import { registerUpdateChecker } from './update-checker.js';

// 注册 Service Worker 并初始化更新检查
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                registerUpdateChecker();
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}