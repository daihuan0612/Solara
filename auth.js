/**
 * Solara 认证系统
 * 安全登录保护，无需修改源码
 */

class SolaraAuth {
    constructor() {
        this.password = '123456'; // 🔑 在这里修改密码
        this.storageKey = 'solara_authenticated';
        this.sessionKey = 'solara_session_auth';
        this.wrapperId = 'solara-auth-wrapper';
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.checkAuth(), 100);
            });
        } else {
            setTimeout(() => this.checkAuth(), 100);
        }
    }

    checkAuth() {
        const sessionAuth = sessionStorage.getItem(this.sessionKey);
        const persistentAuth = localStorage.getItem(this.storageKey);
        
        if (sessionAuth === 'true') {
            return;
        }
        
        if (persistentAuth === 'true') {
            sessionStorage.setItem(this.sessionKey, 'true');
            return;
        }
        
        setTimeout(() => this.showAuthModal(), 500);
    }

    showAuthModal() {
        if (document.getElementById(this.wrapperId)) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.id = this.wrapperId;
        
        wrapper.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 2147483647 !important;
            background: rgba(0,0,0,0.85) !important;
            backdrop-filter: blur(20px) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            margin: 0 !important;
            padding: 0 !important;
        `;

        wrapper.innerHTML = `
            <div id="solara-auth-container">
                <div class="solara-logo">小苹果Music</div>
                <div class="solara-subtitle">安全访问验证</div>
                
                <input type="password" 
                       id="solaraPasswordInput" 
                       class="solara-input"
                       placeholder="请输入访问密码" 
                       autocomplete="current-password">
                
                <button id="solaraLoginBtn" class="solara-button">🔐 登录</button>
                
                <div id="solaraAuthError" class="solara-error">❌ 密码错误，请重试！</div>
                
                <div class="solara-footer">关闭标签页后需要重新验证</div>
            </div>
        `;

        document.body.insertBefore(wrapper, document.body.firstChild);
        this.disablePageScroll();
        
        const input = document.getElementById('solaraPasswordInput');
        const loginBtn = document.getElementById('solaraLoginBtn');
        
        input.focus();
        
        // 事件监听
        loginBtn.addEventListener('click', () => this.verifyPassword());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyPassword();
            }
        });
    }

    disablePageScroll() {
        const originalStyle = document.body.style.cssText;
        document.body.setAttribute('data-solara-original-style', originalStyle);
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    enablePageScroll() {
        const originalStyle = document.body.getAttribute('data-solara-original-style');
        if (originalStyle) {
            document.body.style.cssText = originalStyle;
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    }

    verifyPassword() {
        const input = document.getElementById('solaraPasswordInput');
        const error = document.getElementById('solaraAuthError');
        const password = input.value.trim();

        if (password === this.password) {
            sessionStorage.setItem(this.sessionKey, 'true');
            localStorage.setItem(this.storageKey, 'true');
            this.hideAuthModal();
        } else {
            error.style.display = 'block';
            input.style.borderColor = '#e74c3c';
            input.value = '';
            input.focus();
            
            input.style.animation = 'solara-shake 0.5s';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        }
    }

    hideAuthModal() {
        const wrapper = document.getElementById(this.wrapperId);
        if (wrapper) {
            wrapper.style.animation = 'solara-fadeOut 0.3s ease-in-out';
            setTimeout(() => {
                wrapper.remove();
                this.enablePageScroll();
            }, 300);
        }
    }

    logout() {
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.storageKey);
        location.reload();
    }
}

// 添加动画样式
const solaraStyles = document.createElement('style');
solaraStyles.textContent = `
    @keyframes solara-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes solara-fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes solara-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(solaraStyles);

// 初始化认证系统
const solaraAuth = new SolaraAuth();
window.solaraAuth = solaraAuth;
window.solaraLogout = () => solaraAuth.logout();