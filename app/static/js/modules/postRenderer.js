/**
 * 帖子渲染模块
 * 负责将帖子数据渲染为DOM元素
 */

export class PostRenderer {
    constructor() {
        this.defaultImage = '';
    }

    /**
     * 创建帖子元素
     * @param {Object} post - 帖子数据
     * @param {boolean} showDeleteBtn - 是否显示删除按钮（"我的发布"页面时为true）
     */
    createPostElement(post, showDeleteBtn = false) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.postId = post.id;
        card.dataset.authorId = post.authorId || 0;
        // 保存帖子数据到 DOM 元素，便于后续获取
        card._postData = post;

        // 图片部分（仅在存在有效图片时渲染）
        if (post.image && post.image !== 'image.png') {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'post-image-container';
            
            const img = document.createElement('img');
            img.className = 'post-image';
            img.src = this.getValidImageUrl(post.image);
            img.alt = '帖子图片';
            img.loading = 'lazy';
            img.onclick = () => window.imagePreview && window.imagePreview.open(img.src);
            
            // 图片加载错误处理
            img.onerror = () => {
                imageContainer.style.display = 'none';
            };
            
            imageContainer.appendChild(img);
            card.appendChild(imageContainer);
        }

        // 内容部分
        const content = document.createElement('div');
        content.className = 'post-content';

        // 头部信息
        const header = document.createElement('div');
        header.className = 'post-header';
        
        header.innerHTML = `
            <div class="post-avatar">${post.avatar || '👤'}</div>
            <div class="post-author">
                <div class="post-author-name">
                    ${this.escapeHtml(post.author)}
                    ${post.is_author_admin ? '<span class="author-admin-badge">管理员</span>' : ''}
                </div>
                <div class="post-time">${post.time || '刚刚'}</div>
            </div>
        `;
        content.appendChild(header);

        // 文本内容
        if (post.content) {
            const text = document.createElement('div');
            text.className = 'post-text';
            text.textContent = post.content;
            content.appendChild(text);
        }

        // 操作按钮
        const actions = document.createElement('div');
        actions.className = 'post-actions';
        actions.innerHTML = `
            <button class="action-btn ${post.isLiked || post.is_liked ? 'liked' : ''}" data-action="like">
                <span class="action-icon">${post.isLiked || post.is_liked ? '❤️' : '🤍'}</span>
                <span class="action-count">${post.likes || 0}</span>
            </button>
            <button class="action-btn" data-action="comment">
                <span class="action-icon">💬</span>
                <span class="action-count">${post.comments_count || (post.comments ? post.comments.length : 0)}</span>
            </button>
            <button class="action-btn" data-action="share">
                <span class="action-icon">📤</span>
                <span>分享</span>
            </button>
            ${showDeleteBtn ? `
            <button class="action-btn post-action-delete-btn" data-action="delete-post">
                <span class="action-icon">🗑️</span>
                <span>删除</span>
            </button>
            ` : ''}
        `;
        content.appendChild(actions);
        card.appendChild(content);

        // 评论区 - 在"我的发布"页面时默认显示
        const commentsSection = this.createCommentsSection(post, showDeleteBtn);
        commentsSection.style.display = showDeleteBtn ? 'block' : 'none';
        card.appendChild(commentsSection);

        return card;
    }
    
    /**
     * 获取当前登录用户
     */
    getCurrentUser() {
        const user = localStorage.getItem('chuandou_user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * 创建评论区
     * @param {Object} post - 帖子数据
     * @param {boolean} showCommentDeleteBtn - 是否显示评论删除按钮
     */
    createCommentsSection(post, showCommentDeleteBtn = false) {
        const section = document.createElement('div');
        section.className = 'comments-section';
        section.dataset.commentsSection = 'true';

        // 评论列表
        const commentList = document.createElement('div');
        commentList.className = 'comment-list';
        
        if (post.comments && post.comments.length > 0) {
            post.comments.forEach(comment => {
                const commentEl = this.createCommentElement(comment, post.id, showCommentDeleteBtn);
                commentList.appendChild(commentEl);
            });
        }
        
        section.appendChild(commentList);

        // 输入区域
        const inputArea = document.createElement('div');
        inputArea.className = 'comment-input-area';
        inputArea.innerHTML = `
            <input type="text" class="comment-input" placeholder="写下你的评论..." maxlength="200">
            <button class="comment-submit">发送</button>
        `;
        section.appendChild(inputArea);

        return section;
    }

    /**
     * 创建单个评论元素
     * @param {Object} comment - 评论数据
     * @param {number} postId - 帖子ID
     * @param {boolean} showDeleteBtn - 是否显示删除按钮
     */
    createCommentElement(comment, postId, showDeleteBtn = false) {
        const currentUser = this.getCurrentUser();
        const isAdmin = (window.isAdminUser && window.isAdminUser()) || (currentUser && currentUser.is_admin === true);
        
        // 判断是否显示删除按钮：评论作者或管理员均可删除
        const isCommentAuthor = currentUser && (
            comment.authorId === currentUser.id ||
            comment.author_id === currentUser.id ||
            comment.author === currentUser.username ||
            comment.author === currentUser.nickname
        );
        const canShowDelete = isAdmin || isCommentAuthor || showDeleteBtn;
        const deleteBtnTitle = isAdmin && !isCommentAuthor ? '管理员删除评论' : '删除评论';
        const deleteBtnClass = isAdmin && !isCommentAuthor ? 'comment-delete-btn admin-delete' : 'comment-delete-btn';
        
        // 评论点赞状态
        const isLiked = comment.is_liked === true || comment.isLiked === true;
        const likesCount = comment.likes || comment.likes_count || 0;
        
        const item = document.createElement('div');
        item.className = 'comment-item';
        // 只有评论有ID时才设置dataset
        if (comment.id) {
            item.dataset.commentId = comment.id;
        }
        item.innerHTML = `
            <div class="comment-avatar">${comment.avatar || '👤'}</div>
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                    ${canShowDelete && comment.id ? `<button class="${deleteBtnClass}" data-action="delete-comment" title="${deleteBtnTitle}">×</button>` : ''}
                </div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                <div class="comment-footer">
                    <span class="comment-time">${comment.time || ''}</span>
                    <button class="comment-like-btn ${isLiked ? 'liked' : ''}" data-action="like-comment" data-comment-id="${comment.id}">
                        <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                        <span class="like-count">${likesCount}</span>
                    </button>
                </div>
            </div>
        `;
        return item;
    }

    /**
     * 获取有效的图片URL
     * @param {string} url - 原始URL
     */
    getValidImageUrl(url) {
        if (!url) {
            return this.defaultImage;
        }
        
        // 如果是GLB文件，使用默认图片
        if (url.endsWith('.glb')) {
            return this.defaultImage;
        }
        
        return url;
    }

    /**
     * HTML转义，防止XSS攻击
     * @param {string} text - 原始文本
     */
    escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 更新帖子点赞状态
     * @param {HTMLElement} postEl - 帖子元素
     * @param {boolean} isLiked - 是否已点赞
     * @param {number} likes - 点赞数
     */
    updateLikeState(postEl, isLiked, likes) {
        const likeBtn = postEl.querySelector('[data-action="like"]');
        if (likeBtn) {
            likeBtn.classList.toggle('liked', isLiked);
            likeBtn.querySelector('.action-icon').textContent = isLiked ? '❤️' : '🤍';
            likeBtn.querySelector('.action-count').textContent = likes;
        }
    }

    /**
     * 切换评论区显示
     * @param {HTMLElement} postEl - 帖子元素
     */
    toggleComments(postEl) {
        const commentsSection = postEl.querySelector('[data-comments-section]');
        if (commentsSection) {
            const isVisible = commentsSection.style.display !== 'none';
            commentsSection.style.display = isVisible ? 'none' : 'block';
            
            // 如果显示评论区，聚焦输入框
            if (!isVisible) {
                setTimeout(() => {
                    const input = commentsSection.querySelector('.comment-input');
                    if (input) input.focus();
                }, 100);
            }
        }
    }

    /**
     * 添加新评论到DOM
     * @param {HTMLElement} postEl - 帖子元素
     * @param {Object} comment - 评论数据
     */
    addCommentToDOM(postEl, comment) {
        const commentList = postEl.querySelector('.comment-list');
        if (commentList) {
            const commentEl = this.createCommentElement(comment);
            commentList.appendChild(commentEl);
            commentList.scrollTop = commentList.scrollHeight;
        }

        // 更新评论数
        const commentBtn = postEl.querySelector('[data-action="comment"]');
        if (commentBtn) {
            const currentCount = parseInt(commentBtn.querySelector('.action-count').textContent) || 0;
            commentBtn.querySelector('.action-count').textContent = currentCount + 1;
        }
    }
}
