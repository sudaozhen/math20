/**
 * PWA 更新检查器
 * 当有新的 Service Worker 可用时，会显示一个提示框，让用户可以点击更新。
 */

// 记录页面加载时的初始版本
let currentVersion = null;

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

    // 初始化：获取当前运行的版本（快照）
    fetch('version.json')
        .then(res => res.json())
        .then(data => {
            currentVersion = data.version;
            console.log(`[PWA检查] 当前运行版本: ${currentVersion}`);
            
            // 4. 获取到基准版本后，立即检查一次远程
            checkVersionMismatch();
        })
        .catch(err => console.log('初始化版本获取失败:', err));

    // 5. 新增：每 10 分钟自动轮询一次
    setInterval(checkVersionMismatch, 10 * 60 * 1000);

    // 6. 新增：当应用从后台切回前台时（例如用户解锁手机），立即检查
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('[PWA检查] 应用切回前台，正在检查更新...');
            checkVersionMismatch();
        }
    });
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
    // 如果没有初始版本，或者设备明确处于离线状态，则跳过检查
    if (!currentVersion || !navigator.onLine) {
        if (currentVersion && !navigator.onLine) {
            console.log('[PWA检查] 设备离线，跳过远程版本检查。');
        }
        return;
    }

    // 直接请求服务器最新版本 (加时间戳绕过缓存)
    fetch(`version.json?t=${Date.now()}`)
        .then(res => res.json())
        .then(remoteData => {
            // console.log(`[PWA检查] 运行中: ${currentVersion} | 服务器: ${remoteData.version}`);
            
            // 对比：如果服务器版本 与 初始运行版本 不一致，说明有更新
            if (currentVersion !== remoteData.version) {
                console.log('>>> 发现新版本，准备弹出更新提示');
                showUpdateUI(null);
            }
        })
        .catch(err => console.log('检查远程版本失败:', err));
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
    
    // 在 HTTP 环境下，window.caches 可能不存在，需要安全处理
    if ('caches' in window) {
        caches.keys().then(keys => {
            Promise.all(keys.map(key => caches.delete(key))).then(() => window.location.reload());
        });
    } else {
        // 不支持 Cache API 或 HTTP 环境，直接强制刷新
        window.location.reload();
    }
}