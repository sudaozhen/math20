/**
 * 渲染通用触摸键盘组件.
 * 这个函数会在指定的容器内创建键盘的HTML, 并为按键点击设置事件监听.
 *
 * @param {string} containerSelector - 键盘容器的 CSS 选择器 (e.g., '.keypad-container').
 * @param {function(string)} onKeyPress - 按键点击时的回调函数. 它会接收一个字符串参数，
 * 代表被点击的按键值 (e.g., '1', '删除', '确认').
 */
function renderKeypad(containerSelector, onKeyPress) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error('Keypad container not found:', containerSelector);
        return;
    }

    // 定义键盘的 HTML 结构, 包含数字键、删除键和确认键.
    const keypadHTML = `
        <div class="keypad">
            <button class="key">1</button>
            <button class="key">2</button>
            <button class="key">3</button>
            <button class="key">4</button>
            <button class="key">5</button>
            <button class="key">6</button>
            <button class="key">7</button>
            <button class="key">8</button>
            <button class="key">9</button>
            <button class="key key-del">删除</button>
            <button class="key">0</button>
            <button class="key key-ok">确认</button>
        </div>
    `;

    container.innerHTML = keypadHTML;

    // 使用事件委托来高效处理所有按键的点击事件.
    container.querySelector('.keypad')?.addEventListener('click', (event) => {
        if (event.target.classList.contains('key')) {
            onKeyPress(event.target.textContent);
        }
    });
}