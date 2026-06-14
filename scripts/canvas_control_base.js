// Requires vec_add, vec_sub, vec_scale from vector.js
class CanvasControlBase {
    constructor({ animate = true, frame_interval = 10 } = {}) {
        this.animate = animate;
        this.frame_interval = frame_interval;
        this.animation = null;
        this.grabbing_canvas = false;
        this.origin = [-canvas.clientWidth / 2, canvas.clientHeight / 2];
        this.size = 1;
        this.mouse_x = 0;
        this.mouse_y = 0;
    }

    setup_listeners() {
        canvas.addEventListener("wheel", e => this.handle_wheel(e));
        canvas.addEventListener("mousedown", e => this.handle_mousedown(e));
        window.addEventListener("mousemove", e => this.handle_mousemove(e));
        window.addEventListener("mouseup", () => this.handle_mouseup());
        window.addEventListener("resize", () => this.handle_resize());
    }

    handle_wheel(e) {
        const rect = canvas.getBoundingClientRect();
        const canvas_point = vec_sub([e.clientX, -e.clientY], [rect.left, -rect.top]);
        const origin = vec_sub(vec_scale(vec_add(this.origin, canvas_point), e.deltaY > 0 ? 1 / 1.1 : 1.1), canvas_point);
        this.size *= e.deltaY > 0 ? 1 / 1.1 : 1.1;
        this.origin = origin;
        this.set_canvas();
    }

    handle_mousedown(e) {
        this.grabbing_canvas = true;
        this.mouse_x = e.clientX;
        this.mouse_y = e.clientY;
    }

    handle_mousemove(e) {
        if (!this.grabbing_canvas) return;
        this.origin = vec_add(this.origin, [this.mouse_x - e.clientX, -(this.mouse_y - e.clientY)]);
        this.mouse_x = e.clientX;
        this.mouse_y = e.clientY;
        this.set_canvas();
    }

    handle_mouseup() {
        this.grabbing_canvas = false;
    }

    handle_resize() {
        this.set_canvas(true);
    }

    set_canvas(adjust_size=false) {
        if (adjust_size) {
            canvas.height = canvas.clientHeight;
            canvas.width = canvas.clientWidth;
        }
        ctx.setTransform(
            this.size, 0, 0, -this.size,
            -this.origin[0], this.origin[1]
        );
        this.render_frame();
    }

    start_animation() {
        if (!this.animate) return;
        this.stop_animation();
        this.animation = setInterval(() => this.render_frame(), this.frame_interval);
    }

    stop_animation() {
        if (this.animation) {
            clearInterval(this.animation);
            this.animation = null;
        }
    }

    draw() {
        if (this.animate) {
            this.start_animation();
        } else {
            this.render_frame();
        }
    }

    render_frame() {
        // Implemented by subclasses.
    }

    destroy() {
        this.stop_animation();
    }
}