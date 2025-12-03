(function() {
    'use strict';

    class WataOmiWidgetCore {
        constructor(config) {
            this.config = config;
            this.isOpen = false;
            this.botConfig = null;
            this.conversationId = null;
            this.messages = [];
            this.isLoading = false;
            this.container = null;
        }

        async init() {
            try {
                await this.loadBotConfig();
                this.createContainer();
                this.render();
                this.toggle(); // Open immediately after load
            } catch (error) {
                console.error('[WataOmi Widget] Initialization failed:', error);
            }
        }

        async loadBotConfig() {
            try {
                const response = await fetch(
                    `${this.config.apiUrl}/public/bots/${this.config.botId}/config`,
                    {
                        headers: {
                            'Origin': window.location.origin,
                        },
                    }
                );
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Bot not found or widget is disabled');
                    } else if (response.status === 403) {
                        throw new Error('This domain is not allowed to use this widget');
                    } else {
                        throw new Error('Failed to load bot configuration');
                    }
                }
                
                this.botConfig = await response.json();
                
                // Apply backend config to widget
                this.applyBackendConfig();
            } catch (error) {
                console.error('[WataOmi Widget] Config load error:', error);
                throw error;
            }
        }

        applyBackendConfig() {
            // Override local config with backend config
            if (this.botConfig.theme?.position) {
                this.config.position = this.botConfig.theme.position;
            }
            if (this.botConfig.behavior?.autoOpen !== undefined) {
                this.config.autoOpen = this.botConfig.behavior.autoOpen;
            }
            if (this.botConfig.behavior?.autoOpenDelay !== undefined) {
                this.config.autoOpenDelay = this.botConfig.behavior.autoOpenDelay;
            }
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'wataomi-widget-container';
            this.container.style.cssText = 'position: fixed; z-index: 999999;';
            document.body.appendChild(this.container);
        }

        async createConversation() {
            try {
                const response = await fetch(
                    `${this.config.apiUrl}/public/bots/${this.config.botId}/conversations`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userAgent: navigator.userAgent,
                            metadata: {
                                url: window.location.href,
                                referrer: document.referrer,
                                timestamp: new Date().toISOString(),
                            },
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    this.conversationId = data.conversationId;

                    // Add welcome message
                    if (this.botConfig?.welcomeMessage) {
                        this.messages.push({
                            role: 'assistant',
                            content: this.botConfig.welcomeMessage,
                            timestamp: new Date().toISOString(),
                        });
                        this.render();
                    }
                }
            } catch (error) {
                console.error('[WataOmi Widget] Failed to create conversation:', error);
            }
        }

        async sendMessage(text) {
            if (!text.trim() || this.isLoading || !this.conversationId) return;

            this.messages.push({
                role: 'user',
                content: text,
                timestamp: new Date().toISOString(),
            });
            this.isLoading = true;
            this.render();

            try {
                const response = await fetch(
                    `${this.config.apiUrl}/public/bots/conversations/${this.conversationId}/messages`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    this.messages.push({
                        role: 'assistant',
                        content: data.content,
                        timestamp: data.timestamp,
                        metadata: data.metadata,
                    });
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                console.error('[WataOmi Widget] Failed to send message:', error);
                this.messages.push({
                    role: 'assistant',
                    content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                    timestamp: new Date().toISOString(),
                    isError: true,
                });
            } finally {
                this.isLoading = false;
                this.render();
            }
        }

        toggle() {
            this.isOpen = !this.isOpen;
            if (this.isOpen && !this.conversationId) {
                this.createConversation();
            }
            this.render();
        }

        render() {
            if (!this.botConfig || !this.container) return;

            const primaryColor = this.botConfig.theme?.primaryColor || '#667eea';
            const position = this.botConfig.theme?.position || this.config.position;
            const isMobile = window.innerWidth <= 768;

            const positionStyles = position.includes('right') ? 'right: 20px;' : 'left: 20px;';
            const verticalStyles = position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;';

            this.container.innerHTML = `
                <style>
                    #wataomi-widget-container * { 
                        box-sizing: border-box; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .wataomi-button {
                        position: fixed;
                        ${positionStyles}
                        ${verticalStyles}
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: ${primaryColor};
                        border: none;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        transition: transform 0.2s;
                        z-index: 1000000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .wataomi-button:hover { transform: scale(1.1); }
                    .wataomi-button svg { width: 28px; height: 28px; }
                    
                    .wataomi-window {
                        position: fixed;
                        ${isMobile ? `
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            width: 100%;
                            height: 100%;
                            border-radius: 0;
                        ` : `
                            ${positionStyles}
                            ${position.includes('bottom') ? 'bottom: 100px;' : 'top: 100px;'}
                            width: 400px;
                            height: 600px;
                            max-height: calc(100vh - 120px);
                            border-radius: 16px;
                        `}
                        background: white;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                        display: ${this.isOpen ? 'flex' : 'none'};
                        flex-direction: column;
                        z-index: 999999;
                        animation: slideIn 0.3s ease-out;
                    }
                    
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .wataomi-header {
                        background: ${primaryColor};
                        color: white;
                        padding: 20px;
                        ${isMobile ? '' : 'border-radius: 16px 16px 0 0;'}
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        flex-shrink: 0;
                    }
                    
                    .wataomi-header-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    }
                    
                    .wataomi-header-info {
                        flex: 1;
                    }
                    
                    .wataomi-header-info h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                    }
                    
                    .wataomi-header-info p {
                        margin: 4px 0 0 0;
                        font-size: 13px;
                        opacity: 0.9;
                    }
                    
                    .wataomi-close {
                        background: rgba(255,255,255,0.2);
                        border: none;
                        border-radius: 8px;
                        padding: 8px;
                        cursor: pointer;
                        color: white;
                        transition: background 0.2s;
                    }
                    
                    .wataomi-close:hover {
                        background: rgba(255,255,255,0.3);
                    }
                    
                    .wataomi-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                        background: #f9fafb;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }
                    
                    .wataomi-messages::-webkit-scrollbar {
                        width: 6px;
                    }
                    
                    .wataomi-messages::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 3px;
                    }
                    
                    .wataomi-message {
                        display: flex;
                        animation: messageIn 0.3s ease-out;
                    }
                    
                    @keyframes messageIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .wataomi-message.user { justify-content: flex-end; }
                    .wataomi-message.assistant { justify-content: flex-start; }
                    
                    .wataomi-message-content {
                        max-width: 75%;
                        padding: 12px 16px;
                        border-radius: 12px;
                        font-size: 14px;
                        line-height: 1.5;
                        word-wrap: break-word;
                    }
                    
                    .wataomi-message.user .wataomi-message-content {
                        background: ${primaryColor};
                        color: white;
                        border-bottom-right-radius: 4px;
                    }
                    
                    .wataomi-message.assistant .wataomi-message-content {
                        background: white;
                        border: 1px solid #e5e7eb;
                        color: #1f2937;
                        border-bottom-left-radius: 4px;
                    }
                    
                    .wataomi-message.assistant .wataomi-message-content.error {
                        background: #fee2e2;
                        border-color: #fca5a5;
                        color: #991b1b;
                    }
                    
                    .wataomi-loading {
                        display: flex;
                        gap: 6px;
                        padding: 12px 16px;
                    }
                    
                    .wataomi-loading-dot {
                        width: 8px;
                        height: 8px;
                        background: #9ca3af;
                        border-radius: 50%;
                        animation: bounce 1.4s infinite ease-in-out both;
                    }
                    
                    .wataomi-loading-dot:nth-child(1) { animation-delay: -0.32s; }
                    .wataomi-loading-dot:nth-child(2) { animation-delay: -0.16s; }
                    
                    @keyframes bounce {
                        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                        40% { transform: scale(1); opacity: 1; }
                    }
                    
                    .wataomi-input-container {
                        padding: 16px 20px;
                        border-top: 1px solid #e5e7eb;
                        background: white;
                        ${isMobile ? '' : 'border-radius: 0 0 16px 16px;'}
                        display: flex;
                        gap: 12px;
                        flex-shrink: 0;
                    }
                    
                    .wataomi-input {
                        flex: 1;
                        padding: 12px 16px;
                        border: 1px solid #e5e7eb;
                        border-radius: 24px;
                        font-size: 14px;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    
                    .wataomi-input:focus {
                        border-color: ${primaryColor};
                    }
                    
                    .wataomi-input:disabled {
                        background: #f3f4f6;
                        cursor: not-allowed;
                    }
                    
                    .wataomi-send {
                        width: 44px;
                        height: 44px;
                        padding: 0;
                        background: ${primaryColor};
                        color: white;
                        border: none;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: transform 0.2s, opacity 0.2s;
                        flex-shrink: 0;
                    }
                    
                    .wataomi-send:hover:not(:disabled) {
                        transform: scale(1.05);
                    }
                    
                    .wataomi-send:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    
                    .wataomi-powered {
                        text-align: center;
                        padding: 8px;
                        font-size: 11px;
                        color: #9ca3af;
                        background: white;
                    }
                    
                    .wataomi-powered a {
                        color: ${primaryColor};
                        text-decoration: none;
                    }
                </style>

                <button class="wataomi-button" onclick="window.wataomiToggle()">
                    <svg fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
                        ${this.isOpen ? 
                            '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' :
                            '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>'
                        }
                    </svg>
                </button>

                <div class="wataomi-window">
                    <div class="wataomi-header">
                        <div class="wataomi-header-avatar">
                            ${this.botConfig.avatarUrl ? 
                                `<img src="${this.botConfig.avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` :
                                '🤖'
                            }
                        </div>
                        <div class="wataomi-header-info">
                            <h3>${this.escapeHtml(this.botConfig.name)}</h3>
                            ${this.botConfig.description ? `<p>${this.escapeHtml(this.botConfig.description)}</p>` : ''}
                        </div>
                        <button class="wataomi-close" onclick="window.wataomiToggle()">
                            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="wataomi-messages" id="wataomi-messages">
                        ${this.messages.map(msg => `
                            <div class="wataomi-message ${msg.role}">
                                <div class="wataomi-message-content ${msg.isError ? 'error' : ''}">
                                    ${this.escapeHtml(msg.content)}
                                </div>
                            </div>
                        `).join('')}
                        ${this.isLoading ? `
                            <div class="wataomi-message assistant">
                                <div class="wataomi-message-content">
                                    <div class="wataomi-loading">
                                        <div class="wataomi-loading-dot"></div>
                                        <div class="wataomi-loading-dot"></div>
                                        <div class="wataomi-loading-dot"></div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="wataomi-input-container">
                        <input 
                            type="text" 
                            class="wataomi-input" 
                            id="wataomi-input"
                            placeholder="${this.escapeHtml(this.botConfig.placeholderText || 'Nhập tin nhắn...')}"
                            ${this.isLoading ? 'disabled' : ''}
                        />
                        <button class="wataomi-send" id="wataomi-send" ${this.isLoading ? 'disabled' : ''}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="wataomi-powered">
                        Powered by <a href="https://wataomi.com" target="_blank">WataOmi</a>
                    </div>
                </div>
            `;

            // Scroll to bottom
            setTimeout(() => {
                const messagesContainer = document.getElementById('wataomi-messages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 100);

            // Add event listeners
            const input = document.getElementById('wataomi-input');
            const sendBtn = document.getElementById('wataomi-send');

            if (input && sendBtn) {
                const handleSend = () => {
                    const text = input.value;
                    if (text.trim()) {
                        this.sendMessage(text);
                        input.value = '';
                    }
                };

                sendBtn.onclick = handleSend;
                input.onkeydown = (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                };

                // Auto-focus input when opened
                if (this.isOpen) {
                    setTimeout(() => input.focus(), 300);
                }
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Expose to global scope
    window.WataOmiWidgetCore = WataOmiWidgetCore;
    window.wataomiToggle = function() {
        if (window.wataomiInstance) {
            window.wataomiInstance.toggle();
        }
    };

    // Auto-initialize if config exists
    if (window.WataOmiWidget && window.WataOmiWidget.config) {
        window.wataomiInstance = new WataOmiWidgetCore(window.WataOmiWidget.config);
        window.wataomiInstance.init();
    }
})();
