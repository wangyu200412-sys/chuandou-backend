"""
用户管理路由 - 管理员功能
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)


def is_admin_user(user_id):
    """检查用户是否为管理员"""
    user = User.query.get(user_id)
    return user and user.is_admin and user.is_active


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """获取用户列表（仅管理员可用）"""
    user_id = int(get_jwt_identity())
    
    if not is_admin_user(user_id):
        logger.warning(f"[用户列表] 非管理员尝试访问: user_id={user_id}")
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403
    
    # 获取查询参数
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str)
    
    # 构建查询
    query = User.query
    
    if search:
        query = query.filter(
            db.or_(
                User.username.ilike(f'%{search}%'),
                User.nickname.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )
    
    # 分页
    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    users = [user.to_dict() for user in pagination.items]
    
    logger.info(f"[用户列表] 管理员 {user_id} 获取用户列表, 总数: {pagination.total}")
    
    return jsonify({
        'success': True,
        'data': {
            'users': users,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }
    })


@admin_bp.route('/users/<int:target_user_id>/promote', methods=['PUT'])
@jwt_required()
def promote_to_admin(target_user_id):
    """将普通用户提升为管理员"""
    user_id = int(get_jwt_identity())
    
    if not is_admin_user(user_id):
        logger.warning(f"[提升权限] 非管理员尝试操作: user_id={user_id}")
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403
    
    # 获取目标用户
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    # 检查是否已经是管理员
    if target_user.is_admin:
        return jsonify({'success': False, 'message': '该用户已经是管理员'}), 400
    
    # 不能提升自己
    if target_user_id == user_id:
        return jsonify({'success': False, 'message': '不能修改自己的管理员权限'}), 400
    
    try:
        target_user.is_admin = True
        db.session.commit()
        
        logger.info(f"[提升权限] 用户 {target_user.username} (id={target_user_id}) 被提升为管理员, 操作者: {user_id}")
        
        return jsonify({
            'success': True,
            'message': f'用户 {target_user.username} 已成功提升为管理员',
            'data': target_user.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"[提升权限] 数据库错误: {e}")
        return jsonify({'success': False, 'message': '操作失败，请稍后重试'}), 500


@admin_bp.route('/users/<int:target_user_id>/revoke', methods=['PUT'])
@jwt_required()
def revoke_admin(target_user_id):
    """撤销用户的管理员权限"""
    user_id = int(get_jwt_identity())
    
    if not is_admin_user(user_id):
        logger.warning(f"[撤销权限] 非管理员尝试操作: user_id={user_id}")
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403
    
    # 获取目标用户
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    # 检查是否是管理员
    if not target_user.is_admin:
        return jsonify({'success': False, 'message': '该用户不是管理员'}), 400
    
    # 不能撤销自己的权限
    if target_user_id == user_id:
        return jsonify({'success': False, 'message': '不能撤销自己的管理员权限'}), 400
    
    try:
        target_user.is_admin = False
        db.session.commit()
        
        logger.info(f"[撤销权限] 用户 {target_user.username} (id={target_user_id}) 被撤销管理员权限, 操作者: {user_id}")
        
        return jsonify({
            'success': True,
            'message': f'用户 {target_user.username} 的管理员权限已撤销',
            'data': target_user.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"[撤销权限] 数据库错误: {e}")
        return jsonify({'success': False, 'message': '操作失败，请稍后重试'}), 500


@admin_bp.route('/users/<int:target_user_id>/toggle-status', methods=['PUT'])
@jwt_required()
def toggle_user_status(target_user_id):
    """启用/禁用用户账号"""
    user_id = int(get_jwt_identity())
    
    if not is_admin_user(user_id):
        logger.warning(f"[切换状态] 非管理员尝试操作: user_id={user_id}")
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403
    
    # 获取目标用户
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    # 不能操作自己
    if target_user_id == user_id:
        return jsonify({'success': False, 'message': '不能修改自己的账号状态'}), 400
    
    try:
        target_user.is_active = not target_user.is_active
        db.session.commit()
        
        action = '启用' if target_user.is_active else '禁用'
        logger.info(f"[切换状态] 用户 {target_user.username} (id={target_user_id}) 被{action}, 操作者: {user_id}")
        
        return jsonify({
            'success': True,
            'message': f'用户 {target_user.username} 已被{action}',
            'data': target_user.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"[切换状态] 数据库错误: {e}")
        return jsonify({'success': False, 'message': '操作失败，请稍后重试'}), 500


@admin_bp.route('/users/<int:target_user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(target_user_id):
    """删除用户账号"""
    user_id = int(get_jwt_identity())
    
    if not is_admin_user(user_id):
        logger.warning(f"[删除用户] 非管理员尝试操作: user_id={user_id}")
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403
    
    # 获取目标用户
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    # 不能删除自己
    if target_user_id == user_id:
        return jsonify({'success': False, 'message': '不能删除自己的账号'}), 400
    
    username = target_user.username
    
    try:
        db.session.delete(target_user)
        db.session.commit()
        
        logger.info(f"[删除用户] 用户 {username} (id={target_user_id}) 被删除, 操作者: {user_id}")
        
        return jsonify({
            'success': True,
            'message': f'用户 {username} 已删除'
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"[删除用户] 数据库错误: {e}")
        return jsonify({'success': False, 'message': '操作失败，请稍后重试'}), 500


@admin_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment_by_admin(comment_id):
    """管理员删除任意评论"""
    user_id = int(get_jwt_identity())
    
    if not is_admin_user(user_id):
        logger.warning(f"[删除评论] 非管理员尝试删除评论: user_id={user_id}")
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403
    
    from app.models import Comment, Post
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'success': False, 'message': '评论不存在'}), 404
    
    try:
        post = Post.query.get(comment.post_id)
        if post:
            post.comments_count = max(0, post.comments_count - 1)
        
        db.session.delete(comment)
        db.session.commit()
        
        logger.info(f"[删除评论] 管理员 {user_id} 删除了评论 (id={comment_id})")
        return jsonify({
            'success': True,
            'message': '评论已被管理员删除'
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"[删除评论] 数据库错误: {e}")
        return jsonify({'success': False, 'message': '操作失败，请稍后重试'}), 500
