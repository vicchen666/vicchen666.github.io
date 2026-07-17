// Requires vec_add, vec_sub, vec_scale from vector.js
class CanvasControlBase {
    constructor({ animate = true, frame_interval = 10 } = {}) {
        this.animate = animate;
        this.frame_interval = frame_interval;
        this.animation = null;
        this.default_cursor = "default";
        this.tool_status = { tool: "move", status: "idle"};
        this.grabbing_canvas = false;
        this.origin = [-canvas.clientWidth / 2, canvas.clientHeight / 2];
        this.size = 1;
        this.mouse_x = 0;
        this.mouse_y = 0;
        this.next_id = 0;
        this.next_name = {};
        this.selected_elements = { selected: [], hovered: -1 };
        this.preview_elements = {};
    }

    setup_listeners() {
        canvas.addEventListener("wheel", e => this.handle_wheel(e));
        canvas.addEventListener("mouseleave", e => this.handle_mouseleave(e));
        canvas.addEventListener("mousedown", e => this.handle_mousedown(e));
        window.addEventListener("mousemove", e => this.handle_mousemove(e));
        window.addEventListener("mouseup", () => this.handle_mouseup());
        window.addEventListener("resize", () => this.handle_resize());
    }

    mouse_to_canvas(x, y) {
        const rect = canvas.getBoundingClientRect();
        const canvas_point = vec_scale(vec_add(c.origin, vec_sub([x, -y], [rect.left, -rect.top])), 1 / c.size);
        return canvas_point;
    }

    handle_wheel(e) {
        const rect = canvas.getBoundingClientRect();
        const canvas_point = vec_sub([e.clientX, -e.clientY], [rect.left, -rect.top]);
        const origin = vec_sub(vec_scale(vec_add(this.origin, canvas_point), e.deltaY > 0 ? 1 / 1.1 : 1.1), canvas_point);
        this.size *= e.deltaY > 0 ? 1 / 1.1 : 1.1;
        this.origin = origin;
        this.set_canvas();
    }

    handle_mouseleave(e) {
        this.tool_preview[this.tool_status.tool]?.[this.tool_status.status]?.(e);
    }

    handle_mousedown(e) {
        this.handle_tool_use(e);
    }

    handle_tool_use(e) {
        switch (this.tool_status.tool) {
            case "move":
                if (e.which === 1 || e.which === 2) {
                    this.grabbing_canvas = true;
                    this.mouse_x = e.clientX;
                    this.mouse_y = e.clientY;
                }
                break;
            default:
                if (e.which === 2) {
                    this.grabbing_canvas = true;
                    this.mouse_x = e.clientX;
                    this.mouse_y = e.clientY;
                }
        }
    }

    handle_mousemove(e) {
        if (document.elementFromPoint(e.clientX, e.clientY) === canvas) {
            canvas.style.cursor = this.default_cursor;
            this.tool_preview[this.tool_status.tool]?.[this.tool_status.status]?.(e);
        }
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

    hover_item_from_canvas(e) {
        // Implement by subclasses.
    }

    tool_preview = {
        // Implement by subclasses.
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