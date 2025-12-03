(function() {
    'use strict';

    // Widget configuration
    const config = {
        botId: window.CHATBOT_ID || '',
        apiUrl: window.CHATBOT_API_URL || '/api/v1',
        position: window.CHATBOT_POSITION || 'bottom-right',
    };

    if (!config.botId) {
        console.error('ChatBot: CHATBOT_ID is required');
        return;
    }

    // State
    let isOpen = false;
    let botConfig = null;
    let conversationId = null;
    let messages = [];
    let isLoading = false;

    // Create widget container
    const container = document.createElement('div');pop
    container.id = 'chatbot-widget';
    container.style.cssText = 'position: fixed; z-index: 9999;';
    document.body.appendChild(container);

    // Load bot configuration
    async function loadConfig() {
        try {
            const response = await fetch(`${config.apiUrl}/public/bots/${config.botId}/config`);
            if (response.ok) {
                botConfig = await response.json();
                render();
            }
        } catch (error) {
            console.error('ChatBot: Failed to load config', error);
        }
    }

    // Create conversation
    async function createConversation() {
        try {
            const response = await fetch(`${config.apiUrl}/public/bots/${config.botId}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAgent: navigator.userAgent,
                    metadata: {
                        url: window.location.href,
                        referrer: document.referrer,
                    },
                }),
            });
            if (response.ok) {
                const data = await response.json();
                conversationId = data.conversationId;
                
                // Add welcome message
                if (botConfig?.welcomeMessage) {
                    messages.push({
                        role: 'assistant',
                        content: botConfig.welcomeMessage,
                        timestamp: new Date().toISOString(),
                    });
                    render();
                }
            }
        } catch (error) {
            console.error('ChatBot: Failed to create conversation', error);
        }
    }

    // Send message
    async function sendMessage(text) {
        if (!text.trim() || isLoading || !conversationId) return;

        messages.push({
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        });
        isLoading = true;
        render();

        try {
            const response = await fetch(`${config.apiUrl}/public/bots/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });
            
            if (response.ok) {
                const data = await response.json();
                messages.push({
                    role: 'assistant',
                    content: data.content,
                    timestamp: data.timestamp,
                    metadata: data.metadata,
                });
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('ChatBot: Failed to send message', error);
            messages.push({
                role: 'assistant',
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                timestamp: new Date().toISOString(),
            });
        } finally {
            isLoading = false;
            render();
        }
    }

    // Toggle widget
    function toggle() {
        isOpen = !isOpen;
        if (isOpen && !conversationId) {
            createConversation();
        }
        render();
    }

    // Render widget
    function render() {
        if (!botConfig) return;

        const primaryColor = botConfig.theme?.primaryColor || '#3B82F6';
        const position = botConfig.theme?.position || config.position;
        const buttonSize = botConfig.theme?.buttonSize === 'large' ? '64px' : 
                          botConfig.theme?.buttonSize === 'small' ? '48px' : '56px';

        const positionStyles = position.includes('right') ? 'right: 20px;' : 'left: 20px;';
        const verticalStyles = position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;';

        container.innerHTML = `
            <style>
                #chatbot-widget * { box-sizing: border-box; }
                #chatbot-button {
                    position: fixed;
                    ${positionStyles}
                    ${verticalStyles}
                    width: ${buttonSize};
                    height: ${buttonSize};
                    border-radius: 50%;
                    background: ${primaryColor};
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: transform 0.2s;
                    z-index: 10000;
                }
                #chatbot-button:hover { transform: scale(1.1); }
                #chatbot-button svg { width: 24px; height: 24px; color: white; }
                #chatbot-window {
                    position: fixed;
                    ${positionStyles}
                    ${position.includes('bottom') ? 'bottom: 100px;' : 'top: 100px;'}
                    width: 380px;
                    height: 600px;
                    max-height: calc(100vh - 120px);
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    display: ${isOpen ? 'flex' : 'none'};
                    flex-direction: column;
                    z-index: 9999;
                }
                #chatbot-header {
                    background: ${primaryColor};
                    color: white;
                    padding: 16px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                #chatbot-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
                #chatbot-header p { margin: 0; font-size: 12px; opacity: 0.9; }
                #chatbot-close {
                    margin-left: auto;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 4px;
                    padding: 4px;
                    cursor: pointer;
                    color: white;
                }
                #chatbot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f9fafb;
                }
                .chatbot-message {
                    margin-bottom: 12px;
                    display: flex;
                }
                .chatbot-message.user { justify-content: flex-end; }
                .chatbot-message.assistant { justify-content: flex-start; }
                .chatbot-message-content {
                    max-width: 80%;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .chatbot-message.user .chatbot-message-content {
                    background: ${primaryColor};
                    color: white;
                }
                .chatbot-message.assistant .chatbot-message-content {
                    background: white;
                    border: 1px solid #e5e7eb;
                }
                .chatbot-loading {
                    display: flex;
                    gap: 4px;
                    padding: 12px;
                }
                .chatbot-loading-dot {
                    width: 8px;
                    height: 8px;
                    background: #9ca3af;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .chatbot-loading-dot:nth-child(1) { animation-delay: -0.32s; }
                .chatbot-loading-dot:nth-child(2) { animation-delay: -0.16s; }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
                #chatbot-input-container {
                    padding: 16px;
                    border-top: 1px solid #e5e7eb;
                    background: white;
                    border-radius: 0 0 12px 12px;
                    display: flex;
                    gap: 8px;
                }
                #chatbot-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    outline: none;
                }
                #chatbot-input:focus { border-color: ${primaryColor}; }
                #chatbot-send {
                    padding: 8px 16px;
                    background: ${primaryColor};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                }
                #chatbot-send:disabled { opacity: 0.5; cursor: not-allowed; }
            </style>

            <button id="chatbot-button" onclick="window.chatbotToggle()">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${isOpen ? 
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' :
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>'
                    }
                </svg>
            </button>

            <div id="chatbot-window">
                <div id="chatbot-header">
                    <div style="flex: 1;">
                        <h3>${botConfig.name}</h3>
                        ${botConfig.description ? `<p>${botConfig.description}</p>` : ''}
                    </div>
                    <button id="chatbot-close" onclick="window.chatbotToggle()">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div id="chatbot-messages">
                    ${messages.map(msg => `
                        <div class="chatbot-message ${msg.role}">
                            <div class="chatbot-message-content">${escapeHtml(msg.content)}</div>
                        </div>
                    `).join('')}
                    ${isLoading ? `
                        <div class="chatbot-message assistant">
                            <div class="chatbot-message-content">
                                <div class="chatbot-loading">
                                    <div class="chatbot-loading-dot"></div>
                                    <div class="chatbot-loading-dot"></div>
                                    <div class="chatbot-loading-dot"></div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div id="chatbot-input-container">
                    <input 
                        type="text" 
                        id="chatbot-input" 
                        placeholder="${botConfig.placeholderText || 'Nhập tin nhắn...'}"
                        ${isLoading ? 'disabled' : ''}
                    />
                    <button id="chatbot-send" ${isLoading ? 'disabled' : ''}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Scroll to bottom
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Add event listeners
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        
        if (input && sendBtn) {
            const handleSend = () => {
                const text = input.value;
                if (text.trim()) {
                    sendMessage(text);
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
        }
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Expose toggle function
    window.chatbotToggle = toggle;

    // Initialize
    loadConfig();
})();
