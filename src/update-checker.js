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

    // 4. 额外检查：即便 sw.js 没变，如果 version.json 变了，也提示更新
    checkVersionMismatch();
}

function trackInstalling(worker) {
    worker.addEventListener('statechange', () => {
        // 当新 SW 安装完成并进入 waiting 状态时，显示更新提示。
        if (worker.state === 'installed') {
            showUpdateUI(worker);
        }
    });
}

/**
 * 主动检查 version.json 是否变化
 * 适用于 sw.js 文件本身未修改，但通过 version.json 发布了新版本的场景
 */
function checkVersionMismatch() {
    // 1. 获取当前缓存中的版本 (本地版本)
    fetch('version.json')
        .then(res => res.json())
        .then(localData => {
            // 2. 获取服务器上的最新版本 (加时间戳绕过缓存)
            fetch(`version.json?t=${Date.now()}`)
                .then(res => res.json())
                .then(remoteData => {
                    // 3. 对比版本号
                    if (localData.version !== remoteData.version) {
                        console.log(`检测到新版本: ${remoteData.version} (当前: ${localData.version})`);
                        // 传入 null 表示这不是标准的 SW 更新，而是强制版本更新
                        showUpdateUI(null);
                    }
                })
                .catch(err => console.log('检查远程版本失败:', err));
        })
        .catch(err => console.log('获取本地版本失败:', err));
}

function showUpdateUI(worker) {
    // 防止重复显示
    if (document.getElementById('update-toast')) return;

    const updateToast = document.createElement('div');
    updateToast.id = 'update-toast';
    updateToast.innerHTML = `<span>有新版本可用！</span><button id="update-button">立即更新</button>`;
    document.body.appendChild(updateToast);

    document.getElementById('update-button').addEventListener('click', () => {
        if (worker) {
            // 标准流程：有新的 SW 在等待，发送跳过等待信号
            worker.postMessage({ type: 'SKIP_WAITING' });
        } else {
            // 强制流程：sw.js 没变但 version.json 变了
            // 策略：注销 SW -> 清除缓存 -> 刷新，强制浏览器重新抓取所有资源
            nukeAndReload();
        }
    });
}

function nukeAndReload() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }
    
    caches.keys().then(keys => {
        Promise.all(keys.map(key => caches.delete(key))).then(() => {
            window.location.reload();
        });
    });
}