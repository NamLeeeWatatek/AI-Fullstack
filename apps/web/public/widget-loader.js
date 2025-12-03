(function() {
    'use strict';

    // Configuration from script tag attributes
    const script = document.currentScript;
    const config = {
        botId: script.getAttribute('data-bot-id'),
        apiUrl: script.getAttribute('data-api-url') || 'https://api.wataomi.com/api/v1',
        position: script.getAttribute('data-position') || 'bottom-right',
        autoOpen: script.getAttribute('data-auto-open') === 'true',
        autoOpenDelay: parseInt(script.getAttribute('data-auto-open-delay') || '0'),
    };

    if (!config.botId) {
        console.error('[WataOmi Widget] Error: data-bot-id is required');
        return;
    }

    // State
    let widgetLoaded = false;
    let widgetCore = null;

    // Create minimal button first (fast load)
    function createButton() {
        const button = document.createElement('div');
        button.id = 'wataomi-widget-button';
        button.style.cssText = `
            position: fixed;
            ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
            ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        
        button.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        `;

        button.onmouseover = () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
        };
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };

        button.onclick = loadWidget;
        document.body.appendChild(button);
    }

    // Lazy load widget core
    function loadWidget() {
        if (widgetLoaded) {
            if (widgetCore && widgetCore.toggle) {
                widgetCore.toggle();
            }
            return;
        }

        widgetLoaded = true;
        
        // Show loading state
        const button = document.getElementById('wataomi-widget-button');
        if (button) {
            button.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
            `;
        }

        // Load widget core dynamically
        const coreScript = document.createElement('script');
        coreScript.src = script.src.replace('widget-loader.js', 'widget-core.js');
        coreScript.onload = () => {
            if (window.WataOmiWidgetCore) {
                widgetCore = new window.WataOmiWidgetCore(config);
                widgetCore.init();
                
                // Remove button, widget core will handle UI
                if (button) {
                    button.remove();
                }
            }
        };
        coreScript.onerror = () => {
            console.error('[WataOmi Widget] Failed to load widget core');
            if (button) {
                button.innerHTML = `
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                `;
            }
        };
        document.head.appendChild(coreScript);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }

    // Auto-open if configured
    if (config.autoOpen) {
        setTimeout(() => {
            loadWidget();
        }, config.autoOpenDelay * 1000);
    }

    // Expose public API
    window.WataOmiWidget = {
        open: loadWidget,
        config: config,
    };
})();
