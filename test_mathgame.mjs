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

// 每个游戏一个校验函数 (a, op, b) => boolean，范围与原实现/需求一致
const cases = [
    ['math10', (a, op, b) => op === '+' ? (a >= 1 && a <= 10 && b >= 0 && a + b <= 10)
                                        : (a >= 2 && a <= 10 && b >= 1 && b <= a)],
    ['math20', (a, op, b) => op === '+' ? (a >= 1 && a <= 19 && b >= 0 && a + b <= 20)
                                        : (a >= 2 && a <= 20 && b >= 1 && b <= a)],
    ['math50', (a, op, b) => op === '+' ? (a >= 1 && a <= 50 && b >= 0 && a + b <= 50)
                                        : (a >= 2 && a <= 50 && b >= 1 && b <= a)],
    ['mathMul', (a, op, b) => op === '×' && a >= 1 && a <= 9 && b >= 1 && b <= 9],
];

for (const [name, valid] of cases) {
    const g = createGame(name);
    const ops = new Set();
    for (let i = 0; i < 20000; i++) {
        g.makeQuiz();
        const m = lastQ.match(/^(\d+) ([+\-×]) (\d+) =$/);
        if (!m) throw new Error(`${name}: 题目格式异常: ${lastQ}`);
        const a = +m[1], op = m[2], b = +m[3];
        ops.add(op);
        if (!valid(a, op, b)) throw new Error(`${name}: 超范围题目 ${a}${op}${b}`);
    }
    const expectOps = name === 'mathMul' ? ['×'] : ['+', '-'];
    for (const op of expectOps) {
        if (!ops.has(op)) throw new Error(`${name}: 未出现运算符 ${op}`);
    }
    console.log(`OK ${name}: 20000 题全部合法, 运算符 [${[...ops].join('')}]`);
}
console.log('全部通过');
