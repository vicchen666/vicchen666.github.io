import $ from "jquery";
import * as v from "vectors";

export default class CanvasControlBase {
    constructor(canvas, { name="main", moveable=true, animate=true, frame_interval=10 } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.animate = animate;
        this.frame_interval = frame_interval;
        this.animation = null;
        this.default_cursor = "default";
        this.tool_status = { tool: "move", status: "idle"};
        this.moveable = moveable;
        this.grabbing_canvas = false;
        this.size = 1;
        this.origin = [-this.canvas.clientWidth / (2 * this.size), this.canvas.clientHeight / (2 * this.size)];
        this.mouse_x = 0;
        this.mouse_y = 0;
        this.next_id = 0;
        this.next_name = {};
        this.selected_elements = { selected: [], hovered: -1 };
        this.preview_elements = {};
        this.name = name;
    }

    activate() {
        this.setup_listeners();
        this.set_canvas(true);
        this.draw();
    }

    setup_listeners() {
        if (!this.moveable) return;
        this.canvas.addEventListener("wheel", e => this.handle_wheel(e));
        this.canvas.addEventListener("mouseleave", e => this.handle_mouseleave(e));
        this.canvas.addEventListener("mousedown", e => this.handle_mousedown(e));
        window.addEventListener("mousemove", e => this.handle_mousemove(e));
        window.addEventListener("mouseup", () => this.handle_mouseup());
        window.addEventListener("resize", () => this.handle_resize());
    }

    remove_listeners() {
        if (!this.moveable) return;
        this.canvas.removeEventListener("wheel", this.handle_wheel);
        this.canvas.removeEventListener("mouseleave", this.handle_mouseleave);
        this.canvas.removeEventListener("mousedown", this.handle_mousedown);
        window.removeEventListener("mousemove", this.handle_mousemove);
        window.removeEventListener("mouseup", this.handle_mouseup);
        window.removeEventListener("resize", this.handle_resize);
    }

    mouse_to_canvas(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const canvas_point = v.add(this.origin, v.scale(v.sub([x, -y], [rect.left, -rect.top]), 1 / this.size));
        return canvas_point;
    }

    handle_wheel(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvas_point = v.sub([e.clientX, -e.clientY], [rect.left, -rect.top]);
        const origin = v.sub(v.add(this.origin, v.scale(canvas_point, 1 / this.size)), v.scale(canvas_point, 1 / (this.size * (e.deltaY > 0 ? 1 / 1.1 : 1.1))));
        this.size *= e.deltaY > 0 ? 1 / 1.1 : 1.1;
        this.origin = origin;
        this.set_canvas();
        this.render_frame();
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
        if (document.elementFromPoint(e.clientX, e.clientY) === this.canvas) {
            this.canvas.style.cursor = this.default_cursor;
            this.tool_preview[this.tool_status.tool]?.[this.tool_status.status]?.(e);
        }
        if (!this.grabbing_canvas) return;
        this.origin = v.add(this.origin, v.scale([this.mouse_x - e.clientX, -(this.mouse_y - e.clientY)], 1 / this.size));
        this.mouse_x = e.clientX;
        this.mouse_y = e.clientY;
        this.set_canvas();
        this.render_frame();
    }

    handle_mouseup() {
        this.grabbing_canvas = false;
    }

    handle_resize() {
        this.set_canvas(true);
        this.render_frame();
    }

    hover_item_from_canvas(e) {
        // Implement by subclasses.
    }

    tool_preview = {
        // Implement by subclasses.
    }

    set_canvas(adjust_size=false) {
        if (adjust_size) {
            this.canvas.height = this.canvas.clientHeight;
            this.canvas.width = this.canvas.clientWidth;
        }
        this.ctx.setTransform(
            this.size, 0, 0, -this.size,
            -this.origin[0] * this.size, this.origin[1] * this.size
        );
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

    clear() {
        this.ctx.clearRect(...this.origin, this.canvas.width / this.size, -this.canvas.height / this.size);
    }

    center_on(coordinates, x_percentage=0.5, y_percentage=0.5) {
        const rect = this.canvas.getBoundingClientRect();
        this.origin = v.sub(coordinates, [rect.width * x_percentage / this.size, -rect.height * y_percentage / this.size]);
        this.set_canvas();
    }

    get_canvas_center(x_percentage=0.5, y_percentage=0.5) {
        const rect = this.canvas.getBoundingClientRect();
        return v.add(this.origin, [rect.width * x_percentage / (this.size), -rect.height * y_percentage / (this.size)]);
    }

    // Choose the largest size that fits the bounding box in the canvas, and center the bounding box in the canvas.
    // Uses v.get_bounding_box to get the bounding box of the points.
    set_bounding_box(box, padding_percentage=0) {
        const rect = this.canvas.getBoundingClientRect();
        const box_width = box.max[0] - box.min[0];
        const box_height = box.max[1] - box.min[1];
        this.size = Math.min(rect.width / box_width, rect.height / box_height);
        this.size *= 1 - padding_percentage;
        this.origin = [
            (box.min[0] + box.max[0]) / 2 - rect.width / (2 * this.size),
            (box.min[1] + box.max[1]) / 2 + rect.height / (2 * this.size)
        ];
        this.set_canvas();
    }

    destroy() {
        this.stop_animation();
        this.remove_listeners();
    }
}