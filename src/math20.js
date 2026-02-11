let currentQuiz = { a:0, b:0, op:'', ans:0, input:'' };
let stats = { total: 0, ok: 0, no: 0 };

function makeQuiz() {
    const isPlus = Math.random() > 0.5;
    if (isPlus) {
        currentQuiz.a = Math.floor(Math.random() * 20) + 1;
        currentQuiz.b = Math.floor(Math.random() * (21 - currentQuiz.a));
        currentQuiz.op = '+';
        currentQuiz.ans = currentQuiz.a + currentQuiz.b;
    } else {
        currentQuiz.a = Math.floor(Math.random() * 20) + 1;
        currentQuiz.b = Math.floor(Math.random() * currentQuiz.a) + 1;
        currentQuiz.op = '-';
        currentQuiz.ans = currentQuiz.a - currentQuiz.b;
    }
    currentQuiz.input = '';
    const qEl = document.getElementById('question');
    const aEl = document.getElementById('answer-view');
    if(qEl) qEl.innerText = `${currentQuiz.a} ${currentQuiz.op} ${currentQuiz.b} =`;
    if(aEl) aEl.innerText = '';
}

function press(n) {
    if (currentQuiz.input.length < 3) {
        currentQuiz.input += n;
        const el = document.getElementById('answer-view');
        if(el) el.innerText = currentQuiz.input;
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
        item.innerHTML = `<span><b>#${stats.total}</b> ${currentQuiz.a}${currentQuiz.op}${currentQuiz.b}=${displayResult}</span><span>${isCorrect?'✅':'❌'}</span>`;
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

function renderKeypad() {
    const keypads = document.querySelectorAll('.keypad');
    keypads.forEach(pad => {
        // Force clear to ensure re-render if needed, or check logic
        // The previous logic was: if (pad.innerHTML.trim() !== '') return;
        // But comments might be present (e.g. <!-- JS will render buttons here -->) which makes trim() not empty.
        // Let's check if it has buttons instead.
        if (pad.querySelector('button')) return; 

        let html = '';
        // 1-9
        for(let i=1; i<=9; i++) {
            html += `<button class="btn" onclick="press(${i})">${i}</button>`;
        }
        // Del, 0, Ok
        html += `<button class="btn btn-del" onclick="del()">删除</button>`;
        html += `<button class="btn" onclick="press(0)">0</button>`;
        html += `<button class="btn btn-ok" onclick="submit()">确认</button>`;
        
        pad.innerHTML = html;
    });
}

// Expose functions to global scope if needed (though they are already global in this context)
window.makeQuiz = makeQuiz;
window.press = press;
window.del = del;
window.submit = submit;
window.renderKeypad = renderKeypad;
