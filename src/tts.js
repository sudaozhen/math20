/**
 * 通用 TTS (Text-to-Speech) 模块
 * 使用浏览器原生的 SpeechSynthesis API.
 */
const tts = {
    /**
     * 检查浏览器是否支持 SpeechSynthesis API.
     * @type {boolean}
     */
    isSupported: 'speechSynthesis' in window,

    /**
     * 初始化模块，预加载语音列表.
     */
    init: function() {
        if (!this.isSupported) {
            console.warn("此浏览器不支持 Web Speech API (TTS).");
            return;
        }
        // 尝试触发语音列表加载
        window.speechSynthesis.getVoices();
        // 语音列表加载是异步的，监听 onvoiceschanged 事件
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => {
                // 语音列表已更新
            };
        }
    },

    /**
     * 朗读指定的文本.
     * @param {string} text - 需要朗读的文本.
     * @param {string} [lang='zh-CN'] - 语言代码 (e.g., 'zh-CN', 'en-US').
     * @param {function} [onEndCallback] - 朗读结束后的回调函数.
     */
    speak: function(text, lang = 'zh-CN', onEndCallback) {
        if (!this.isSupported) {
            if (onEndCallback) onEndCallback();
            return;
        }

        // 如果正在朗读，先停止当前的
        this.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0; // 正常语速

        utterance.onend = () => { if (onEndCallback) onEndCallback(); };
        utterance.onerror = (event) => {
            console.error('语音合成发生错误:', event.error);
            if (onEndCallback) onEndCallback();
        };

        window.speechSynthesis.speak(utterance);
    },

    /**
     * 取消当前的语音朗读.
     */
    cancel: function() {
        if (this.isSupported && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    }
};

tts.init();
window.tts = tts;