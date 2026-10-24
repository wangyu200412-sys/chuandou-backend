/**
 * 数据存储模块
 * 管理帖子数据的增删改查，使用 localStorage 持久化
 */

export class DataStore {
    constructor() {
        this.STORAGE_KEY = 'chuandou_square_posts';
        this.USER_STATS_KEY = 'chuandou_user_stats';
        this.defaultPosts = [
            {
                id: 1,
                author: '古建筑研究者',
                avatar: '🏛️',
                content: '穿斗式木结构是中国传统建筑的重要形式之一，以其精巧的榫卯结构和独特的力学原理著称。今天分享一张穿斗式建筑的结构解析图，希望大家喜欢！',
                image: './3Dbackground.png',
                time: '2小时前',
                likes: 128,
                comments: [
                    { author: '木工爱好者', avatar: '🪵', text: '太精美了！榫卯结构真是古人智慧的结晶' },
                    { author: '建筑系学生', avatar: '📐', text: '这个结构图很清晰，收藏了' }
                ],
                isLiked: false
            },
            {
                id: 2,
                author: '传统手艺人',
                avatar: '🪚',
                content: '复原了一座穿斗式建筑的3D模型，从地脚枋到屋顶，每一个细节都经过精心打磨。穿斗式的特点是柱子直接承檩，不用梁，结构简洁而稳固。',
                image: '',
                time: '5小时前',
                likes: 256,
                comments: [
                    { author: '文化传承者', avatar: '📜', text: '工匠精神值得学习！' },
                    { author: '设计师小李', avatar: '✏️', text: '模型精度很高，能分享制作流程吗？' },
                    { author: '古建保护协会', avatar: '🏮', text: '希望能有更多这样的数字化保护项目' }
                ],
                isLiked: false
            },
            {
                id: 3,
                author: '历史爱好者',
                avatar: '📚',
                content: '《营造法式》中记载的穿斗式营造技艺，历经千年依然令人叹为观止。这种结构形式在西南地区尤为常见，适应了当地多雨潮湿的气候。',
                image: './construction.glb',
                time: '1天前',
                likes: 89,
                comments: [
                    { author: '文献研究员', avatar: '🔍', text: '可以分享一下相关的古籍资料吗？' }
                ],
                isLiked: false
            },
            {
                id: 4,
                author: '摄影师阿明',
                avatar: '📷',
                content: '探访了一座保存完好的清代穿斗式建筑，阳光透过窗棂洒在木质结构上，仿佛时光倒流。这就是中国传统建筑的魅力所在。',
                image: './woodenstructureDemo.glb',
                time: '2天前',
                likes: 342,
                comments: [
                    { author: '旅游达人', avatar: '🎒', text: '这是在哪里？想去看看' },
                    { author: '光影艺术家', avatar: '🎨', text: '光线运用得真好' },
                    { author: '古建摄影师', avatar: '📸', text: '构图很棒，学习了' },
                    { author: '文化旅行者', avatar: '🗺️', text: '传统建筑与现代摄影的结合' }
                ],
                isLiked: false
            },
            {
                id: 5,
                author: '结构工程师',
                avatar: '⚙️',
                content: '从力学角度分析穿斗式结构的优越性：1. 柱网密布，荷载分散；2. 穿枋连接，整体性强；3. 榫卯节点，柔性抗震。这些都是古人智慧的体现。',
                image: './zhuangshi.glb',
                time: '3天前',
                likes: 167,
                comments: [
                    { author: '土木研究生', avatar: '📊', text: '分析得很专业！' },
                    { author: '抗震专家', avatar: '🏗️', text: '柔性节点确实是传统建筑抗震的关键' }
                ],
                isLiked: false
            }
        ];
    }

    /**
     * 初始化数据存储
     */
    async init() {
        // 检查是否已有数据
        const existingPosts = localStorage.getItem(this.STORAGE_KEY);
        if (!existingPosts) {
            // 首次加载，为默认评论添加ID
            let commentCounter = Date.now();
            const postsWithIds = this.defaultPosts.map(post => ({
                ...post,
                comments: post.comments.map((comment, idx) => ({
                    ...comment,
                    id: commentCounter++ + idx * 0.1  // 使用小数确保唯一性
                }))
            }));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(postsWithIds));
        } else {
            // 检查旧数据中的评论是否有ID，没有则补充
            const posts = JSON.parse(existingPosts);
            let needsUpdate = false;
            let commentCounter = Date.now();
            posts.forEach(post => {
                if (post.comments && post.comments.length > 0) {
                    post.comments.forEach(comment => {
                        if (comment.id === undefined || comment.id === null) {
                            comment.id = commentCounter++;
                            needsUpdate = true;
                        }
                    });
                }
            });
            if (needsUpdate) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
            }
        }
        
        // 初始化用户统计
        const userStats = localStorage.getItem(this.USER_STATS_KEY);
        if (!userStats) {
            localStorage.setItem(this.USER_STATS_KEY, JSON.stringify({
                posts: 0,
                likes: 0
            }));
        }
    }

    /**
     * 获取帖子列表
     * @param {string} filter - 筛选类型：all/hot/new/mine
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     */
    async getPosts(filter = 'all', page = 1, pageSize = 10) {
        const posts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        
        // 根据筛选条件排序
        let filteredPosts = [...posts];
        
        // 如果是"我的发布"，只显示当前用户的帖子
        if (filter === 'mine') {
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id) {
                filteredPosts = filteredPosts.filter(p => p.authorId === currentUser.id);
            } else {
                return [];
            }
        }
        
        switch (filter) {
            case 'hot':
                filteredPosts.sort((a, b) => b.likes - a.likes);
                break;
            case 'new':
            case 'mine':
                filteredPosts.sort((a, b) => b.id - a.id);
                break;
            default:
                // 默认按时间倒序
                filteredPosts.sort((a, b) => b.id - a.id);
        }
        
        // 分页
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filteredPosts.slice(start, end);
    }
    
    /**
     * 获取当前登录用户
     */
    getCurrentUser() {
        const user = localStorage.getItem('chuandou_user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * 添加新帖子
     * @param {Object} post - 帖子数据
     */
    addPost(post) {
        const posts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        
        // 确保新帖子有 authorId
        if (!post.authorId) {
            const user = localStorage.getItem('chuandou_user');
            if (user) {
                const userData = JSON.parse(user);
                post.authorId = userData.id;
            }
        }
        
        posts.unshift(post);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
        
        // 更新用户统计
        this.updateUserStats('posts', 1);
    }

    /**
     * 删除帖子
     * @param {number} postId - 帖子ID
     */
    deletePost(postId) {
        const posts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        const filteredPosts = posts.filter(p => p.id !== postId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPosts));
        
        // 更新用户统计
        this.updateUserStats('posts', -1);
    }

    /**
     * 点赞/取消点赞
     * @param {number} postId - 帖子ID
     */
    toggleLike(postId) {
        const posts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        const post = posts.find(p => p.id === postId);
        
        if (post) {
            post.isLiked = !post.isLiked;
            post.likes = Math.max(0, (post.likes || 0) + (post.isLiked ? 1 : -1));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
            
            // 重要：只有被点赞的帖子是当前用户自己发布的，才影响当前用户的“获赞”数！
            // 给别人点赞绝对不能增加自己的“获赞”数！
            const currentUserStr = localStorage.getItem('chuandou_user');
            if (currentUserStr) {
                try {
                    const currentUser = JSON.parse(currentUserStr);
                    const isOwnPost = post.authorId && (Number(post.authorId) === Number(currentUser.id));
                    if (isOwnPost) {
                        this.updateUserStats('likes', post.isLiked ? 1 : -1);
                    }
                } catch (e) {}
            }
            
            return { isLiked: post.isLiked, likes: post.likes };
        }
        
        return null;
    }

    /**
     * 更新帖子点赞数据（直接同步，避免重复切换状态）
     */
    updatePostLike(postId, likes, isLiked) {
        const posts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.likes = likes;
            post.isLiked = isLiked;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
        }
    }

    /**
     * 添加评论
     * @param {number} postId - 帖子ID
     * @param {Object} comment - 评论数据
     */
    addComment(postId, comment) {
        const posts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        let post = posts.find(p => p.id === postId);
        
        if (!post) {
            post = { id: postId, comments: [] };
            posts.push(post);
        }
        if (!post.comments) {
            post.comments = [];
        }
        if (!comment.id) {
            comment.id = Date.now();
        }
        post.comments.push(comment);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
        return post.comments;
    }

    /**
     * 删除评论
     * @param {number} postId - 帖子ID
     * @param {number|string} commentId - 评论ID
     */
    deleteComment(postId, commentId) {
        const posts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        const post = posts.find(p => p.id === postId);
        
        if (post && post.comments) {
            const originalLength = post.comments.length;
            // 使用宽松比较，确保字符串和数字都能匹配
            post.comments = post.comments.filter(c => String(c.id) !== String(commentId));
            
            if (post.comments.length < originalLength) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
                return true;
            }
        }
        
        return false;
    }

    /**
     * 获取用户统计
     */
    getUserStats() {
        const token = localStorage.getItem('chuandou_token');
        const user = localStorage.getItem('chuandou_user');
        if (!token || !user) {
            return { posts: 0, likes: 0 };
        }
        try {
            const data = localStorage.getItem(this.USER_STATS_KEY);
            if (data) {
                const stats = JSON.parse(data);
                // 确保必要的属性存在且为有效数字
                if (typeof stats.posts !== 'number' || isNaN(stats.posts)) stats.posts = 0;
                if (typeof stats.likes !== 'number' || isNaN(stats.likes)) stats.likes = 0;
                return stats;
            }
        } catch (e) {
            console.error('获取用户统计失败:', e);
        }
        return { posts: 0, likes: 0 };
    }

    /**
     * 更新用户统计
     * @param {string} type - 统计类型：posts/likes
     * @param {number} delta - 变化量
     */
    updateUserStats(type, delta) {
        try {
            const stats = this.getUserStats();
            // 确保当前值是有效数字
            const currentValue = typeof stats[type] === 'number' && !isNaN(stats[type]) ? stats[type] : 0;
            stats[type] = Math.max(0, currentValue + delta);
            localStorage.setItem(this.USER_STATS_KEY, JSON.stringify(stats));
            console.log(`更新用户统计: ${type} = ${stats[type]}`);
            return stats;
        } catch (e) {
            console.error('更新用户统计失败:', e);
            return { posts: 0, likes: 0 };
        }
    }
    
    /**
     * 从服务器同步用户统计数据
     * @param {Object} serverStats - 服务器返回的统计数据
     */
    syncUserStatsFromServer(serverStats) {
        try {
            const localStats = this.getUserStats();
            if (serverStats) {
                // 更新帖子数量（使用服务器的值作为权威来源）
                if (typeof serverStats.posts_count === 'number') {
                    localStats.posts = Math.max(0, serverStats.posts_count);
                }
                // 更新获赞数量（使用服务器的值）
                if (typeof serverStats.likes_received === 'number') {
                    localStats.likes = Math.max(0, serverStats.likes_received);
                }
            }
            localStorage.setItem(this.USER_STATS_KEY, JSON.stringify(localStats));
            console.log('从服务器同步统计:', localStats);
            return localStats;
        } catch (e) {
            console.error('同步统计失败:', e);
            return this.getUserStats();
        }
    }
    
    /**
     * 强制设置用户统计（用于同步服务器数据）
     * @param {number} posts - 帖子数量
     * @param {number} likes - 获赞数量
     */
    setUserStats(posts, likes) {
        try {
            const stats = {
                posts: typeof posts === 'number' && !isNaN(posts) ? Math.max(0, posts) : 0,
                likes: typeof likes === 'number' && !isNaN(likes) ? Math.max(0, likes) : 0
            };
            localStorage.setItem(this.USER_STATS_KEY, JSON.stringify(stats));
            console.log('设置用户统计:', stats);
            return stats;
        } catch (e) {
            console.error('设置用户统计失败:', e);
            return { posts: 0, likes: 0 };
        }
    }

    /**
     * 清空所有数据（调试用）
     */
    clearUserStats() {
        localStorage.removeItem(this.USER_STATS_KEY);
    }

    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.USER_STATS_KEY);
    }
}
