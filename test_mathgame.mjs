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
const bin = (f) => (n, o) => n.length === 2 && f(n[0], o[0], n[1]);
const cases = [
    ['math10', bin((a, op, b) => op === '+' ? (a >= 1 && a <= 10 && b >= 0 && a + b <= 10)
                                           : (a >= 2 && a <= 10 && b >= 1 && b <= a))],
    ['math20', bin((a, op, b) => op === '+' ? (a >= 1 && a <= 19 && b >= 0 && a + b <= 20)
                                           : (a >= 2 && a <= 20 && b >= 1 && b <= a))],
    ['math50', bin((a, op, b) => op === '+' ? (a >= 1 && a <= 50 && b >= 0 && a + b <= 50)
                                           : (a >= 2 && a <= 50 && b >= 1 && b <= a))],
    ['mathMul', bin((a, op, b) => op === '×' && a >= 1 && a <= 9 && b >= 1 && b <= 9)],
    // 除法：除数 1-9、整除、商 1-9（被除数最大 81）
    ['mathDiv', bin((a, op, b) => op === '÷' && b >= 1 && b <= 9 && a % b === 0 && a / b >= 1 && a / b <= 9)],
    // 两位数加减：操作数均两位数，和 ≤100、差 ≥0
    ['math100', bin((a, op, b) => op === '+' ? (a >= 10 && a <= 90 && b >= 10 && a + b <= 100)
                                             : (a >= 10 && a <= 99 && b >= 10 && b <= a))],
    // 两位数连加：三项均两位数、全为加号、和 ≤100
    ['mathChain', (n, o) => n.length === 3 && o.every(x => x === '+')
        && n.every(x => x >= 10 && x <= 99) && n[0] + n[1] + n[2] <= 100],
    // 两位数连减：三项均两位数、中间/最终结果 ≥0
    ['mathChainSub', (n, o) => n.length === 3 && o.every(x => x === '-')
        && n.every(x => x >= 10 && x <= 99) && n[0] >= n[1] && n[0] - n[1] >= n[2]],
    // 两位数加减混合：+− 或 −+，中间/最终 ≥0、答案 ≤100
    ['mathMix', (n, o) => n.length === 3 && n.every(x => x >= 10 && x <= 99)
        && ((o[0] === '+' && o[1] === '-' && n[2] <= n[0] + n[1] && n[0] + n[1] - n[2] <= 99)
          || (o[0] === '-' && o[1] === '+' && n[0] >= n[1] && n[0] - n[1] + n[2] <= 100))],
];

for (const [name, valid] of cases) {
    const g = createGame(name);
    const ops = new Set();
    for (let i = 0; i < 20000; i++) {
        g.makeQuiz();
        // split 解析（重复分组的捕获只留最后一次迭代，不能用正则捕获多项）
        const toks = lastQ.trim().split(' ');
        if (toks[toks.length - 1] !== '=' || toks.length < 3 || toks.length % 2 === 1) {
            throw new Error(`${name}: 题目格式异常: ${lastQ}`);
        }
        const body = toks.slice(0, -1);
        const nums = body.filter((_, i) => i % 2 === 0).map(Number);
        const qOps = body.filter((_, i) => i % 2 === 1);
        for (const o of qOps) ops.add(o);
        if (!valid(nums, qOps)) throw new Error(`${name}: 超范围题目 ${lastQ}`);
    }
    const expectOps = { mathMul: ['×'], mathDiv: ['÷'], mathChain: ['+'], mathChainSub: ['-'], mathMix: ['+', '-'] }[name] || ['+', '-'];
    for (const op of expectOps) {
        if (!ops.has(op)) throw new Error(`${name}: 未出现运算符 ${op}`);
    }
    console.log(`OK ${name}: 20000 题全部合法, 运算符 [${[...ops].join('')}]`);
}
console.log('全部通过');
