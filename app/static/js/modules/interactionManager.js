/**
 * 交互管理模块
 * 处理用户交互事件：点赞、评论、分享等
 */

export class InteractionManager {
    constructor() {
        this.dataStore = null;
        this.postRenderer = null;
    }

    /**
     * 设置依赖
     */
    setDependencies(dataStore, postRenderer) {
        this.dataStore = dataStore;
        this.postRenderer = postRenderer;
    }

    /**
     * 获取当前登录用户（支持函数、全局变量、localStorage多层兜底）
     */
    getCurrentUser() {
        if (typeof window.currentUser === 'function') {
            try {
                const u = window.currentUser();
                if (u && (u.id || u.username)) return u;
            } catch (e) {}
        } else if (window.currentUser && typeof window.currentUser === 'object') {
            if (window.currentUser.id || window.currentUser.username) {
                return window.currentUser;
            }
        }
        
        const token = localStorage.getItem('chuandou_token');
        const userStr = localStorage.getItem('chuandou_user');
        if (token && userStr) {
            try {
                const parsed = JSON.parse(userStr);
                if (parsed && (parsed.id || parsed.username)) {
                    return parsed;
                }
            } catch (e) {}
        }
        
        return null;
    }

    /**
     * 绑定帖子事件
     * @param {HTMLElement} postEl - 帖子元素
     * @param {Object} post - 帖子数据
     */
    bindPostEvents(postEl, post) {
        // 点赞按钮
        const likeBtn = postEl.querySelector('[data-action="like"]');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleLike(postEl, post));
        }

        // 评论按钮
        const commentBtn = postEl.querySelector('[data-action="comment"]');
        if (commentBtn) {
            commentBtn.addEventListener('click', () => this.handleCommentToggle(postEl));
        }

        // 分享按钮
        const shareBtn = postEl.querySelector('[data-action="share"]');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.handleShare(post));
        }

        // 删除按钮（"我的发布"页面中的删除）
        const deleteBtn = postEl.querySelector('[data-action="delete-post"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePostDelete(postEl, post);
            });
        }

        // 评论提交
        const commentSubmit = postEl.querySelector('.comment-submit');
        const commentInput = postEl.querySelector('.comment-input');
        
        if (commentSubmit && commentInput) {
            commentSubmit.addEventListener('click', () => {
                this.handleCommentSubmit(postEl, post, commentInput);
            });

            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCommentSubmit(postEl, post, commentInput);
                }
            });
        }

        // 评论删除按钮（事件委托）
        const commentList = postEl.querySelector('.comment-list');
        if (commentList) {
            commentList.addEventListener('click', (e) => {
                // 评论点赞按钮
                const likeCommentBtn = e.target.closest('[data-action="like-comment"]');
                if (likeCommentBtn) {
                    const commentItem = likeCommentBtn.closest('.comment-item');
                    if (commentItem) {
                        this.handleCommentLike(commentItem, post);
                    }
                }
                
                // 评论删除按钮
                const deleteCommentBtn = e.target.closest('[data-action="delete-comment"]');
                if (deleteCommentBtn) {
                    const commentItem = deleteCommentBtn.closest('.comment-item');
                    if (commentItem) {
                        this.handleCommentDelete(postEl, post, commentItem);
                    }
                }
            });
        }

        // 如果评论区已默认展开且内容为空，自动加载评论
        const commentsSection = postEl.querySelector('[data-comments-section]');
        if (commentsSection && commentsSection.style.display !== 'none' && commentList && commentList.children.length === 0) {
            this.loadComments(post.id, commentList, post);
        }
    }

    /**
     * 处理点赞
     * @param {HTMLElement} postEl - 帖子元素
     * @param {Object} post - 帖子数据
     */
    async handleLike(postEl, post) {
        // 获取dataStore
        const dataStore = this.dataStore || (window.squareApp ? window.squareApp.dataStore : null) || (window.app ? window.app.dataStore : null);
        
        // 确保 post 有有效数据
        if (!post || !post.id) {
            console.error('帖子数据无效');
            return;
        }
        
        // 检查登录状态
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            if (window.showLoginModal) {
                window.showLoginModal();
            } else {
                this.showToast('请先登录后再点赞');
            }
            return;
        }

        const likeBtn = postEl.querySelector('[data-action="like"]');
        const isCurrentlyLiked = likeBtn.classList.contains('liked');
        
        // 先乐观更新UI
        const newLikes = (post.likes || 0) + (isCurrentlyLiked ? -1 : 1);
        const newIsLiked = !isCurrentlyLiked;
        
        likeBtn.classList.toggle('liked', newIsLiked);
        likeBtn.querySelector('.action-icon').textContent = newIsLiked ? '❤️' : '🤍';
        likeBtn.querySelector('.action-count').textContent = newLikes;
        
        // 添加动画效果
        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            likeBtn.style.transform = '';
        }, 200);
        
        // 更新本地数据
        if (dataStore && typeof dataStore.toggleLike === 'function') {
            const result = dataStore.toggleLike(post.id);
            if (result) {
                post.likes = result.likes;
                post.isLiked = result.isLiked;
            }
        }

        // 同步到后端
        try {
            const token = localStorage.getItem('chuandou_token');
            const response = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (data.success && data.data) {
                // 严格以服务器返回的真实点赞状态与数量为准
                const serverIsLiked = Boolean(data.data.is_liked);
                const serverLikes = Number(data.data.likes);
                
                likeBtn.classList.toggle('liked', serverIsLiked);
                const actionIcon = likeBtn.querySelector('.action-icon');
                if (actionIcon) actionIcon.textContent = serverIsLiked ? '❤️' : '🤍';
                const actionCount = likeBtn.querySelector('.action-count');
                if (actionCount) actionCount.textContent = serverLikes;
                
                post.likes = serverLikes;
                post.isLiked = serverIsLiked;
                post.is_liked = serverIsLiked;
                
                if (dataStore && typeof dataStore.updatePostLike === 'function') {
                    dataStore.updatePostLike(post.id, serverLikes, serverIsLiked);
                }
                
                // 从服务器准确同步当前用户的统计（权威数据：给别人点赞绝不增加自己的获赞）
                if (window.squareApp && typeof window.squareApp.syncUserStatsFromServer === 'function') {
                    await window.squareApp.syncUserStatsFromServer();
                } else if (window.app && typeof window.app.syncUserStatsFromServer === 'function') {
                    await window.app.syncUserStatsFromServer();
                }
            } else {
                // 后端返回失败，回滚UI
                likeBtn.classList.toggle('liked', isCurrentlyLiked);
                const actionIcon = likeBtn.querySelector('.action-icon');
                if (actionIcon) actionIcon.textContent = isCurrentlyLiked ? '❤️' : '🤍';
                const actionCount = likeBtn.querySelector('.action-count');
                if (actionCount) actionCount.textContent = post.likes;
                if (dataStore && typeof dataStore.toggleLike === 'function') {
                    dataStore.toggleLike(post.id);
                }
            }
        } catch (error) {
            console.error('点赞同步失败:', error);
            // 回滚UI（如果后端失败）
            likeBtn.classList.toggle('liked', isCurrentlyLiked);
            likeBtn.querySelector('.action-icon').textContent = isCurrentlyLiked ? '❤️' : '🤍';
            likeBtn.querySelector('.action-count').textContent = post.likes;
            if (dataStore && typeof dataStore.toggleLike === 'function') {
                dataStore.toggleLike(post.id);
            }
        }
    }

    /**
     * 处理评论展开/收起
     * @param {HTMLElement} postEl - 帖子元素
     */
    async handleCommentToggle(postEl) {
        const commentsSection = postEl.querySelector('[data-comments-section]');
        if (!commentsSection) return;
        
        // 直接从 DOM 元素获取帖子数据
        const post = postEl._postData || this.getPostData(postEl);
        if (!post || !post.id) {
            console.error('无法获取帖子数据');
            return;
        }
        
        const postId = post.id;
        const isVisible = commentsSection.style.display !== 'none';
        
        if (isVisible) {
            // 收起评论区
            commentsSection.style.display = 'none';
        } else {
            // 展开评论区，先加载评论数据
            const commentList = commentsSection.querySelector('.comment-list');
            
            // 如果评论列表为空，先加载评论
            if (!post.comments || post.comments.length === 0) {
                await this.loadComments(postId, commentList, post);
            }
            
            commentsSection.style.display = 'block';
            
            // 聚焦输入框
            setTimeout(() => {
                const input = commentsSection.querySelector('.comment-input');
                if (input) {
                    input.focus();
                    // 滚动到评论区
                    commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
    }
    
    /**
     * 获取帖子数据
     * @param {HTMLElement} postEl - 帖子元素
     */
    getPostData(postEl) {
        const postId = parseInt(postEl.dataset.postId);
        
        // 优先从 squareApp 获取帖子数据
        if (window.squareApp && window.squareApp.loadedPosts) {
            const post = window.squareApp.loadedPosts.find(p => p.id === postId);
            if (post) return post;
        }
        
        // 备用：从 squareAppPosts 获取
        if (window.squareAppPosts && Array.isArray(window.squareAppPosts)) {
            const post = window.squareAppPosts.find(p => p.id === postId);
            if (post) return post;
        }
        
        // 如果都没找到，从 DOM 数据属性重建
        return {
            id: postId,
            comments: []
        };
    }
    
    /**
     * 加载评论数据
     * @param {number} postId - 帖子ID
     * @param {HTMLElement} commentList - 评论列表元素
     * @param {Object} post - 帖子数据
     */
    async loadComments(postId, commentList, post) {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.comments) {
                const comments = result.data.comments;
                
                // 更新帖子数据
                if (post) {
                    post.comments = comments;
                    // 更新 DOM 元素上保存的帖子数据
                    const postCard = commentList.closest('.post-card');
                    if (postCard && postCard._postData) {
                        postCard._postData.comments = comments;
                    }
                }
                
                // 同步到全局加载的帖子数组
                if (window.squareApp && window.squareApp.loadedPosts) {
                    const globalPost = window.squareApp.loadedPosts.find(p => p.id === postId);
                    if (globalPost) {
                        globalPost.comments = comments;
                    }
                }
                if (window.squareAppPosts && Array.isArray(window.squareAppPosts)) {
                    const globalPost = window.squareAppPosts.find(p => p.id === postId);
                    if (globalPost) {
                        globalPost.comments = comments;
                    }
                }
                
                // 清空现有评论
                commentList.innerHTML = '';
                
                // 获取当前登录用户用于判断删除权限
                const currentUser = (window.currentUser ? window.currentUser() : null) || 
                                    (localStorage.getItem('chuandou_user') ? JSON.parse(localStorage.getItem('chuandou_user')) : null);
                const isAdmin = (window.isAdminUser && window.isAdminUser()) || (currentUser && currentUser.is_admin === true);
                
                // 渲染评论
                comments.forEach(comment => {
                    const commentEl = document.createElement('div');
                    commentEl.className = 'comment-item';
                    commentEl.dataset.commentId = comment.id;
                    
                    // 判断是否可以删除（评论作者 或 管理员 均可删除）
                    const isCommentAuthor = currentUser && (
                        comment.authorId === currentUser.id ||
                        comment.author_id === currentUser.id ||
                        comment.author === currentUser.username ||
                        comment.author === currentUser.nickname
                    );
                    const canDelete = isCommentAuthor || isAdmin;
                    const deleteBtnTitle = isAdmin && !isCommentAuthor ? '管理员删除评论' : '删除评论';
                    const deleteBtnClass = isAdmin && !isCommentAuthor ? 'comment-delete-btn admin-delete' : 'comment-delete-btn';
                    const deleteBtnHtml = canDelete 
                        ? `<button class="${deleteBtnClass}" data-action="delete-comment" title="${deleteBtnTitle}">×</button>` 
                        : '';
                    
                    commentEl.innerHTML = `
                        <div class="comment-avatar">${comment.avatar || '👤'}</div>
                        <div class="comment-body">
                            <div class="comment-header">
                                <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                                ${deleteBtnHtml}
                            </div>
                            <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                        </div>
                    `;
                    commentList.appendChild(commentEl);
                });
                
                // 更新评论数
                const postCard = commentList.closest('.post-card');
                const commentBtn = postCard ? postCard.querySelector('[data-action="comment"]') : null;
                if (commentBtn) {
                    commentBtn.querySelector('.action-count').textContent = comments.length;
                }
            }
        } catch (error) {
            console.error('加载评论失败:', error);
            this.showToast('加载评论失败，请重试');
        }
    }

    /**
     * 处理评论提交
     * @param {HTMLElement} postEl - 帖子元素
     * @param {Object} post - 帖子数据
     * @param {HTMLInputElement} input - 输入框
     */
    async handleCommentSubmit(postEl, post, input) {
        let text = input.value.trim();
        if (!text) {
            this.showToast('请输入评论内容');
            return;
        }
        
        // 检查是否包含图片或视频链接，禁止发送
        const imagePattern = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif|heic|heif|avif)$/i;
        const videoPattern = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|3gp)$/i;
        const urlImagePattern = /!\[.*?\]\(.*?\)|<img.*?>|https?:\/\/.*?\.(jpg|jpeg|png|gif|webp|bmp)/gi;
        const urlVideoPattern = /<video.*?>|https?:\/\/.*?\.(mp4|webm|ogg|avi|mov)/gi;
        
        if (imagePattern.test(text) || videoPattern.test(text) || 
            urlImagePattern.test(text) || urlVideoPattern.test(text)) {
            this.showToast('评论仅支持文字内容，暂不支持图片和视频');
            return;
        }
        
        // 检查登录状态
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            if (window.showLoginModal) {
                window.showLoginModal();
            } else {
                this.showToast('请先登录后再评论');
            }
            return;
        }

        const dataStore = this.dataStore || (window.squareApp ? window.squareApp.dataStore : null) || (window.app ? window.app.dataStore : null);
        
        // 优先使用 DOM 元素上保存的帖子数据
        const postData = postEl._postData || post;
        if (!postData || !postData.id) {
            this.showToast('无法获取帖子信息，请刷新页面');
            return;
        }
        
        // 禁用输入框和提交按钮防止重复提交
        const submitBtn = postEl.querySelector('.comment-submit');
        input.disabled = true;
        if (submitBtn) submitBtn.disabled = true;

        try {
            // 先同步到后端
            const token = localStorage.getItem('chuandou_token');
            const apiBase = '/api';
            const response = await fetch(`${apiBase}/posts/${postData.id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: text })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                this.showToast(data.message || '评论失败');
                input.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
            
            // 创建评论数据（优先使用后端返回的数据）
            const serverComment = data.data || {};
            const comment = {
                id: serverComment.id || Date.now(),
                author: serverComment.author || currentUser.nickname || currentUser.username,
                authorId: serverComment.author_id || currentUser.id,
                author_id: serverComment.author_id || currentUser.id,
                avatar: serverComment.avatar || currentUser.avatar || '👤',
                text: serverComment.text || serverComment.content || text,
                time: serverComment.time || '刚刚',
                likes: 0,
                is_liked: false
            };

            // 尝试更新本地存储
            if (dataStore && typeof dataStore.addComment === 'function') {
                try {
                    dataStore.addComment(postData.id, comment);
                } catch (e) {
                    console.warn('本地存储同步失败', e);
                }
            }
            
            // 确保更新内存中帖子的评论列表
            if (!postData.comments) postData.comments = [];
            postData.comments.push(comment);
            if (postEl._postData) {
                if (!postEl._postData.comments) postEl._postData.comments = [];
                postEl._postData.comments.push(comment);
            }
            
            // 添加到DOM
            const commentList = postEl.querySelector('.comment-list');
            if (commentList) {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.dataset.commentId = comment.id;
                commentEl.innerHTML = `
                    <div class="comment-avatar">${comment.avatar}</div>
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                            <button class="comment-delete-btn" data-action="delete-comment" title="删除评论">×</button>
                        </div>
                        <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                        <div class="comment-footer">
                            <span class="comment-time">${comment.time || '刚刚'}</span>
                            <button class="comment-like-btn" data-action="like-comment" data-comment-id="${comment.id}">
                                <span class="like-icon">🤍</span>
                                <span class="like-count">0</span>
                            </button>
                        </div>
                    </div>
                `;
                commentList.appendChild(commentEl);
                commentList.scrollTop = commentList.scrollHeight;
            }

            // 更新评论数
            const commentBtn = postEl.querySelector('[data-action="comment"]');
            if (commentBtn) {
                const countSpan = commentBtn.querySelector('.action-count');
                const currentCount = parseInt(countSpan ? countSpan.textContent : '0') || 0;
                if (countSpan) countSpan.textContent = currentCount + 1;
            }

            // 显示成功提示
            this.showToast('评论发布成功');
            
            // 清空输入框并恢复
            input.value = '';
            input.disabled = false;
            if (submitBtn) submitBtn.disabled = false;
        } catch (error) {
            console.error('评论提交失败:', error);
            this.showToast('评论提交失败，请重试');
            input.disabled = false;
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    /**
     * 处理评论删除
     * @param {HTMLElement} postEl - 帖子元素
     * @param {Object} post - 帖子数据
     * @param {HTMLElement} commentItem - 评论元素
     */
    async handleCommentDelete(postEl, post, commentItem) {
        const commentId = commentItem.dataset.commentId;
        if (!commentId) {
            console.error('评论ID不存在');
            return;
        }

        // 获取dataStore
        const dataStore = this.dataStore || (window.squareApp ? window.squareApp.dataStore : null) || (window.app ? window.app.dataStore : null);

        // 优先使用 DOM 元素上保存的帖子数据
        const postData = postEl._postData || post;
        if (!postData || !postData.id) {
            this.showToast('无法获取帖子信息，请刷新页面');
            return;
        }

        // 当前用户与管理员权限
        const currentUser = (window.currentUser ? window.currentUser() : null) || 
                            (localStorage.getItem('chuandou_user') ? JSON.parse(localStorage.getItem('chuandou_user')) : null);
        const isAdmin = (window.isAdminUser && window.isAdminUser()) || (currentUser && currentUser.is_admin === true);

        // 使用确认弹窗
        const confirmMsg = isAdmin ? '确定要删除这条评论吗？（管理员操作）' : '确定要删除这条评论吗？此操作不可恢复。';
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // 添加删除动画
        commentItem.style.transition = 'all 0.3s ease';
        commentItem.style.opacity = '0.5';

        try {
            // 先同步到后端
            const token = localStorage.getItem('chuandou_token');
            const response = await fetch(`/api/posts/${postData.id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                commentItem.style.opacity = '1';
                this.showToast(data.message || '删除失败');
                return;
            }
            
            // 从本地数据存储中删除
            if (dataStore && typeof dataStore.deleteComment === 'function') {
                dataStore.deleteComment(postData.id, commentId);
            }
            
            // 更新帖子数据
            if (postData.comments) {
                postData.comments = postData.comments.filter(c => String(c.id) !== String(commentId));
            }
            if (postEl._postData && postEl._postData.comments) {
                postEl._postData.comments = postEl._postData.comments.filter(c => String(c.id) !== String(commentId));
            }
            
            // 从DOM中移除（带动画）
            commentItem.style.opacity = '0';
            commentItem.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                commentItem.remove();
            }, 300);

            // 更新评论数
            const commentBtn = postEl.querySelector('[data-action="comment"]');
            if (commentBtn) {
                const countSpan = commentBtn.querySelector('.action-count');
                if (countSpan) {
                    const currentCount = parseInt(countSpan.textContent) || 0;
                    countSpan.textContent = Math.max(0, currentCount - 1);
                }
            }
            if (postData.comments_count !== undefined) {
                postData.comments_count = Math.max(0, (postData.comments_count || 1) - 1);
            }

            // 显示成功提示
            this.showToast(isAdmin ? '评论已被管理员删除' : '评论已删除');
        } catch (error) {
            console.error('删除评论失败:', error);
            commentItem.style.opacity = '1';
            this.showToast('删除失败，请重试');
        }
    }

    /**
     * 处理评论点赞
     * @param {HTMLElement} commentItem - 评论元素
     * @param {Object} post - 帖子数据
     */
    async handleCommentLike(commentItem, post) {
        const commentId = commentItem.dataset.commentId;
        if (!commentId) {
            console.error('评论ID不存在');
            return;
        }
        
        // 检查登录状态
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            if (window.showLoginModal) {
                window.showLoginModal();
            } else {
                this.showToast('请先登录后再点赞');
            }
            return;
        }
        
        const likeBtn = commentItem.querySelector('[data-action="like-comment"]');
        if (!likeBtn) return;
        
        const isCurrentlyLiked = likeBtn.classList.contains('liked');
        
        // 乐观更新UI
        const likeIcon = likeBtn.querySelector('.like-icon');
        const likeCount = likeBtn.querySelector('.like-count');
        const currentCount = parseInt(likeCount.textContent) || 0;
        const newCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        const newIsLiked = !isCurrentlyLiked;
        
        likeBtn.classList.toggle('liked', newIsLiked);
        if (likeIcon) likeIcon.textContent = newIsLiked ? '❤️' : '🤍';
        if (likeCount) likeCount.textContent = newCount;
        
        // 添加动画效果
        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            likeBtn.style.transform = 'scale(1)';
        }, 200);
        
        try {
            const token = localStorage.getItem('chuandou_token');
            const response = await fetch(`/api/posts/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.data) {
                // 更新为服务器返回的状态
                likeBtn.classList.toggle('liked', data.data.is_liked);
                if (likeIcon) likeIcon.textContent = data.data.is_liked ? '❤️' : '🤍';
                if (likeCount) likeCount.textContent = data.data.likes;
            } else {
                // 恢复原状态
                likeBtn.classList.toggle('liked', isCurrentlyLiked);
                if (likeIcon) likeIcon.textContent = isCurrentlyLiked ? '❤️' : '🤍';
                if (likeCount) likeCount.textContent = currentCount;
                this.showToast(data.message || '点赞失败');
            }
        } catch (error) {
            console.error('评论点赞失败:', error);
            // 恢复原状态
            likeBtn.classList.toggle('liked', isCurrentlyLiked);
            if (likeIcon) likeIcon.textContent = isCurrentlyLiked ? '❤️' : '🤍';
            if (likeCount) likeCount.textContent = currentCount;
            this.showToast('网络错误，请重试');
        }
    }

    /**
     * 处理帖子删除
     * @param {HTMLElement} postEl - 帖子元素
     * @param {Object} post - 帖子数据
     */
    async handlePostDelete(postEl, post) {
        // 使用确认弹窗
        if (window.showDeletePostModal) {
            window.showDeletePostModal(postEl, post);
        } else {
            // 备用：使用原生 confirm
            if (!confirm('确定要删除这篇帖子吗？')) {
                return;
            }
            this.executePostDelete(postEl, post);
        }
    }
    
    /**
     * 执行帖子删除（内部方法）
     */
    async executePostDelete(postEl, post) {
        // 获取dataStore
        const dataStore = window.app ? window.app.dataStore : null;
        if (!dataStore) return;

        try {
            // 先同步到后端
            const token = localStorage.getItem('chuandou_token');
            const response = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                this.showToast(data.message || '删除失败');
                return;
            }
        } catch (error) {
            console.error('删除帖子失败:', error);
            this.showToast('删除失败，请重试');
            return;
        }
        
        // 从本地数据存储中删除
        dataStore.deletePost(post.id);

        // 从DOM中移除（带动画效果）
        postEl.style.transition = 'all 0.3s ease';
        postEl.style.opacity = '0';
        postEl.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            postEl.remove();
            
            // 检查是否还有帖子
            const container = document.getElementById('postContainer');
            if (container && container.children.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无内容，快来发布第一条动态吧！</div>';
            }
        }, 300);

        // 显示成功提示
        this.showToast('帖子已删除');

        // 更新用户统计
        if (window.app) {
            window.app.updateUserStats();
        }
    }

    /**
     * 处理分享
     * @param {Object} post - 帖子数据
     */
    async handleShare(post) {
        const shareData = {
            title: `${post.author}的穿斗式建筑分享`,
            text: post.content || '来看看这个精彩的古建筑分享吧！',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // 复制链接到剪贴板
                await navigator.clipboard.writeText(window.location.href);
                this.showToast('链接已复制到剪贴板');
            }
        } catch (error) {
            console.error('分享失败:', error);
            // 备用方案：复制链接
            try {
                await navigator.clipboard.writeText(window.location.href);
                this.showToast('链接已复制到剪贴板');
            } catch (e) {
                this.showToast('分享失败，请手动复制链接');
            }
        }
    }

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     */
    showToast(message) {
        // 检查是否已有toast
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

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
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * HTML转义
     * @param {string} text - 原始文本
     */
    escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);
