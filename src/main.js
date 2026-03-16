import { registerUpdateChecker } from './update-checker.js';

// 无论环境是否支持 Service Worker，都启动更新检查器 (用于 HTTP 轮询)
registerUpdateChecker();

// 注册 Service Worker 并初始化更新检查
if ('serviceWorker' in navigator) {
    // 确保在页面加载完成后注册 (如果 load 事件已过，则立即执行)
    const initSW = () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => console.log('SW 注册成功:', registration.scope))
            .catch(err => console.log('SW 注册失败:', err));
    };

    if (document.readyState === 'complete') initSW();
    else window.addEventListener('load', initSW);
}