import $ from "jquery";
import CanvasControlBase from "canvas_control_base";
import * as v from "vectors";
import { reload_element_settings } from "utils";

const TAU = Math.PI * 2;

export default class CanvasControl extends CanvasControlBase {
    constructor(canvas, options={ animate: false }) {
        super(canvas, options);

        // this.axes = [[Math.cos(TAU * 1/6), Math.sin(TAU * 1/6)], [-1, 0], [Math.cos(TAU * 5/6), Math.sin(TAU * 5/6)]]
        this.axes = [[0, 1], [Math.cos(TAU * 7/12)*.5, Math.sin(TAU * 7/12)*.5], [Math.cos(TAU * 12/12), Math.sin(TAU * 12/12)]];
        // this.axes = [[0, 1], [Math.cos(TAU * 5/8)*.5, Math.sin(TAU * 5/8)*.5], [1, 0]];
        // this.axes = [[0, 1], [Math.cos(TAU * 7/12), Math.sin(TAU * 7/12)], [Math.cos(TAU * 11/12), Math.sin(TAU * 11/12)]];
        this.axes = this.axes.map(axis => v.scale(axis, 100));
        this.vertices = {};
        this.beams = {};
        this.render_order = [];
        this.next_name = { vertex: 1, beam: 1 };
        this.preview_elements = { vertices: [], beams: [], axes: [] };

        Vertex.ctx = this.ctx;
        Beam.ctx = this.ctx;
        Axis.ctx = this.ctx;
        this.sync_settings();
        this.setup_listeners();
        this.set_canvas(true);
        this.draw();
    }

    settings = {
        vertex_connect_length_threshold: 1e-5,
        preview_alpha: 0.5,
        axis_style: "white",
        axis_width: 5,
        hovered_style: "#add8e680",
        selected_style: "#ade6b5cc",
        outline_style: "yellow",
        vertex_fill_styles: ["white", "gray", "black"],
        beam_fill_styles: ["white", "gray", "black"],
        seal_cracks_line_width: 1,
    };

    tool_preview = {
        "select": {
            "select_element": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                    this.render_frame();
                    return;
                }

                Object.entries(this.beams).forEach(([id, beam]) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > Beam.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
        },
        "add-vertex-click": {
            "add_vertex": e => {
                this.preview_elements.vertices = [];
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                this.preview_elements.vertices.push(new Vertex(canvas_point, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "add-vertex-beam": {
            "select_beam": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.beams).forEach(([id, beam]) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > Beam.hover_dist) return;
                    if (dist > nearest_dist) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "add_vertex": e => {
                this.preview_elements.vertices = [];
                this.preview_elements.beams[this.preview_elements.beams.length - 1]?.destroy();
                this.preview_elements.beams[this.preview_elements.beams.length - 2]?.destroy();
                this.preview_elements.beams = [];
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const beam = this.beams[this.selected_elements.selected[0]];
                const point = v.point_to_seg_point(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                let vertex;
                if (point === beam.vertices[0].position || point === beam.vertices[1].position) {
                    vertex = new Vertex(v.scale(v.add(beam.vertices[0].position, beam.vertices[1].position), 0.5), { preview: true });
                } else {
                    vertex = new Vertex(point, { preview: true });
                }

                this.preview_elements.vertices.push(vertex);
                this.preview_elements.beams.push(new Beam([beam.vertices[0], vertex], beam.direction, { preview: true }));
                this.preview_elements.beams.push(new Beam([beam.vertices[1], vertex], beam.direction, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "extend-beam-vertex": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (Object.keys(vertex.beams).length === 6) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "add_vertex": e => {
                this.preview_elements.beams[this.preview_elements.beams.length - 1]?.destroy();
                this.preview_elements.beams = [];
                this.preview_elements.vertices = [];

                const vertex = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 1]];
                const unit_axes = Object.fromEntries(
                    Object.entries({
                        "1": v.unit(this.axes[0]),
                        "2": v.unit(this.axes[1]),
                        "3": v.unit(this.axes[2]),
                        "-1": v.scale(v.unit(this.axes[0]), -1),
                        "-2": v.scale(v.unit(this.axes[1]), -1),
                        "-3": v.scale(v.unit(this.axes[2]), -1),
                    }).filter(([key]) => !(key in vertex.beams))
                );

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = Object.fromEntries(Object.entries(unit_axes).map(([key, axis_vec]) => [key, v.dot(axis_vec, v.sub(canvas_point, vertex.position))]));
                const nearest_axis = Object.entries(dot_prods)
                    .reduce((best, [key, value]) => value > best.value ? { key, value } : best, { key: null, value: -Infinity });
                if (dot_prods[nearest_axis.key] < 0) {
                    this.render_frame();
                    return;
                };

                const projected_direction = v.scale(unit_axes[nearest_axis.key], dot_prods[nearest_axis.key]);
                const new_vertex = new Vertex(v.add(vertex.position, projected_direction), { preview: true });
                this.preview_elements.vertices.push(new_vertex);
                this.preview_elements.beams.push(new Beam([vertex, new_vertex], Math.abs(Number(nearest_axis.key)), { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "extend-beam-length": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (Object.keys(vertex.beams).length === 6) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "select_axis": e => {
            },
            "enter_length": e => {
            },
        },
        "connect-vertices": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (Object.keys(vertex.beams).length === 6) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "select_vertex_2": e => {
                this.preview_elements.beams[this.preview_elements.beams.length - 1]?.destroy();
                this.preview_elements.beams = [];
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const vertex1 = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 1]];
                let nearest_id = -1;
                let nearest_dist = Infinity;
                let nearest_direction = 0;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;
                    if (Object.keys(vertex.beams).length === 6) return;
                    const direction = Object.entries({
                        "1": v.unit(this.axes[0]),
                        "2": v.unit(this.axes[1]),
                        "3": v.unit(this.axes[2]),
                        "-1": v.scale(v.unit(this.axes[0]), -1),
                        "-2": v.scale(v.unit(this.axes[1]), -1),
                        "-3": v.scale(v.unit(this.axes[2]), -1),
                    }).filter(([key, axis_vec]) => {
                        if (key in vertex1.beams) return false;
                        if (String(-Number(key)) in vertex.beams) return false;
                        return true;
                    }).reduce((best, [key, axis_vec]) => {
                        const dist = v.point_to_line_dist(vertex1.position, vertex.position, axis_vec);
                        if (v.dot(v.sub(vertex.position, vertex1.position), axis_vec) < 0) return best;
                        return dist < best.dist ? { key, dist } : best;
                    }, { key: null, dist: Infinity });
                    if (direction.dist > this.settings.vertex_connect_length_threshold) return;

                    nearest_id = id;
                    nearest_dist = dist;
                    nearest_direction = direction.key;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.preview_elements.beams.push(new Beam([this.vertices[this.selected_elements.selected[0]], this.vertices[nearest_id]], Math.abs(Number(nearest_direction)), { preview: true }));
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
        },
        "connect-vertex-along-axes": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (Object.keys(vertex.beams).length === 6) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "select_axis": e => {
                this.preview_elements.axes = [];

                const vertex = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 1]];
                const unit_axes = Object.fromEntries(
                    Object.entries({
                        "1": v.unit(this.axes[0]),
                        "2": v.unit(this.axes[1]),
                        "3": v.unit(this.axes[2]),
                        "-1": v.scale(v.unit(this.axes[0]), -1),
                        "-2": v.scale(v.unit(this.axes[1]), -1),
                        "-3": v.scale(v.unit(this.axes[2]), -1),
                    }).filter(([key]) => !(key in vertex.beams))
                );

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = Object.fromEntries(Object.entries(unit_axes).map(([key, axis_vec]) => [key, v.dot(axis_vec, v.sub(canvas_point, vertex.position))]));
                const nearest_axis = Object.entries(dot_prods)
                    .reduce((best, [key, value]) => value > best.value ? { key, value } : best, { key: null, value: -Infinity });
                if (dot_prods[nearest_axis.key] < 0) {
                    this.render_frame();
                    return;
                };

                this.preview_elements.axes.push(new Axis(vertex, Number(nearest_axis.key), { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
            "select_vertex_2": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const vertex1 = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 1]];
                const direction1 = this.preview_elements.axes[0].direction;
                const direction1_vec = direction1 > 0 ? this.axes[direction1 - 1] : v.scale(this.axes[-direction1 - 1], -1);
                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;
                    if (Object.keys(vertex.beams).length === 6) return;
                    // Return if the axis of vertex 1 doesn't intersect with all the axis of the vertex
                    if (Object.entries({
                        "1": this.axes[0],
                        "2": this.axes[1],
                        "3": this.axes[2],
                        "-1": v.scale(this.axes[0], -1),
                        "-2": v.scale(this.axes[1], -1),
                        "-3": v.scale(this.axes[2], -1),
                    }).filter(([key, axis]) => {
                        if (key in vertex.beams) return false;
                        if (Math.abs(Number(key)) === Math.abs(direction1)) return false;
                        const intersection = v.ray_intersection(vertex1.position, direction1_vec, vertex.position, axis);
                        if (intersection === null) return false;
                        if (v.len(v.sub(vertex.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                        if (v.len(v.sub(vertex1.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                        return true;
                    }).length === 0) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "select_axis_2": e => {
                this.preview_elements.axes[0].show = true;
                this.preview_elements.vertices = [];
                this.preview_elements.beams[this.preview_elements.beams.length - 2]?.destroy();
                this.preview_elements.beams[this.preview_elements.beams.length - 1]?.destroy();
                this.preview_elements.beams = [];

                const vertex1 = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 2]];
                const vertex2 = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 1]];
                const direction1 = this.preview_elements.axes[0].direction;
                const direction1_vec = direction1 > 0 ? this.axes[direction1 - 1] : v.scale(this.axes[-direction1 - 1], -1);
                const unit_axes = Object.fromEntries(
                    Object.entries({
                        "1": v.unit(this.axes[0]),
                        "2": v.unit(this.axes[1]),
                        "3": v.unit(this.axes[2]),
                        "-1": v.scale(v.unit(this.axes[0]), -1),
                        "-2": v.scale(v.unit(this.axes[1]), -1),
                        "-3": v.scale(v.unit(this.axes[2]), -1),
                    }).filter(([key, axis_vec]) => {
                        if (key in vertex2.beams) return false;
                        if (Math.abs(Number(key)) === Math.abs(direction1)) return false;
                        const intersection = v.ray_intersection(vertex1.position, direction1_vec, vertex2.position, axis_vec);
                        if (intersection === null) return false;
                        if (v.len(v.sub(vertex2.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                        if (v.len(v.sub(vertex1.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                        return true;
                    })
                );

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = Object.fromEntries(Object.entries(unit_axes).map(([key, axis_vec]) => [key, v.dot(axis_vec, v.sub(canvas_point, vertex2.position))]));
                const nearest_axis = Object.entries(dot_prods)
                    .reduce((best, [key, value]) => value > best.value ? { key, value } : best, { key: null, value: -Infinity });
                if (dot_prods[nearest_axis.key] < 0) {
                    this.render_frame();
                    return;
                };

                this.preview_elements.axes[0].show = false;
                const new_vertex = new Vertex(v.ray_intersection(vertex1.position, direction1_vec, vertex2.position, unit_axes[nearest_axis.key]), { preview: true });
                this.preview_elements.vertices.push(new_vertex);
                this.preview_elements.beams.push(new Beam([vertex1, new_vertex], Math.abs(direction1), { preview: true }));
                this.preview_elements.beams.push(new Beam([vertex2, new_vertex], Math.abs(Number(nearest_axis.key)), { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "connect-vertex-beam":{
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (Object.keys(vertex.beams).length === 6) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "select_axis": e => {
                this.preview_elements.axes = [];

                const vertex = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 1]];
                const unit_axes = Object.fromEntries(
                    Object.entries({
                        "1": v.unit(this.axes[0]),
                        "2": v.unit(this.axes[1]),
                        "3": v.unit(this.axes[2]),
                        "-1": v.scale(v.unit(this.axes[0]), -1),
                        "-2": v.scale(v.unit(this.axes[1]), -1),
                        "-3": v.scale(v.unit(this.axes[2]), -1),
                    }).filter(([key]) => !(key in vertex.beams))
                );

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = Object.fromEntries(Object.entries(unit_axes).map(([key, axis_vec]) => [key, v.dot(axis_vec, v.sub(canvas_point, vertex.position))]));
                const nearest_axis = Object.entries(dot_prods)
                    .reduce((best, [key, value]) => value > best.value ? { key, value } : best, { key: null, value: -Infinity });
                if (dot_prods[nearest_axis.key] < 0) {
                    this.render_frame();
                    return;
                };

                this.preview_elements.axes.push(new Axis(vertex, Number(nearest_axis.key), { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
            "select_beam": e => {
                this.preview_elements.axes[0].show = true;
                this.preview_elements.vertices = [];
                this.preview_elements.beams[this.preview_elements.beams.length - 1]?.destroy();
                this.preview_elements.beams[this.preview_elements.beams.length - 2]?.destroy();
                this.preview_elements.beams[this.preview_elements.beams.length - 3]?.destroy();
                this.preview_elements.beams = [];
                if (this.selected_elements.hovered in this.beams) {
                    this.beams[this.selected_elements.hovered].show = true;
                    this.beams[this.selected_elements.hovered].assign_vertices();
                }
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const vertex1 = this.vertices[this.selected_elements.selected[this.selected_elements.selected.length - 1]];
                const direction1 = this.preview_elements.axes[0].direction;
                const direction1_vec = direction1 > 0 ? this.axes[direction1 - 1] : v.scale(this.axes[-direction1 - 1], -1);
                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.beams).forEach(([id, beam]) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > Beam.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (Object.values(vertex1.beams).includes(beam)) return;
                    if (v.ray_seg_intersection(vertex1.position, direction1_vec, beam.vertices[0].position, beam.vertices[1].position) === null) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });
                if (nearest_id === -1) {
                    this.selected_elements.hovered = -1;
                    this.render_frame();
                    return;
                }

                this.preview_elements.axes[0].show = false;
                this.selected_elements.hovered = nearest_id;
                this.beams[nearest_id].show = false;
                this.beams[nearest_id].destroy();
                const vertex2 = new Vertex(v.ray_seg_intersection(vertex1.position, direction1_vec, this.beams[nearest_id].vertices[0].position, this.beams[nearest_id].vertices[1].position), { preview: true });
                this.preview_elements.vertices.push(vertex2);
                this.preview_elements.beams.push(new Beam([vertex1, vertex2], Math.abs(direction1), { preview: true }));
                this.preview_elements.beams.push(new Beam([vertex2, this.beams[nearest_id].vertices[0]], this.beams[nearest_id].direction, { preview: true }));
                this.preview_elements.beams.push(new Beam([vertex2, this.beams[nearest_id].vertices[1]], this.beams[nearest_id].direction, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame(); 
            },
        },
        "add-beam-intersection": {
            "select_beam": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.beams).forEach(([id, beam]) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > Beam.hover_dist) return;
                    if (dist > nearest_dist) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
            "select_beam_2": e => {
                this.preview_elements.vertices = [];
                this.preview_elements.beams[this.preview_elements.beams.length - 1]?.destroy();
                this.preview_elements.beams[this.preview_elements.beams.length - 2]?.destroy();
                this.preview_elements.beams[this.preview_elements.beams.length - 3]?.destroy();
                this.preview_elements.beams[this.preview_elements.beams.length - 4]?.destroy();
                this.preview_elements.beams = [];
                this.beams[this.selected_elements.selected[0]].show = true;
                this.beams[this.selected_elements.selected[0]].assign_vertices();
                if (this.selected_elements.hovered in this.beams) {
                    this.beams[this.selected_elements.hovered].show = true;
                    this.beams[this.selected_elements.hovered].assign_vertices();
                }
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const beam1 = this.beams[this.selected_elements.selected[0]];
                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.beams).forEach(([id, beam]) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > Beam.hover_dist) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;
                    if (beam1.vertices.some(vertex => Object.values(vertex.beams).includes(beam))) return;
                    if (v.seg_intersection(beam1.vertices[0].position, beam1.vertices[1].position, beam.vertices[0].position, beam.vertices[1].position) === null) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });
                if (nearest_id === -1) {
                    this.selected_elements.hovered = -1;
                    this.render_frame();
                    return;
                }

                this.selected_elements.hovered = nearest_id;
                beam1.show = false;
                beam1.destroy();
                this.beams[nearest_id].show = false;
                this.beams[nearest_id].destroy();
                const vertex = new Vertex(v.seg_intersection(beam1.vertices[0].position, beam1.vertices[1].position, this.beams[nearest_id].vertices[0].position, this.beams[nearest_id].vertices[1].position), { preview: true });
                this.preview_elements.vertices.push(vertex);
                this.preview_elements.beams.push(new Beam([vertex, this.beams[nearest_id].vertices[0]], this.beams[nearest_id].direction, { preview: true }));
                this.preview_elements.beams.push(new Beam([vertex, this.beams[nearest_id].vertices[1]], this.beams[nearest_id].direction, { preview: true }));
                this.preview_elements.beams.push(new Beam([vertex, beam1.vertices[0]], beam1.direction, { preview: true }));
                this.preview_elements.beams.push(new Beam([vertex, beam1.vertices[1]], beam1.direction, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "delete-vertex": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
        },
        "dissolve-vertex": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > Vertex.hover_dist) return;
                    if (dist > nearest_dist) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();
            },
        },
        "delete-beam": {
            "select_beam": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                Object.entries(this.beams).forEach(([id, beam]) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > Beam.hover_dist) return;
                    if (dist > nearest_dist) return;

                    nearest_id = id;
                    nearest_dist = dist;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.canvas.style.cursor = "pointer";
                } else {
                    this.selected_elements.hovered = -1;
                }
                this.render_frame();                    
            },
        },
    }

    render_frame() {
        this.highlight_selected_elements();
        this.ctx.clearRect(...v.scale(this.origin, 1 / this.size), this.canvas.width / this.size, -this.canvas.height / this.size);
        Beam.seal_cracks_line_width = this.settings.seal_cracks_line_width / this.size;
        Vertex.seal_cracks_line_width = this.settings.seal_cracks_line_width / this.size;
        Axis.line_width = this.settings.axis_width / this.size;

        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.lineWidth = 2 / this.size;

        const combined_object = {...this.beams, ...this.vertices};
        this.render_order.forEach(key => {
            combined_object[key].fill();
        });

        this.draw_tools();
        // this.display_sierpinski(8);
        // this.display_all_possibilities();
        // this.display_penrose_triangle();
        // this.display_impossible_cube();
    }

    handle_tool_use(e) {
        super.handle_tool_use(e);
        switch (this.tool_status.tool) {
            case "select":
                if (e.which !== 1) return;
                if (this.selected_elements.hovered === -1) return;

                this.selected_elements.selected = [this.selected_elements.hovered];
                this.selected_elements.hovered = -1;
                reload_element_settings(this, this.selected_elements.selected[0]);
                break;
            case "add-vertex-click":
                if (e.which !== 1) return;
                if (this.preview_elements.vertices.length !== 1) return;

                this.register_preview(this.preview_elements.vertices[0]);
                this.preview_elements.vertices = [];
                break;
            case "add-vertex-beam":
                if (e.which !== 1) return;
                switch (this.tool_status.status) {
                    case "select_beam":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;
                        this.beams[this.selected_elements.selected[0]].show = false;
                        this.beams[this.selected_elements.selected[0]].destroy();

                        this.tool_status.status = "add_vertex";
                        break;
                    case "add_vertex":
                        if (this.preview_elements.vertices.length !== 1) return;

                        this.remove_element(this.beams[this.selected_elements.selected[0]]);
                        this.register_preview(this.preview_elements.beams[0]);
                        this.register_preview(this.preview_elements.beams[1]);
                        this.register_preview(this.preview_elements.vertices[0]);
                        this.preview_elements = { vertices: [], beams: [], axes: [] };
                        this.selected_elements.selected = [];

                        this.tool_status.status = "select_beam";
                        break;
                }
                break;
            case "extend-beam-vertex":
                if (e.which !== 1) return;
                switch (this.tool_status.status) {
                    case "select_vertex":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;

                        this.tool_status.status = "add_vertex";
                        break;
                    case "add_vertex":
                        if (this.preview_elements.beams.length !== 1) return;

                        this.register_preview(this.preview_elements.beams[0]);
                        this.register_preview(this.preview_elements.vertices[0]);
                        this.preview_elements = { vertices: [], beams: [], axes: [] };
                        this.selected_elements.selected = [];

                        this.tool_status.status = "select_vertex";
                        break;
                }
                break;
            case "extend-beam-length":
                if (e.which !== 1) return;
                switch (this.tool_status.status) {
                    case "select_vertex":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;

                        this.tool_status.status = "select_axis";
                        this.tool_status.can_select_elements = new Set();
                        this.tool_status.create_element = "axis";
                        break;
                    case "select_axis":
                        if (this.preview_elements.axes.length !== 1) return;

                        this.tool_status.status = "enter_length";
                        break;
                    case "enter_length":
                        break;
                }
                break;
            case "connect-vertices":
                if (e.which !== 1) return;
                switch (this.tool_status.status) {
                    case "select_vertex":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;

                        this.tool_status.status = "select_vertex_2";
                        break;
                    case "select_vertex_2":
                        if (this.selected_elements.hovered === -1) return;

                        this.register_preview(this.preview_elements.beams[0]);
                        this.preview_elements.beams = [];
                        this.selected_elements.hovered = -1;
                        this.selected_elements.selected = [];

                        this.tool_status.status = "select_vertex";
                        break;
                }
                break;
            case "connect-vertex-along-axes":
                if (e.which !== 1) return;
                switch (this.tool_status.status) {
                    case "select_vertex":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;

                        this.tool_status.status = "select_axis";
                        break;
                    case "select_axis":
                        if (this.preview_elements.axes.length !== 1) return;

                        this.preview_elements.axes[this.preview_elements.axes.length - 1].preview = false;
                        this.tool_status.status = "select_vertex_2";
                        break;
                    case "select_vertex_2":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;

                        this.tool_status.status = "select_axis_2";
                        break;
                    case "select_axis_2":
                        if (this.preview_elements.vertices.length !== 1) return;

                        this.register_preview(this.preview_elements.beams[0]);
                        this.register_preview(this.preview_elements.beams[1]);
                        this.register_preview(this.preview_elements.vertices[0]);
                        this.preview_elements = { vertices: [], beams: [], axes: [] };
                        this.selected_elements.selected = [];

                        this.tool_status.status = "select_vertex";
                        break;
                }
                break;
            case "connect-vertex-beam":
                if (e.which !== 1) return;
                switch (this.tool_status.status) {
                    case "select_vertex":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;

                        this.tool_status.status = "select_axis";
                        break;
                    case "select_axis":
                        if (this.preview_elements.axes.length !== 1) return;

                        this.preview_elements.axes[this.preview_elements.axes.length - 1].preview = false;
                        this.tool_status.status = "select_beam";
                        break;
                    case "select_beam":
                        if (this.selected_elements.hovered === -1) return;

                        this.remove_element(this.beams[this.selected_elements.hovered]);
                        this.register_preview(this.preview_elements.beams[0]);
                        this.register_preview(this.preview_elements.beams[1]);
                        this.register_preview(this.preview_elements.beams[2]);
                        this.register_preview(this.preview_elements.vertices[0]);
                        this.preview_elements = { vertices: [], beams: [], axes: [] };
                        this.selected_elements.hovered = -1;
                        this.selected_elements.selected = [];

                        this.tool_status.status = "select_vertex";
                        break;
                }
                break;
            case "add-beam-intersection":
                if (e.which !== 1) return;
                switch (this.tool_status.status) {
                    case "select_beam":
                        if (this.selected_elements.hovered === -1) return;

                        this.selected_elements.selected.push(this.selected_elements.hovered);
                        this.selected_elements.hovered = -1;

                        this.tool_status.status = "select_beam_2";
                        break;
                    case "select_beam_2":
                        if (this.selected_elements.hovered === -1) return;

                        this.remove_element(this.beams[this.selected_elements.selected[0]]);
                        this.remove_element(this.beams[this.selected_elements.hovered]);
                        this.register_preview(this.preview_elements.beams[0]);
                        this.register_preview(this.preview_elements.beams[1]);
                        this.register_preview(this.preview_elements.beams[2]);
                        this.register_preview(this.preview_elements.beams[3]);
                        this.register_preview(this.preview_elements.vertices[0]);
                        this.preview_elements = { vertices: [], beams: [], axes: [] };
                        this.selected_elements.hovered = -1;
                        this.selected_elements.selected = [];

                        this.tool_status.status = "select_beam";
                        break;
                }
                break;
            case "delete-vertex":
                if (e.which !== 1) return;
                if (this.selected_elements.hovered === -1) return;

                Object.values(this.vertices[this.selected_elements.hovered].beams).forEach(beam => {
                    this.remove_element(this.beams[beam.id]);
                });
                this.remove_element(this.vertices[this.selected_elements.hovered]);
                this.selected_elements.hovered = -1;
                break;
            case "dissolve-vertex":
                if (e.which !== 1) return;
                if (this.selected_elements.hovered === -1) return;

                Object.entries(this.vertices[this.selected_elements.hovered].beams).forEach(([dir, beam]) => {
                    if (!this.beams[beam.id]) return;
                    this.remove_element(this.beams[beam.id]);
                    const same_axis_beam = this.vertices[this.selected_elements.hovered].beams[String(-Number(dir))];
                    if (same_axis_beam) {
                        this.remove_element(this.beams[same_axis_beam.id]);
                        const vertex1 = beam.vertices[0] === this.vertices[this.selected_elements.hovered] ? beam.vertices[1] : beam.vertices[0];
                        const vertex2 = same_axis_beam.vertices[0] === this.vertices[this.selected_elements.hovered] ? same_axis_beam.vertices[1] : same_axis_beam.vertices[0];
                        this.register_preview(new Beam([vertex1, vertex2], Math.abs(Number(dir))));
                    }
                });
                this.remove_element(this.vertices[this.selected_elements.hovered]);
                this.selected_elements.hovered = -1;
                break;
            case "delete-beam":
                if (e.which !== 1) return;
                if (this.selected_elements.hovered === -1) return;
                
                this.remove_element(this.beams[this.selected_elements.hovered]);
                this.selected_elements.hovered = -1;
                break;
        }
        this.render_frame();
        this.handle_mousemove(e);
    }

    // Add preview element to this.vertices or this.beams
    register_preview(element) {
        element.preview = false;
        element.id = this.next_id;
        this.render_order.push(this.next_id);
        if (element instanceof Vertex) {
            element.name = `Vertex ${this.next_name.vertex++}`;
            this.vertices[this.next_id] = element;
        } else if (element instanceof Beam) {
            element.name = `Beam ${this.next_name.beam++}`;
            this.beams[this.next_id] = element;
        }
        const order = $("<div>").text(this.render_order.indexOf(this.next_id) + 1);
        const button = $("<button>").data("id", this.next_id).text(element.name);
        switch (this.tool_status.tool) {
            case "move":
            case "select":
                button.removeClass("default-cursor");
                break;
            default:
                button.addClass("default-cursor");
                break;
        }
        $("#element-list").append($("<li>").addClass("element-list-item").append(order).append(button));
        this.next_id++;
        this.update_element_order();
    }

    remove_element(element) {
        this.render_order.splice(this.render_order.indexOf(element.id), 1);
        if (element instanceof Vertex) {
            delete this.vertices[element.id];
        } else if (element instanceof Beam) {
            element.destroy();
            delete this.beams[element.id];
        }
        $('.element-list-item > button').filter(function () {
            return $(this).data('id') === element.id;
        }).parent().remove();
        this.update_element_order();
    }

    update_element_order(according_to_html_order = false) {
        if (according_to_html_order) {
            this.render_order = [];
            $(".element-list-item").not(".sortable-ghost").each((_, button) => {
                const id = $(button).children("button").data("id");
                this.render_order.push(id);
            });
        }
        $(".element-list-item").not(".sortable-ghost").each((_, button) => {
            const id = $(button).children("button").data("id");
            $(button).children("div").text(this.render_order.indexOf(id) + 1);
        });
    }

    highlight_selected_elements() {
        $(".element-list-item > button").each((_, button) => {
            const id = String($(button).data("id"));
            button.classList.remove("hovered", "selected");
            if (id === this.selected_elements.hovered) {
                $(button).addClass("hovered");
            } else if (this.selected_elements.selected.includes(id)) {
                $(button).addClass("selected");
            }
        });
    }

    display_all_possibilities() {
        let centers_vertices = [];
        for (let i=0; i<8; i++) {
            for (let j=0; j<8; j++) {
                centers_vertices.push(new Vertex(v.add(v.scale([0, 1], i * 500), v.scale([1, 0], j * 500))));
            }
        }
        const toggle_beams = Array.from({ length: 2 ** 6 - 1 }, (_, i) => i + 1)
            .map(x => x.toString(2).padStart(6, '0'))
            .sort((a, b) => {
                const countA = a.split('').filter(n => n === '1').length;
                const countB = b.split('').filter(n => n === '1').length;
                return countA - countB || (a.localeCompare(b));
            }).map(x => x.split('').map((n, i) => n === '1' ? 6 - i : 0).filter(n => n !== 0));
        let vertices = [];
        let beams = [];

        for (let i=0; i<63; i++) {
            toggle_beams[i].forEach(beam => {
                const v = new Vertex(v.add(centers_vertices[i].position, v.scale(this.axes[(beam - 1) % 3], beam > 3 ? -10 : 10)));
                const b = new Beam(beam < 4 ? [v, centers_vertices[i]] : [centers_vertices[i], v], (beam - 1) % 3 + 1);
                beams.push(b);
                vertices.push(v);
            });
        }
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.lineWidth = 2 / this.size;

        centers_vertices.forEach(vertex => vertex.fill());
        beams.forEach(beam => beam.fill());
        vertices.forEach(vertex => vertex.fill());

        // centers_vertices.forEach(vertex => vertex.draw_outline());
        // beams.forEach(beam => beam.draw_outline());
        // vertices.forEach(vertex => vertex.draw_outline());
    }

    display_penrose_triangle() {
        let vertices = [];
        let beams = [];
        vertices.push(new Vertex([-300, 0]));
        vertices.push(new Vertex(v.add(vertices[0].position, v.scale(this.axes[0], 5))));
        vertices.push(new Vertex(v.add(vertices[0].position, v.scale(this.axes[1], -5))));

        beams.push(new Beam([vertices[1], vertices[0]], 1));
        beams.push(new Beam([vertices[0], vertices[2]], 2));
        beams.push(new Beam([vertices[2], vertices[1]], 3));

        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.lineWidth = 2 / this.size;
        
        beams.forEach(beam => beam.fill());
        vertices.forEach(vertex => vertex.fill());

        // beams.forEach(beam => beam.draw_outline());
        // vertices.forEach(vertex => vertex.draw_outline());
    }

    display_impossible_cube() {
        let vertices = [];
        let beams = [];

        vertices.push(new Vertex([0, 0]));
        vertices.push(new Vertex(v.add(vertices[0].position, v.scale(this.axes[0], 10))));
        vertices.push(new Vertex(v.add(vertices[0].position, v.scale(this.axes[1], 10))));
        vertices.push(new Vertex(v.add(vertices[0].position, v.scale(this.axes[2], 10))));
        vertices.push(new Vertex(v.add(vertices[1].position, v.scale(this.axes[1], 10))));
        vertices.push(new Vertex(v.add(vertices[2].position, v.scale(this.axes[2], 10))));
        vertices.push(new Vertex(v.add(vertices[3].position, v.scale(this.axes[0], 10))));
        vertices.push(new Vertex(v.add(vertices[4].position, v.scale(this.axes[2], 10))));

        beams.push(new Beam([vertices[4], vertices[1]], 2));
        beams.push(new Beam([vertices[6], vertices[1]], 3));
        beams.push(new Beam([vertices[5], vertices[2]], 3));
        beams.push(new Beam([vertices[4], vertices[2]], 1));
        beams.push(new Beam([vertices[6], vertices[3]], 1));
        beams.push(new Beam([vertices[5], vertices[3]], 2));
        beams.push(new Beam([vertices[7], vertices[4]], 3));
        beams.push(new Beam([vertices[7], vertices[5]], 1));
        beams.push(new Beam([vertices[7], vertices[6]], 2));
        beams.push(new Beam([vertices[1], vertices[0]], 1));
        beams.push(new Beam([vertices[2], vertices[0]], 2));
        beams.push(new Beam([vertices[3], vertices[0]], 3));

        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.lineWidth = 2 / this.size;

        beams.forEach(beam => beam.fill());
        vertices.forEach(vertex => vertex.fill());

        // beams.forEach(beam => beam.draw_outline());
        // vertices.forEach(vertex => vertex.draw_outline());
    }

    display_sierpinski(level) {
        // Credit to NutronStar45 for the algorithm
        let vertices = [new Vertex([0, 0])];
        let vertexCount = 1;
        let beams = [];

        /**
         * Generates a subtriangle.
         * @param {number} sublevel Positive integer indicating the level of the triangle.
         * @param {number} bottomLeft Index of the vertex at the bottom left.
         * @param {number | null} bottomRight Index of the vertex at the bottom right, or `null` if not yet generated.
         * @returns {[number, number]} Array containing the indices of the vertices at the bottom right and top.
         */
        let subtriangle = (sublevel, bottomLeft, bottomRight) => {
            if (sublevel === 1) {
                // Generate vertices
                if (bottomRight === null) {
                    bottomRight = vertexCount++;
                    vertices.push(new Vertex(v.add(vertices[bottomLeft].position, v.scale(this.axes[0], 10))));
                }
                let top = vertexCount++;
                vertices.push(new Vertex(v.add(vertices[bottomLeft].position, v.scale(this.axes[1], -10))));

                // Generate beams
                beams.push(new Beam([vertices[bottomLeft], vertices[bottomRight]], 1));
                beams.push(new Beam([vertices[bottomLeft], vertices[top]], 2));
                beams.push(new Beam([vertices[bottomRight], vertices[top]], 3));

                return [bottomRight, top];
            } else {
                // Bottom left subtriangle
                let [bottom, left] = subtriangle(sublevel - 1, bottomLeft, null);

                // Bottom right subtriangle
                let [bottomRightTemp, right] = subtriangle(sublevel - 1, bottom, bottomRight);
                if (bottomRight === null) bottomRight = bottomRightTemp;

                // Top subtriangle
                let top = subtriangle(sublevel - 1, left, right)[1];

                return [bottomRight, top];
            }
        }

        subtriangle(level, 0, null);

        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.lineWidth = 2 / this.size;

        beams.forEach(beam => beam.fill());
        vertices.forEach(vertex => vertex.fill());

        // beams.forEach(beam => beam.draw_outline());
        // vertices.forEach(vertex => vertex.draw_outline());
    }

    draw_tools() {
        Object.entries(this.beams).forEach(([id, beam]) => {
            if (id === this.selected_elements.hovered) {
                beam.draw_hovered();
            } else if (this.selected_elements.selected.includes(id)) {
                beam.draw_selected();
            }
        });
        Object.entries(this.vertices).forEach(([id, vertex]) => {
            if (id === this.selected_elements.hovered) {
                vertex.draw_hovered();
            } else if (this.selected_elements.selected.includes(id)) {
                vertex.draw_selected();
            }
        });
        this.preview_elements.axes.forEach(axis => {
            axis.draw();
        });
        this.preview_elements.beams.forEach(beam => {
            beam.fill();
        });
        this.preview_elements.vertices.forEach(vertex => {
            vertex.fill();
        });
    }

    sync_settings() {
        Beam.axes = this.axes;
        Beam.hover_dist = Math.max(...this.axes.map(axis => v.len(axis)));
        Beam.preview_alpha = this.settings.preview_alpha;
        Beam.hovered_style = this.settings.hovered_style;
        Beam.selected_style = this.settings.selected_style;
        Beam.outline_style = this.settings.outline_style;
        Beam.fill_styles = this.settings.beam_fill_styles;
        Vertex.axes = this.axes;
        Vertex.hover_dist = Math.max(...this.axes.map(axis => v.len(axis))) * 2 ** .5;
        Vertex.preview_alpha = this.settings.preview_alpha;
        Vertex.hovered_style = this.settings.hovered_style;
        Vertex.selected_style = this.settings.selected_style;
        Vertex.outline_style = this.settings.outline_style;
        Vertex.fill_styles = this.settings.vertex_fill_styles;
        Axis.axes = this.axes;
        Axis.stroke_style = this.settings.axis_style;
        Axis.preview_alpha = this.settings.preview_alpha;
        Axis.line_width = this.settings.axis_width;
    }
}

class Vertex {
    static ctx;
    static axes;
    static hover_dist;
    static preview_alpha;
    static hovered_style;
    static selected_style;
    static outline_style;
    static fill_styles;
    static seal_cracks_line_width;

    constructor(position, { id=0, preview=false, show=true } = {}) {
        this.position = position;
        this.id = id;
        this.beams = {};
        this.edges = new Set();
        this.preview = preview;
        this.show = show;
    }

    draw_outline() {
        if (!this.show) return;
        const add_edges_1 = () => {
            Object.keys(this.beams).forEach(main_beam => {
                main_beam = Number(main_beam);
                const main_axis = Math.abs(main_beam);
                const other_axes = [1, 2, 3].filter(axis => axis !== Math.abs(main_beam));
                if (main_beam > 0) {
                    this.edges.add(`${main_axis}`);
                    this.edges.add(`${other_axes[0]},${main_axis}`);
                    this.edges.add(`${main_axis},${other_axes[0]}`);
                    this.edges.add(`${other_axes[1]},${main_axis}`);
                    this.edges.add(`${main_axis},${other_axes[1]}`);
                } else {
                    this.edges.add(`${main_axis}`);
                    this.edges.add(`${other_axes[0]}`);
                    this.edges.add(`${other_axes[1]}`);
                    this.edges.add(`${other_axes[0]},${other_axes[1]}`);
                    this.edges.add(`${other_axes[1]},${other_axes[0]}`);
                    this.edges.add(`${other_axes[0]},${main_axis}`);
                    this.edges.add(`${other_axes[1]},${main_axis}`);
                    this.edges.add(`${main_axis},${other_axes[0]},${main_axis}`);
                    this.edges.add(`${main_axis},${other_axes[1]},${main_axis}`);
                }
            });
        }

        const remove_edges = () => {
            Object.keys(this.beams).forEach(main_beam => {
                main_beam = Number(main_beam);
                const main_axis = Math.abs(main_beam);
                const other_axes = [1, 2, 3].filter(axis => axis !== main_axis);
                if (main_beam > 0) {
                    Object.keys(this.beams).forEach(secondary_beam => {
                        secondary_beam = Number(secondary_beam);
                        if (secondary_beam !== main_beam) {
                            const secondary_axis = Math.abs(secondary_beam);
                            const other_axis = [1, 2, 3].filter(axis => axis !== main_axis && axis !== secondary_axis)[0];
                            if (secondary_beam === -main_beam) {
                                this.edges.delete(`${main_axis},${other_axes[0]}`);
                                this.edges.delete(`${main_axis},${other_axes[1]}`);
                            } else if (secondary_beam > 0) {
                                this.edges.delete(`${main_axis}`);
                                this.edges.delete(`${main_axis},${other_axis}`);
                                this.edges.delete(`${other_axis},${main_axis}`);
                            } else if (secondary_beam < 0) {
                                this.edges.delete(`${secondary_axis},${main_axis}`);
                            }
                        }
                    });
                } else {
                    Object.keys(this.beams).forEach(secondary_beam => {
                        secondary_beam = Number(secondary_beam);
                        if (secondary_beam !== main_beam) {
                            const secondary_axis = Math.abs(secondary_beam);
                            const other_axis = [1, 2, 3].filter(axis => axis !== main_axis && axis !== secondary_axis)[0];
                            if (secondary_beam === -main_beam) {
                                this.edges.delete(`${other_axes[0]}`);
                                this.edges.delete(`${other_axes[1]}`);
                                this.edges.delete(`${other_axes[0]},${other_axes[1]}`);
                                this.edges.delete(`${other_axes[1]},${other_axes[0]}`);
                            } else if (secondary_beam > 0) {
                                this.edges.delete(`${main_axis}`);
                                this.edges.delete(`${other_axis}`);
                                this.edges.delete(`${other_axis},${main_axis}`);
                                this.edges.delete(`${main_axis},${other_axis},${main_axis}`);
                            } else if (secondary_beam < 0) {
                                this.edges.delete(`${secondary_axis},${other_axis}`);
                                this.edges.delete(`${secondary_axis},${main_axis}`);
                            }
                        }
                    });
                }
            });
        }

        const add_edges_2 = () => {
            Object.keys(this.beams).forEach(main_beam => {
                main_beam = Number(main_beam);
                const main_axis = Math.abs(main_beam);
                const other_axes = [1, 2, 3].filter(axis => axis !== Math.abs(main_beam));
                if (main_beam > 0) {
                    Object.keys(this.beams).forEach(secondary_beam => {
                        secondary_beam = Number(secondary_beam);
                        if (secondary_beam > 0 && secondary_beam !== main_beam) {
                            const secondary_axis = Math.abs(secondary_beam);
                            const other_axis = [1, 2, 3].filter(axis => axis !== main_axis && axis !== secondary_axis)[0];
                            this.edges.add(`${other_axis}`);
                        }
                    });
                }
            });
        }

        add_edges_1();
        // remove_edges();
        add_edges_2();

        Vertex.ctx.strokeStyle = Vertex.outline_style;
        Vertex.ctx.beginPath();
        this.edges.forEach(edgeKey => {
            const edge = edgeKey.split(",").map(Number);
            let position = this.position;
            for (let i=0; i<edge.length-1; i++) {
                    position = v.sub(position, Vertex.axes[edge[i] - 1]);
            }
            Vertex.ctx.moveTo(...position);
                const line_end = v.sub(position, Vertex.axes[edge[edge.length - 1] - 1]);
            Vertex.ctx.lineTo(...line_end);
        });
        Vertex.ctx.closePath();
        Vertex.ctx.stroke();
    }

    fill() {
        if (!this.show) return;
        if (this.preview) Vertex.ctx.globalAlpha = Vertex.preview_alpha;
        for (let i=0; i<3; i++) {
            if (String(i + 1) in this.beams) continue;
            const main_axis = Vertex.axes[i];
            const other_axes = Vertex.axes.filter((_, j) => j !== i);
            Vertex.ctx.fillStyle = Vertex.fill_styles[i];
            Vertex.ctx.beginPath();
            let position = this.position;
            Vertex.ctx.moveTo(...position);
            position = v.sub(position, other_axes[0]);
            Vertex.ctx.lineTo(...position);
            position = v.sub(position, other_axes[1]);
            Vertex.ctx.lineTo(...position);
            position = v.add(position, other_axes[0]);
            Vertex.ctx.lineTo(...position);
            position = v.add(position, other_axes[1]);
            Vertex.ctx.lineTo(...position);
            Vertex.ctx.closePath();
            Vertex.ctx.fill();

            // Draw outline to prevent cracks
            Vertex.ctx.save();
            Vertex.ctx.strokeStyle = Vertex.fill_styles[i];
            Vertex.ctx.lineWidth = Vertex.seal_cracks_line_width;
            Vertex.ctx.stroke();
            Vertex.ctx.restore();
        }
        if (this.preview) Vertex.ctx.globalAlpha = 1;
    }

    draw_hovered() {
        if (!this.show) return;
        Vertex.ctx.fillStyle = Vertex.hovered_style;
        Vertex.ctx.beginPath();
        let position = v.sub(this.position, Vertex.axes[0]);
        Vertex.ctx.moveTo(...position);
        position = v.sub(position, Vertex.axes[1]);
        Vertex.ctx.lineTo(...position);
        position = v.add(position, Vertex.axes[0]);
        Vertex.ctx.lineTo(...position);
        position = v.sub(position, Vertex.axes[2]);
        Vertex.ctx.lineTo(...position);
        position = v.add(position, Vertex.axes[1]);
        Vertex.ctx.lineTo(...position);
        position = v.sub(position, Vertex.axes[0]);
        Vertex.ctx.lineTo(...position);
        position = v.add(position, Vertex.axes[2]);
        Vertex.ctx.closePath();
        Vertex.ctx.fill();
    }

    draw_selected() {
        if (!this.show) return;
        Vertex.ctx.fillStyle = Vertex.selected_style;
        Vertex.ctx.beginPath();
        let position = v.sub(this.position, Vertex.axes[0]);
        Vertex.ctx.moveTo(...position);
        position = v.sub(position, Vertex.axes[1]);
        Vertex.ctx.lineTo(...position);
        position = v.add(position, Vertex.axes[0]);
        Vertex.ctx.lineTo(...position);
        position = v.sub(position, Vertex.axes[2]);
        Vertex.ctx.lineTo(...position);
        position = v.add(position, Vertex.axes[1]);
        Vertex.ctx.lineTo(...position);
        position = v.sub(position, Vertex.axes[0]);
        Vertex.ctx.lineTo(...position);
        position = v.add(position, Vertex.axes[2]);
        Vertex.ctx.closePath();
        Vertex.ctx.fill();
    }
}

class Beam {
    static ctx;
    static axes;
    static hover_dist;
    static preview_alpha;
    static hovered_style;
    static selected_style;
    static outline_style;
    static fill_styles;
    static seal_cracks_line_width;

    constructor(vertices, direction, { id=0, preview=false, show=true, name="" } = {}) {
        this.vertices = vertices;
        this.direction = direction;
        this.id = id;
        this.preview = preview;
        this.show = show;
        if (v.dot(v.sub(this.vertices[0].position, this.vertices[1].position), Beam.axes[this.direction - 1]) < 0) this.vertices.reverse();
        this.assign_vertices();
    }

    assign_vertices() {
        this.vertices[0].beams[String(-this.direction)] = this;
        this.vertices[1].beams[String(this.direction)] = this;
    }

    destroy() {
        if (this.vertices[0].beams[String(-this.direction)] === this) delete this.vertices[0].beams[String(-this.direction)];
        if (this.vertices[1].beams[String(this.direction)] === this) delete this.vertices[1].beams[String(this.direction)];
    }

    draw_outline() {
        if (!this.show) return;
        const main_axis = Beam.axes[this.direction - 1];
        const other_axes = Beam.axes.filter((_, i) => i !== this.direction - 1);
        let starts = [];
        starts[0] = this.vertices[0].position;
        starts[0] = v.sub(starts[0], main_axis);
        starts[1] = v.sub(starts[0], main_axis);
        starts[2] = v.sub(starts[1], other_axes[1]);
        starts[1] = v.sub(starts[1], other_axes[0]);


        let ends = [];
        ends[0] = this.vertices[1].position;
        ends[1] = v.sub(ends[0], other_axes[0]);
        ends[2] = v.sub(ends[0], other_axes[1]);

        Beam.ctx.strokeStyle = Beam.outline_style;
        for (let i=0; i<3; i++) {
            Beam.ctx.beginPath();
            Beam.ctx.moveTo(...starts[i]);
            Beam.ctx.lineTo(...ends[i]);
            Beam.ctx.closePath();
            Beam.ctx.stroke();
        }
    }

    fill() {
        if (!this.show) return;
        if (this.preview) Beam.ctx.globalAlpha = Beam.preview_alpha;
        const main_axis = Beam.axes[this.direction - 1];
        const other_axes_index = [1, 2, 3].filter(axis => axis !== this.direction);
        const other_axes = other_axes_index.map(i => Beam.axes[i - 1]);
        for (let i=0; i<2; i++) {
            // Draw the part of the other beams of the vertices[1] that is covered by the beam
            // Continue if the other beam does not exist
            if (!(String(-other_axes_index[i]) in this.vertices[1].beams)) continue;
            // Continue if the other beam is not shown
            if(!this.vertices[1].beams[String(-other_axes_index[i])].show) continue;
            // Continue if the other beam is shorter than the axis of the beam
            if (v.len(v.sub(this.vertices[1].position, this.vertices[1].beams[String(-other_axes_index[i])].vertices[1].position)) < v.len(Beam.axes[other_axes_index[i] - 1])) continue;
            const p1 = v.sub(this.vertices[1].position, other_axes[i]);
            const p2 = v.sub(this.vertices[1].beams[String(-other_axes_index[i])].vertices[1].position, other_axes[1 - i]);
            const overlapping_point = v.line_intersection(p1, main_axis, p2, other_axes[i]);
            Beam.ctx.fillStyle = Beam.fill_styles[this.direction - 1];
            Beam.ctx.save();
            Beam.ctx.globalAlpha = this.vertices[1].beams[String(-other_axes_index[i])].preview ? Beam.preview_alpha : 1;
            Beam.ctx.beginPath();
            Beam.ctx.moveTo(...p1);
            Beam.ctx.lineTo(...v.sub(p1, other_axes[1 - i]));
            if (v.dot(v.sub(overlapping_point, p2), other_axes[i]) > 0) {
                Beam.ctx.lineTo(...overlapping_point);
            } else {
                const alt_overlapping_point = v.line_intersection(p1, main_axis, p2, other_axes[1 - i]);
                Beam.ctx.lineTo(...p2)
                Beam.ctx.lineTo(...alt_overlapping_point);
            }
            Beam.ctx.lineTo(...p1);
            Beam.ctx.closePath();
            Beam.ctx.fill();
            Beam.ctx.restore();
        }
        for (let i=0; i<2; i++) {
            // Draw the part of the beam that is not covered by the other beam
            if (v.len(v.sub(this.vertices[0].position, this.vertices[1].position)) < v.len(Beam.axes[this.direction - 1])) continue;
            Beam.ctx.fillStyle = Beam.fill_styles[other_axes_index[i] - 1];
            Beam.ctx.beginPath();
            let position = this.vertices[1].position;
            Beam.ctx.moveTo(...position);
            if (String(other_axes_index[i]) in this.vertices[0].beams) {
                // If the beam is covered by the other beam of the vertices[0]
                const p1 = v.sub(this.vertices[0].position, main_axis);
                const p2 = v.sub(this.vertices[1].position, other_axes[1 - i]);
                const overlapping_point = v.line_intersection(p1, other_axes[i], p2, main_axis);
                if (v.dot(v.sub(overlapping_point, p2), main_axis) > 0) {
                    Beam.ctx.lineTo(...v.sub(position, other_axes[1 - i]));
                    Beam.ctx.lineTo(...overlapping_point);
                } else {
                    // If the overlapping point is inside the vertices[1]
                    const alt_overlapping_point = v.line_intersection(p1, other_axes[i], p2, other_axes[1 - i]);
                    Beam.ctx.lineTo(...alt_overlapping_point);
                }
            } else {
                Beam.ctx.lineTo(...v.sub(position, other_axes[1 - i]));
                Beam.ctx.lineTo(...v.sub(v.sub(this.vertices[0].position, main_axis), other_axes[1 - i]));
            }
            Beam.ctx.lineTo(...v.sub(this.vertices[0].position, main_axis));
            Beam.ctx.lineTo(...this.vertices[1].position);
            Beam.ctx.closePath();
            Beam.ctx.fill();

            // Draw outline to prevent cracks
            Beam.ctx.save();
            Beam.ctx.strokeStyle = Beam.fill_styles[other_axes_index[i] - 1];
            Beam.ctx.lineWidth = Beam.seal_cracks_line_width;
            Beam.ctx.stroke();
            Beam.ctx.restore();
        }
        if (this.preview) Beam.ctx.globalAlpha = 1;
    }

    draw_hovered() {
        if (!this.show) return;
        Beam.ctx.fillStyle = Beam.hovered_style;
        const main_axis = Beam.axes[this.direction - 1];
        const other_axes = Beam.axes.filter((_, i) => i !== this.direction - 1);
        Beam.ctx.beginPath();
        let position = v.sub(v.sub(this.vertices[0].position, main_axis), other_axes[1]);
        Beam.ctx.moveTo(...position);
        position = v.sub(position, other_axes[0]);
        Beam.ctx.lineTo(...position);
        position = v.add(position, other_axes[1]);
        Beam.ctx.lineTo(...position);
        Beam.ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[0]));
        Beam.ctx.lineTo(...this.vertices[1].position);
        Beam.ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[1]));
        Beam.ctx.closePath();
        Beam.ctx.fill();
    }

    draw_selected() {
        if (!this.show) return;
        Beam.ctx.fillStyle = Beam.selected_style;
        const main_axis = Beam.axes[this.direction - 1];
        const other_axes = Beam.axes.filter((_, i) => i !== this.direction - 1);
        Beam.ctx.beginPath();
        let position = v.sub(v.sub(this.vertices[0].position, main_axis), other_axes[1]);
        Beam.ctx.moveTo(...position);
        position = v.sub(position, other_axes[0]);
        Beam.ctx.lineTo(...position);
        position = v.add(position, other_axes[1]);
        Beam.ctx.lineTo(...position);
        Beam.ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[0]));
        Beam.ctx.lineTo(...this.vertices[1].position);
        Beam.ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[1]));
        Beam.ctx.closePath();
        Beam.ctx.fill();
    }
}

class Axis {
    static ctx;
    static axes;
    static preview_alpha;
    static stroke_style;
    static line_width;

    constructor(vertex, direction, { preview=false, show=true, name="" } = {}) {
        this.vertex = vertex;
        this.direction = direction;
        this.preview = preview;
        this.show = show;
    }

    draw() {
        if (this.direction === 0 || !this.show) return;
        const vec_to_center = v.scale(v.add(v.add(Vertex.axes[0], Vertex.axes[1]), Vertex.axes[2]), 0.5);
        let position = v.sub(this.vertex.position, vec_to_center);
        const unit_axis = this.direction > 0 ? v.unit(Axis.axes[this.direction - 1]) : v.scale(v.unit(Axis.axes[-this.direction - 1]), -1);
        position = v.add(position, v.scale(unit_axis, 200));

        Axis.ctx.strokeStyle = Axis.stroke_style;
        Axis.ctx.beginPath();
        Axis.ctx.moveTo(...position);
        position = v.add(position, v.scale(unit_axis, 100));
        Axis.ctx.lineTo(...position);
        Axis.ctx.lineTo(...v.add(position, v.rotate(v.scale(unit_axis, 30), 150)));
        Axis.ctx.lineTo(...position);
        Axis.ctx.lineTo(...v.add(position, v.rotate(v.scale(unit_axis, 30), -150)));
        Axis.ctx.save();
        if (this.preview) Axis.ctx.globalAlpha = Axis.preview_alpha;
        Axis.ctx.lineWidth = Axis.line_width;
        Axis.ctx.stroke();
        Axis.ctx.restore();
    }
}

