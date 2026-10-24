/**
 * 穿斗式建筑 - 应用主入口
 * 整合广场和游戏功能
 */

import { BuildingGame } from './modules/buildingGame.js';

// ==================== Tab切换管理 ====================
class TabManager {
    constructor() {
        this.currentTab = 'square';
        this.gameInstance = null;
        this.init();
    }

    init() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 初始化广场
        squareApp.init();
    }

    switchTab(tabName) {
        // 更新Tab按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            const contentId = content.id.replace('Content', '');
            content.classList.toggle('active', contentId === tabName);
        });

        this.currentTab = tabName;

        // 如果切换到游戏，初始化游戏
        if (tabName === 'game') {
            this.initGame();
        } else if (this.gameInstance) {
            // 如果切换回广场，可以销毁游戏实例释放资源
            // this.gameInstance.destroy();
            // this.gameInstance = null;
        }
    }

    initGame() {
        if (!this.gameInstance) {
            this.gameInstance = new BuildingGame('scene');
            this.gameInstance.init();
        }
    }
}

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
        
        // 更新用户统计
        this.updateUserStats();
        
        console.log('广场应用初始化完成');
    }

    bindEvents() {
        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.page = 1;
                this.loadPosts(true);
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

        // 标签点击
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const postContent = document.getElementById('postContent');
                if (postContent) {
                    const tagText = tag.textContent;
                    postContent.value += ` ${tagText}`;
                    this.postModal?.open();
                }
            });
        });
    }

    async loadPosts(reset = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const container = document.getElementById('postContainer');
        if (!container) return;
        
        if (reset) {
            container.innerHTML = '';
        }

        try {
            const posts = await this.dataStore.getPosts(this.currentFilter, this.page);
            
            if (posts.length === 0 && this.page === 1) {
                container.innerHTML = '<div class="empty-state">暂无内容，快来发布第一条动态吧！</div>';
                return;
            }

            posts.forEach(post => {
                const postEl = this.postRenderer.createPostElement(post);
                container.appendChild(postEl);
                
                // 绑定交互事件
                this.interactionManager.bindPostEvents(postEl, post);
            });

            // 如果没有更多数据，隐藏加载按钮
            const loadMoreBtn = document.getElementById('loadMore');
            if (loadMoreBtn) {
                if (posts.length < 10) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('加载帖子失败:', error);
        } finally {
            this.isLoading = false;
        }
    }

    updateUserStats() {
        if (!this.dataStore) return;
        const stats = this.dataStore.getUserStats();
        const myPostsEl = document.getElementById('myPosts');
        const myLikesEl = document.getElementById('myLikes');
        if (myPostsEl) myPostsEl.textContent = stats.posts;
        if (myLikesEl) myLikesEl.textContent = stats.likes;
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
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (result.success && result.data && result.data.image_url) {
                return result.data.image_url;
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
            alert('请上传图片或输入内容');
            return;
        }

        try {
            let imageUrl = '';
            
            if (this.selectedImage) {
                const serverUrl = await this.uploadImageToServer(this.selectedImage);
                if (serverUrl) {
                    imageUrl = serverUrl;
                } else {
                    imageUrl = await this.uploadImage(this.selectedImage);
                }
            }

            const newPost = {
                id: Date.now(),
                author: '古建筑爱好者',
                avatar: '👤',
                content: content,
                image: imageUrl,
                time: '刚刚',
                likes: 0,
                comments: [],
                isLiked: false
            };

            this.app.dataStore.addPost(newPost);
            
            const container = document.getElementById('postContainer');
            if (container) {
                const postEl = this.app.postRenderer.createPostElement(newPost);
                container.insertBefore(postEl, container.firstChild);
                this.app.interactionManager.bindPostEvents(postEl, newPost);
            }
            
            this.app.updateUserStats();
            this.close();
            this.showToast('发布成功！');
        } catch (error) {
            console.error('发布失败:', error);
            alert('发布失败，请重试');
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

// ==================== 游戏辅助函数 ====================
function closeGameComplete() {
    document.getElementById('gameComplete')?.classList.remove('show');
}

function closeGameHelp() {
    document.getElementById('gameHelpModal')?.classList.remove('show');
}

// ==================== 初始化 ====================
const squareApp = new SquareApp();
const tabManager = new TabManager();

// 导出供全局使用
window.postModal = null; // 将在PostModal初始化后赋值
window.imagePreview = null;
window.closeGameComplete = closeGameComplete;
window.closeGameHelp = closeGameHelp;

// 页面加载完成后
document.addEventListener('DOMContentLoaded', () => {
    // 等待广场初始化完成后设置全局postModal
    setTimeout(() => {
        window.postModal = squareApp.postModal;
        window.imagePreview = squareApp.imagePreview;
    }, 100);

    // 点击弹窗外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'postModal') {
                squareApp.postModal?.close();
            } else if (e.target.id === 'imagePreviewModal') {
                squareApp.imagePreview?.close();
            }
        }
    });
});
