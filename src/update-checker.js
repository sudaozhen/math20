/**
 * PWA 更新检查器
 * 当有新的 Service Worker 可用时，会显示一个提示框，让用户可以点击更新。
 */

/**
 * 注册 Service Worker 更新检查逻辑。
 */
export function registerUpdateChecker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (!reg) return;

            // 场景1: 页面加载时，已经有一个新的 SW 在等待了。
            if (reg.waiting) {
                showUpdateUI(reg.waiting);
                return;
            }

            // 场景2: 页面加载时，一个新的 SW 正在安装中。
            if (reg.installing) {
                trackInstalling(reg.installing);
                return;
            }

            // 场景3: 监听后续发现的新版本。
            reg.addEventListener('updatefound', () => {
                trackInstalling(reg.installing);
            });
        });

        // 当新的 SW 接管控制权后，刷新页面以应用更新。
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }
}

function trackInstalling(worker) {
    worker.addEventListener('statechange', () => {
        // 当新 SW 安装完成并进入 waiting 状态时，显示更新提示。
        if (worker.state === 'installed') {
            showUpdateUI(worker);
        }
    });
}

function showUpdateUI(worker) {
    const updateToast = document.createElement('div');
    updateToast.id = 'update-toast';
    updateToast.innerHTML = `<span>有新版本可用！</span><button id="update-button">立即更新</button>`;
    document.body.appendChild(updateToast);

    document.getElementById('update-button').addEventListener('click', () => {
        // 向等待中的 SW 发送消息，让它立即激活。
        worker.postMessage({ type: 'SKIP_WAITING' });
    });
}