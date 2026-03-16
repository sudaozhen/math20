/**
 * 手写草稿板模块
 */
const scratchpad = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,

    /**
     * 初始化草稿板
     * @param {string} canvasId - canvas 元素的 ID
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Scratchpad canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        this.resize();

        // 绘图设置
        this.ctx.strokeStyle = '#e53e3e'; // 用于草稿的红色
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        // 绑定事件监听
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e));

        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('touchmove', (e) => this.draw(e));

        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        // 重新设置绘图属性，因为 resize 会重置 canvas 状态
        this.ctx.strokeStyle = '#e53e3e';
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
    },

    getCoordinates(event) {
        event.preventDefault();
        let x, y;
        if (event.touches && event.touches.length > 0) {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        } else {
            x = event.clientX;
            y = event.clientY;
        }
        const rect = this.canvas.getBoundingClientRect();
        return [x - rect.left, y - rect.top];
    },

    startDrawing(e) {
        this.isDrawing = true;
        [this.lastX, this.lastY] = this.getCoordinates(e);
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    },

    draw(e) {
        if (!this.isDrawing) return;
        const [x, y] = this.getCoordinates(e);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        [this.lastX, this.lastY] = [x, y];
    },

    stopDrawing() {
        this.isDrawing = false;
    },

    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

window.scratchpad = scratchpad;