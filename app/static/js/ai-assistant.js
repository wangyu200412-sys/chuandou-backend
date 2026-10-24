/**
 * AI智能体悬浮窗组件
 * 可在所有页面引入使用
 * 
 * 使用方法：
 * 1. 在HTML中引入：<script src="js/ai-assistant.js"></script>
 * 2. 在页面加载后调用：new AIAssistant({ apiKey: 'your-api-key', apiUrl: 'your-api-url' });
 */

class AIAssistant {
    constructor(config = {}) {
        // 默认配置
        this.config = {
            apiKey: config.apiKey || '',
            apiUrl: config.apiUrl || '',
            model: config.model || 'gpt-3.5-turbo',
            position: config.position || 'right-bottom', // right-bottom, left-bottom, right-top, left-top
            theme: config.theme || 'dark', // dark, light
            welcomeMessage: config.welcomeMessage || '你好！我是AI助手，有什么可以帮助你的吗？',
            placeholder: config.placeholder || '输入你的问题...',
            maxHistory: config.maxHistory || 50,
            ...config
        };

        this.isOpen = false;
        this.isMinimized = false;
        this.messages = [];
        this.isTyping = false;

        this.init();
    }

    init() {
        this.createStyles();
        this.createDOM();
        this.bindEvents();
        this.loadHistory();
    }

    createStyles() {
        if (document.getElementById('ai-assistant-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-assistant-styles';
        styles.textContent = `
            .ai-assistant-container {
                position: fixed;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }

            /* 悬浮按钮 */
            .ai-assistant-float-btn {
                position: fixed;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                z-index: 9999;
            }

            .ai-assistant-float-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
            }

            .ai-assistant-float-btn svg {
                width: 28px;
                height: 28px;
                fill: white;
            }

            .ai-assistant-float-btn.has-new::after {
                content: '';
                position: absolute;
                top: 5px;
                right: 5px;
                width: 12px;
                height: 12px;
                background: #ff4757;
                border-radius: 50%;
                border: 2px solid white;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
            }

            /* 聊天窗口 */
            .ai-assistant-chat {
                position: fixed;
                width: 380px;
                height: 550px;
                background: ${this.config.theme === 'light' ? '#ffffff' : '#1a1a2e'};
                border-radius: 20px;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transition: all 0.3s ease;
                opacity: 0;
                transform: scale(0.9) translateY(20px);
                pointer-events: none;
                z-index: 9998;
            }

            .ai-assistant-chat.open {
                opacity: 1;
                transform: scale(1) translateY(0);
                pointer-events: all;
            }

            .ai-assistant-chat.minimized {
                height: 60px;
                overflow: hidden;
            }

            /* 头部 */
            .ai-assistant-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                cursor: pointer;
            }

            .ai-assistant-header-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .ai-assistant-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-assistant-avatar svg {
                width: 24px;
                height: 24px;
                fill: white;
            }

            .ai-assistant-title {
                font-size: 16px;
                font-weight: 600;
            }

            .ai-assistant-status {
                font-size: 12px;
                opacity: 0.8;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .ai-assistant-status::before {
                content: '';
                width: 8px;
                height: 8px;
                background: #2ed573;
                border-radius: 50%;
            }

            .ai-assistant-controls {
                display: flex;
                gap: 10px;
            }

            .ai-assistant-controls button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 5px;
                border-radius: 5px;
                transition: background 0.2s;
            }

            .ai-assistant-controls button:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            /* 消息区域 */
            .ai-assistant-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .ai-assistant-messages::-webkit-scrollbar {
                width: 6px;
            }

            .ai-assistant-messages::-webkit-scrollbar-track {
                background: transparent;
            }

            .ai-assistant-messages::-webkit-scrollbar-thumb {
                background: ${this.config.theme === 'light' ? '#ddd' : '#444'};
                border-radius: 3px;
            }

            .ai-message {
                display: flex;
                gap: 10px;
                max-width: 85%;
            }

            .ai-message.user {
                align-self: flex-end;
                flex-direction: row-reverse;
            }

            .ai-message-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .ai-message.user .ai-message-avatar {
                background: #4a5568;
            }

            .ai-message-avatar svg {
                width: 20px;
                height: 20px;
                fill: white;
            }

            .ai-message-content {
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.5;
                word-wrap: break-word;
                background: ${this.config.theme === 'light' ? '#f0f0f0' : '#2d2d44'};
                color: ${this.config.theme === 'light' ? '#333' : '#e0e0e0'};
            }

            .ai-message.user .ai-message-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .ai-message-time {
                font-size: 11px;
                color: ${this.config.theme === 'light' ? '#999' : '#666'};
                margin-top: 4px;
                text-align: right;
            }

            /* 输入区域 */
            .ai-assistant-input-area {
                padding: 15px 20px;
                border-top: 1px solid ${this.config.theme === 'light' ? '#e0e0e0' : '#333'};
                display: flex;
                gap: 10px;
                align-items: flex-end;
            }

            .ai-assistant-input {
                flex: 1;
                border: 1px solid ${this.config.theme === 'light' ? '#ddd' : '#444'};
                border-radius: 20px;
                padding: 10px 15px;
                font-size: 14px;
                resize: none;
                outline: none;
                background: ${this.config.theme === 'light' ? '#fff' : '#2d2d44'};
                color: ${this.config.theme === 'light' ? '#333' : '#e0e0e0'};
                min-height: 40px;
                max-height: 120px;
                font-family: inherit;
            }

            .ai-assistant-input::placeholder {
                color: ${this.config.theme === 'light' ? '#999' : '#666'};
            }

            .ai-assistant-send {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .ai-assistant-send:hover {
                transform: scale(1.05);
            }

            .ai-assistant-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .ai-assistant-send svg {
                width: 20px;
                height: 20px;
                fill: white;
            }

            /* 打字指示器 */
            .ai-typing {
                display: flex;
                gap: 4px;
                padding: 15px 20px;
            }

            .ai-typing span {
                width: 8px;
                height: 8px;
                background: ${this.config.theme === 'light' ? '#999' : '#666'};
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }

            .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
            .ai-typing span:nth-child(3) { animation-delay: 0.4s; }

            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }

            /* 位置样式 */
            .ai-assistant-position-right-bottom .ai-assistant-float-btn,
            .ai-assistant-position-right-bottom .ai-assistant-chat {
                right: 30px;
                bottom: 30px;
            }

            .ai-assistant-position-left-bottom .ai-assistant-float-btn,
            .ai-assistant-position-left-bottom .ai-assistant-chat {
                left: 30px;
                bottom: 30px;
            }

            .ai-assistant-position-right-top .ai-assistant-float-btn,
            .ai-assistant-position-right-top .ai-assistant-chat {
                right: 30px;
                top: 30px;
            }

            .ai-assistant-position-left-top .ai-assistant-float-btn,
            .ai-assistant-position-left-top .ai-assistant-chat {
                left: 30px;
                top: 30px;
            }

            .ai-assistant-position-right-top .ai-assistant-chat,
            .ai-assistant-position-left-top .ai-assistant-chat {
                transform-origin: top;
            }

            /* 代码块样式 */
            .ai-message-content pre {
                background: ${this.config.theme === 'light' ? '#f5f5f5' : '#1a1a2e'};
                padding: 12px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 8px 0;
            }

            .ai-message-content code {
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 13px;
            }

            /* 移动端适配 */
            @media (max-width: 480px) {
                .ai-assistant-chat {
                    width: 100vw;
                    height: 100vh;
                    border-radius: 0;
                    right: 0 !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    top: 0 !important;
                }

                .ai-assistant-float-btn {
                    right: 20px !important;
                    bottom: 20px !important;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    createDOM() {
        const container = document.createElement('div');
        container.className = `ai-assistant-container ai-assistant-position-${this.config.position}`;
        container.innerHTML = `
            <!-- 悬浮按钮 -->
            <div class="ai-assistant-float-btn" id="aiFloatBtn">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.38 3.55 1.07 5.11L2 22l4.89-1.07A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.66 0-3.22-.52-4.5-1.41l-.32-.21-2.9.63.63-2.9-.21-.32A7.96 7.96 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8zm4.24-5.76c-.2-.1-1.18-.58-1.36-.65-.18-.06-.32-.1-.45.1-.13.2-.5.65-.62.78-.11.13-.22.15-.42.05-.2-.1-.84-.31-1.6-.99-.59-.53-.99-1.18-1.1-1.38-.12-.2-.01-.31.09-.41.09-.09.2-.22.3-.33.1-.11.13-.18.2-.3.06-.13.03-.24-.02-.33-.05-.1-.45-1.08-.62-1.47-.16-.39-.32-.33-.45-.34l-.38-.01c-.13 0-.34.05-.52.24-.18.2-.68.66-.68 1.61 0 .95.69 1.87.79 2 .1.13 1.36 2.08 3.29 2.91.46.2.82.32 1.1.41.46.15.88.13 1.21.08.37-.05 1.18-.48 1.35-.95.17-.47.17-.87.12-.95-.05-.09-.18-.13-.38-.22z"/>
                </svg>
            </div>

            <!-- 聊天窗口 -->
            <div class="ai-assistant-chat" id="aiChatWindow">
                <div class="ai-assistant-header" id="aiHeader">
                    <div class="ai-assistant-header-info">
                        <div class="ai-assistant-avatar">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.38 3.55 1.07 5.11L2 22l4.89-1.07A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.66 0-3.22-.52-4.5-1.41l-.32-.21-2.9.63.63-2.9-.21-.32A7.96 7.96 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="ai-assistant-title">AI助手</div>
                            <div class="ai-assistant-status">在线</div>
                        </div>
                    </div>
                    <div class="ai-assistant-controls">
                        <button id="aiMinimizeBtn" title="最小化">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13H5v-2h14v2z"/>
                            </svg>
                        </button>
                        <button id="aiCloseBtn" title="关闭">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="ai-assistant-messages" id="aiMessages">
                    <!-- 欢迎消息 -->
                    <div class="ai-message">
                        <div class="ai-message-avatar">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.38 3.55 1.07 5.11L2 22l4.89-1.07A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="ai-message-content">${this.config.welcomeMessage}</div>
                            <div class="ai-message-time">${this.getCurrentTime()}</div>
                        </div>
                    </div>
                </div>

                <div class="ai-assistant-input-area">
                    <textarea 
                        class="ai-assistant-input" 
                        id="aiInput" 
                        placeholder="${this.config.placeholder}"
                        rows="1"
                    ></textarea>
                    <button class="ai-assistant-send" id="aiSendBtn">
                        <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // 缓存DOM元素
        this.elements = {
            floatBtn: document.getElementById('aiFloatBtn'),
            chatWindow: document.getElementById('aiChatWindow'),
            header: document.getElementById('aiHeader'),
            messages: document.getElementById('aiMessages'),
            input: document.getElementById('aiInput'),
            sendBtn: document.getElementById('aiSendBtn'),
            minimizeBtn: document.getElementById('aiMinimizeBtn'),
            closeBtn: document.getElementById('aiCloseBtn')
        };
    }

    bindEvents() {
        // 打开/关闭聊天窗口
        this.elements.floatBtn.addEventListener('click', () => this.toggleChat());

        // 关闭按钮
        this.elements.closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat();
        });

        // 最小化按钮
        this.elements.minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeChat();
        });

        // 点击头部展开（当最小化时）
        this.elements.header.addEventListener('click', () => {
            if (this.isMinimized) {
                this.expandChat();
            }
        });

        // 发送消息
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

        // 回车发送
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框自动调整高度
        this.elements.input.addEventListener('input', () => {
            this.elements.input.style.height = 'auto';
            this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 120) + 'px';
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.elements.chatWindow.contains(e.target) && 
                !this.elements.floatBtn.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.elements.chatWindow.classList.add('open');
        this.elements.floatBtn.style.display = 'none';
        this.elements.input.focus();
        this.scrollToBottom();
    }

    closeChat() {
        this.isOpen = false;
        this.isMinimized = false;
        this.elements.chatWindow.classList.remove('open', 'minimized');
        this.elements.floatBtn.style.display = 'flex';
    }

    minimizeChat() {
        this.isMinimized = true;
        this.elements.chatWindow.classList.add('minimized');
    }

    expandChat() {
        this.isMinimized = false;
        this.elements.chatWindow.classList.remove('minimized');
    }

    async sendMessage() {
        const message = this.elements.input.value.trim();
        if (!message || this.isTyping) return;

        // 添加用户消息
        this.addMessage(message, 'user');
        this.elements.input.value = '';
        this.elements.input.style.height = 'auto';

        // 显示打字指示器
        this.showTyping();

        try {
            // 调用API
            const response = await this.callAPI(message);
            this.hideTyping();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.hideTyping();
            this.addMessage('抱歉，我暂时无法回答，请稍后再试。', 'assistant');
            console.error('AI API Error:', error);
        }
    }

    async callAPI(message) {
        if (!this.config.apiUrl || !this.config.apiKey) {
            // 模拟回复（没有配置API时）
            await this.simulateDelay();
            return `我收到了你的消息："${message}"\n\n（提示：请配置API密钥和地址以获取真实的AI回复）`;
        }

        // 根据API类型选择请求格式
        const apiType = this.config.apiType || 'openai';
        
        let requestBody, headers, responseParser;

        if (apiType === 'zhipu' || apiType === 'glm') {
            // 智谱AI / GLM 格式
            headers = {
                'Content-Type': 'application/json',
                'Authorization': this.config.apiKey
            };
            requestBody = {
                model: this.config.model || 'glm-4',
                messages: [
                    { role: 'system', content: this.config.systemPrompt || '你是一个 helpful 的AI助手。' },
                    ...this.messages.map(m => ({
                        role: m.type === 'user' ? 'user' : 'assistant',
                        content: m.content
                    })),
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 2000
            };
            responseParser = (data) => data.choices[0].message.content;
        } else if (apiType === 'qwen' || apiType === 'dashscope') {
            // 通义千问 / DashScope 格式
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            };
            requestBody = {
                model: this.config.model || 'qwen-turbo',
                input: {
                    messages: [
                        { role: 'system', content: this.config.systemPrompt || '你是一个 helpful 的AI助手。' },
                        ...this.messages.map(m => ({
                            role: m.type === 'user' ? 'user' : 'assistant',
                            content: m.content
                        })),
                        { role: 'user', content: message }
                    ]
                },
                parameters: {
                    temperature: 0.7,
                    max_tokens: 2000
                }
            };
            responseParser = (data) => data.output.choices[0].message.content;
        } else if (apiType === 'yuanqi') {
            // 腾讯元器 API格式 - 可能需要特定的assistant_id
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            };
            // 腾讯元器可能需要assistant_id参数
            requestBody = {
                assistant_id: this.config.appId,
                user_id: 'user_' + Date.now(),
                messages: [
                    { role: 'user', content: message }
                ],
                stream: false
            };
            responseParser = (data) => {
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content;
                }
                if (data.answer) return data.answer;
                if (data.data?.answer) return data.data.answer;
                if (data.result) return data.result;
                if (data.response) return data.response;
                if (data.content) return data.content;
                return JSON.stringify(data);
            };
        } else if (apiType === 'custom') {
            // 自定义格式
            headers = {
                'Content-Type': 'application/json',
                'appid': this.config.appId || '',
                'secret': this.config.apiKey
            };
            requestBody = {
                app_id: this.config.appId,
                secret: this.config.apiKey,
                query: message,
                session_id: this.sessionId || this.generateSessionId(),
                stream: false
            };
            responseParser = (data) => data.data?.content || data.result || data.text || data.message || JSON.stringify(data);
        } else {
            // OpenAI 标准格式
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            };
            requestBody = {
                model: this.config.model || 'gpt-3.5-turbo',
                messages: [
                    ...this.messages.map(m => ({
                        role: m.type === 'user' ? 'user' : 'assistant',
                        content: m.content
                    })),
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 2000
            };
            responseParser = (data) => data.choices[0].message.content;
        }

        // 调试信息
        console.log('[AI Assistant] Request:', {
            url: this.config.apiUrl,
            headers: headers,
            body: requestBody
        });

        const response = await fetch(this.config.apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('[AI Assistant] Response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        const result = responseParser(data);
        console.log('[AI Assistant] Parsed result:', result);
        return result;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type}`;
        
        const isUser = type === 'user';
        messageDiv.innerHTML = `
            <div class="ai-message-avatar">
                <svg viewBox="0 0 24 24">
                    ${isUser 
                        ? '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>'
                        : '<path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.38 3.55 1.07 5.11L2 22l4.89-1.07A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>'
                    }
                </svg>
            </div>
            <div>
                <div class="ai-message-content">${this.formatMessage(content)}</div>
                <div class="ai-message-time">${this.getCurrentTime()}</div>
            </div>
        `;

        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();

        // 保存到历史记录
        this.messages.push({ type, content, time: new Date() });
        if (this.messages.length > this.config.maxHistory) {
            this.messages.shift();
        }
        this.saveHistory();
    }

    formatMessage(content) {
        // 简单的Markdown格式支持
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showTyping() {
        this.isTyping = true;
        this.elements.sendBtn.disabled = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message ai-typing-indicator';
        typingDiv.innerHTML = `
            <div class="ai-message-avatar">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.38 3.55 1.07 5.11L2 22l4.89-1.07A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
            </div>
            <div class="ai-typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.elements.messages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.elements.sendBtn.disabled = false;
        const typingIndicator = this.elements.messages.querySelector('.ai-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    generateSessionId() {
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return this.sessionId;
    }

    simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }

    saveHistory() {
        try {
            localStorage.setItem('ai-assistant-history', JSON.stringify(this.messages));
        } catch (e) {
            console.warn('Failed to save chat history:', e);
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('ai-assistant-history');
            if (history) {
                this.messages = JSON.parse(history);
                // 恢复历史消息到界面
                this.messages.forEach(msg => {
                    if (msg.type !== 'assistant' || msg.content !== this.config.welcomeMessage) {
                        this.addMessageToDOM(msg.content, msg.type, msg.time);
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to load chat history:', e);
        }
    }

    addMessageToDOM(content, type, time) {
        const isUser = type === 'user';
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type}`;
        messageDiv.innerHTML = `
            <div class="ai-message-avatar">
                <svg viewBox="0 0 24 24">
                    ${isUser 
                        ? '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>'
                        : '<path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.38 3.55 1.07 5.11L2 22l4.89-1.07A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>'
                    }
                </svg>
            </div>
            <div>
                <div class="ai-message-content">${this.formatMessage(content)}</div>
                <div class="ai-message-time">${time || this.getCurrentTime()}</div>
            </div>
        `;
        this.elements.messages.appendChild(messageDiv);
    }

    // 公共方法
    clearHistory() {
        this.messages = [];
        localStorage.removeItem('ai-assistant-history');
        this.elements.messages.innerHTML = `
            <div class="ai-message">
                <div class="ai-message-avatar">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.38 3.55 1.07 5.11L2 22l4.89-1.07A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
                    </svg>
                </div>
                <div>
                    <div class="ai-message-content">${this.config.welcomeMessage}</div>
                    <div class="ai-message-time">${this.getCurrentTime()}</div>
                </div>
            </div>
        `;
    }

    destroy() {
        const container = document.querySelector('.ai-assistant-container');
        if (container) {
            container.remove();
        }
        const styles = document.getElementById('ai-assistant-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// 自动初始化（如果配置了全局变量）
if (typeof window.AI_ASSISTANT_CONFIG !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiAssistant = new AIAssistant(window.AI_ASSISTANT_CONFIG);
    });
}
