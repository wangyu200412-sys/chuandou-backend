/**
 * API服务层 - 与Python后端通信
 */

const API_BASE_URL = '/api';

// ==================== 工具函数 ====================

/**
 * 获取存储的Token
 */
function getToken() {
    return localStorage.getItem('chuandou_token');
}

/**
 * 获取请求头
 */
function getHeaders(includeAuth = true) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
}

/**
 * 处理API响应
 */
async function handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
        // 处理401未授权
        if (response.status === 401) {
            localStorage.removeItem('chuandou_token');
            localStorage.removeItem('chuandou_user');
        }
        throw new Error(data.message || '请求失败');
    }
    
    return data;
}

// ==================== 认证API ====================

const AuthAPI = {
    /**
     * 用户注册
     */
    async register(username, password, email = '', nickname = '') {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ username, password, email, nickname })
        });
        
        const data = await handleResponse(response);
        
        if (data.success && data.data.token) {
            localStorage.setItem('chuandou_token', data.data.token);
            localStorage.setItem('chuandou_user', JSON.stringify(data.data.user));
        }
        
        return data;
    },
    
    /**
     * 用户登录
     */
    async login(username, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ username, password })
        });
        
        const data = await handleResponse(response);
        
        if (data.success && data.data.token) {
            localStorage.setItem('chuandou_token', data.data.token);
            localStorage.setItem('chuandou_user', JSON.stringify(data.data.user));
        }
        
        return data;
    },
    
    /**
     * 获取当前用户信息
     */
    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: getHeaders()
        });
        
        return handleResponse(response);
    },
    
    /**
     * 更新用户信息
     */
    async updateProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(profileData)
        });
        
        const data = await handleResponse(response);
        
        if (data.success) {
            localStorage.setItem('chuandou_user', JSON.stringify(data.data));
        }
        
        return data;
    },
    
    /**
     * 修改密码
     */
    async changePassword(oldPassword, newPassword) {
        const response = await fetch(`${API_BASE_URL}/auth/password`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        
        return handleResponse(response);
    },
    
    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem('chuandou_token');
        localStorage.removeItem('chuandou_user');
    },
    
    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!getToken();
    },
    
    /**
     * 获取当前用户
     */
    getCurrentUser() {
        const user = localStorage.getItem('chuandou_user');
        return user ? JSON.parse(user) : null;
    }
};

// ==================== 帖子API ====================

const PostsAPI = {
    /**
     * 获取帖子列表
     */
    async getList(page = 1, filter = 'all', perPage = 10) {
        const response = await fetch(
            `${API_BASE_URL}/posts?page=${page}&filter=${filter}&per_page=${perPage}`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 获取单个帖子
     */
    async getDetail(postId) {
        const response = await fetch(
            `${API_BASE_URL}/posts/${postId}`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 创建帖子
     */
    async create(content, imageFile = null) {
        const formData = new FormData();
        formData.append('content', content);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        
        return handleResponse(response);
    },
    
    /**
     * 删除帖子
     */
    async delete(postId) {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        return handleResponse(response);
    },
    
    /**
     * 点赞/取消点赞
     */
    async toggleLike(postId) {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: getHeaders()
        });
        
        return handleResponse(response);
    },
    
    /**
     * 获取评论列表
     */
    async getComments(postId, page = 1) {
        const response = await fetch(
            `${API_BASE_URL}/posts/${postId}/comments?page=${page}`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 添加评论
     */
    async addComment(postId, content) {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content })
        });
        
        return handleResponse(response);
    },
    
    /**
     * 删除评论
     */
    async deleteComment(postId, commentId) {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        return handleResponse(response);
    }
};

// ==================== 游戏API ====================

const GameAPI = {
    /**
     * 获取排行榜
     */
    async getLeaderboard(page = 1, sort = 'score') {
        const response = await fetch(
            `${API_BASE_URL}/game/records?page=${page}&sort=${sort}`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 保存游戏记录
     */
    async saveRecord(completionTime, errorCount = 0, isCompleted = true) {
        const response = await fetch(`${API_BASE_URL}/game/records`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                completion_time: completionTime,
                error_count: errorCount,
                is_completed: isCompleted
            })
        });
        
        return handleResponse(response);
    },
    
    /**
     * 获取我的游戏记录
     */
    async getMyRecords(page = 1) {
        const response = await fetch(
            `${API_BASE_URL}/game/my-records?page=${page}`,
            { headers: getHeaders() }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 获取游戏统计
     */
    async getStats() {
        const response = await fetch(
            `${API_BASE_URL}/game/stats`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 获取我的排名
     */
    async getMyRank() {
        const response = await fetch(
            `${API_BASE_URL}/game/rank`,
            { headers: getHeaders() }
        );
        
        return handleResponse(response);
    }
};

// ==================== 构件API ====================

const ComponentsAPI = {
    /**
     * 获取构件列表
     */
    async getList(category = null, page = 1) {
        let url = `${API_BASE_URL}/components?page=${page}`;
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetch(url, { headers: getHeaders(false) });
        
        return handleResponse(response);
    },
    
    /**
     * 获取分类列表
     */
    async getCategories() {
        const response = await fetch(
            `${API_BASE_URL}/components/categories`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 获取构件详情
     */
    async getDetail(componentId) {
        const response = await fetch(
            `${API_BASE_URL}/components/${componentId}`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 根据名称获取构件
     */
    async getByName(name) {
        const response = await fetch(
            `${API_BASE_URL}/components/by-name/${encodeURIComponent(name)}`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    },
    
    /**
     * 搜索构件
     */
    async search(keyword) {
        const response = await fetch(
            `${API_BASE_URL}/components/search?q=${encodeURIComponent(keyword)}`,
            { headers: getHeaders(false) }
        );
        
        return handleResponse(response);
    }
};

// ==================== 导出 ====================

export {
    AuthAPI,
    PostsAPI,
    GameAPI,
    ComponentsAPI,
    API_BASE_URL
};

// 全局暴露（供非模块脚本使用）
window.ChuandouAPI = {
    Auth: AuthAPI,
    Posts: PostsAPI,
    Game: GameAPI,
    Components: ComponentsAPI
};
