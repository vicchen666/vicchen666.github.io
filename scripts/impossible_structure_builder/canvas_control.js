let c;
const TAU = Math.PI * 2;
const canvas = $("#main-canvas canvas")[0];
const ctx = canvas.getContext("2d");
{
    class CanvasControl extends CanvasControlBase {
        constructor(options = {animate: false}) {
            super(options);
            // this.axes = [[0, 1], [Math.cos(TAU * 7/12)*.5, Math.sin(TAU * 7/12)*.5], [Math.cos(TAU * 12/12), Math.sin(TAU * 12/12)]];
            // this.axes = [[0, 1], [Math.cos(TAU * 5/8)*.5, Math.sin(TAU * 5/8)*.5], [Math.cos(TAU * 12/12), Math.sin(TAU * 12/12)]];
            this.axes = [[0, 1], [Math.cos(TAU * 7/12), Math.sin(TAU * 7/12)], [Math.cos(TAU * 11/12), Math.sin(TAU * 11/12)]];
            this.axes = this.axes.map(axis => vec_scale(axis, 20));
            this.outline_style = "yellow";
            this.vertex_fill_styles = ["white", "gray", "black"];
            this.beams_fill_styles = ["white", "gray", "black"];
            this.setup_listeners();
            this.set_canvas(true);
            this.draw();
        }

        render_frame() {
            ctx.clearRect(...vec_scale(this.origin, 1 / this.size), canvas.width / this.size, -canvas.height / this.size);
            this.seal_cracks_line_width = 1 / this.size;
            // this.draw_beams();
            this.display_all_possibilities();
            this.display_penrose_triangle();
        }

        display_all_possibilities() {
            let centers_vertices = [];
            for (let i=0; i<8; i++) {
                for (let j=0; j<8; j++) {
                    centers_vertices.push(new Vertex(vec_add(vec_scale([0, 1], i * 500), vec_scale([1, 0], j * 500)), this.axes));
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
                    const v = new Vertex(vec_add(centers_vertices[i].position, vec_scale(this.axes[(beam - 1) % 3], beam > 3 ? -10 : 10)), this.axes);
                    v.beams.add(beam < 4 ? -beam : beam - 3);
                    centers_vertices[i].beams.add(-v.beams.values().next().value);
                    const b = new Beam(beam < 4 ? [v, centers_vertices[i]] : [centers_vertices[i], v], this.axes, (beam - 1) % 3 + 1);
                    beams.push(b);
                    vertices.push(v);
                });
            }
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2 / this.size;

            // centers_vertices.forEach(v => v.draw_outline(this.outline_style));
            // vertices.forEach(v => v.draw_outline(this.outline_style));
            centers_vertices.forEach(vertex => vertex.fill(this.vertex_fill_styles, this.seal_cracks_line_width));
            vertices.forEach(vertex => vertex.fill(this.vertex_fill_styles, this.seal_cracks_line_width));
            // beams.forEach(b => b.draw_outline(this.outline_style));
            beams.forEach(b => b.fill(this.vertex_fill_styles, this.seal_cracks_line_width));
        }

        display_penrose_triangle() {
            let vertices = [];
            let beams = [];
            vertices.push(new Vertex([-300, 0], this.axes));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[0], 5)), this.axes));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[1], -5)), this.axes));

            vertices[0].beams.add(1).add(-2);
            vertices[1].beams.add(-1).add(3);
            vertices[2].beams.add(2).add(-3);

            beams.push(new Beam([vertices[1], vertices[0]], this.axes, 1));
            beams.push(new Beam([vertices[0], vertices[2]], this.axes, 2));
            beams.push(new Beam([vertices[2], vertices[1]], this.axes, 3));

            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2 / this.size;

            // vertices.forEach(v => v.draw_outline(this.outline_style));
            // beams.forEach(b => b.draw_outline(this.outline_style));
            vertices.forEach(v => v.fill(this.vertex_fill_styles, this.seal_cracks_line_width));
            beams.forEach(b => b.fill(this.beams_fill_styles, this.seal_cracks_line_width));
        }

        draw_beams() {
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2 / this.size;

            // create v0 as center, v1 to v6 as the vertices around v0, and b1 as the beam from v0 to v1. The beams from v0 to v2, v3, v4, v5, v6 can be drawn by rotating b1 by 60, 120, 180, 240, 300 degrees respectively
            // use for toggle 6 beams
            let vertices = [];
            let beams = [];
            vertices.push(new Vertex([0, 0], this.axes));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[0], 10)), this.axes));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[1], 3)), this.axes));
            vertices.push(new Vertex(vec_add(vertices[2].position, vec_scale(this.axes[0], 10)), this.axes));

            beams.push(new Beam([vertices[1], vertices[0]], this.axes, 1));
            beams.push(new Beam([vertices[2], vertices[0]], this.axes, 2));
            beams.push(new Beam([vertices[3], vertices[2]], this.axes, 1));

            vertices[0].beams.add(1).add(2);
            vertices[1].beams.add(-1);
            vertices[2].beams.add(1).add(-2);
            vertices[3].beams.add(-1);

            vertices.forEach(vertex => vertex.draw_outline(outline_color));
            // vertices.forEach(vertex => vertex.fill(fill_styles));
            beams.forEach(beam => beam.draw_outline(outline_color));
        }
    }

    class Vertex {
        constructor(position, axes) {
            this.position = position;
            this.axes = axes;
            this.beams = new Set();
            this.edges = new Set();
        }

        draw_outline(stroke_style) {
            const add_edges_1 = () => {
                this.beams.forEach(main_beam => {
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
                this.beams.forEach(main_beam => {
                    const main_axis = Math.abs(main_beam);
                    const other_axes = [1, 2, 3].filter(axis => axis !== main_axis);
                    if (main_beam > 0) {
                        this.beams.forEach(secondary_beam => {
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
                        this.beams.forEach(secondary_beam => {
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
                this.beams.forEach(main_beam => {
                    const main_axis = Math.abs(main_beam);
                    const other_axes = [1, 2, 3].filter(axis => axis !== Math.abs(main_beam));
                    if (main_beam > 0) {
                        this.beams.forEach(secondary_beam => {
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

            ctx.strokeStyle = stroke_style;
            ctx.beginPath();
            this.edges.forEach(edgeKey => {
                const edge = edgeKey.split(",").map(Number);
                let position = this.position;
                for (let i=0; i<edge.length-1; i++) {
                    	position = vec_sub(position, this.axes[edge[i] - 1]);
                }
                ctx.moveTo(...position);
                	const line_end = vec_sub(position, this.axes[edge[edge.length - 1] - 1]);
                ctx.lineTo(...line_end);
            });
            ctx.closePath();
            ctx.stroke();
        }

        fill(fill_styles,seal_cracks_line_width) {
            for (let i=0; i<3; i++) {
                if (this.beams.has(i + 1)) continue;
                const main_axis = this.axes[i];
                const other_axes = this.axes.filter((_, j) => j !== i);
                ctx.fillStyle = fill_styles[i];
                ctx.beginPath();
                let position = this.position;
                ctx.moveTo(...position);
                position = vec_sub(position, other_axes[0]);
                ctx.lineTo(...position);
                position = vec_sub(position, other_axes[1]);
                ctx.lineTo(...position);
                position = vec_add(position, other_axes[0]);
                ctx.lineTo(...position);
                position = vec_add(position, other_axes[1]);
                ctx.lineTo(...position);
                ctx.closePath();
                ctx.fill();

                // Draw outline to prevent cracks
                ctx.save();
                ctx.strokeStyle = fill_styles[i];
                ctx.lineWidth = seal_cracks_line_width;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    class Beam {
        constructor(vertices, axes, direction) {
            this.vertices = vertices;
            this.axes = axes;
            this.direction = direction;
        }

        draw_outline(stroke_style) {
            const main_axis = this.axes[this.direction - 1];
            const other_axes = this.axes.filter((_, i) => i !== this.direction - 1);
            let starts = [];
            starts[0] = this.vertices[0].position;
            starts[0] = vec_sub(starts[0], main_axis);
            starts[1] = vec_sub(starts[0], main_axis);
            starts[2] = vec_sub(starts[1], other_axes[1]);
            starts[1] = vec_sub(starts[1], other_axes[0]);


            let ends = [];
            ends[0] = this.vertices[1].position;
            ends[1] = vec_sub(ends[0], other_axes[0]);
            ends[2] = vec_sub(ends[0], other_axes[1]);

            ctx.strokeStyle = stroke_style;
            for (let i=0; i<3; i++) {
                ctx.beginPath();
                ctx.moveTo(...starts[i]);
                ctx.lineTo(...ends[i]);
                ctx.closePath();
                ctx.stroke();
            }
        }

        fill(fill_styles, seal_cracks_line_width) {
            const main_axis = this.axes[this.direction - 1];
            const other_axes_index = [1, 2, 3].filter(axis => axis !== this.direction);
            const other_axes = other_axes_index.map(i => this.axes[i - 1]);
            for (let i=0; i<2; i++) {
                ctx.fillStyle = fill_styles[other_axes_index[i] - 1];
                ctx.beginPath();
                let position = this.vertices[1].position;
                ctx.moveTo(...position);
                position = vec_sub(position, other_axes[1 - i]);
                ctx.lineTo(...position);
                if (this.vertices[0].beams.has(other_axes_index[i])) {
                    const v1_start = vec_sub(this.vertices[0].position, main_axis);
                    const v2_start = vec_sub(v1_start, other_axes[1 - i]);
                    const overlapping_point = vec_add(v1_start, vec_scale(other_axes[i], lineq2(other_axes[i], main_axis, vec_sub(v2_start, v1_start))[0]));
                    ctx.lineTo(...overlapping_point);
                } else {
                    ctx.lineTo(...vec_sub(vec_sub(this.vertices[0].position, main_axis), other_axes[1 - i]));
                }
                ctx.lineTo(...vec_sub(this.vertices[0].position, main_axis));
                ctx.lineTo(...this.vertices[1].position);
                ctx.closePath();
                ctx.fill();

                // Draw outline to prevent cracks
                ctx.save();
                ctx.strokeStyle = fill_styles[other_axes_index[i] - 1];
                ctx.lineWidth = seal_cracks_line_width;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    c = new CanvasControl();
}