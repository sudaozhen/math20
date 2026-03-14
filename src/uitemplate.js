/**
 * 渲染通用的游戏界面布局.
 * @param {HTMLElement} container - 将要填充布局的容器元素.
 * @param {object} [options={}] - 配置选项.
 * @param {boolean} [options.showExitButton=false] - 是否显示退出按钮.
 */
function renderGameLayout(container, options = {}) {
    if (!container) {
        console.error("Layout container not found.");
        return;
    }

    const { showExitButton = false } = options;

    const exitButtonHTML = showExitButton
        ? `<button class="back-btn" onclick="goHome()">🏠 退出</button>`
        : '';

    const toolbarJustify = showExitButton ? 'space-between' : 'flex-end';

    const layoutHTML = `
        <div class="sidebar-overlay" onclick="toggleHistory()"></div>
        <div class="sidebar">
            <div class="sidebar-header">答题记录</div>
            <div class="history-list" id="historyList"></div>
        </div>

        <div class="main-content">
            <div class="app-toolbar" style="justify-content: ${toolbarJustify};">
                ${exitButtonHTML}
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 0.8rem; margin-right: 4px;">语音报题</span>
                    <label class="switch" title="切换语音报题" style="margin: 0 4px; transform: scale(0.8);">
                        <input type="checkbox" id="tts-toggle">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size: 0.8rem; margin-left: 8px; margin-right: 4px;">重复题目</span>
                    <button onclick="repeatQuestion()" style="background: none; border: none; font-size: 1.2rem; padding: 0; cursor: pointer;" title="重读题目">🔁</button>
                </div>
            </div>

            <div class="stats-bar">
                <button class="history-trigger" onclick="toggleHistory()">🕒 记录</button>
                <div class="stat-box"><span class="stat-val" id="s-total">0</span><span class="stat-lab">总数</span></div>
                <div class="stat-box"><span class="stat-val" id="s-ok" style="color:var(--success)">0</span><span class="stat-lab">正确</span></div>
                <div class="stat-box"><span class="stat-val" id="s-no" style="color:var(--danger)">0</span><span class="stat-lab">错误</span></div>
            </div>
            <div class="quiz-area">
                <div id="question"></div>
                <div id="answer-view"></div>
            </div>
            <div class="keypad-container">
                <!-- keypad.js will render the keypad here -->
            </div>
        </div>
    `;

    container.innerHTML = layoutHTML;
}