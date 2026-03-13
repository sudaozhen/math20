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
     * 存储可用的语音列表.
     * @type {SpeechSynthesisVoice[]}
     */
    voices: [],
    
    /**
     * 初始化模块，预加载语音列表.
     */
    init: function() {
        if (!this.isSupported) {
            console.warn("此浏览器不支持 Web Speech API (TTS).");
            return;
        }

        const loadVoices = () => {
            // 获取所有支持的语音, 特别是中文语音
            this.voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('zh'));
            // console.log("可用的中文语音:", this.voices); // 调试时可以取消注释
        };

        // 语音列表是异步加载的，需要监听事件
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices(); // 立即尝试加载一次
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

        // 优先选择更高质量的语音 (特别是为 Apple 设备优化)
        // 您可以根据需要在这个列表中添加或修改语音名称
        const preferredVoices = [
            'Ting-Ting', // iOS/macOS 昔日经典高质量中文女声
            'Sin-ji',    // iOS/macOS 粤语女声
            'Li-mu'      // 另一个 macOS 中文男声
        ];

        const selectedVoice = this.voices.find(v => preferredVoices.includes(v.name));
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

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