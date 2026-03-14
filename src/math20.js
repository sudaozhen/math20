let currentQuiz = { a:0, b:0, op:'', ans:0, input:'' };
let stats = { total: 0, ok: 0, no: 0 };
let isTtsEnabled = false;
let quizStartTime = null;
let timerDelayId = null;

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
    if (timerDelayId) {
        clearTimeout(timerDelayId);
        timerDelayId = null;
    }
    quizStartTime = null;

    const isPlus = Math.random() > 0.5;
    if (isPlus) {
        currentQuiz.a = Math.floor(Math.random() * 19) + 1; // 1-19
        currentQuiz.b = Math.floor(Math.random() * (21 - currentQuiz.a));
        currentQuiz.op = '+';
        currentQuiz.ans = currentQuiz.a + currentQuiz.b;
    } else {
        currentQuiz.a = Math.floor(Math.random() * 19) + 2; // 2-20
        currentQuiz.b = Math.floor(Math.random() * currentQuiz.a) + 1;
        currentQuiz.op = '-';
        currentQuiz.ans = currentQuiz.a - currentQuiz.b;
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
    const ttsToggle = document.getElementById('tts-toggle');
    if (!ttsToggle) return;

    try {
        isTtsEnabled = localStorage.getItem('math20_ttsEnabled') === 'true';
        ttsToggle.checked = isTtsEnabled;
        displayQuestion();
    } catch (e) {
        console.error("无法访问 localStorage:", e);
    }

    ttsToggle.addEventListener('change', () => {
        isTtsEnabled = ttsToggle.checked;
        try {
            localStorage.setItem('math20_ttsEnabled', isTtsEnabled);
        } catch (e) {
            console.error("无法访问 localStorage:", e);
        }
        
        displayQuestion();
        if (window.tts) tts.cancel();
    });
}

// Expose functions to global scope
window.makeQuiz = makeQuiz;
window.handleKeypadInput = handleKeypadInput;
window.toggleHistory = toggleHistory;
window.repeatQuestion = repeatQuestion;
window.setupTtsToggle = setupTtsToggle;
