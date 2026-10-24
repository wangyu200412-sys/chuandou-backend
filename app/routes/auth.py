"""
用户认证路由
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models import User

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    logger.info("[注册] 收到注册请求")
    
    data = request.get_json()
    logger.debug(f"[注册] 请求数据: {data}")
    
    # 验证必填字段
    if not data or not data.get('username') or not data.get('password'):
        logger.warning("[注册] 缺少用户名或密码")
        return jsonify({'success': False, 'message': '用户名和密码不能为空'}), 400
    
    username = data['username'].strip()
    password = data['password']
    email = data.get('email', '').strip()
    
    logger.info(f"[注册] 用户名: {username}")
    
    # 验证用户名长度
    if len(username) < 3 or len(username) > 20:
        logger.warning(f"[注册] 用户名长度不符合: {len(username)}")
        return jsonify({'success': False, 'message': '用户名长度需在3-20个字符之间'}), 400
    
    # 验证密码长度
    if len(password) < 6:
        logger.warning(f"[注册] 密码长度不符合: {len(password)}")
        return jsonify({'success': False, 'message': '密码长度至少6位'}), 400
    
    # 检查用户名是否已存在
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        logger.warning(f"[注册] 用户名已存在: {username}")
        return jsonify({'success': False, 'message': '用户名已存在'}), 409
    
    # 检查邮箱是否已存在
    if email:
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            logger.warning(f"[注册] 邮箱已被注册: {email}")
            return jsonify({'success': False, 'message': '邮箱已被注册'}), 409
    
    # 创建新用户
    try:
        user = User(
            username=username,
            email=email or f'{username}@example.com',
            nickname=data.get('nickname', username),
            avatar=data.get('avatar', '👤')
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        logger.info(f"[注册] 用户创建成功, ID: {user.id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"[注册] 数据库错误: {e}")
        return jsonify({'success': False, 'message': '注册失败，请稍后重试'}), 500
    
    # 生成JWT令牌（identity必须是字符串）
    access_token = create_access_token(identity=str(user.id))
    logger.info(f"[注册] Token生成成功")
    
    response_data = {
        'success': True,
        'message': '注册成功',
        'data': {
            'token': access_token,
            'user': user.to_dict()
        }
    }
    logger.info(f"[注册] 返回数据: is_admin={user.is_admin}")
    
    return jsonify(response_data), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    logger.info("[登录] 收到登录请求")
    
    data = request.get_json()
    logger.debug(f"[登录] 请求数据: {data}")
    
    if not data:
        logger.warning("[登录] 请求数据为空")
        return jsonify({'success': False, 'message': '请求数据格式错误'}), 400
    
    if not data.get('username') or not data.get('password'):
        logger.warning("[登录] 缺少用户名或密码")
        return jsonify({'success': False, 'message': '用户名和密码不能为空'}), 400
    
    username = data['username'].strip()
    password = data['password']
    
    logger.info(f"[登录] 尝试登录用户: {username}")
    
    # 查找用户
    user = User.query.filter_by(username=username).first()
    logger.debug(f"[登录] 查询用户结果: {user}")
    
    if not user:
        logger.warning(f"[登录] 用户不存在: {username}")
        return jsonify({'success': False, 'message': '用户名或密码错误'}), 401
    
    # 验证密码
    password_valid = user.check_password(password)
    logger.debug(f"[登录] 密码验证结果: {password_valid}")
    
    if not password_valid:
        logger.warning(f"[登录] 密码错误: {username}")
        return jsonify({'success': False, 'message': '用户名或密码错误'}), 401
    
    # 检查账号状态
    if not user.is_active:
        logger.warning(f"[登录] 账号已被禁用: {username}")
        return jsonify({'success': False, 'message': '账号已被禁用'}), 403
    
    logger.info(f"[登录] 用户验证成功, ID: {user.id}, is_admin: {user.is_admin}")
    
    # 生成JWT令牌（identity必须是字符串）
    access_token = create_access_token(identity=str(user.id))
    logger.info(f"[登录] Token生成成功")
    
    response_data = {
        'success': True,
        'message': '登录成功',
        'data': {
            'token': access_token,
            'user': user.to_dict()
        }
    }
    
    logger.info(f"[登录] 返回用户数据: id={user.id}, is_admin={user.to_dict().get('is_admin')}")
    
    return jsonify(response_data)


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """获取当前用户信息"""
    user_id = int(get_jwt_identity())  # 转换为整数
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    return jsonify({
        'success': True,
        'data': {
            'user': user.to_dict(),
            'stats': user.get_stats()
        }
    })


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """更新用户信息"""
    user_id = int(get_jwt_identity())  # 转换为整数
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    data = request.get_json()
    
    # 允许更新的字段
    if 'nickname' in data:
        user.nickname = data['nickname'].strip()
    if 'avatar' in data:
        user.avatar = data['avatar']
    if 'bio' in data:
        user.bio = data['bio'].strip()
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '资料更新成功',
        'data': user.to_dict()
    })


@auth_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    """修改密码"""
    user_id = int(get_jwt_identity())  # 转换为整数
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({'success': False, 'message': '请提供旧密码和新密码'}), 400
    
    if not user.check_password(old_password):
        return jsonify({'success': False, 'message': '旧密码错误'}), 401
    
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': '新密码长度至少6位'}), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '密码修改成功'
    })


@auth_bp.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_account():
    """删除当前账号（同时删除所有关联内容）"""
    user_id = int(get_jwt_identity())  # 转换为整数
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    data = request.get_json() or {}
    password = data.get('password')
    
    if not password:
        return jsonify({'success': False, 'message': '请输入密码确认'}), 400
    
    if not user.check_password(password):
        return jsonify({'success': False, 'message': '密码错误'}), 401
    
    username = user.username
    
    # 关联删除：posts, comments, likes, game_records 会通过 cascade 自动删除
    posts_count = user.posts.count()
    comments_count = user.comments.count()
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'账号 {username} 已删除（同时删除了 {posts_count} 篇帖子和 {comments_count} 条评论）'
    })
