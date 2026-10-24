"""
广场帖子路由
"""
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
from app import db
from app.models import Post, Comment, Like, CommentLike, User
from app.utils.risk_control import check_content_safety

posts_bp = Blueprint('posts', __name__)


def allowed_file(filename):
    """检查文件类型是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def save_image(file):
    """保存并压缩图片"""
    if not file or not allowed_file(file.filename):
        return None

    # 云端临时文件系统或主动关闭上传时不落盘
    if current_app.config.get('UPLOAD_STORAGE', 'local') != 'local':
        return None

    # 生成唯一文件名
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    # 保存原图
    file.save(filepath)
    
    # 压缩图片
    try:
        with Image.open(filepath) as img:
            # 如果图片太大，进行压缩
            max_size = (1200, 1200)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # 转换为RGB（处理RGBA图片）
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # 保存压缩后的图片
            img.save(filepath, 'JPEG', quality=85, optimize=True)
    except Exception as e:
        current_app.logger.error(f'图片处理失败: {e}')
    
    return f'/uploads/{filename}'


@posts_bp.route('', methods=['GET'])
def get_posts():
    """获取帖子列表"""
    # 获取查询参数
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    filter_type = request.args.get('filter', 'all')  # all, hot, new, mine
    
    # 限制每页数量
    per_page = min(per_page, 50)
    
    # 获取当前用户ID（如果已登录）
    current_user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            current_user_id = int(identity)  # 转换为整数
    except:
        pass
    
    # 构建查询
    query = Post.query.filter_by(is_deleted=False)
    
    # 如果是"我的发布"筛选，只显示当前用户的帖子
    if filter_type == 'mine':
        if not current_user_id:
            return jsonify({
                'success': True,
                'data': {
                    'posts': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0,
                        'has_next': False,
                        'has_prev': False
                    }
                }
            })
        query = query.filter_by(author_id=current_user_id)
    
    # 根据筛选条件排序
    if filter_type == 'hot':
        query = query.order_by(Post.likes_count.desc(), Post.created_at.desc())
    else:  # all, new, mine 都按时间倒序
        query = query.order_by(Post.created_at.desc())
    
    # 分页
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    posts = pagination.items
    
    # 获取用户点赞的帖子ID列表
    liked_post_ids = set()
    if current_user_id:
        liked_post_ids = {like.post_id for like in Like.query.filter_by(user_id=current_user_id).all()}
    
    # 构建响应数据
    posts_data = []
    for post in posts:
        post_dict = post.to_dict()
        post_dict['is_liked'] = post.id in liked_post_ids
        # 确保返回 authorId 字段（兼容前端）
        post_dict['authorId'] = post.author_id
        posts_data.append(post_dict)
    
    return jsonify({
        'success': True,
        'data': {
            'posts': posts_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }
    })


@posts_bp.route('/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """获取单个帖子详情"""
    post = Post.query.filter_by(id=post_id, is_deleted=False).first()
    
    if not post:
        return jsonify({'success': False, 'message': '帖子不存在'}), 404
    
    # 获取当前用户ID
    current_user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            current_user_id = int(identity)  # 转换为整数
    except:
        pass
    
    # 检查是否已点赞
    is_liked = False
    if current_user_id:
        is_liked = Like.query.filter_by(user_id=current_user_id, post_id=post_id).first() is not None
    
    post_dict = post.to_dict(include_comments=True)
    post_dict['is_liked'] = is_liked
    
    return jsonify({
        'success': True,
        'data': post_dict
    })

@posts_bp.route('', methods=['POST'])
@jwt_required()
def create_post():
    """创建新帖子"""
    user_id = int(get_jwt_identity())  # 转换为整数

    # 获取表单数据
    content = request.form.get('content', '').strip()

    if not content:
        return jsonify({'success': False, 'message': '内容不能为空'}), 400

    # ==========================================
    # 🚨 新增：AI 智能风控安检门
    # ==========================================
    safety_status = check_content_safety(content)
    
    if safety_status == "Block":
        return jsonify({'success': False, 'message': '您发布的内容不合规，请修改后重试'}), 403
    elif safety_status == "Review":
        # 考虑到不大幅改动您现有的数据库模型，嫌疑内容我们也暂做拦截提示
        return jsonify({'success': False, 'message': '内容疑似包含违规敏感词，发布失败'}), 403
    # ==========================================

    # 处理图片上传 (完全保留您的原代码)
    image_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename:
            image_url = save_image(file)

    # 创建帖子 (完全保留您的原代码)
    post = Post(
        author_id=user_id,
        content=content,
        image_url=image_url
    )
    
    # 下面应该是您原本的 db.session.add(post) 等存库代码，请原样保留不要删！
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '发布成功',
        'data': post.to_dict()
    }), 201


@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """删除帖子"""
    user_id = int(get_jwt_identity())  # 转换为整数
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'success': False, 'message': '帖子不存在'}), 404
    
    # 检查权限（只能删除自己的帖子，管理员可以删除所有）
    user = User.query.get(user_id)
    if post.author_id != user_id and not user.is_admin:
        return jsonify({'success': False, 'message': '无权删除此帖子'}), 403
    
    # 软删除
    post.is_deleted = True
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '删除成功'
    })


@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    """点赞/取消点赞"""
    user_id = int(get_jwt_identity())  # 转换为整数
    
    post = Post.query.filter_by(id=post_id, is_deleted=False).first()
    if not post:
        return jsonify({'success': False, 'message': '帖子不存在'}), 404
    
    # 检查是否已点赞
    existing_like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
    
    if existing_like:
        # 取消点赞
        db.session.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        is_liked = False
    else:
        # 添加点赞
        like = Like(user_id=user_id, post_id=post_id)
        db.session.add(like)
        post.likes_count += 1
        is_liked = True
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': {
            'is_liked': is_liked,
            'likes': post.likes_count
        }
    })


@posts_bp.route('/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """获取帖子评论列表"""
    post = Post.query.filter_by(id=post_id, is_deleted=False).first()
    if not post:
        return jsonify({'success': False, 'message': '帖子不存在'}), 404
    
    # 获取当前用户ID
    current_user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            current_user_id = int(identity)
    except:
        pass
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # 评论按时间降序排列（最新评论在前）
    comments = post.comments_list.order_by(Comment.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'success': True,
        'data': {
            'comments': [c.to_dict(current_user_id) for c in comments.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': comments.total,
                'has_next': comments.has_next
            }
        }
    })


@posts_bp.route('/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    """添加评论"""
    user_id = int(get_jwt_identity())  # 转换为整数
    
    post = Post.query.filter_by(id=post_id, is_deleted=False).first()
    if not post:
        return jsonify({'success': False, 'message': '帖子不存在'}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'message': '请求数据格式错误'}), 400
    
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({'success': False, 'message': '评论内容不能为空'}), 400
    
    if len(content) > 500:
        return jsonify({'success': False, 'message': '评论内容过长（最多500字）'}), 400
    
    # 创建评论
    comment = Comment(
        post_id=post_id,
        author_id=user_id,
        content=content
    )
    
    db.session.add(comment)
    post.comments_count += 1
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '评论成功',
        'data': comment.to_dict()
    }), 201


@posts_bp.route('/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(post_id, comment_id):
    """删除评论"""
    user_id = int(get_jwt_identity())  # 转换为整数
    
    # 查找帖子
    post = Post.query.filter_by(id=post_id, is_deleted=False).first()
    if not post:
        return jsonify({'success': False, 'message': '帖子不存在'}), 404
    
    # 查找评论
    comment = Comment.query.filter_by(id=comment_id, post_id=post_id).first()
    if not comment:
        return jsonify({'success': False, 'message': '评论不存在'}), 404
    
    # 权限检查（只能删自己的或管理员可删所有）
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
        
    if comment.author_id != user_id and not user.is_admin:
        return jsonify({'success': False, 'message': '无权删除此评论'}), 403
    
    # 执行删除
    db.session.delete(comment)
    post.comments_count = max(0, post.comments_count - 1)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '评论已删除'
    })


@posts_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment_direct(comment_id):
    """直接删除评论（无需post_id，支持作者及管理员删除）"""
    user_id = int(get_jwt_identity())
    
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'success': False, 'message': '评论不存在'}), 404
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    if comment.author_id != user_id and not user.is_admin:
        return jsonify({'success': False, 'message': '无权删除此评论'}), 403
    
    post = Post.query.get(comment.post_id)
    if post:
        post.comments_count = max(0, post.comments_count - 1)
    
    db.session.delete(comment)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '评论已删除'
    })


@posts_bp.route('/comments/<int:comment_id>/like', methods=['POST'])
@jwt_required()
def toggle_comment_like(comment_id):
    """评论点赞/取消点赞"""
    user_id = int(get_jwt_identity())
    
    # 查找评论
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'success': False, 'message': '评论不存在'}), 404
    
    # 检查是否已点赞
    existing_like = CommentLike.query.filter_by(user_id=user_id, comment_id=comment_id).first()
    
    if existing_like:
        # 取消点赞
        db.session.delete(existing_like)
        comment.likes_count = max(0, comment.likes_count - 1)
        is_liked = False
    else:
        # 添加点赞
        like = CommentLike(user_id=user_id, comment_id=comment_id)
        db.session.add(like)
        comment.likes_count += 1
        is_liked = True
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': {
            'is_liked': is_liked,
            'likes': comment.likes_count
        }
    })


@posts_bp.route('/my-comments', methods=['GET'])
@jwt_required()
def get_my_comments():
    """获取当前用户发布的所有评论"""
    user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # 只获取评论所属帖子未被删除的评论
    # 使用子查询排除已删除帖子的评论
    deleted_post_ids = db.session.query(Post.id).filter_by(is_deleted=True)
    
    # 获取当前用户的所有评论，且帖子未被删除
    query = Comment.query.filter(
        Comment.author_id == user_id,
        ~Comment.post_id.in_(deleted_post_ids)
    ).order_by(Comment.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    comments_data = []
    for comment in pagination.items:
        # 获取评论所属的帖子信息
        post = Post.query.filter_by(id=comment.post_id, is_deleted=False).first()
        comment_dict = comment.to_dict(user_id)
        comment_dict['post_id'] = comment.post_id  # 确保有 post_id
        if post:
            comment_dict['post'] = {
                'id': post.id,
                'content': post.content[:50] + '...' if len(post.content) > 50 else post.content,
                'image': post.image_url
            }
        comments_data.append(comment_dict)
    
    return jsonify({
        'success': True,
        'data': {
            'comments': comments_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next
            }
        }
    })
