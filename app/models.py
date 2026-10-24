"""
数据库模型定义
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255), default='👤')
    nickname = db.Column(db.String(80))
    bio = db.Column(db.Text)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    game_records = db.relationship('GameRecord', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """设置密码"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'nickname': self.nickname or self.username,
            'avatar': self.avatar,
            'bio': self.bio,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def get_stats(self):
        """获取用户统计"""
        # 过滤已删除的帖子
        posts_count = Post.query.filter_by(author_id=self.id, is_deleted=False).count()
        # 计算获赞数（只计算未删除帖子的点赞）
        likes_received = db.session.query(db.func.sum(Post.likes_count)).filter(
            Post.author_id == self.id,
            Post.is_deleted == False
        ).scalar() or 0
        return {
            'posts_count': posts_count,
            'likes_received': likes_received,
            'comments_count': self.comments.count()
        }


class Post(db.Model):
    """帖子模型"""
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500))
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    comments_list = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    likes_list = db.relationship('Like', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_comments=False):
        """转换为字典"""
        data = {
            'id': self.id,
            'author': self.author.nickname or self.author.username if self.author else '未知用户',
            'authorId': self.author_id,
            'avatar': self.author.avatar if self.author else '👤',
            'content': self.content,
            'image': self.image_url,
            'likes': self.likes_count,
            'comments_count': self.comments_count,
            'time': self.format_time(),
            'is_liked': False,  # 需要在查询时根据当前用户设置
            'comments': []  # 默认空数组
        }
        
        if include_comments:
            # 评论按时间降序排列（最新在前）
            data['comments'] = [c.to_dict() for c in self.comments_list.order_by(Comment.created_at.desc()).limit(10)]
        
        return data
    
    def format_time(self):
        """格式化时间显示"""
        now = datetime.utcnow()
        diff = now - self.created_at
        
        if diff.days == 0:
            hours = diff.seconds // 3600
            if hours == 0:
                minutes = diff.seconds // 60
                if minutes == 0:
                    return '刚刚'
                return f'{minutes}分钟前'
            return f'{hours}小时前'
        elif diff.days == 1:
            return '昨天'
        elif diff.days < 7:
            return f'{diff.days}天前'
        elif diff.days < 30:
            return f'{diff.days // 7}周前'
        else:
            return self.created_at.strftime('%Y-%m-%d')


class Comment(db.Model):
    """评论模型"""
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    likes_count = db.Column(db.Integer, default=0)  # 评论点赞数
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系 - 评论点赞
    comment_likes = db.relationship('CommentLike', backref='comment', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, current_user_id=None):
        """转换为字典"""
        # 检查当前用户是否已点赞
        is_liked = False
        if current_user_id:
            from app.models import CommentLike
            is_liked = CommentLike.query.filter_by(user_id=current_user_id, comment_id=self.id).first() is not None
        
        return {
            'id': self.id,
            'author_id': self.author_id,
            'authorId': self.author_id,  # 兼容前端字段名
            'author': self.author.nickname or self.author.username if self.author else '未知用户',
            'avatar': self.author.avatar if self.author else '👤',
            'text': self.content,
            'time': self.format_time(),
            'likes': self.likes_count,
            'is_liked': is_liked
        }
    
    def format_time(self):
        """格式化时间"""
        return self.created_at.strftime('%m-%d %H:%M') if self.created_at else ''


class Like(db.Model):
    """帖子点赞模型"""
    __tablename__ = 'likes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 联合唯一约束
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),)


class CommentLike(db.Model):
    """评论点赞模型"""
    __tablename__ = 'comment_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 联合唯一约束
    __table_args__ = (db.UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_like'),)


class GameRecord(db.Model):
    """游戏记录模型"""
    __tablename__ = 'game_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    completion_time = db.Column(db.Float, nullable=False)  # 通关时间（秒）
    error_count = db.Column(db.Integer, default=0)  # 错误次数
    score = db.Column(db.Integer, default=0)  # 得分
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.user.nickname or self.user.username if self.user else '匿名',
            'avatar': self.user.avatar if self.user else '👤',
            'completion_time': self.completion_time,
            'error_count': self.error_count,
            'score': self.score,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def calculate_score(completion_time, error_count):
        """计算得分"""
        base_score = 1000
        time_bonus = max(0, 300 - int(completion_time))  # 时间奖励
        error_penalty = error_count * 50  # 错误惩罚
        return max(0, base_score + time_bonus - error_penalty)


class Component(db.Model):
    """建筑构件知识库模型"""
    __tablename__ = 'components'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # 构件名称
    category = db.Column(db.String(50), nullable=False, index=True)  # 分类：立柱、穿枋、檩条等
    description = db.Column(db.Text, nullable=False)  # 详细描述
    short_desc = db.Column(db.String(255))  # 简短描述
    image_url = db.Column(db.String(500))  # 图片
    model_file = db.Column(db.String(255))  # 3D模型文件名
    order_index = db.Column(db.Integer, default=0)  # 展示顺序
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'short_desc': self.short_desc,
            'image': self.image_url,
            'model_file': self.model_file,
            'order': self.order_index
        }


class SystemConfig(db.Model):
    """系统配置模型"""
    __tablename__ = 'system_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
