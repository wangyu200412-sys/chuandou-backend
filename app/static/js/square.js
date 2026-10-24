 /**
 * 穿斗式建筑 - 广场独立模块
 */

// ==================== 全局用户状态 ====================
let currentUser = null;
let isAdmin = false;

// 初始化时从 localStorage 恢复用户和管理员状态
function initAdminState() {
    const storedUser = localStorage.getItem('chuandou_user');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            isAdmin = currentUser.is_admin === true;
        } catch (e) {
            currentUser = null;
            isAdmin = false;
        }
    } else {
        currentUser = null;
        isAdmin = false;
    }
    window.isAdminUser = () => {
        if (isAdmin) return true;
        try {
            const u = JSON.parse(localStorage.getItem('chuandou_user') || '{}');
            return u.is_admin === true;
        } catch (e) {
            return false;
        }
    };
    window.currentUser = () => {
        if (currentUser) return currentUser;
        try {
            return JSON.parse(localStorage.getItem('chuandou_user') || 'null');
        } catch (e) {
            return null;
        }
    };
}

// 页面脚本加载时立即初始化状态
initAdminState();

// ==================== API基础配置 ====================
const API_BASE_URL = '/api';

function getToken() {
    return localStorage.getItem('chuandou_token');
}

// ==================== AuthAPI (内联版本) ====================
const AuthAPI = {
    async register(username, password, email = '', nickname = '') {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email, nickname })
        });
        const data = await response.json();
        if (data.success && data.data.token) {
            localStorage.setItem('chuandou_token', data.data.token);
            localStorage.setItem('chuandou_user', JSON.stringify(data.data.user));
        }
        return data;
    },
    
    async login(username, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success && data.data.token) {
            localStorage.setItem('chuandou_token', data.data.token);
            localStorage.setItem('chuandou_user', JSON.stringify(data.data.user));
        }
        return data;
    },
    
    logout() {
        localStorage.removeItem('chuandou_token');
        localStorage.removeItem('chuandou_user');
        currentUser = null;
        isAdmin = false;
        window.isAdminUser = () => false;
        window.currentUser = () => null;
    },
    
    async deleteAccount(password) {
        const response = await fetch(`${API_BASE_URL}/auth/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ password })
        });
        const data = await response.json();
        if (data.success) {
            this.logout();
        }
        return data;
    },
    
    isLoggedIn() {
        return !!getToken();
    },
    
    getCurrentUser() {
        const user = localStorage.getItem('chuandou_user');
        return user ? JSON.parse(user) : null;
    }
};

// ==================== 广场应用 ====================
class SquareApp {
    constructor() {
        this.dataStore = null;
        this.postRenderer = null;
        this.interactionManager = null;
        this.currentFilter = 'all';
        this.page = 1;
        this.isLoading = false;
        this.postModal = null;
        this.imagePreview = null;
        this.loadedPosts = []; // 存储已加载的帖子，用于评论功能
    }

    async init() {
        // 动态导入模块
        const { DataStore } = await import('./modules/dataStore.js');
        const { PostRenderer } = await import('./modules/postRenderer.js');
        const { InteractionManager } = await import('./modules/interactionManager.js');

        this.dataStore = new DataStore();
        this.postRenderer = new PostRenderer();
        this.interactionManager = new InteractionManager();

        // 设置依赖
        this.interactionManager.setDependencies(this.dataStore, this.postRenderer);

        // 初始化数据
        await this.dataStore.init();
        
        // 渲染初始帖子
        this.loadPosts();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化弹窗
        this.initModals();
        
        // 更新用户状态UI
        this.updateUserUI();
        
        // 从后端权威同步用户统计
        await this.syncUserStatsFromServer();
        
        // 更新用户统计
        this.updateUserStats();
        
        console.log('广场应用初始化完成');
    }
    
    // 更新用户UI状态
    updateUserUI() {
        const token = getToken();
        const storedUser = localStorage.getItem('chuandou_user');
        
        if (token && storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                isAdmin = currentUser.is_admin === true;
            } catch (e) {
                currentUser = null;
                isAdmin = false;
            }
        } else {
            currentUser = null;
            isAdmin = false;
        }
        window.currentUser = () => currentUser;
        window.isAdminUser = () => isAdmin;
        
        const navAuth = document.getElementById('navAuth');
        const navProfile = document.getElementById('navProfile');
        const navAvatar = document.getElementById('navAvatar');
        const navUsername = document.getElementById('navUsername');
        const navAdminBadge = document.getElementById('navAdminBadge');
        const publishBtn = document.querySelector('.publish-btn');
        const userName = document.querySelector('.user-name');
        const userAvatar = document.querySelector('.user-card .user-avatar');
        const myPostsBtn = document.getElementById('myPostsBtn');
        const myCommentsBtn = document.getElementById('myCommentsBtn');
        const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
        
        if (token && currentUser) {
            // 已登录状态
            if (navAuth) navAuth.style.display = 'none';
            if (navProfile) navProfile.style.display = 'flex';
            if (navAvatar) navAvatar.textContent = currentUser.avatar || '👤';
            if (navUsername) navUsername.textContent = currentUser.nickname || currentUser.username;
            if (userName) userName.textContent = currentUser.nickname || currentUser.username;
            if (userAvatar) userAvatar.textContent = currentUser.avatar || '👤';
            
            // 显示"我的帖子"和"我的评论"按钮
            if (myPostsBtn) myPostsBtn.style.display = 'inline-block';
            if (myCommentsBtn) myCommentsBtn.style.display = 'inline-block';
            if (sidebarLogoutBtn) sidebarLogoutBtn.style.display = 'block';
            
            // 显示管理员徽章（从 localStorage 读取）
            const storedUser = localStorage.getItem('chuandou_user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const storedIsAdmin = user.is_admin === true;
                    isAdmin = storedIsAdmin;
                    window.isAdminUser = () => isAdmin;
                    if (navAdminBadge) {
                        navAdminBadge.style.display = storedIsAdmin ? 'inline' : 'none';
                    }
                    // 更新管理员面板按钮
                    updateAdminPanelButton();
                } catch (e) {
                    if (navAdminBadge) navAdminBadge.style.display = 'none';
                }
            } else {
                if (navAdminBadge) navAdminBadge.style.display = 'none';
            }
            
            // 异步检查 token 有效性（不在初始化时阻止UI）
            this.validateToken();
            
            // 发布按钮文字
            if (publishBtn) {
                publishBtn.innerHTML = '<span>+</span> 发布作品';
                publishBtn.style.display = 'block';
            }
        } else {
            // 未登录状态
            if (navAuth) navAuth.style.display = 'flex';
            if (navProfile) navProfile.style.display = 'none';
            if (userName) userName.textContent = '游客';
            if (userAvatar) userAvatar.textContent = '👤';
            const myPostsEl = document.getElementById('myPosts');
            const myLikesEl = document.getElementById('myLikes');
            if (myPostsEl) myPostsEl.textContent = '0';
            if (myLikesEl) myLikesEl.textContent = '0';
            localStorage.removeItem('chuandou_user_stats');
            // 隐藏"我的帖子"和"我的评论"按钮
            if (myPostsBtn) myPostsBtn.style.display = 'none';
            if (myCommentsBtn) myCommentsBtn.style.display = 'none';
            if (sidebarLogoutBtn) sidebarLogoutBtn.style.display = 'none';
            // 未登录时发布按钮提示登录
            if (publishBtn) {
                publishBtn.innerHTML = '<span>🔒</span> 登录后发布';
            }
        }
    }
    
    // 验证 token 有效性（不阻塞UI）
    async validateToken() {
        const token = getToken();
        if (!token) return;
        
        const app = this; // 保存 this 引用
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401 || response.status === 422) {
                // Token 无效或过期，清除登录状态
                AuthAPI.logout();
                isAdmin = false;
                window.isAdminUser = () => false;
                if (app.updateUserUI) app.updateUserUI();
                return;
            }
            
            const data = await response.json();
            if (data.success && data.data && data.data.user) {
                const serverIsAdmin = data.data.user.is_admin === true;
                isAdmin = serverIsAdmin;
                
                // 更新存储的用户信息（确保 is_admin 同步）
                const storedUser = localStorage.getItem('chuandou_user');
                if (storedUser) {
                    try {
                        const user = JSON.parse(storedUser);
                        if (user.is_admin !== serverIsAdmin) {
                            user.is_admin = serverIsAdmin;
                            localStorage.setItem('chuandou_user', JSON.stringify(user));
                        }
                    } catch (e) {
                        console.error('更新用户信息失败:', e);
                    }
                }
                
                // 同步更新全局管理员状态函数
                window.isAdminUser = () => isAdmin;
                
                // 更新管理员徽章显示
                const navAdminBadge = document.getElementById('navAdminBadge');
                if (navAdminBadge) {
                    navAdminBadge.style.display = isAdmin ? 'inline' : 'none';
                }
                
                // 更新管理员面板按钮
                updateAdminPanelButton();
                
                console.log('Token 验证完成，管理员状态:', isAdmin ? '是' : '否');
            }
        } catch (e) {
            // 网络错误时不清除登录状态，让用户可以继续使用
            console.log('Token 验证失败（网络错误）', e);
        }
    }

    bindEvents() {
        // 筛选按钮（排除有data-type的我的内容按钮）
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.filter-btn');
                if (!target) return;
                
                // 如果点击的是我的内容按钮（data-type），不处理
                if (target.dataset.type) return;
                
                // 只有筛选按钮才处理
                if (target.dataset.filter) {
                    document.querySelectorAll('.filter-btn').forEach(b => {
                        if (!b.dataset.type) b.classList.remove('active');
                    });
                    target.classList.add('active');
                    this.currentFilter = target.dataset.filter;
                    this.page = 1;
                    this.loadPosts(true);
                }
            });
        });

        // 加载更多
        const loadMoreBtn = document.getElementById('loadMore');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                if (!this.isLoading) {
                    this.page++;
                    this.loadPosts();
                }
            });
        }

        // 标签点击 - 检查登录
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', () => {
                if (!AuthAPI.isLoggedIn()) {
                    showLoginModal();
                    return;
                }
                const postContent = document.getElementById('postContent');
                if (postContent) {
                    const tagText = tag.textContent;
                    postContent.value += ` ${tagText}`;
                    this.postModal?.open();
                }
            });
        });
        
        // 发布按钮 - 检查登录
        const publishBtn = document.querySelector('.publish-btn');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => {
                if (!AuthAPI.isLoggedIn()) {
                    showLoginModal();
                } else {
                    this.postModal?.open();
                }
            });
        }
    }

    async loadPosts(reset = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const container = document.getElementById('postContainer');
        if (!container) return;
        
        if (reset) {
            container.innerHTML = '<div class="loading-skeleton">加载中...</div>';
            this.loadedPosts = []; // 重置加载的帖子列表
        }

        try {
            // 尝试从后端API获取数据
            const response = await fetch(`${API_BASE_URL}/posts?page=${this.page}&filter=${this.currentFilter}`, {
                headers: this.getAuthHeaders()
            });
            
            const result = await response.json();
            
            if (result.success && result.data && result.data.posts) {
                const posts = result.data.posts;
                
                // 清空加载提示
                if (reset) {
                    container.innerHTML = '';
                }
                
                if (posts.length === 0 && this.page === 1) {
                    container.innerHTML = '<div class="empty-state">暂无内容，快来发布第一条动态吧！</div>';
                    return;
                }

                // 存储帖子数据用于评论功能
                if (this.page === 1) {
                    this.loadedPosts = posts;
                } else {
                    this.loadedPosts.push(...posts);
                }
                
                // 同时存储到全局变量供其他模块使用
                window.squareAppPosts = this.loadedPosts;

                posts.forEach(post => {
                    // 防御性过滤：跳过图片无效或缺少作者的幽灵帖子
                    if (!post.author) return; if (post.image === 'image.png') post.image = null;
                    
                    // 在"我的发布"页面或管理员登录时显示删除按钮
                    const showDeleteBtn = this.currentFilter === 'mine' || isAdmin;
                    const postEl = this.postRenderer.createPostElement(post, showDeleteBtn);
                    container.appendChild(postEl);
                    
                    // 绑定交互事件
                    this.interactionManager.bindPostEvents(postEl, post);
                });

                // 如果没有更多数据，隐藏加载按钮
                const loadMoreBtn = document.getElementById('loadMore');
                if (loadMoreBtn) {
                    if (!result.data.pagination || !result.data.pagination.has_next) {
                        loadMoreBtn.style.display = 'none';
                    } else {
                        loadMoreBtn.style.display = 'block';
                    }
                }
            } else {
                // 后端请求失败，使用本地数据作为降级方案
                if (reset) {
                    container.innerHTML = '';
                }
                const posts = await this.dataStore.getPosts(this.currentFilter, this.page);
                
                if (posts.length === 0 && this.page === 1) {
                    container.innerHTML = '<div class="empty-state">暂无内容，快来发布第一条动态吧！</div>';
                    return;
                }

                // 存储帖子数据用于评论功能
                if (this.page === 1) {
                    this.loadedPosts = posts;
                } else {
                    this.loadedPosts.push(...posts);
                }
                window.squareAppPosts = this.loadedPosts;

                posts.forEach(post => {
                    // 防御性过滤：跳过图片无效或缺少作者的幽灵帖子
                    if (!post.author) return; if (post.image === 'image.png') post.image = null;

                    // 在"我的发布"页面或管理员登录时显示删除按钮
                    const showDeleteBtn = this.currentFilter === 'mine' || isAdmin;
                    const postEl = this.postRenderer.createPostElement(post, showDeleteBtn);
                    container.appendChild(postEl);
                    this.interactionManager.bindPostEvents(postEl, post);
                });
            }
        } catch (error) {
            console.error('加载帖子失败:', error);
            // 网络错误时显示提示
            if (reset) {
                container.innerHTML = '<div class="empty-state">加载失败，请检查网络连接后刷新页面</div>';
            }
        } finally {
            this.isLoading = false;
        }
    }
    
    // 获取认证头
    getAuthHeaders() {
        const token = getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    updateUserStats() {
        const myPostsEl = document.getElementById('myPosts');
        const myLikesEl = document.getElementById('myLikes');
        const token = getToken();
        if (!token || !currentUser) {
            if (myPostsEl) myPostsEl.textContent = '0';
            if (myLikesEl) myLikesEl.textContent = '0';
            localStorage.removeItem('chuandou_user_stats');
            return;
        }
        if (!this.dataStore) {
            console.error('dataStore 未初始化');
            return;
        }
        
        try {
            // 先尝试从后端获取用户统计
            this.syncUserStatsFromServer();
            
            // 然后更新UI
            const stats = this.dataStore.getUserStats();
            const myPostsEl = document.getElementById('myPosts');
            const myLikesEl = document.getElementById('myLikes');
            
            console.log('更新用户统计:', stats);
            
            if (myPostsEl) {
                myPostsEl.textContent = stats.posts || 0;
            }
            if (myLikesEl) {
                myLikesEl.textContent = stats.likes || 0;
            }
        } catch (e) {
            console.error('更新用户统计UI失败:', e);
        }
    }
    
    // 从后端同步用户统计数据
    async syncUserStatsFromServer() {
        const token = getToken();
        if (!token) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.stats) {
                    this.dataStore.syncUserStatsFromServer(result.data.stats);
                    this.updateUserStats();
                }
            }
        } catch (e) {
            console.error('同步用户统计失败:', e);
        }
    }

    initModals() {
        this.postModal = new PostModal(this);
        this.imagePreview = new ImagePreviewModal();
    }
}

// ==================== 发布弹窗管理 ====================
class PostModal {
    constructor(app) {
        this.app = app;
        this.modal = document.getElementById('postModal');
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.previewImage = document.getElementById('previewImage');
        this.postContent = document.getElementById('postContent');
        this.selectedImage = null;

        if (this.modal) {
            this.bindEvents();
        }
    }

    bindEvents() {
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', () => {
                this.imageInput?.click();
            });

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
        }

        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleImageSelect(e.target.files[0]);
                }
            });
        }
    }

    handleImageSelect(file) {
        this.selectedImage = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (this.previewImage) {
                this.previewImage.src = e.target.result;
                this.previewImage.hidden = false;
                const placeholder = this.uploadArea.querySelector('.upload-placeholder');
                if (placeholder) placeholder.style.display = 'none';
            }
        };
        
        reader.readAsDataURL(file);
    }

    open() {
        this.modal?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal?.classList.remove('show');
        document.body.style.overflow = '';
        this.reset();
    }

    reset() {
        this.selectedImage = null;
        if (this.imageInput) this.imageInput.value = '';
        if (this.postContent) this.postContent.value = '';
        if (this.previewImage) {
            this.previewImage.hidden = true;
            this.previewImage.src = '';
        }
        const placeholder = this.uploadArea?.querySelector('.upload-placeholder');
        if (placeholder) placeholder.style.display = 'block';
    }

    uploadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    async uploadImageToServer(file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('content', this.postContent.value.trim() || '分享图片');

        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });
            
            const result = await response.json();
            // 返回完整的帖子数据而不是只返回 image_url
            if (result.success && result.data) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('上传图片到服务器失败:', error);
            return null;
        }
    }

    async submit() {
        const content = this.postContent.value.trim();
        
        if (!this.selectedImage && !content) {
            this.showToast('请上传图片或输入内容');
            return;
        }
        
        // 检查登录状态
        if (!AuthAPI.isLoggedIn()) {
            this.showToast('请先登录');
            closeAuthModal();
            setTimeout(() => showLoginModal(), 300);
            return;
        }

        try {
            let serverPost = null;
            
            // 如果有图片，上传图片并创建帖子（一次完成）
            if (this.selectedImage) {
                serverPost = await this.uploadImageToServer(this.selectedImage);
            }
            
            // 如果没有图片或上传失败，再单独创建文字帖子
            if (!serverPost) {
                const response = await fetch(`${API_BASE_URL}/posts`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: new URLSearchParams({
                        content: content || ''
                    })
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    this.showToast(result.message || '发布失败');
                    return;
                }
                
                serverPost = result.data;
            }

            // 使用后端返回的帖子数据
            const user = AuthAPI.getCurrentUser();
            const newPost = {
                id: serverPost.id,
                author: serverPost.author || user.nickname || user.username,
                authorId: serverPost.author_id || user.id,
                avatar: serverPost.avatar || user.avatar || '👤',
                content: serverPost.content || content,
                image: serverPost.image || serverPost.image_url || '',
                time: serverPost.time || '刚刚',
                likes: serverPost.likes || 0,
                comments: serverPost.comments || [],
                isLiked: false
            };

            // 保存到本地存储
            this.app.dataStore.addPost(newPost);
            
            const container = document.getElementById('postContainer');
            // 移除空状态提示
            const emptyState = container?.querySelector('.empty-state');
            if (emptyState) emptyState.remove();
            
            if (container) {
                // 发布成功后，如果当前在"我的发布"页面，显示删除按钮
                const showDeleteBtn = this.app.currentFilter === 'mine';
                const postEl = this.app.postRenderer.createPostElement(newPost, showDeleteBtn);
                container.insertBefore(postEl, container.firstChild);
                this.app.interactionManager.bindPostEvents(postEl, newPost);
            }
            
            // 确保更新用户统计
            this.app.updateUserStats();
            this.close();
            this.showToast('发布成功！');
        } catch (error) {
            console.error('发布失败:', error);
            this.showToast('发布失败，请重试');
        }
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

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
class ImagePreviewModal {
    constructor() {
        this.modal = document.getElementById('imagePreviewModal');
        this.image = document.getElementById('previewLargeImage');
    }

    open(src) {
        if (this.image) this.image.src = src;
        this.modal?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal?.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ==================== 认证相关函数 ====================

// 显示登录弹窗
function showLoginModal() {
    closeAuthModal();
    document.getElementById('loginModal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 显示注册弹窗
function showRegisterModal() {
    closeAuthModal();
    document.getElementById('registerModal')?.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 关闭所有认证弹窗
function closeAuthModal() {
    document.getElementById('loginModal')?.classList.remove('show');
    document.getElementById('registerModal')?.classList.remove('show');
    document.getElementById('loginError') && (document.getElementById('loginError').textContent = '');
    document.getElementById('registerError') && (document.getElementById('registerError').textContent = '');
    document.body.style.overflow = '';
}

// 切换到注册
function switchToRegister() {
    closeAuthModal();
    setTimeout(() => showRegisterModal(), 100);
}

// 切换到登录
function switchToLogin() {
    closeAuthModal();
    setTimeout(() => showLoginModal(), 100);
}

// 处理登录
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    // 清除之前的错误
    errorEl.textContent = '';
    
    if (!username || !password) {
        errorEl.textContent = '请输入用户名和密码';
        return;
    }
    
    console.log('[登录调试] 开始登录流程');
    console.log('[登录调试] 用户名:', username);
    console.log('[登录调试] API地址:', `${API_BASE_URL}/auth/login`);
    
    try {
        console.log('[登录调试] 发送请求到服务器...');
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        console.log('[登录调试] 收到响应, 状态码:', response.status);
        
        // 先获取响应文本用于调试
        const responseText = await response.text();
        console.log('[登录调试] 响应原始内容:', responseText.substring(0, 500));
        
        // 尝试解析为 JSON
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('[登录调试] JSON解析成功:', result);
        } catch (e) {
            console.error('[登录调试] JSON解析失败:', e);
            console.error('[登录调试] 响应内容:', responseText);
            errorEl.textContent = '服务器响应格式错误，请稍后重试';
            return;
        }
        
        if (!response.ok) {
            // HTTP 状态码不是 2xx
            console.error('[登录调试] HTTP错误, 状态码:', response.status);
            console.error('[登录调试] 错误信息:', result.message);
            errorEl.textContent = result.message || `登录失败 (${response.status})`;
            return;
        }
        
        if (result.success) {
            console.log('[登录调试] 登录成功!');
            console.log('[登录调试] 服务器返回的用户数据:', result.data.user);
            console.log('[登录调试] is_admin字段:', result.data.user.is_admin);
            
            // 保存 token 和用户信息
            localStorage.setItem('chuandou_token', result.data.token);
            localStorage.setItem('chuandou_user', JSON.stringify(result.data.user));
            
            console.log('[登录调试] localStorage保存完成');
            console.log('[登录调试] Token已保存:', result.data.token.substring(0, 30) + '...');
            
            // 登录成功后，立即同步更新全局用户和管理员状态
            currentUser = result.data.user;
            isAdmin = result.data.user.is_admin === true;
            window.currentUser = () => currentUser;
            window.isAdminUser = () => isAdmin;
            
            closeAuthModal();
            
            const navAdminBadge = document.getElementById('navAdminBadge');
            if (navAdminBadge) {
                navAdminBadge.style.display = isAdmin ? 'inline' : 'none';
            }
            
            // 更新管理员面板按钮
            updateAdminPanelButton();
            
            console.log('[登录调试] 管理员状态设置完成:', isAdmin ? '是管理员' : '普通用户');
            
            squareApp.updateUserUI();
            // 重新刷新帖子列表，确保每篇帖子的红心/白心状态与当前用户点赞记录完全对齐
            squareApp.page = 1;
            squareApp.loadPosts(true);
            // 从后端同步用户统计，然后更新UI
            await squareApp.syncUserStatsFromServer();
            squareApp.updateUserStats();
            showAlert('登录成功！欢迎回来，' + (result.data.user.nickname || result.data.user.username), '✅');
        } else {
            console.error('[登录调试] 登录失败:', result.message);
            errorEl.textContent = result.message || '登录失败';
        }
    } catch (error) {
        console.error('[登录调试] 请求异常:', error);
        console.error('[登录调试] 错误类型:', error.name);
        console.error('[登录调试] 错误消息:', error.message);
        
        // 提供更详细的错误信息
        if (error.message && error.message.includes('Failed to fetch')) {
            errorEl.textContent = '无法连接到服务器，请检查服务器是否启动';
        } else if (error.message && error.message.includes('NetworkError')) {
            errorEl.textContent = '网络错误，请检查网络连接';
        } else {
            errorEl.textContent = '网络错误，请检查服务器是否启动';
        }
    }
}

// 处理注册
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const nickname = document.getElementById('regNickname').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const errorEl = document.getElementById('registerError');
    
    if (password !== passwordConfirm) {
        errorEl.textContent = '两次输入的密码不一致';
        return;
    }
    
    try {
        const result = await AuthAPI.register(username, password, email, nickname);
        if (result.success) {
            // 注册成功后直接登录，立即同步全局用户状态
            currentUser = result.data.user;
            isAdmin = result.data.user.is_admin === true;
            window.currentUser = () => currentUser;
            window.isAdminUser = () => isAdmin;
            
            closeAuthModal();
            squareApp.updateUserUI();
            // 重新刷新帖子列表
            squareApp.page = 1;
            squareApp.loadPosts(true);
            // 新用户统计数据初始化为0
            squareApp.dataStore.setUserStats(0, 0);
            squareApp.updateUserStats();
            showAlert('注册成功！欢迎加入穿斗广场，' + (result.data.user.nickname || result.data.user.username), '🎉');
        } else {
            errorEl.textContent = result.message || '注册失败';
        }
    } catch (error) {
        errorEl.textContent = '网络错误，请稍后重试';
    }
}

// 退出登录
function logout() {
    AuthAPI.logout();
    isAdmin = false; // 重置管理员状态
    window.isAdminUser = () => false; // 更新全局函数
    updateAdminPanelButton(); // 更新管理员面板按钮
    squareApp.updateUserUI();
    squareApp.updateUserStats(); // 更新用户统计UI（显示为0）
    squareApp.page = 1;
    squareApp.loadPosts(true); // 重新加载帖子（恢复游客未点赞视图）
    // 如果当前在我的内容视图，切回全部视图
    if (squareApp && (squareApp.currentFilter === 'mine' || (typeof myContentType !== 'undefined' && myContentType === 'comments'))) {
        squareApp.currentFilter = 'all';
        squareApp.page = 1;
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) {
            document.querySelectorAll('.filter-btn').forEach(b => {
                if (!b.dataset.type) b.classList.remove('active');
            });
            allBtn.classList.add('active');
        }
        const postContainer = document.getElementById('postContainer');
        const commentsContainer = document.getElementById('myCommentsContainer');
        if (postContainer) postContainer.style.display = '';
        if (commentsContainer) commentsContainer.style.display = 'none';
        squareApp.loadPosts(true);
    }
    showAlert('已退出登录', '👋');
}

// 显示删除账号弹窗
function showDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    const passwordInput = document.getElementById('deleteAccountPassword');
    const errorEl = document.getElementById('deleteAccountError');
    
    if (passwordInput) passwordInput.value = '';
    if (errorEl) errorEl.textContent = '';
    
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// 关闭删除账号弹窗
function closeDeleteAccountModal() {
    document.getElementById('deleteAccountModal')?.classList.remove('show');
    document.body.style.overflow = '';
}

// 关闭删除帖子弹窗
function closeDeletePostModal() {
    document.getElementById('deletePostModal')?.classList.remove('show');
    document.body.style.overflow = '';
}

// 显示删除帖子弹窗
function showDeletePostModal(postEl, post) {
    const modal = document.getElementById('deletePostModal');
    const confirmBtn = document.getElementById('confirmDeletePostBtn');
    const deleteMessage = document.getElementById('deletePostMessage');
    const errorEl = document.getElementById('deletePostError');
    
    if (modal && confirmBtn) {
        // 重置状态
        if (errorEl) errorEl.textContent = '';
        const btnText = confirmBtn.querySelector('.btn-text');
        const btnLoading = confirmBtn.querySelector('.btn-loading');
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        confirmBtn.disabled = false;
        
        // 更新提示信息
        if (deleteMessage) {
            if (post.comments && post.comments.length > 0) {
                deleteMessage.innerHTML = `确定要删除这条帖子吗？<br><br>此操作不可恢复，将同时删除 <strong>${post.comments.length}</strong> 条评论。`;
            } else {
                deleteMessage.innerHTML = '确定要删除这条帖子吗？<br><br>此操作不可恢复。';
            }
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // 移除之前的事件监听器（防止重复绑定）
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 绑定确认按钮事件
        newConfirmBtn.onclick = async () => {
            // 显示加载状态
            const btnText = newConfirmBtn.querySelector('.btn-text');
            const btnLoading = newConfirmBtn.querySelector('.btn-loading');
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
            newConfirmBtn.disabled = true;
            
            await handleDeletePost(postEl, post, newConfirmBtn);
        };
    }
}

// 处理删除帖子
async function handleDeletePost(postEl, post, confirmBtn) {
    const currentUser = AuthAPI.getCurrentUser();
    const isAdminUser = window.isAdminUser ? window.isAdminUser() : false;
    const isAuthor = currentUser && (
        post.authorId === currentUser.id || 
        post.author === currentUser.username || 
        post.author === currentUser.nickname
    );
    
    // 获取dataStore
    if (!squareApp || !squareApp.dataStore) {
        resetConfirmButton(confirmBtn);
        showAlert('系统错误，请刷新页面重试', '⚠️');
        return;
    }
    
    try {
        // 先同步到后端
        const token = getToken();
        if (!token) {
            resetConfirmButton(confirmBtn);
            showAlert('请先登录', '⚠️');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/posts/${post.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            resetConfirmButton(confirmBtn);
            showAlert(data.message || '删除失败', '⚠️');
            return;
        }
    } catch (error) {
        console.error('删除帖子失败:', error);
        resetConfirmButton(confirmBtn);
        showAlert('删除失败，请检查网络连接后重试', '⚠️');
        return;
    }
    
    // 从数据存储中删除
    squareApp.dataStore.deletePost(post.id);
    
    // 从DOM中移除（带动画效果）
    postEl.style.transition = 'all 0.3s ease';
    postEl.style.opacity = '0';
    postEl.style.transform = 'translateX(-100%) scale(0.8)';
    
    setTimeout(() => {
        postEl.remove();
        
        // 检查是否还有帖子
        const container = document.getElementById('postContainer');
        if (container && container.children.length === 0) {
            // 根据当前筛选状态显示不同提示
            const filter = squareApp.currentFilter;
            if (filter === 'mine') {
                container.innerHTML = '<div class="empty-state">你还没有发布过内容，快去发布第一条动态吧！</div>';
            } else {
                container.innerHTML = '<div class="empty-state">暂无内容，快来发布第一条动态吧！</div>';
            }
        }
    }, 300);
    
    // 关闭确认弹窗
    closeDeletePostModal();
    
    // 显示成功提示
    const toastMessage = isAdminUser && !isAuthor 
        ? '管理员已删除帖子' 
        : '帖子已删除';
    showAlert(toastMessage, '🗑️');
    
    // 更新用户统计
    squareApp.updateUserStats();
    
    // 如果在"我的发布"页面，刷新列表
    if (squareApp.currentFilter === 'mine') {
        squareApp.page = 1;
        squareApp.loadPosts(true);
    }
}

// 重置确认按钮状态
function resetConfirmButton(btn) {
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
    btn.disabled = false;
}

// 处理删除账号
async function handleDeleteAccount() {
    const password = document.getElementById('deleteAccountPassword').value;
    const errorEl = document.getElementById('deleteAccountError');
    
    if (!password) {
        errorEl.textContent = '请输入密码确认';
        return;
    }
    
    try {
        const result = await AuthAPI.deleteAccount(password);
        
        if (result && result.message && (result.message.includes('过期') || result.message.includes('无效'))) {
            AuthAPI.logout();
            closeDeleteAccountModal();
            squareApp.updateUserUI();
            showAlert('登录已过期，请重新登录', '⚠️');
            return;
        }
        
        if (result.success) {
            closeDeleteAccountModal();
            squareApp.updateUserUI();
            squareApp.updateUserStats(); // 更新用户统计UI
            showAlert(result.message || '账号已注销', '🗑️');
        } else {
            errorEl.textContent = result.message || '注销失败';
        }
    } catch (error) {
        errorEl.textContent = '网络错误，请稍后重试';
    }
}

// 显示提示弹窗
function showAlert(message, icon = 'ℹ️') {
    const alertModal = document.getElementById('alertModal');
    const alertMessage = document.getElementById('alertMessage');
    const alertIcon = document.getElementById('alertIcon');
    
    if (alertModal) {
        if (alertIcon) alertIcon.textContent = icon;
        if (alertMessage) alertMessage.textContent = message;
        alertModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// 关闭提示弹窗
function closeAlert() {
    document.getElementById('alertModal')?.classList.remove('show');
    document.body.style.overflow = '';
}

// ==================== 初始化 ====================
const squareApp = new SquareApp();

// 将 squareApp 实例挂载到 window，供其他模块使用
window.squareApp = squareApp;
window.app = squareApp; // 兼容其他模块的命名习惯

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化管理员状态（从 localStorage 恢复）
    initAdminState();
    
    await squareApp.init();
    
    // 初始化管理员面板按钮
    updateAdminPanelButton();
    
    // 设置全局变量
    window.postModal = squareApp.postModal;
    window.imagePreview = squareApp.imagePreview;
    window.AuthAPI = AuthAPI;
    window.currentUser = () => AuthAPI.getCurrentUser();

    // 点击弹窗外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'postModal') {
                squareApp.postModal?.close();
            } else if (e.target.id === 'imagePreviewModal') {
                squareApp.imagePreview?.close();
            } else if (e.target.id === 'loginModal' || e.target.id === 'registerModal') {
                closeAuthModal();
            } else if (e.target.id === 'alertModal') {
                closeAlert();
            } else if (e.target.id === 'deleteAccountModal') {
                closeDeleteAccountModal();
            } else if (e.target.id === 'deletePostModal') {
                closeDeletePostModal();
            } else if (e.target.id === 'confirmActionModal') {
                closeConfirmAction();
            } else if (e.target.id === 'adminPanelModal') {
                closeAdminPanel();
            }
        }
    });
});

// ==================== 管理员面板功能 ====================

// 显示管理员面板
async function showAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    const userList = document.getElementById('adminUserList');
    
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // 加载用户列表
        if (userList) {
            userList.innerHTML = '<div class="admin-loading">加载中...</div>';
            await loadUsersForAdmin();
        }
    }
}

// 关闭管理员面板
function closeAdminPanel() {
    document.getElementById('adminPanelModal')?.classList.remove('show');
    document.body.style.overflow = '';
}

// 加载用户列表（管理员用）
async function loadUsersForAdmin(searchKeyword = '') {
    const userList = document.getElementById('adminUserList');
    if (!userList) return;
    
    try {
        const token = getToken();
        if (!token) {
            userList.innerHTML = '<div class="admin-error">请先登录</div>';
            return;
        }
        
        let url = `${API_BASE_URL}/admin/users?per_page=50`;
        if (searchKeyword) {
            url += `&search=${encodeURIComponent(searchKeyword)}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 403) {
            userList.innerHTML = '<div class="admin-error">需要管理员权限</div>';
            return;
        }
        
        if (response.status === 401 || response.status === 422) {
            userList.innerHTML = '<div class="admin-error">登录已过期，请重新登录</div>';
            AuthAPI.logout();
            window.isAdminUser = () => false;
            squareApp.updateUserUI();
            return;
        }
        
        const result = await response.json();
        
        if (!result.success) {
            userList.innerHTML = `<div class="admin-error">${result.message || '加载失败'}</div>`;
            return;
        }
        
        const users = result.data.users;
        
        if (users.length === 0) {
            userList.innerHTML = '<div class="admin-empty">暂无用户</div>';
            return;
        }
        
        // 渲染用户列表
        userList.innerHTML = users.map(user => `
            <div class="admin-user-item" data-user-id="${user.id}">
                <div class="user-info">
                    <span class="user-avatar">${user.avatar || '👤'}</span>
                    <div class="user-details">
                        <span class="user-name">${user.nickname || user.username}</span>
                        <span class="user-username">@${user.username}</span>
                        ${user.is_admin ? '<span class="user-badge admin">管理员</span>' : ''}
                        ${!user.is_active ? '<span class="user-badge banned">已禁用</span>' : ''}
                    </div>
                </div>
                <div class="user-actions">
                    ${!user.is_admin ? `
                        <button class="action-btn promote-btn" onclick="confirmPromoteUser(${user.id}, '${escapeHtml(user.username)}')">
                            提升为管理员
                        </button>
                    ` : `
                        <button class="action-btn revoke-btn" onclick="confirmRevokeAdmin(${user.id}, '${escapeHtml(user.username)}')">
                            撤销管理员
                        </button>
                    `}
                    ${user.is_active ? `
                        <button class="action-btn disable-btn" onclick="confirmDisableUser(${user.id}, '${escapeHtml(user.username)}')">
                            禁用账号
                        </button>
                    ` : `
                        <button class="action-btn enable-btn" onclick="enableUser(${user.id})">
                            启用账号
                        </button>
                    `}
                    <button class="action-btn delete-btn" onclick="confirmDeleteUser(${user.id}, '${escapeHtml(user.username)}')">
                        删除用户
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('加载用户列表失败:', error);
        userList.innerHTML = '<div class="admin-error">加载失败，请检查网络连接</div>';
    }
}

// 搜索用户
let searchTimeout = null;
function searchUsers() {
    const searchInput = document.getElementById('adminSearchInput');
    const keyword = searchInput?.value.trim() || '';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadUsersForAdmin(keyword);
    }, 300);
}

// 确认提升用户为管理员
let pendingAction = null;

function confirmPromoteUser(userId, username) {
    showConfirmAction(
        `确定要将用户 <strong>${username}</strong> 提升为管理员吗？`,
        () => promoteUserToAdmin(userId)
    );
}

function confirmRevokeAdmin(userId, username) {
    showConfirmAction(
        `确定要撤销用户 <strong>${username}</strong> 的管理员权限吗？`,
        () => revokeUserAdmin(userId)
    );
}

function confirmDisableUser(userId, username) {
    showConfirmAction(
        `确定要禁用用户 <strong>${username}</strong> 的账号吗？<br><br>禁用后该用户将无法登录。`,
        () => toggleUserStatus(userId)
    );
}

function confirmDeleteUser(userId, username) {
    showConfirmAction(
        `<strong>警告！</strong><br><br>确定要删除用户 <strong>${username}</strong> 吗？<br><br>此操作不可恢复，将同时删除该用户的所有帖子和评论。`,
        () => deleteUser(userId)
    );
}

// 显示确认操作弹窗
function showConfirmAction(message, actionCallback) {
    const modal = document.getElementById('confirmActionModal');
    const messageEl = document.getElementById('confirmActionMessage');
    const errorEl = document.getElementById('confirmActionError');
    const confirmBtn = document.getElementById('confirmActionBtn');
    
    if (modal) {
        if (messageEl) messageEl.innerHTML = message;
        if (errorEl) errorEl.textContent = '';
        
        // 重置按钮状态
        const btnText = confirmBtn?.querySelector('.btn-text');
        const btnLoading = confirmBtn?.querySelector('.btn-loading');
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (confirmBtn) confirmBtn.disabled = false;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // 存储回调
        pendingAction = actionCallback;
        
        // 绑定确认按钮
        if (confirmBtn) {
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            newBtn.onclick = async () => {
                const btnText = newBtn.querySelector('.btn-text');
                const btnLoading = newBtn.querySelector('.btn-loading');
                if (btnText) btnText.style.display = 'none';
                if (btnLoading) btnLoading.style.display = 'inline';
                newBtn.disabled = true;
                
                if (pendingAction) {
                    await pendingAction();
                }
                
                pendingAction = null;
            };
        }
    }
}

// 关闭确认操作弹窗
function closeConfirmAction() {
    document.getElementById('confirmActionModal')?.classList.remove('show');
    document.body.style.overflow = '';
    pendingAction = null;
}

// 提升用户为管理员
async function promoteUserToAdmin(userId) {
    const errorEl = document.getElementById('confirmActionError');
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/promote`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            if (errorEl) errorEl.textContent = result.message || '操作失败';
            return;
        }
        
        closeConfirmAction();
        showAlert(result.message || '已成功提升为管理员', '✅');
        
        // 刷新用户列表
        const searchInput = document.getElementById('adminSearchInput');
        await loadUsersForAdmin(searchInput?.value?.trim() || '');
        
    } catch (error) {
        console.error('提升用户失败:', error);
        if (errorEl) errorEl.textContent = '网络错误，请检查服务器连接';
    }
}

// 撤销用户管理员权限
async function revokeUserAdmin(userId) {
    const errorEl = document.getElementById('confirmActionError');
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/revoke`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            if (errorEl) errorEl.textContent = result.message || '操作失败';
            return;
        }
        
        closeConfirmAction();
        showAlert(result.message || '已撤销管理员权限', '✅');
        
        // 刷新用户列表
        const searchInput = document.getElementById('adminSearchInput');
        await loadUsersForAdmin(searchInput?.value?.trim() || '');
        
    } catch (error) {
        console.error('撤销权限失败:', error);
        if (errorEl) errorEl.textContent = '网络错误，请检查服务器连接';
    }
}

// 切换用户状态（启用/禁用）
async function toggleUserStatus(userId) {
    const errorEl = document.getElementById('confirmActionError');
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            if (errorEl) errorEl.textContent = result.message || '操作失败';
            return;
        }
        
        closeConfirmAction();
        showAlert(result.message || '状态已更新', '✅');
        
        // 刷新用户列表
        const searchInput = document.getElementById('adminSearchInput');
        await loadUsersForAdmin(searchInput?.value?.trim() || '');
        
    } catch (error) {
        console.error('切换用户状态失败:', error);
        if (errorEl) errorEl.textContent = '网络错误，请检查服务器连接';
    }
}

// 直接启用用户
async function enableUser(userId) {
    await toggleUserStatus(userId);
}

// 删除用户
async function deleteUser(userId) {
    const errorEl = document.getElementById('confirmActionError');
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            if (errorEl) errorEl.textContent = result.message || '操作失败';
            return;
        }
        
        closeConfirmAction();
        showAlert(result.message || '用户已删除', '🗑️');
        
        // 刷新用户列表
        const searchInput = document.getElementById('adminSearchInput');
        await loadUsersForAdmin(searchInput?.value?.trim() || '');
        
    } catch (error) {
        console.error('删除用户失败:', error);
        if (errorEl) errorEl.textContent = '网络错误，请检查服务器连接';
    }
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// ==================== 我的发布分隔式标签功能 ====================
let myContentType = 'posts'; // 当前我的内容类型：posts 或 comments

// 切换我的内容类型
async function switchMyContent(type) {
    myContentType = type;
    
    // 取消所有筛选按钮的active状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (!btn.dataset.type) btn.classList.remove('active');
    });
    
    // 设置我的内容按钮为active
    document.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    // 显示/隐藏对应内容
    const postContainer = document.getElementById('postContainer');
    const commentsContainer = document.getElementById('myCommentsContainer');
    const loadMoreBtn = document.getElementById('loadMore');
    
    if (type === 'posts') {
        // 显示帖子
        if (postContainer) postContainer.style.display = '';
        if (commentsContainer) commentsContainer.style.display = 'none';
        if (loadMoreBtn) loadMoreBtn.style.display = 'block';
        // 重新加载帖子
        squareApp.currentFilter = 'mine';
        squareApp.page = 1;
        squareApp.loadPosts(true);
    } else {
        // 显示评论
        if (postContainer) postContainer.style.display = 'none';
        if (commentsContainer) commentsContainer.style.display = '';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        // 加载我的评论
        await loadMyComments();
    }
}

// 加载我的评论
async function loadMyComments() {
    const container = document.getElementById('myCommentsList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-skeleton">加载中...</div>';
    
    try {
        const token = getToken();
        if (!token) {
            container.innerHTML = '<div class="my-comments-empty">请先登录查看我的评论</div>';
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/posts/my-comments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            container.innerHTML = `<div class="my-comments-empty">加载失败: ${result.message || '请稍后重试'}</div>`;
            return;
        }
        
        const comments = result.data.comments;
        
        if (comments.length === 0) {
            container.innerHTML = `
                <div class="my-comments-empty">
                    你还没有发布过评论，快去发表吧！
                </div>
            `;
            return;
        }
        
        // 渲染评论列表
        container.innerHTML = `<div class="my-comments-header">我的评论 (${result.data.pagination?.total || comments.length})</div>`;
        
        comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'my-comment-item';
            commentEl.dataset.commentId = comment.id;
            commentEl.dataset.postId = comment.post_id || comment.post?.id;
            
            // 评论所属的帖子信息
            let postInfo = '';
            if (comment.post) {
                postInfo = `<div class="my-comment-post-link" data-post-id="${comment.post.id}">
                    📄 帖子: ${escapeHtml(comment.post.content)}
                </div>`;
            }
            
            commentEl.innerHTML = `
                ${postInfo}
                <div class="my-comment-content">${escapeHtml(comment.text)}</div>
                <div class="my-comment-meta">
                    <span>${comment.time || ''}</span>
                    <div class="my-comment-actions">
                        <span class="my-comment-likes">❤️ ${comment.likes || 0}</span>
                        <button class="my-comment-delete-btn" data-comment-id="${comment.id}">删除</button>
                    </div>
                </div>
            `;
            
            container.appendChild(commentEl);
        });
        
        // 使用事件委托处理点击
        container.onclick = function(e) {
            // 处理帖子链接点击
            const postLink = e.target.closest('.my-comment-post-link');
            if (postLink) {
                const postId = postLink.dataset.postId;
                if (postId) {
                    goToPost(parseInt(postId));
                }
                return;
            }
            
            // 处理删除按钮点击
            const deleteBtn = e.target.closest('.my-comment-delete-btn');
            if (deleteBtn) {
                const commentId = deleteBtn.dataset.commentId;
                const commentItem = deleteBtn.closest('.my-comment-item');
                if (commentId && commentItem) {
                    deleteMyComment(commentId, commentItem);
                }
            }
        };
        
    } catch (error) {
        console.error('加载我的评论失败:', error);
        container.innerHTML = '<div class="my-comments-empty">加载失败，请检查网络连接</div>';
    }
}

// 删除我的评论
async function deleteMyComment(commentId, commentItem) {
    if (!confirm('确定要删除这条评论吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const token = getToken();
        if (!token) {
            showAlert('请先登录', '⚠️');
            return;
        }
        
        // 从评论数据中获取 postId
        const postId = commentItem.dataset.postId;
        if (!postId) {
            showAlert('无法获取帖子信息', '⚠️');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showAlert(result.message || '删除失败', '❌');
            return;
        }
        
        // 从DOM移除评论
        commentItem.style.transition = 'all 0.3s ease';
        commentItem.style.opacity = '0';
        commentItem.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            commentItem.remove();
            
            // 检查是否还有评论
            const container = document.getElementById('myCommentsList');
            const remainingComments = container.querySelectorAll('.my-comment-item');
            
            if (remainingComments.length === 0) {
                container.innerHTML = `
                    <div class="my-comments-empty">
                        你还没有发布过评论，快去发表吧！
                    </div>
                `;
            } else {
                // 更新评论数量
                const header = container.querySelector('.my-comments-header');
                if (header) {
                    header.textContent = `我的评论 (${remainingComments.length})`;
                }
            }
        }, 300);
        
        showAlert('评论已删除', '🗑️');
        
    } catch (error) {
        console.error('删除评论失败:', error);
        showAlert('删除失败，请检查网络连接', '❌');
    }
}

// 跳转到帖子
function goToPost(postId) {
    // 切换到全部帖子
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const allBtn = document.querySelector('[data-filter="all"]');
    if (allBtn) allBtn.classList.add('active');
    
    // 退出我的评论视图
    const postContainer = document.getElementById('postContainer');
    const commentsContainer = document.getElementById('myCommentsContainer');
    const loadMoreBtn = document.getElementById('loadMore');
    
    if (postContainer) postContainer.style.display = '';
    if (commentsContainer) commentsContainer.style.display = 'none';
    if (loadMoreBtn) loadMoreBtn.style.display = 'block';
    
    squareApp.currentFilter = 'all';
    squareApp.page = 1;
    
    // 加载帖子后滚动到目标帖子
    squareApp.loadPosts(true).then(() => {
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 3秒后滚动到目标帖子
        setTimeout(() => {
            const targetPost = document.querySelector(`[data-post-id="${postId}"]`);
            if (targetPost) {
                targetPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 高亮显示目标帖子
                targetPost.style.boxShadow = '0 0 20px rgba(201, 162, 39, 0.5)';
                setTimeout(() => {
                    targetPost.style.boxShadow = '';
                }, 2000);
            }
        }, 500);
    });
}

// 更新管理员面板按钮显示
function updateAdminPanelButton() {
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    const isAdminUser = window.isAdminUser ? window.isAdminUser() : false;
    
    if (adminPanelBtn) {
        adminPanelBtn.style.display = isAdminUser ? 'inline-block' : 'none';
    }
}

// 导出供全局使用
window.SquareApp = SquareApp;
window.PostModal = PostModal;
window.ImagePreviewModal = ImagePreviewModal;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeAuthModal = closeAuthModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.showAlert = showAlert;
window.closeAlert = closeAlert;
window.showDeleteAccountModal = showDeleteAccountModal;
window.closeDeleteAccountModal = closeDeleteAccountModal;
window.handleDeleteAccount = handleDeleteAccount;
window.closeDeletePostModal = closeDeletePostModal;
window.showDeletePostModal = showDeletePostModal;
window.handleDeletePost = handleDeletePost;
window.showAdminPanel = showAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.searchUsers = searchUsers;
window.confirmPromoteUser = confirmPromoteUser;
window.confirmRevokeAdmin = confirmRevokeAdmin;
window.confirmDisableUser = confirmDisableUser;
window.confirmDeleteUser = confirmDeleteUser;
window.showConfirmAction = showConfirmAction;
window.closeConfirmAction = closeConfirmAction;
window.promoteUserToAdmin = promoteUserToAdmin;
window.revokeUserAdmin = revokeUserAdmin;
window.toggleUserStatus = toggleUserStatus;
window.enableUser = enableUser;
window.deleteUser = deleteUser;
window.escapeHtml = escapeHtml;
window.switchMyContent = switchMyContent;
window.loadMyComments = loadMyComments;
window.goToPost = goToPost;
window.deleteMyComment = deleteMyComment;
