// 通用口算游戏模块：math10/20/50 共用，按名称取配置
// 解决 iOS PWA 中 :active 伪类不立即触发的问题
document.body.addEventListener('touchstart', function() {}, {passive: true});

const CONFIGS = {
    math10: { cap: 10, plusMax: 10, minusMax: 10, tBank: 3, tYellow: 2, tRed: 3, tBlack: 5 },
    math20: { cap: 20, plusMax: 19, minusMax: 20, tBank: 3, tYellow: 2, tRed: 3, tBlack: 5 },
    math50: { cap: 50, plusMax: 50, minusMax: 50, tBank: 5, tYellow: 3, tRed: 5, tBlack: 8 },
    // 乘法表：带自定义 gen() 的游戏不走下面的加减法默认公式
    mathMul: { tBank: 3, tYellow: 2, tRed: 3, tBlack: 5,
        gen: () => {
            const a = Math.floor(Math.random() * 9) + 1; // 1-9
            const b = Math.floor(Math.random() * 9) + 1; // 1-9
            return { a, b, op: '×', ans: a * b };
        } },
    // 两位数加减法：操作数均为两位数，和 ≤100、差 ≥0（答案最大 100，3 位输入够用）
    math100: { tBank: 6, tYellow: 4, tRed: 6, tBlack: 10,
        gen: () => {
            if (Math.random() > 0.5) {
                const a = Math.floor(Math.random() * 81) + 10;          // 10-90，保证 b≥10 时和 ≤100
                const b = Math.floor(Math.random() * (91 - a)) + 10;    // 10..(100-a)
                return { a, b, op: '+', ans: a + b };
            }
            const a = Math.floor(Math.random() * 90) + 10;              // 10-99
            const b = Math.floor(Math.random() * (a - 9)) + 10;         // 10..a，差 ≥0
            return { a, b, op: '-', ans: a - b };
        } },
    // 两位数连加：三个两位数相加，和 ≤100；三项装不进 a/op/b，用 text/tts 显式给出
    mathChain: { tBank: 8, tYellow: 5, tRed: 8, tBlack: 12,
        gen: () => {
            const a = Math.floor(Math.random() * 61) + 10;         // 10-70，给 b、c 留出 ≥10 的空间
            const b = Math.floor(Math.random() * (71 - a)) + 10;   // 10..(80-a)
            const c = Math.floor(Math.random() * (91 - a - b)) + 10; // 10..(100-a-b)，和 ≤100
            return { a, b, op: '+', ans: a + b + c,
                     text: `${a} + ${b} + ${c} =`, tts: `${a}加${b}再加${c}等于` };
        } },
    // 两位数连减：a-b-c，中间结果与最终结果均 ≥0
    mathChainSub: { tBank: 8, tYellow: 5, tRed: 8, tBlack: 12,
        gen: () => {
            const b = Math.floor(Math.random() * 30) + 10;          // 10-39
            const c = Math.floor(Math.random() * (80 - b)) + 10;    // 10..(89-b)，保证 b+c ≤89
            const a = Math.floor(Math.random() * (100 - b - c)) + b + c; // b+c..99，差 ≥0
            return { a, b, op: '-', ans: a - b - c,
                     text: `${a} - ${b} - ${c} =`, tts: `${a}减${b}再减${c}等于` };
        } },
    // 两位数加减混合：a+b-c 或 a-b+c，中间/最终结果均 ≥0，答案 ≤100
    mathMix: { tBank: 8, tYellow: 5, tRed: 8, tBlack: 12,
        gen: () => {
            if (Math.random() > 0.5) {
                const a = Math.floor(Math.random() * 90) + 10;      // 10-99
                const b = Math.floor(Math.random() * 90) + 10;      // 10-99
                const lo = Math.max(10, a + b - 99);                // 保证答案 ≤99
                const hi = Math.min(a + b, 99);                     // c 本身也是两位数
                const c = Math.floor(Math.random() * (hi - lo + 1)) + lo; // lo..hi，答案 ≥0
                return { a, b, op: '+', ans: a + b - c,
                         text: `${a} + ${b} - ${c} =`, tts: `${a}加${b}再减${c}等于` };
            }
            const a = Math.floor(Math.random() * 90) + 10;          // 10-99
            const b = Math.floor(Math.random() * (a - 9)) + 10;     // 10..a，中间结果 ≥0
            const hi = Math.min(99, 100 - (a - b));                 // 保证答案 ≤100
            const c = Math.floor(Math.random() * (hi - 9)) + 10;    // 10..hi
            return { a, b, op: '-', ans: a - b + c,
                     text: `${a} - ${b} + ${c} =`, tts: `${a}减${b}再加${c}等于` };
        } },
    // 表内除法：从乘法表反推，保证整除（被除数=除数×商）
    mathDiv: { tBank: 3, tYellow: 2, tRed: 3, tBlack: 5,
        gen: () => {
            const b = Math.floor(Math.random() * 9) + 1;   // 除数 1-9
            const ans = Math.floor(Math.random() * 9) + 1; // 商 1-9
            return { a: b * ans, b, op: '÷', ans };
        } },
};

const OP_TEXT = { '+': '加', '-': '减', '×': '乘', '÷': '除以' };

export function createGame(name) {
    const cfg = CONFIGS[name];
    if (!cfg) throw new Error(`Unknown game: ${name}`);
    const ttsKey = `${name}_ttsEnabled`;
    const mistakesKey = `${name}_mistakes`;

    let currentQuiz = { a:0, b:0, op:'', ans:0, input:'' };
    let stats = { total: 0, ok: 0, no: 0 };
    let isTtsEnabled = false;
    let quizStartTime = null;
    let timerDelayId = null;
    let mistakeBank = [];

    /**
     * 处理来自通用键盘组件的输入
     * @param {string} key - 被按下的键值 ('1', '删除', '确认', etc.)
     */
    function handleKeypadInput(key) {
        if (!isNaN(parseInt(key, 10))) { // 是数字
            press(key);
        } else if (key === '删除') {
            del();
        } else if (key === '确认') {
            submit();
        }
    }

    function makeQuiz() {
        // 清空草稿板
        if (window.scratchpad) scratchpad.clear();

        if (timerDelayId) {
            clearTimeout(timerDelayId);
            timerDelayId = null;
        }
        quizStartTime = null;

        let isFromBank = false;
        // 40% 概率从错题集抽取，前提是错题集不为空
        if (mistakeBank.length > 0 && Math.random() < 0.4) {
            const idx = Math.floor(Math.random() * mistakeBank.length);
            const q = mistakeBank[idx];
            currentQuiz.a = q.a;
            currentQuiz.b = q.b;
            currentQuiz.op = q.op;
            currentQuiz.ans = q.ans;
            currentQuiz.text = q.text;
            currentQuiz.tts = q.tts;
            isFromBank = true;
        }

        if (!isFromBank) {
            if (cfg.gen) {
                Object.assign(currentQuiz, cfg.gen());
            } else {
            const isPlus = Math.random() > 0.5;
            if (isPlus) {
                currentQuiz.a = Math.floor(Math.random() * (cfg.plusMax - 1)) + 1; // 1..plusMax
                currentQuiz.b = Math.floor(Math.random() * (cfg.cap + 1 - currentQuiz.a)); // 0..cap-a，保证和不超过 cap
                currentQuiz.op = '+';
                currentQuiz.ans = currentQuiz.a + currentQuiz.b;
            } else {
                currentQuiz.a = Math.floor(Math.random() * (cfg.minusMax - 2)) + 2; // 2..minusMax
                currentQuiz.b = Math.floor(Math.random() * currentQuiz.a) + 1; // 1..a，保证差非负
                currentQuiz.op = '-';
                currentQuiz.ans = currentQuiz.a - currentQuiz.b;
            }
            }
        }
        currentQuiz.input = '';
        const aEl = document.getElementById('answer-view');

        if (isTtsEnabled && window.tts) {
            const opText = OP_TEXT[currentQuiz.op];
            const questionText = currentQuiz.tts || `${currentQuiz.a} ${opText} ${currentQuiz.b} 等于`;
            tts.speak(questionText, 'zh-CN', () => {
                quizStartTime = Date.now();
            });
        } else {
            timerDelayId = setTimeout(() => {
                quizStartTime = Date.now();
            }, 1000);
        }

        displayQuestion();
        if(aEl) aEl.innerText = '';
    }

    function press(n) {
        if (currentQuiz.input.length < 3) {
            currentQuiz.input += n;
            const el = document.getElementById('answer-view');
            if(el) el.innerText = currentQuiz.input;
        }
    }

    function displayQuestion() {
        const qEl = document.getElementById('question');
        if (!qEl) return;

        qEl.style.visibility = isTtsEnabled ? 'hidden' : 'visible';
        if (isTtsEnabled) {
            qEl.innerText = '请听题...';
        } else {
            qEl.innerText = currentQuiz.text || `${currentQuiz.a} ${currentQuiz.op} ${currentQuiz.b} =`;
        }
    }

    function del() {
        currentQuiz.input = currentQuiz.input.slice(0, -1);
        const el = document.getElementById('answer-view');
        if(el) el.innerText = currentQuiz.input;
    }

    function submit() {
        if (currentQuiz.input === '') return;
        const userAns = parseInt(currentQuiz.input);
        const isCorrect = userAns === currentQuiz.ans;

        let duration = 0;
        if (quizStartTime) {
            duration = (Date.now() - quizStartTime) / 1000;
        }

        // 错题集逻辑：答错 或 用时超 tBank -> 加入；答对 且 未超时 -> 移除
        if (!isCorrect || duration > cfg.tBank) {
            addToMistakeBank(currentQuiz);
        } else {
            removeFromMistakeBank(currentQuiz);
        }

        let timeIcon = '🟢';
        if (duration > cfg.tBlack) {
            timeIcon = '⛔';
        } else if (duration > cfg.tRed) {
            timeIcon = '🔴';
        } else if (duration >= cfg.tYellow) {
            timeIcon = '🟡';
        }

        stats.total++;
        isCorrect ? stats.ok++ : stats.no++;

        document.getElementById('s-total').innerText = stats.total;
        document.getElementById('s-ok').innerText = stats.ok;
        document.getElementById('s-no').innerText = stats.no;

        const list = document.getElementById('historyList');
        if(list) {
            const item = document.createElement('div');
            item.className = `history-item ${isCorrect ? 'correct' : 'wrong'}`;
            // Show user's answer. If wrong, append correct answer in parentheses.
            const displayResult = isCorrect ? userAns : `${userAns} (${currentQuiz.ans})`;
            item.innerHTML = `<span><b>#${stats.total}</b> ${currentQuiz.a}${currentQuiz.op}${currentQuiz.b}=${displayResult}</span><span>${timeIcon} ${isCorrect?'✅':'❌'}</span>`;
            list.prepend(item);
        }

        const view = document.getElementById('answer-view');
        if(view) {
            view.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
            setTimeout(() => {
                view.style.color = 'var(--primary)';
                makeQuiz();
            }, 400);
        } else {
            makeQuiz();
        }
    }

    function toggleHistory() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    }

    function repeatQuestion() {
        if (window.tts) {
            const opText = OP_TEXT[currentQuiz.op];
            const questionText = currentQuiz.tts || `${currentQuiz.a} ${opText} ${currentQuiz.b} 等于`;
            tts.speak(questionText, 'zh-CN');
        }
    }

    function setupTtsToggle() {
        // 重置状态，确保每次进入模块都是全新的开始
        stats = { total: 0, ok: 0, no: 0 };
        currentQuiz = { a: 0, b: 0, op: '', ans: 0, input: '' };

        const historyList = document.getElementById('historyList');
        if (historyList) {
            historyList.innerHTML = '';
        }
        document.getElementById('s-total').innerText = '0';
        document.getElementById('s-ok').innerText = '0';
        document.getElementById('s-no').innerText = '0';

        const answerView = document.getElementById('answer-view');
        if (answerView) {
            answerView.innerText = '';
        }

        const ttsToggle = document.getElementById('tts-toggle');
        if (!ttsToggle) return;

        try {
            isTtsEnabled = localStorage.getItem(ttsKey) === 'true';
            ttsToggle.checked = isTtsEnabled;
            displayQuestion();
        } catch (e) {
            console.error("无法访问 localStorage:", e);
        }

        ttsToggle.addEventListener('change', () => {
            isTtsEnabled = ttsToggle.checked;
            try {
                localStorage.setItem(ttsKey, isTtsEnabled);
            } catch (e) {
                console.error("无法访问 localStorage:", e);
            }

            displayQuestion();
            if (window.tts) tts.cancel();
        });
    }

    // --- 错题集管理 ---
    function loadMistakes() {
        try {
            const data = localStorage.getItem(mistakesKey);
            if (data) mistakeBank = JSON.parse(data);
        } catch (e) { console.error('Load mistakes failed', e); }
    }

    function saveMistakes() {
        try {
            localStorage.setItem(mistakesKey, JSON.stringify(mistakeBank));
        } catch (e) { console.error('Save mistakes failed', e); }
    }

    // 去重键：连加等多项题用题目文本，普通题退化为 a op b（兼容旧版本存的条目）
    const quizKey = q => q.text || `${q.a}${q.op}${q.b}`;

    function addToMistakeBank(q) {
        const key = quizKey(q);
        const exists = mistakeBank.some(item => (item.key || `${item.a}${item.op}${item.b}`) === key);
        if (!exists) {
            mistakeBank.push({ a: q.a, b: q.b, op: q.op, ans: q.ans, text: q.text, tts: q.tts, key });
            saveMistakes();
        }
    }

    function removeFromMistakeBank(q) {
        const key = quizKey(q);
        const initialLen = mistakeBank.length;
        mistakeBank = mistakeBank.filter(item => (item.key || `${item.a}${item.op}${item.b}`) !== key);
        if (mistakeBank.length < initialLen) saveMistakes();
    }

    loadMistakes();

    return {
        makeQuiz,
        handleKeypadInput,
        submit,
        toggleHistory,
        repeatQuestion,
        setupTtsToggle,
    };
}
