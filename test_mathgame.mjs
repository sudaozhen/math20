// 出题范围自检：node test_mathgame.mjs
let lastQ = '';
globalThis.window = {};
globalThis.document = {
    body: { addEventListener() {} },
    getElementById: (id) => id === 'question'
        ? { style: {}, set innerText(v) { lastQ = v; } }
        : null,
    querySelector: () => null,
};
globalThis.localStorage = { getItem: () => null, setItem() {} };

const { createGame } = await import('./src/mathgame.js');

// [名称, cap(和上限), plusMax(加数a上限), minusMax(被减数a上限)] — 与原 math10/20/50.js 一致
const cases = [['math10', 10, 10, 10], ['math20', 20, 19, 20], ['math50', 50, 50, 50]];

for (const [name, cap, plusMax, minusMax] of cases) {
    const g = createGame(name);
    let plusSeen = 0, minusSeen = 0;
    for (let i = 0; i < 20000; i++) {
        g.makeQuiz();
        const m = lastQ.match(/^(\d+) ([+-]) (\d+) =$/);
        if (!m) throw new Error(`${name}: 题目格式异常: ${lastQ}`);
        const a = +m[1], op = m[2], b = +m[3];
        if (op === '+') {
            plusSeen++;
            if (!(a >= 1 && a <= plusMax)) throw new Error(`${name}: 加法 a=${a} 超出 1..${plusMax}`);
            if (!(b >= 0 && a + b <= cap)) throw new Error(`${name}: ${a}+${b} 超出 0..${cap - a}`);
        } else {
            minusSeen++;
            if (!(a >= 2 && a <= minusMax)) throw new Error(`${name}: 减法 a=${a} 超出 2..${minusMax}`);
            if (!(b >= 1 && b <= a)) throw new Error(`${name}: ${a}-${b} 的 b 超出 1..${a}`);
        }
    }
    if (!plusSeen || !minusSeen) throw new Error(`${name}: 加/减法未都出现`);
    console.log(`OK ${name}: +${plusSeen} / -${minusSeen}, 范围全部合法`);
}
console.log('全部通过');
