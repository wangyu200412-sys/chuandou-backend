"""
游戏记录路由
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import GameRecord, User

game_bp = Blueprint('game', __name__)


@game_bp.route('/records', methods=['GET'])
def get_leaderboard():
    """获取游戏排行榜"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    sort_by = request.args.get('sort', 'score')  # score, time, recent
    
    # 限制每页数量
    per_page = min(per_page, 50)
    
    # 构建查询
    query = GameRecord.query.filter_by(is_completed=True)
    
    # 排序
    if sort_by == 'score':
        query = query.order_by(GameRecord.score.desc(), GameRecord.completion_time.asc())
    elif sort_by == 'time':
        query = query.order_by(GameRecord.completion_time.asc())
    else:  # recent
        query = query.order_by(GameRecord.created_at.desc())
    
    # 分页
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    records = pagination.items
    
    return jsonify({
        'success': True,
        'data': {
            'records': [r.to_dict() for r in records],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next
            }
        }
    })


@game_bp.route('/records', methods=['POST'])
@jwt_required()
def create_record():
    """创建游戏记录"""
    user_id = int(get_jwt_identity())  # 转换为整数
    data = request.get_json()
    
    # 验证必填字段
    if not data or 'completion_time' not in data:
        return jsonify({'success': False, 'message': '通关时间不能为空'}), 400
    
    completion_time = float(data['completion_time'])
    error_count = int(data.get('error_count', 0))
    is_completed = data.get('is_completed', True)
    
    # 计算得分
    score = GameRecord.calculate_score(completion_time, error_count)
    
    # 创建记录
    record = GameRecord(
        user_id=user_id,
        completion_time=completion_time,
        error_count=error_count,
        score=score,
        is_completed=is_completed
    )
    
    db.session.add(record)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '记录保存成功',
        'data': {
            'record': record.to_dict(),
            'rank': get_user_rank(record.id, score)
        }
    }), 201


@game_bp.route('/my-records', methods=['GET'])
@jwt_required()
def get_my_records():
    """获取当前用户的游戏记录"""
    user_id = int(get_jwt_identity())  # 转换为整数
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = GameRecord.query.filter_by(user_id=user_id).order_by(GameRecord.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # 获取最佳记录
    best_record = GameRecord.query.filter_by(user_id=user_id, is_completed=True)\
        .order_by(GameRecord.score.desc()).first()
    
    # 获取排名
    rank = None
    if best_record:
        rank = get_user_rank(best_record.id, best_record.score)
    
    return jsonify({
        'success': True,
        'data': {
            'records': [r.to_dict() for r in pagination.items],
            'best_record': best_record.to_dict() if best_record else None,
            'rank': rank,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'has_next': pagination.has_next
            }
        }
    })


@game_bp.route('/stats', methods=['GET'])
def get_game_stats():
    """获取游戏统计数据"""
    # 总通关次数
    total_completions = GameRecord.query.filter_by(is_completed=True).count()
    
    # 总玩家数
    total_players = db.session.query(db.func.count(db.distinct(GameRecord.user_id))).scalar()
    
    # 平均通关时间
    avg_time = db.session.query(db.func.avg(GameRecord.completion_time))\
        .filter_by(is_completed=True).scalar()
    
    # 最高得分
    max_score = db.session.query(db.func.max(GameRecord.score))\
        .filter_by(is_completed=True).scalar()
    
    # 今日通关数
    from datetime import datetime, timedelta
    today = datetime.utcnow().date()
    today_completions = GameRecord.query.filter(
        GameRecord.is_completed == True,
        db.func.date(GameRecord.created_at) == today
    ).count()
    
    return jsonify({
        'success': True,
        'data': {
            'total_completions': total_completions,
            'total_players': total_players,
            'average_time': round(avg_time, 2) if avg_time else 0,
            'max_score': max_score or 0,
            'today_completions': today_completions
        }
    })


@game_bp.route('/rank', methods=['GET'])
@jwt_required()
def get_my_rank():
    """获取当前用户排名"""
    user_id = int(get_jwt_identity())  # 转换为整数
    
    # 获取用户最佳记录
    best_record = GameRecord.query.filter_by(user_id=user_id, is_completed=True)\
        .order_by(GameRecord.score.desc()).first()
    
    if not best_record:
        return jsonify({
            'success': True,
            'data': {
                'has_record': False,
                'message': '暂无通关记录'
            }
        })
    
    rank = get_user_rank(best_record.id, best_record.score)
    
    # 获取前后各2名的玩家
    nearby_records = GameRecord.query.filter_by(is_completed=True)\
        .order_by(GameRecord.score.desc(), GameRecord.completion_time.asc())
    
    nearby = []
    for i, record in enumerate(nearby_records):
        if abs(i + 1 - rank) <= 2:
            data = record.to_dict()
            data['rank'] = i + 1
            nearby.append(data)
    
    return jsonify({
        'success': True,
        'data': {
            'has_record': True,
            'my_rank': rank,
            'best_record': best_record.to_dict(),
            'nearby_rankings': nearby
        }
    })


def get_user_rank(record_id, score):
    """获取用户排名"""
    # 计算得分更高的记录数
    higher_scores = GameRecord.query.filter(
        GameRecord.is_completed == True,
        GameRecord.score > score
    ).count()
    
    # 相同得分但时间更短的记录数
    same_score_faster = GameRecord.query.filter(
        GameRecord.is_completed == True,
        GameRecord.score == score,
        GameRecord.completion_time < GameRecord.query.get(record_id).completion_time
    ).count()
    
    return higher_scores + same_score_faster + 1
