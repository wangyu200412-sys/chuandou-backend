/**
 * 穿斗式建筑广场 - 后端API集成版本
 */

import { AuthAPI, PostsAPI, GameAPI } from './api.js';

// ==================== 全局状态管理 ====================
class SquareApp {
    constructor() {
        this.currentFilter = 'all';
        this.page = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.posts = [];
    }

    async init() {
        // 检查登录状态
        this.checkAuthStatus();
        
        // 加载帖子
        await this.loadPosts();
        
        // 绑定事件
        this.bindEvents();
        
        // 更新用户统计
        this.updateUserStats();
        
        console.log('广场应用初始化完成');
    }

    checkAuthStatus() {
        const user = AuthAPI.getCurrentUser();
        if (user) {
            // 更新UI显示已登录状态
            document.querySelector('.user-name').textContent = user.nickname || user.username;
            document.querySelector('.user-avatar').textContent = user.avatar || '👤';
        }
    }

    bindEvents() {
        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.page = 1;
                this.hasMore = true;
                await this.loadPosts(true);
            });
        });

        // 加载更多
        document.getElementById('loadMore').addEventListener('click', async () => {
            if (!this.isLoading && this.hasMore) {
                this.page++;
                await this.loadPosts();
            }
        });

        // 标签点击
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const tagText = tag.textContent;
                document.getElementById('postContent').value += ` ${tagText}`;
                postModal.open();
            });
        });
        
        // 滚动加载
        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                if (!this.isLoading && this.hasMore) {
                    this.page++;
                    this.loadPosts();
                }
            }
        });
    }

    async loadPosts(reset = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const container = document.getElementById('postContainer');
        const loadMoreBtn = document.getElementById('loadMore');
        
        if (reset) {
            container.innerHTML = '';
            this.posts = [];
        }

        // 显示加载状态
        loadMoreBtn.querySelector('.load-btn').textContent = '加载中...';

        try {
            const response = await PostsAPI.getList(this.page, this.currentFilter);
            
            if (!response.success) {
                throw new Error(response.message);
            }

            const { posts, pagination } = response.data;
            
            if (posts.length === 0 && this.page === 1) {
                container.innerHTML = '<div class="empty-state">暂无内容，快来发布第一条动态吧！</div>';
                return;
            }

            posts.forEach(post => {
                this.posts.push(post);
                const postEl = this.createPostElement(post);
                container.appendChild(postEl);
                this.bindPostEvents(postEl, post);
            });

            // 更新加载更多按钮状态
            this.hasMore = pagination.has_next;
            loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';

        } catch (error) {
            console.error('加载帖子失败:', error);
            // 显示错误提示
            if (this.page === 1) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>加载失败，请检查网络连接</p>
                        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 20px; background: var(--primary-color); border: none; border-radius: 4px; cursor: pointer;">重试</button>
                    </div>
                `;
            }
        } finally {
            this.isLoading = false;
            loadMoreBtn.querySelector('.load-btn').textContent = '加载更多';
        }
    }

    createPostElement(post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.postId = post.id;

        const hasImage = post.image && !post.image.endsWith('.glb');
        
        card.innerHTML = `
            ${hasImage ? `
            <div class="post-image-container">
                <img class="post-image" src="${post.image}" alt="帖子图片" loading="lazy">
            </div>
            ` : ''}
            <div class="post-content">
                <div class="post-header">
                    <div class="post-avatar">${post.avatar || '👤'}</div>
                    <div class="post-author">
                        <div class="post-author-name">${this.escapeHtml(post.author)}</div>
                        <div class="post-time">${post.time}</div>
                    </div>
                </div>
                ${post.content ? `<div class="post-text">${this.escapeHtml(post.content)}</div>` : ''}
                <div class="post-actions">
                    <button class="action-btn ${post.is_liked ? 'liked' : ''}" data-action="like">
                        <span class="action-icon">${post.is_liked ? '❤️' : '🤍'}</span>
                        <span class="action-count">${post.likes || 0}</span>
                    </button>
                    <button class="action-btn" data-action="comment">
                        <span class="action-icon">💬</span>
                        <span class="action-count">${post.comments_count || 0}</span>
                    </button>
                    <button class="action-btn" data-action="share">
                        <span class="action-icon">📤</span>
                        <span>分享</span>
                    </button>
                </div>
            </div>
            <div class="comments-section" style="display: none;">
                <div class="comment-list"></div>
                <div class="comment-input-area">
                    <input type="text" class="comment-input" placeholder="写下你的评论..." maxlength="200">
                    <button class="comment-submit">发送</button>
                </div>
            </div>
        `;

        return card;
    }

    bindPostEvents(postEl, post) {
        // 点赞
        const likeBtn = postEl.querySelector('[data-action="like"]');
        likeBtn.addEventListener('click', async () => {
            if (!AuthAPI.isLoggedIn()) {
                alert('请先登录');
                return;
            }
            
            try {
                const response = await PostsAPI.toggleLike(post.id);
                if (response.success) {
                    likeBtn.classList.toggle('liked', response.data.is_liked);
                    likeBtn.querySelector('.action-icon').textContent = response.data.is_liked ? '❤️' : '🤍';
                    likeBtn.querySelector('.action-count').textContent = response.data.likes;
                    
                    // 动画效果
                    likeBtn.style.transform = 'scale(1.2)';
                    setTimeout(() => likeBtn.style.transform = '', 200);
                    
                    this.updateUserStats();
                }
            } catch (error) {
                console.error('点赞失败:', error);
            }
        });

        // 评论展开
        const commentBtn = postEl.querySelector('[data-action="comment"]');
        const commentsSection = postEl.querySelector('.comments-section');
        commentBtn.addEventListener('click', () => {
            const isVisible = commentsSection.style.display !== 'none';
            commentsSection.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                // 加载评论
                this.loadComments(post.id, postEl);
                setTimeout(() => {
                    const input = commentsSection.querySelector('.comment-input');
                    if (input) input.focus();
                }, 100);
            }
        });

        // 评论提交
        const submitBtn = postEl.querySelector('.comment-submit');
        const commentInput = postEl.querySelector('.comment-input');
        
        const submitComment = async () => {
            if (!AuthAPI.isLoggedIn()) {
                alert('请先登录');
                return;
            }
            
            const text = commentInput.value.trim();
            if (!text) return;

            try {
                const response = await PostsAPI.addComment(post.id, text);
                if (response.success) {
                    // 添加到DOM
                    const commentList = postEl.querySelector('.comment-list');
                    const commentEl = document.createElement('div');
                    commentEl.className = 'comment-item';
                    commentEl.innerHTML = `
                        <div class="comment-avatar">${response.data.avatar || '👤'}</div>
                        <div class="comment-body">
                            <div class="comment-author">${this.escapeHtml(response.data.author)}</div>
                            <div class="comment-text">${this.escapeHtml(response.data.text)}</div>
                        </div>
                    `;
                    commentList.appendChild(commentEl);
                    commentList.scrollTop = commentList.scrollHeight;
                    
                    // 更新评论数
                    const count = parseInt(commentBtn.querySelector('.action-count').textContent) + 1;
                    commentBtn.querySelector('.action-count').textContent = count;
                    
                    commentInput.value = '';
                    this.showToast('评论发布成功');
                }
            } catch (error) {
                console.error('评论失败:', error);
                alert('评论失败，请重试');
            }
        };
        
        submitBtn.addEventListener('click', submitComment);
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitComment();
        });

        // 分享
        const shareBtn = postEl.querySelector('[data-action="share"]');
        shareBtn.addEventListener('click', async () => {
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: `${post.author}的穿斗式建筑分享`,
                        text: post.content || '来看看这个精彩的古建筑分享吧！',
                        url: window.location.href
                    });
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    this.showToast('链接已复制到剪贴板');
                }
            } catch (error) {
                console.error('分享失败:', error);
            }
        });

        // 图片预览
        const img = postEl.querySelector('.post-image');
        if (img) {
            img.addEventListener('click', () => {
                imagePreview.open(img.src);
            });
        }
    }

    async loadComments(postId, postEl) {
        try {
            const response = await PostsAPI.getComments(postId);
            if (response.success) {
                const commentList = postEl.querySelector('.comment-list');
                commentList.innerHTML = '';
                
                response.data.comments.forEach(comment => {
                    const commentEl = document.createElement('div');
                    commentEl.className = 'comment-item';
                    commentEl.dataset.commentId = comment.id;
                    
                    // 判断是否为当前用户的评论（可删除）
                    const currentUser = AuthAPI.getCurrentUser();
                    const isOwnComment = currentUser && comment.author_id === currentUser.id;
                    
                    commentEl.innerHTML = `
                        <div class="comment-avatar">${comment.avatar || '👤'}</div>
                        <div class="comment-body">
                            <div class="comment-header">
                                <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                                ${isOwnComment ? `<button class="comment-delete-btn" data-comment-id="${comment.id}" title="删除评论">✕</button>` : ''}
                            </div>
                            <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                        </div>
                    `;
                    commentList.appendChild(commentEl);
                });
                
                // 绑定删除事件
                this.bindDeleteCommentEvents(postId, postEl);
            }
        } catch (error) {
            console.error('加载评论失败:', error);
        }
    }

    bindDeleteCommentEvents(postId, postEl) {
        const deleteBtns = postEl.querySelectorAll('.comment-delete-btn');
        const commentBtn = postEl.querySelector('[data-action="comment"]');
        
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // 确认删除
                if (!confirm('确定要删除这条评论吗？')) return;
                
                const commentId = parseInt(btn.dataset.commentId);
                const commentItem = btn.closest('.comment-item');
                
                try {
                    const response = await PostsAPI.deleteComment(postId, commentId);
                    
                    if (response.success) {
                        // 动画移除
                        commentItem.style.transition = 'all 0.3s ease';
                        commentItem.style.opacity = '0';
                        commentItem.style.transform = 'translateX(20px)';
                        
                        setTimeout(() => {
                            commentItem.remove();
                            
                            // 更新评论计数
                            const countEl = commentBtn.querySelector('.action-count');
                            const currentCount = parseInt(countEl.textContent) || 0;
                            countEl.textContent = Math.max(0, currentCount - 1);
                        }, 300);
                        
                        this.showToast('评论已删除');
                    }
                } catch (error) {
                    console.error('删除评论失败:', error);
                    alert('删除失败，请重试');
                }
            });
        });
    }

    async updateUserStats() {
        if (!AuthAPI.isLoggedIn()) return;
        
        try {
            const response = await AuthAPI.getProfile();
            if (response.success) {
                const stats = response.data.stats;
                document.getElementById('myPosts').textContent = stats.posts_count;
                document.getElementById('myLikes').textContent = stats.likes_received;
            }
        } catch (error) {
            console.error('更新统计失败:', error);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: #1a0f0a;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 3000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// ==================== 发布弹窗管理 ====================
class PostModal {
    constructor() {
        this.modal = document.getElementById('postModal');
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.previewImage = document.getElementById('previewImage');
        this.postContent = document.getElementById('postContent');
        this.selectedImage = null;
        
        this.bindEvents();
    }

    bindEvents() {
        // 点击上传区域
        this.uploadArea.addEventListener('click', () => {
            this.imageInput.click();
        });

        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'var(--primary-color)';
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.style.borderColor = 'var(--border-color)';
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'var(--border-color)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageSelect(files[0]);
            }
        });

        // 文件选择
        this.imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageSelect(e.target.files[0]);
            }
        });
    }

    handleImageSelect(file) {
        // 检查文件大小（最大16MB）
        if (file.size > 16 * 1024 * 1024) {
            alert('图片大小不能超过16MB');
            return;
        }
        
        this.selectedImage = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewImage.hidden = false;
            this.uploadArea.querySelector('.upload-placeholder').style.display = 'none';
        };
        
        reader.readAsDataURL(file);
    }

    open() {
        if (!AuthAPI.isLoggedIn()) {
            alert('请先登录后再发布');
            return;
        }
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        this.reset();
    }

    reset() {
        this.selectedImage = null;
        this.imageInput.value = '';
        this.postContent.value = '';
        this.previewImage.hidden = true;
        this.previewImage.src = '';
        this.uploadArea.querySelector('.upload-placeholder').style.display = 'block';
    }

    async submit() {
        if (!AuthAPI.isLoggedIn()) {
            alert('请先登录');
            return;
        }
        
        const content = this.postContent.value.trim();
        
        if (!this.selectedImage && !content) {
            alert('请上传图片或输入内容');
            return;
        }

        const submitBtn = this.modal.querySelector('.submit-btn');
        submitBtn.textContent = '发布中...';
        submitBtn.disabled = true;

        try {
            const response = await PostsAPI.create(content, this.selectedImage);
            
            if (response.success) {
                // 添加到列表顶部
                const container = document.getElementById('postContainer');
                const postEl = app.createPostElement(response.data);
                container.insertBefore(postEl, container.firstChild);
                app.bindPostEvents(postEl, response.data);
                
                // 更新统计
                app.updateUserStats();
                
                // 关闭弹窗
                this.close();
                this.showToast('发布成功！');
            } else {
                alert(response.message || '发布失败');
            }
        } catch (error) {
            console.error('发布失败:', error);
            alert('发布失败，请重试');
        } finally {
            submitBtn.textContent = '发布';
            submitBtn.disabled = false;
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: #1a0f0a;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 3000;
            animation: slideDown 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
}

// ==================== 图片预览弹窗 ====================
class ImagePreview {
    constructor() {
        this.modal = document.getElementById('imagePreviewModal');
        this.image = document.getElementById('previewLargeImage');
    }

    open(src) {
        this.image.src = src;
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ==================== 登录弹窗 ====================
class AuthModal {
    constructor() {
        this.createModal();
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'authModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 id="authTitle">登录</h2>
                    <button class="close-btn" onclick="authModal.close()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <input type="text" id="authUsername" placeholder="用户名" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <input type="password" id="authPassword" placeholder="密码" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary);">
                    </div>
                    <div class="form-group" id="nicknameGroup" style="margin-bottom: 15px; display: none;">
                        <input type="text" id="authNickname" placeholder="昵称（可选）" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary);">
                    </div>
                    <p id="authError" style="color: #e74c3c; font-size: 14px; margin: 0;"></p>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" onclick="authModal.close()">取消</button>
                    <button class="submit-btn" id="authSubmitBtn" onclick="authModal.submit()">登录</button>
                </div>
                <div style="text-align: center; padding: 0 20px 20px;">
                    <a href="#" id="authSwitch" onclick="authModal.toggleMode()" style="color: var(--primary-color);">还没有账号？立即注册</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        this.modal = modal;
        this.isLogin = true;
        
        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }
    
    open() {
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('authUsername').focus();
    }
    
    close() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        this.clearError();
    }
    
    toggleMode() {
        this.isLogin = !this.isLogin;
        document.getElementById('authTitle').textContent = this.isLogin ? '登录' : '注册';
        document.getElementById('authSubmitBtn').textContent = this.isLogin ? '登录' : '注册';
        document.getElementById('authSwitch').textContent = this.isLogin ? '还没有账号？立即注册' : '已有账号？立即登录';
        document.getElementById('nicknameGroup').style.display = this.isLogin ? 'none' : 'block';
        this.clearError();
    }
    
    clearError() {
        document.getElementById('authError').textContent = '';
    }
    
    showError(message) {
        document.getElementById('authError').textContent = message;
    }
    
    async submit() {
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value;
        const nickname = document.getElementById('authNickname').value.trim();
        
        if (!username || !password) {
            this.showError('请输入用户名和密码');
            return;
        }
        
        const btn = document.getElementById('authSubmitBtn');
        btn.textContent = '处理中...';
        btn.disabled = true;
        
        try {
            let response;
            if (this.isLogin) {
                response = await AuthAPI.login(username, password);
            } else {
                response = await AuthAPI.register(username, password, '', nickname);
            }
            
            if (response.success) {
                this.close();
                app.checkAuthStatus();
                app.updateUserStats();
                app.showToast(this.isLogin ? '登录成功！' : '注册成功！');
            } else {
                this.showError(response.message || '操作失败');
            }
        } catch (error) {
            this.showError(error.message || '网络错误，请重试');
        } finally {
            btn.textContent = this.isLogin ? '登录' : '注册';
            btn.disabled = false;
        }
    }
}

// ==================== 初始化 ====================
const app = new SquareApp();
const postModal = new PostModal();
const imagePreview = new ImagePreview();
const authModal = new AuthModal();

// 导出供全局使用
window.postModal = postModal;
window.imagePreview = imagePreview;
window.authModal = authModal;
window.app = app;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
