import $ from "jquery";
import CanvasControlBase from "canvas_control_base";
import * as v from "vectors";
import { reload_element_settings } from "utils";

const TAU = Math.PI * 2;

/**
 * @template K, V
 * @param {Map<K, V>} map
 * @param {(value: V, key: K) => boolean} predicate
 * @returns {Map<K, V>}
 */
function map_filter(map, predicate) {
    return new Map(
        [...map].filter(([key, value]) => predicate(value, key))
    );
}

function map_includes(map, value) {
    return [...map.values()].includes(value);
}

function map_reduce(map, reducer, initial_value) {
    return [...map].reduce((accumulator, [key, value]) => reducer(accumulator, value, key), initial_value);
}

function map_map(map, mapper) {
    return new Map(
        [...map].map(([key, value]) => [key, mapper(value, key)])
    );
}

export default class CanvasControl extends CanvasControlBase {
    constructor(canvas, options={ animate: false }) {
        super(canvas, options);

        // this.axes = [[Math.cos(TAU * 1/6), Math.sin(TAU * 1/6)], [-1, 0], [Math.cos(TAU * 5/6), Math.sin(TAU * 5/6)]]
        this.axes = [[0, 1], [Math.cos(TAU * 7/12)*.5, Math.sin(TAU * 7/12)*.5], [Math.cos(TAU * 12/12), Math.sin(TAU * 12/12)]];
        // this.axes = [[0, 1], [Math.cos(TAU * 5/8)*.5, Math.sin(TAU * 5/8)*.5], [1, 0]];
        // this.axes = [[0, 1], [Math.cos(TAU * 7/12), Math.sin(TAU * 7/12)], [Math.cos(TAU * 11/12), Math.sin(TAU * 11/12)]];
        this.axes = this.axes.map(axis => v.scale(axis, 100));

        this.vertices = new Map();
        this.beams = new Map();
        this.render_order = [];
        this.next_name = { vertex: 1, beam: 1 };
        this.preview_elements = { vertices: [], beams: [], axes: [] };
    }

    set_axes(axes) {
        this.axes = axes;
        this.settings.hover_dist.vertex = Math.max(...this.axes.map(axis => v.len(axis))) * 2 ** .5;
        this.settings.hover_dist.beam = Math.max(...this.axes.map(axis => v.len(axis)));
    }

    activate() {
        this.setup_listeners();
        this.set_canvas(true);
        this.draw();
    }

    settings = {
        vertex_connect_length_threshold: 1e-5,
        hover_dist: { vertex: 0, beam: 0 },
        vertex_hover_dist: 0,
        beam_hover_dist: 0,
        preview_alpha: 0.5,
        axis_style: "white",
        axis_width: 5,
        hovered_style: "#add8e680",
        selected_style: "#ade6b5cc",
        outline_style: "yellow",
        fill_styles: { vertex: ["white", "gray", "black"], beam: ["white", "gray", "black"] },
        seal_cracks_line_width: 1,
    };

    tool_preview = {
        "select": {
            "select_element": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
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

                this.beams.forEach((beam, id) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > this.settings.hover_dist.beam) return;
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
                this.preview_elements.vertices.push(this.create_vertex(canvas_point, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "add-vertex-beam": {
            "select_beam": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.beams.forEach((beam, id) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > this.settings.hover_dist.beam) return;
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

                const beam = this.beams.get(this.selected_elements.selected[0]);
                const point = v.point_to_seg_point(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                let vertex;
                if (point === beam.vertices[0].position || point === beam.vertices[1].position) {
                    vertex = this.create_vertex(v.scale(v.add(beam.vertices[0].position, beam.vertices[1].position), 0.5), { preview: true });
                } else {
                    vertex = this.create_vertex(point, { preview: true });
                }

                this.preview_elements.vertices.push(vertex);
                this.preview_elements.beams.push(this.create_beam([beam.vertices[0], vertex], beam.direction, { preview: true }));
                this.preview_elements.beams.push(this.create_beam([beam.vertices[1], vertex], beam.direction, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "extend-beam-vertex": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
                    if (dist > nearest_dist) return;
                    if (vertex.beams.size === 6) return;

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

                const vertex = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 1]);
                const unit_axes = map_filter(this.generate_axis_map(true), (_, key) => !vertex.beams.has(key));

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = map_map(unit_axes, axis_vec => v.dot(axis_vec, v.sub(canvas_point, vertex.position)));
                const nearest_axis = map_reduce(dot_prods,
                    (best, value, key) => value > best.value ? { key, value } : best,
                    { key: null, value: -Infinity }
                );
                if (dot_prods.get(nearest_axis.key) < 0) {
                    this.render_frame();
                    return;
                };

                const projected_direction = v.scale(unit_axes.get(nearest_axis.key), dot_prods.get(nearest_axis.key));
                const new_vertex = this.create_vertex(v.add(vertex.position, projected_direction), { preview: true });
                this.preview_elements.vertices.push(new_vertex);
                this.preview_elements.beams.push(this.create_beam([vertex, new_vertex], Math.abs(nearest_axis.key), { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "extend-beam-length": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
                    if (dist > nearest_dist) return;
                    if (vertex.beams.size === 6) return;

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
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
                    if (dist > nearest_dist) return;
                    if (vertex.beams.size === 6) return;

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

                const vertex1 = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 1]);
                let nearest_id = -1;
                let nearest_dist = Infinity;
                let nearest_direction = 0;
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;
                    if (vertex.beams.size === 6) return;
                    const directions = map_filter(
                        this.generate_axis_map(true),
                        (_, key) => !vertex1.beams.has(key) && !vertex.beams.has(-key)
                    );
                    const direction = map_reduce(directions,
                        (best, axis_vec, key) => {
                            const dist = v.point_to_line_dist(vertex1.position, vertex.position, axis_vec);
                            if (v.dot(v.sub(vertex.position, vertex1.position), axis_vec) < 0) return best;
                            return dist < best.dist ? { key, dist } : best;
                        },
                        { key: null, dist: Infinity }
                    );
                    if (direction.dist > this.settings.vertex_connect_length_threshold) return;

                    nearest_id = id;
                    nearest_dist = dist;
                    nearest_direction = direction.key;
                });

                if (nearest_id !== -1) {
                    this.selected_elements.hovered = nearest_id;
                    this.preview_elements.beams.push(this.create_beam([this.vertices.get(this.selected_elements.selected[0]), this.vertices.get(nearest_id)], Math.abs(nearest_direction), { preview: true }));
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
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
                    if (dist > nearest_dist) return;
                    if (vertex.beams.size === 6) return;

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

                const vertex = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 1]);
                const unit_axes = map_filter(this.generate_axis_map(true), (_, key) => !vertex.beams.has(key));

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = map_map(unit_axes, axis_vec => v.dot(axis_vec, v.sub(canvas_point, vertex.position)));
                const nearest_axis = map_reduce(dot_prods,
                    (best, value, key) => value > best.value ? { key, value } : best,
                    { key: null, value: -Infinity }
                );
                if (dot_prods.get(nearest_axis.key) < 0) {
                    this.render_frame();
                    return;
                };

                this.preview_elements.axes.push(this.create_axis(vertex, nearest_axis.key, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
            "select_vertex_2": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const vertex1 = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 1]);
                const direction1 = this.preview_elements.axes[0].direction;
                const direction1_vec = this.generate_axis_map().get(direction1);
                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;
                    if (vertex.beams.size === 6) return;
                    // Return if the axis of vertex 1 doesn't intersect with all the axis of the vertex
                    const intersecting_axes = map_filter(this.generate_axis_map(true), (axis, key) => {
                        if (vertex.beams.has(key)) return false;
                        if (Math.abs(key) === Math.abs(direction1)) return false;
                        const intersection = v.ray_intersection(vertex1.position, direction1_vec, vertex.position, axis);
                        if (intersection === null) return false;
                        if (v.len(v.sub(vertex.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                        if (v.len(v.sub(vertex1.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                        return true;
                    });
                    if (intersecting_axes.size === 0) return;

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

                const vertex1 = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 2]);
                const vertex2 = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 1]);
                const direction1 = this.preview_elements.axes[0].direction;
                const direction1_vec = this.generate_axis_map().get(direction1);
                const unit_axes = map_filter(this.generate_axis_map(true), (axis_vec, key) => {
                    if (vertex2.beams.has(key)) return false;
                    if (Math.abs(key) === Math.abs(direction1)) return false;
                    const intersection = v.ray_intersection(vertex1.position, direction1_vec, vertex2.position, axis_vec);
                    if (intersection === null) return false;
                    if (v.len(v.sub(vertex2.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                    if (v.len(v.sub(vertex1.position, intersection)) < this.settings.vertex_connect_length_threshold) return false;
                    return true;
                });

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = map_map(unit_axes, axis_vec => v.dot(axis_vec, v.sub(canvas_point, vertex2.position)));
                const nearest_axis = map_reduce(dot_prods,
                    (best, value, key) => value > best.value ? { key, value } : best,
                    { key: null, value: -Infinity }
                );
                if (dot_prods.get(nearest_axis.key) < 0) {
                    this.render_frame();
                    return;
                };

                this.preview_elements.axes[0].show = false;
                const new_vertex = this.create_vertex(v.ray_intersection(vertex1.position, direction1_vec, vertex2.position, unit_axes.get(nearest_axis.key)), { preview: true });
                this.preview_elements.vertices.push(new_vertex);
                this.preview_elements.beams.push(this.create_beam([vertex1, new_vertex], Math.abs(direction1), { preview: true }));
                this.preview_elements.beams.push(this.create_beam([vertex2, new_vertex], Math.abs(nearest_axis.key), { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "connect-vertex-beam":{
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
                    if (dist > nearest_dist) return;
                    if (vertex.beams.size === 6) return;

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

                const vertex = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 1]);
                const unit_axes = map_filter(this.generate_axis_map(true), (_, key) => !vertex.beams.has(key));

                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = map_map(unit_axes, axis_vec => v.dot(axis_vec, v.sub(canvas_point, vertex.position)));
                const nearest_axis = map_reduce(dot_prods,
                    (best, value, key) => value > best.value ? { key, value } : best,
                    { key: null, value: -Infinity }
                );
                if (dot_prods.get(nearest_axis.key) < 0) {
                    this.render_frame();
                    return;
                };

                this.preview_elements.axes.push(this.create_axis(vertex, nearest_axis.key, { preview: true }));
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
                if (this.beams.has(this.selected_elements.hovered)) {
                    this.beams.get(this.selected_elements.hovered).show = true;
                    this.beams.get(this.selected_elements.hovered).assign_vertices();
                }
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const vertex1 = this.vertices.get(this.selected_elements.selected[this.selected_elements.selected.length - 1]);
                const direction1 = this.preview_elements.axes[0].direction;
                const direction1_vec = this.generate_axis_map().get(direction1);
                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.beams.forEach((beam, id) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > this.settings.hover_dist.beam) return;
                    if (dist > nearest_dist) return;
                    if (map_includes(vertex1.beams, beam)) return;
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
                this.beams.get(nearest_id).show = false;
                this.beams.get(nearest_id).destroy();
                const vertex2 = this.create_vertex(v.ray_seg_intersection(vertex1.position, direction1_vec, this.beams.get(nearest_id).vertices[0].position, this.beams.get(nearest_id).vertices[1].position), { preview: true });
                this.preview_elements.vertices.push(vertex2);
                this.preview_elements.beams.push(this.create_beam([vertex1, vertex2], Math.abs(direction1), { preview: true }));
                this.preview_elements.beams.push(this.create_beam([vertex2, this.beams.get(nearest_id).vertices[0]], this.beams.get(nearest_id).direction, { preview: true }));
                this.preview_elements.beams.push(this.create_beam([vertex2, this.beams.get(nearest_id).vertices[1]], this.beams.get(nearest_id).direction, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame(); 
            },
        },
        "add-beam-intersection": {
            "select_beam": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.beams.forEach((beam, id) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > this.settings.hover_dist.beam) return;
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
                this.beams.get(this.selected_elements.selected[0]).show = true;
                this.beams.get(this.selected_elements.selected[0]).assign_vertices();
                if (this.beams.has(this.selected_elements.hovered)) {
                    this.beams.get(this.selected_elements.hovered).show = true;
                    this.beams.get(this.selected_elements.hovered).assign_vertices();
                }
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                const beam1 = this.beams.get(this.selected_elements.selected[0]);
                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.beams.forEach((beam, id) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > this.settings.hover_dist.beam) return;
                    if (dist > nearest_dist) return;
                    if (this.selected_elements.selected.includes(id)) return;
                    if (beam1.vertices.some(vertex => map_includes(vertex.beams, beam))) return;
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
                this.beams.get(nearest_id).show = false;
                this.beams.get(nearest_id).destroy();
                const vertex = this.create_vertex(v.seg_intersection(beam1.vertices[0].position, beam1.vertices[1].position, this.beams.get(nearest_id).vertices[0].position, this.beams.get(nearest_id).vertices[1].position), { preview: true });
                this.preview_elements.vertices.push(vertex);
                this.preview_elements.beams.push(this.create_beam([vertex, this.beams.get(nearest_id).vertices[0]], this.beams.get(nearest_id).direction, { preview: true }));
                this.preview_elements.beams.push(this.create_beam([vertex, this.beams.get(nearest_id).vertices[1]], this.beams.get(nearest_id).direction, { preview: true }));
                this.preview_elements.beams.push(this.create_beam([vertex, beam1.vertices[0]], beam1.direction, { preview: true }));
                this.preview_elements.beams.push(this.create_beam([vertex, beam1.vertices[1]], beam1.direction, { preview: true }));
                this.canvas.style.cursor = "pointer";
                this.render_frame();
            },
        },
        "delete-vertex": {
            "select_vertex": e => {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
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
                this.vertices.forEach((vertex, id) => {
                    const dist = v.len(v.sub(vertex.position, canvas_point));
                    if (dist > this.settings.hover_dist.vertex) return;
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
                this.beams.forEach((beam, id) => {
                    const dist = v.point_to_seg_dist(canvas_point, beam.vertices[0].position, beam.vertices[1].position);
                    if (dist > this.settings.hover_dist.beam) return;
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
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.lineWidth = 2 / this.size;

        this.render_order.forEach(key => {
            const element = this.beams.get(key) || this.vertices.get(key);
            element?.fill();
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
                        this.beams.get(this.selected_elements.selected[0]).show = false;
                        this.beams.get(this.selected_elements.selected[0]).destroy();

                        this.tool_status.status = "add_vertex";
                        break;
                    case "add_vertex":
                        if (this.preview_elements.vertices.length !== 1) return;

                        this.remove_element(this.beams.get(this.selected_elements.selected[0]));
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

                        this.remove_element(this.beams.get(this.selected_elements.hovered));
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

                        this.remove_element(this.beams.get(this.selected_elements.selected[0]));
                        this.remove_element(this.beams.get(this.selected_elements.hovered));
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

                this.vertices.get(this.selected_elements.hovered).beams.forEach(beam => {
                    this.remove_element(this.beams.get(beam.id));
                });
                this.remove_element(this.vertices.get(this.selected_elements.hovered));
                this.selected_elements.hovered = -1;
                break;
            case "dissolve-vertex":
                if (e.which !== 1) return;
                if (this.selected_elements.hovered === -1) return;

                this.vertices.get(this.selected_elements.hovered).beams.forEach((beam, dir) => {
                    if (!this.beams.has(beam.id)) return;
                    this.remove_element(this.beams.get(beam.id));
                    const same_axis_beam = this.vertices.get(this.selected_elements.hovered).beams.get(-dir);
                    if (same_axis_beam) {
                        this.remove_element(this.beams.get(same_axis_beam.id));
                        const hovered_vertex = this.vertices.get(this.selected_elements.hovered);
                        const vertex1 = beam.vertices[0] === hovered_vertex ? beam.vertices[1] : beam.vertices[0];
                        const vertex2 = same_axis_beam.vertices[0] === hovered_vertex ? same_axis_beam.vertices[1] : same_axis_beam.vertices[0];
                        this.register_preview(this.create_beam([vertex1, vertex2], Math.abs(Number(dir))));
                    }
                });
                this.remove_element(this.vertices.get(this.selected_elements.hovered));
                this.selected_elements.hovered = -1;
                break;
            case "delete-beam":
                if (e.which !== 1) return;
                if (this.selected_elements.hovered === -1) return;
                
                this.remove_element(this.beams.get(this.selected_elements.hovered));
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
            this.vertices.set(this.next_id, element);
        } else if (element instanceof Beam) {
            element.name = `Beam ${this.next_name.beam++}`;
            this.beams.set(this.next_id, element);
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
            this.vertices.delete(element.id);
        } else if (element instanceof Beam) {
            element.destroy();
            this.beams.delete(element.id);
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
            const id = $(button).data("id");
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
                centers_vertices.push(this.create_vertex(v.add(v.scale([0, 1], i * 500), v.scale([1, 0], j * 500))));
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
                const v = this.create_vertex(v.add(centers_vertices[i].position, v.scale(this.axes[(beam - 1) % 3], beam > 3 ? -10 : 10)));
                const b = this.create_beam(beam < 4 ? [v, centers_vertices[i]] : [centers_vertices[i], v], (beam - 1) % 3 + 1);
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
        vertices.push(this.create_vertex([-300, 0]));
        vertices.push(this.create_vertex(v.add(vertices[0].position, v.scale(this.axes[0], 5))));
        vertices.push(this.create_vertex(v.add(vertices[0].position, v.scale(this.axes[1], -5))));

        beams.push(this.create_beam([vertices[1], vertices[0]], 1));
        beams.push(this.create_beam([vertices[0], vertices[2]], 2));
        beams.push(this.create_beam([vertices[2], vertices[1]], 3));

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

        vertices.push(this.create_vertex([0, 0]));
        vertices.push(this.create_vertex(v.add(vertices[0].position, v.scale(this.axes[0], 10))));
        vertices.push(this.create_vertex(v.add(vertices[0].position, v.scale(this.axes[1], 10))));
        vertices.push(this.create_vertex(v.add(vertices[0].position, v.scale(this.axes[2], 10))));
        vertices.push(this.create_vertex(v.add(vertices[1].position, v.scale(this.axes[1], 10))));
        vertices.push(this.create_vertex(v.add(vertices[2].position, v.scale(this.axes[2], 10))));
        vertices.push(this.create_vertex(v.add(vertices[3].position, v.scale(this.axes[0], 10))));
        vertices.push(this.create_vertex(v.add(vertices[4].position, v.scale(this.axes[2], 10))));

        beams.push(this.create_beam([vertices[4], vertices[1]], 2));
        beams.push(this.create_beam([vertices[6], vertices[1]], 3));
        beams.push(this.create_beam([vertices[5], vertices[2]], 3));
        beams.push(this.create_beam([vertices[4], vertices[2]], 1));
        beams.push(this.create_beam([vertices[6], vertices[3]], 1));
        beams.push(this.create_beam([vertices[5], vertices[3]], 2));
        beams.push(this.create_beam([vertices[7], vertices[4]], 3));
        beams.push(this.create_beam([vertices[7], vertices[5]], 1));
        beams.push(this.create_beam([vertices[7], vertices[6]], 2));
        beams.push(this.create_beam([vertices[1], vertices[0]], 1));
        beams.push(this.create_beam([vertices[2], vertices[0]], 2));
        beams.push(this.create_beam([vertices[3], vertices[0]], 3));

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
        let vertices = [this.create_vertex([0, 0])];
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
                    vertices.push(this.create_vertex(v.add(vertices[bottomLeft].position, v.scale(this.axes[0], 10))));
                }
                let top = vertexCount++;
                vertices.push(this.create_vertex(v.add(vertices[bottomLeft].position, v.scale(this.axes[1], -10))));

                // Generate beams
                beams.push(this.create_beam([vertices[bottomLeft], vertices[bottomRight]], 1));
                beams.push(this.create_beam([vertices[bottomLeft], vertices[top]], 2));
                beams.push(this.create_beam([vertices[bottomRight], vertices[top]], 3));

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


    display_init_vertex(hovered_axis=-1) {
        const vertex = this.create_vertex([0, 0]);
        this.vertices.set(0, vertex);
        this.render_order.push(0);

        const vec_to_center = v.scale(v.add(v.add(this.axes[0], this.axes[1]), this.axes[2]), 0.5);
        const length = this.axes.reduce((max, axis) => Math.max(max, v.len(v.sub(axis, vec_to_center))), 0);
        let tips = [];
        this.axes.forEach((axis, index) => {
            const unit_axis = v.unit(axis);
            let position = v.sub(vertex.position, vec_to_center);
            position = v.add(position, v.scale(unit_axis, length * 1.5));
            position = v.add(position, v.scale(unit_axis, v.len(axis)));
            tips.push(position);
        });

        const min_x = Math.min(...tips.map(tip => tip[0]));
        const max_x = Math.max(...tips.map(tip => tip[0]));
        const min_y = Math.min(...tips.map(tip => tip[1]));
        const max_y = Math.max(...tips.map(tip => tip[1]));

        const side_length = Math.max(max_x - min_x, max_y - min_y);
        this.origin = [min_x, max_y];
        this.size = this.canvas.clientHeight / side_length;
        this.set_canvas();

        const settings = this.settings;
        const ctx = this.ctx;
        ctx.lineWidth = settings.axis_width / this.size;

        this.axes.forEach((axis, index) => {
            ctx.strokeStyle = settings.axis_style;
            if (hovered_axis === index + 1) ctx.strokeStyle = settings.selected_style;

            const unit_axis = v.unit(axis);
            let position = v.sub(vertex.position, vec_to_center);
            position = v.add(position, v.scale(unit_axis, length * 1.5));
            ctx.beginPath();
            ctx.moveTo(...position);
            position = v.add(position, v.scale(unit_axis, v.len(axis)));
            ctx.lineTo(...position);
            ctx.lineTo(...v.add(position, v.rotate(v.scale(unit_axis, length / 3), 150)));
            ctx.lineTo(...position);
            ctx.lineTo(...v.add(position, v.rotate(v.scale(unit_axis, length / 3), -150)));
            ctx.stroke();
        });
    }

    display_init_penrose_triangle() {

    }

    draw_tools() {
        this.beams.forEach((beam, id) => {
            if (id === this.selected_elements.hovered) {
                beam.draw_hovered();
            } else if (this.selected_elements.selected.includes(id)) {
                beam.draw_selected();
            }
        });
        this.vertices.forEach((vertex, id) => {
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

    generate_axis_map(unit=false) {
        return new Map([
            [1, unit ? v.unit(this.axes[0]) : this.axes[0]],
            [2, unit ? v.unit(this.axes[1]) : this.axes[1]],
            [3, unit ? v.unit(this.axes[2]) : this.axes[2]],
            [-1, unit ? v.scale(v.unit(this.axes[0]), -1) : v.scale(this.axes[0], -1)],
            [-2, unit ? v.scale(v.unit(this.axes[1]), -1) : v.scale(this.axes[1], -1)],
            [-3, unit ? v.scale(v.unit(this.axes[2]), -1) : v.scale(this.axes[2], -1)],
        ]);
    }

    create_vertex(position, { id=0, preview=false, show=true, name="" } = {}) {
        return new Vertex(this, position, { id, preview, show, name });
    }

    create_beam(vertices, direction, { id=0, preview=false, show=true, name="" } = {}) {
        return new Beam(this, vertices, direction, { id, preview, show, name });
    }

    create_axis(vertex, direction, { preview=false, show=true } = {}) {
        return new Axis(this, vertex, direction, { preview, show });
    }
}

class Vertex {
    constructor(canvas_control, position, { id=0, preview=false, show=true, name="" } = {}) {
        this.c = canvas_control;
        this.position = position;
        this.id = id;
        this.beams = new Map();
        this.edges = new Set();
        this.preview = preview;
        this.show = show;
        this.name = name;
    }

    draw_outline() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        const add_edges_1 = () => {
            this.beams.forEach((_, main_beam) => {
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
            this.beams.forEach((_, main_beam) => {
                main_beam = Number(main_beam);
                const main_axis = Math.abs(main_beam);
                const other_axes = [1, 2, 3].filter(axis => axis !== main_axis);
                if (main_beam > 0) {
                    this.beams.forEach((_, secondary_beam) => {
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
                    this.beams.forEach((_, secondary_beam) => {
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
            this.beams.forEach((_, main_beam) => {
                main_beam = Number(main_beam);
                const main_axis = Math.abs(main_beam);
                const other_axes = [1, 2, 3].filter(axis => axis !== Math.abs(main_beam));
                if (main_beam > 0) {
                    this.beams.forEach((_, secondary_beam) => {
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

        ctx.strokeStyle = settings.outline_style;
        ctx.beginPath();
        this.edges.forEach(edgeKey => {
            const edge = edgeKey.split(",").map(Number);
            let position = this.position;
            for (let i=0; i<edge.length-1; i++) {
                    position = v.sub(position, c.axes[edge[i] - 1]);
            }
            ctx.moveTo(...position);
                const line_end = v.sub(position, c.axes[edge[edge.length - 1] - 1]);
            ctx.lineTo(...line_end);
        });
        ctx.closePath();
        ctx.stroke();
    }

    fill() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        if (this.preview) ctx.globalAlpha = settings.preview_alpha;
        for (let i=0; i<3; i++) {
            if (this.beams.has(i + 1)) continue;
            const main_axis = c.axes[i];
            const other_axes = c.axes.filter((_, j) => j !== i);
            ctx.fillStyle = settings.fill_styles.vertex[i];
            ctx.beginPath();
            let position = this.position;
            ctx.moveTo(...position);
            position = v.sub(position, other_axes[0]);
            ctx.lineTo(...position);
            position = v.sub(position, other_axes[1]);
            ctx.lineTo(...position);
            position = v.add(position, other_axes[0]);
            ctx.lineTo(...position);
            position = v.add(position, other_axes[1]);
            ctx.lineTo(...position);
            ctx.closePath();
            ctx.fill();

            // Draw outline to prevent cracks
            ctx.save();
            ctx.strokeStyle = settings.fill_styles.vertex[i];
            ctx.lineWidth = settings.seal_cracks_line_width / c.size;
            ctx.stroke();
            ctx.restore();
        }
        if (this.preview) ctx.globalAlpha = 1;
    }

    draw_hovered() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        ctx.fillStyle = settings.hovered_style;
        ctx.beginPath();
        let position = v.sub(this.position, c.axes[0]);
        ctx.moveTo(...position);
        position = v.sub(position, c.axes[1]);
        ctx.lineTo(...position);
        position = v.add(position, c.axes[0]);
        ctx.lineTo(...position);
        position = v.sub(position, c.axes[2]);
        ctx.lineTo(...position);
        position = v.add(position, c.axes[1]);
        ctx.lineTo(...position);
        position = v.sub(position, c.axes[0]);
        ctx.lineTo(...position);
        position = v.add(position, c.axes[2]);
        ctx.closePath();
        ctx.fill();
    }

    draw_selected() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        ctx.fillStyle = settings.selected_style;
        ctx.beginPath();
        let position = v.sub(this.position, c.axes[0]);
        ctx.moveTo(...position);
        position = v.sub(position, c.axes[1]);
        ctx.lineTo(...position);
        position = v.add(position, c.axes[0]);
        ctx.lineTo(...position);
        position = v.sub(position, c.axes[2]);
        ctx.lineTo(...position);
        position = v.add(position, c.axes[1]);
        ctx.lineTo(...position);
        position = v.sub(position, c.axes[0]);
        ctx.lineTo(...position);
        position = v.add(position, c.axes[2]);
        ctx.closePath();
        ctx.fill();
    }
}

class Beam {
    constructor(canvas_control, vertices, direction, { id=0, preview=false, show=true, name="" } = {}) {
        this.c = canvas_control;
        this.vertices = vertices;
        this.direction = direction;
        this.id = id;
        this.preview = preview;
        this.show = show;
        this.name = name;
        if (v.dot(v.sub(this.vertices[0].position, this.vertices[1].position), this.c.generate_axis_map().get(this.direction)) < 0) this.vertices.reverse();
        this.assign_vertices();
    }

    assign_vertices() {
        this.vertices[0].beams.set(-this.direction, this);
        this.vertices[1].beams.set(this.direction, this);
    }

    destroy() {
        if (this.vertices[0].beams.get(-this.direction) === this) this.vertices[0].beams.delete(-this.direction);
        if (this.vertices[1].beams.get(this.direction) === this) this.vertices[1].beams.delete(this.direction);
    }

    draw_outline() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        const axis_map = c.generate_axis_map();
        const main_axis = axis_map.get(this.direction);
        const other_axes = [1, 2, 3].filter(axis => axis !== this.direction).map(axis => axis_map.get(axis));
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

        ctx.strokeStyle = settings.outline_style;
        for (let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.moveTo(...starts[i]);
            ctx.lineTo(...ends[i]);
            ctx.closePath();
            ctx.stroke();
        }
    }

    fill() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        if (this.preview) ctx.globalAlpha = settings.preview_alpha;
        const axis_map = c.generate_axis_map();
        const main_axis = axis_map.get(this.direction);
        const other_axes_index = [1, 2, 3].filter(axis => axis !== this.direction);
        const other_axes = other_axes_index.map(i => axis_map.get(i));
        for (let i=0; i<2; i++) {
            // Draw the part of the other beams of the vertices[1] that is covered by the beam
            // Continue if the other beam does not exist
            if (!this.vertices[1].beams.has(-other_axes_index[i])) continue;
            // Continue if the other beam is not shown
            if(!this.vertices[1].beams.get(-other_axes_index[i]).show) continue;
            // Continue if the other beam is shorter than the axis of the beam
            if (v.len(v.sub(this.vertices[1].position, this.vertices[1].beams.get(-other_axes_index[i]).vertices[1].position)) < v.len(axis_map.get(other_axes_index[i]))) continue;
            const p1 = v.sub(this.vertices[1].position, other_axes[i]);
            const p2 = v.sub(this.vertices[1].beams.get(-other_axes_index[i]).vertices[1].position, other_axes[1 - i]);
            const overlapping_point = v.line_intersection(p1, main_axis, p2, other_axes[i]);
            ctx.fillStyle = settings.fill_styles.beam[this.direction - 1];
            ctx.save();
            ctx.globalAlpha = this.vertices[1].beams.get(-other_axes_index[i]).preview ? settings.preview_alpha : 1;
            ctx.beginPath();
            ctx.moveTo(...p1);
            ctx.lineTo(...v.sub(p1, other_axes[1 - i]));
            if (v.dot(v.sub(overlapping_point, p2), other_axes[i]) > 0) {
                ctx.lineTo(...overlapping_point);
            } else {
                const alt_overlapping_point = v.line_intersection(p1, main_axis, p2, other_axes[1 - i]);
                ctx.lineTo(...p2)
                ctx.lineTo(...alt_overlapping_point);
            }
            ctx.lineTo(...p1);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        for (let i=0; i<2; i++) {
            // Draw the part of the beam that is not covered by the other beam
            if (v.len(v.sub(this.vertices[0].position, this.vertices[1].position)) < v.len(axis_map.get(this.direction))) continue;
            ctx.fillStyle = settings.fill_styles.beam[other_axes_index[i] - 1];
            ctx.beginPath();
            let position = this.vertices[1].position;
            ctx.moveTo(...position);
            if (this.vertices[0].beams.has(other_axes_index[i])) {
                // If the beam is covered by the other beam of the vertices[0]
                const p1 = v.sub(this.vertices[0].position, main_axis);
                const p2 = v.sub(this.vertices[1].position, other_axes[1 - i]);
                const overlapping_point = v.line_intersection(p1, other_axes[i], p2, main_axis);
                if (v.dot(v.sub(overlapping_point, p2), main_axis) > 0) {
                    ctx.lineTo(...v.sub(position, other_axes[1 - i]));
                    ctx.lineTo(...overlapping_point);
                } else {
                    // If the overlapping point is inside the vertices[1]
                    const alt_overlapping_point = v.line_intersection(p1, other_axes[i], p2, other_axes[1 - i]);
                    ctx.lineTo(...alt_overlapping_point);
                }
            } else {
                ctx.lineTo(...v.sub(position, other_axes[1 - i]));
                ctx.lineTo(...v.sub(v.sub(this.vertices[0].position, main_axis), other_axes[1 - i]));
            }
            ctx.lineTo(...v.sub(this.vertices[0].position, main_axis));
            ctx.lineTo(...this.vertices[1].position);
            ctx.closePath();
            ctx.fill();

            // Draw outline to prevent cracks
            ctx.save();
            ctx.strokeStyle = settings.fill_styles.beam[other_axes_index[i] - 1];
            ctx.lineWidth = settings.seal_cracks_line_width / c.size;
            ctx.stroke();
            ctx.restore();
        }
        if (this.preview) ctx.globalAlpha = 1;
    }

    draw_hovered() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        ctx.fillStyle = settings.hovered_style;
        const main_axis = c.axes[this.direction - 1];
        const other_axes = c.axes.filter((_, i) => i !== this.direction - 1);
        ctx.beginPath();
        let position = v.sub(v.sub(this.vertices[0].position, main_axis), other_axes[1]);
        ctx.moveTo(...position);
        position = v.sub(position, other_axes[0]);
        ctx.lineTo(...position);
        position = v.add(position, other_axes[1]);
        ctx.lineTo(...position);
        ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[0]));
        ctx.lineTo(...this.vertices[1].position);
        ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[1]));
        ctx.closePath();
        ctx.fill();
    }

    draw_selected() {
        if (!this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        ctx.fillStyle = settings.selected_style;
        const main_axis = c.axes[this.direction - 1];
        const other_axes = c.axes.filter((_, i) => i !== this.direction - 1);
        ctx.beginPath();
        let position = v.sub(v.sub(this.vertices[0].position, main_axis), other_axes[1]);
        ctx.moveTo(...position);
        position = v.sub(position, other_axes[0]);
        ctx.lineTo(...position);
        position = v.add(position, other_axes[1]);
        ctx.lineTo(...position);
        ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[0]));
        ctx.lineTo(...this.vertices[1].position);
        ctx.lineTo(...v.sub(this.vertices[1].position, other_axes[1]));
        ctx.closePath();
        ctx.fill();
    }
}

class Axis {
    constructor(canvas_control, vertex, direction, { preview=false, show=true } = {}) {
        this.c = canvas_control;
        this.vertex = vertex;
        this.direction = direction;
        this.preview = preview;
        this.show = show;
    }

    draw() {
        if (this.direction === 0 || !this.show) return;
        const c = this.c;
        const settings = c.settings;
        const ctx = c.ctx;

        const vec_to_center = v.scale(v.add(v.add(c.axes[0], c.axes[1]), c.axes[2]), 0.5);
        const length = c.axes.reduce((max, axis) => Math.max(max, v.len(v.sub(axis, vec_to_center))), 0);
        let position = v.sub(this.vertex.position, vec_to_center);
        const unit_axis = c.generate_axis_map(true).get(this.direction);

        position = v.add(position, v.scale(unit_axis, length * 2));

        ctx.strokeStyle = settings.axis_style;
        ctx.beginPath();
        ctx.moveTo(...position);
        position = v.add(position, v.scale(unit_axis, length));
        ctx.lineTo(...position);
        ctx.lineTo(...v.add(position, v.rotate(v.scale(unit_axis, length / 3), 150)));
        ctx.lineTo(...position);
        ctx.lineTo(...v.add(position, v.rotate(v.scale(unit_axis, length / 3), -150)));
        ctx.save();
        if (this.preview) ctx.globalAlpha = settings.preview_alpha;
        ctx.lineWidth = settings.axis_width / c.size;
        ctx.stroke();
        ctx.restore();
    }
}

