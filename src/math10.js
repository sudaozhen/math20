// 解决 iOS PWA 中 :active 伪类不立即触发的问题
document.body.addEventListener('touchstart', function() {}, {passive: true});

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
        isFromBank = true;
    }

    if (!isFromBank) {
        const isPlus = Math.random() > 0.5;
        if (isPlus) {
            currentQuiz.a = Math.floor(Math.random() * 10) + 1; // 1-10
            currentQuiz.b = Math.floor(Math.random() * (11 - currentQuiz.a));
            currentQuiz.op = '+';
            currentQuiz.ans = currentQuiz.a + currentQuiz.b;
        } else {
            currentQuiz.a = Math.floor(Math.random() * 9) + 2; // 2-10
            currentQuiz.b = Math.floor(Math.random() * currentQuiz.a) + 1;
            currentQuiz.op = '-';
            currentQuiz.ans = currentQuiz.a - currentQuiz.b;
        }
    }
    currentQuiz.input = '';
    const aEl = document.getElementById('answer-view');

    if (isTtsEnabled && window.tts) {
        const opText = currentQuiz.op === '+' ? '加' : '减';
        const questionText = `${currentQuiz.a} ${opText} ${currentQuiz.b} 等于`;
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
        qEl.innerText = `${currentQuiz.a} ${currentQuiz.op} ${currentQuiz.b} =`;
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

    // 错题集逻辑：答错 或 用时>3秒 -> 加入；答对 且 用时<=3秒 -> 移除
    if (!isCorrect || duration > 3) {
        addToMistakeBank(currentQuiz);
    } else {
        removeFromMistakeBank(currentQuiz);
    }

    let timeIcon = '🟢';
    if (duration > 5) {
        timeIcon = '⛔';
    } else if (duration > 3) {
        timeIcon = '🔴';
    } else if (duration >= 2) {
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
        const opText = currentQuiz.op === '+' ? '加' : '减';
        const questionText = `${currentQuiz.a} ${opText} ${currentQuiz.b} 等于`;
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
        isTtsEnabled = localStorage.getItem('math10_ttsEnabled') === 'true';
        ttsToggle.checked = isTtsEnabled;
        displayQuestion();
    } catch (e) {
        console.error("无法访问 localStorage:", e);
    }

    ttsToggle.addEventListener('change', () => {
        isTtsEnabled = ttsToggle.checked;
        try {
            localStorage.setItem('math10_ttsEnabled', isTtsEnabled);
        } catch (e) {
            console.error("无法访问 localStorage:", e);
        }
        
        displayQuestion();
        if (window.tts) window.tts.cancel();
    });
}

// --- 错题集管理 ---
function loadMistakes() {
    try {
        const data = localStorage.getItem('math10_mistakes');
        if (data) mistakeBank = JSON.parse(data);
    } catch (e) { console.error('Load mistakes failed', e); }
}

function saveMistakes() {
    try {
        localStorage.setItem('math10_mistakes', JSON.stringify(mistakeBank));
    } catch (e) { console.error('Save mistakes failed', e); }
}

function addToMistakeBank(q) {
    const exists = mistakeBank.some(item => item.a === q.a && item.b === q.b && item.op === q.op);
    if (!exists) {
        mistakeBank.push({ a: q.a, b: q.b, op: q.op, ans: q.ans });
        saveMistakes();
    }
}

function removeFromMistakeBank(q) {
    const initialLen = mistakeBank.length;
    mistakeBank = mistakeBank.filter(item => !(item.a === q.a && item.b === q.b && item.op === q.op));
    if (mistakeBank.length < initialLen) saveMistakes();
}

loadMistakes();

// 导出所有需要的函数
export {
    makeQuiz,
    handleKeypadInput,
    submit,
    toggleHistory,
    repeatQuestion,
    setupTtsToggle
};
