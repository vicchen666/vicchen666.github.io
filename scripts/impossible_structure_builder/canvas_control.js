let c;
const TAU = Math.PI * 2;
const canvas = $("#main-canvas canvas")[0];
const ctx = canvas.getContext("2d");
{
    class CanvasControl extends CanvasControlBase {
        constructor(options = {animate: false}) {
            super(options);
            this.axes = [[0, 1], [Math.cos(TAU * 7/12)*.5, Math.sin(TAU * 7/12)*.5], [Math.cos(TAU * 12/12), Math.sin(TAU * 12/12)]];
            // this.axes = [[0, 1], [Math.cos(TAU * 7/12), Math.sin(TAU * 7/12)], [Math.cos(TAU * 11/12), Math.sin(TAU * 11/12)]];
            this.axes = this.axes.map(axis => vec_scale(axis, 20));
            this.setup_listeners();
            this.set_canvas(true);
            this.draw();
        }

        render_frame() {
            ctx.clearRect(...vec_scale(this.origin, 1 / this.size), canvas.width / this.size, -canvas.height / this.size);
            // this.draw_beams();
            this.display_all_possibilities();
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
            console.log(toggle_beams);
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
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2 / this.size;

            centers_vertices.forEach(v => v.draw());
            vertices.forEach(v => v.draw());
            beams.forEach(b => b.draw());
        }

        draw_beams() {
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2 / this.size;

            // create v0 as center, v1 to v6 as the vertices around v0, and b1 as the beam from v0 to v1. The beams from v0 to v2, v3, v4, v5, v6 can be drawn by rotating b1 by 60, 120, 180, 240, 300 degrees respectively
            // use for toggle 6 beams
            const v0 = new Vertex([0, 0], this.axes);
            const toggle_beams = [1,2,,,5,6];
            let vertices = [v0];
            let beams = [];
            toggle_beams.forEach(beam => {
                const v = new Vertex(vec_add(v0.position, vec_scale(this.axes[(beam - 1) % 3], beam > 3 ? -10 : 10)), this.axes);
                v.beams.add(beam < 4 ? -beam : beam - 3);
                vertices[0].beams.add(-v.beams.values().next().value);
                const b = new Beam(beam < 4 ? [v, v0] : [v0, v], this.axes, (beam - 1) % 3 + 1);
                vertices.push(v);
                beams.push(b);
            });
            // const v1 = new Vertex(vec_add(v0.position, vec_scale(this.axes[0], 10)), this.axes);
            // const v2 = new Vertex(vec_add(v0.position, vec_scale(this.axes[1], 10)), this.axes);
            // const v3 = new Vertex(vec_add(v0.position, vec_scale(this.axes[2], 10)), this.axes);
            // const v4 = new Vertex(vec_add(v0.position, vec_scale(this.axes[0], -10)), this.axes);
            // const v5 = new Vertex(vec_add(v0.position, vec_scale(this.axes[1], -10)), this.axes);
            // const v6 = new Vertex(vec_add(v0.position, vec_scale(this.axes[2], -10)), this.axes);
            // const b1 = new Beam([v0, v1], this.axes, 1);
            // const b2 = new Beam([v0, v2], this.axes, 2);
            // const b3 = new Beam([v0, v3], this.axes, 3);
            // const b4 = new Beam([v0, v4], this.axes, 1);
            // const b5 = new Beam([v0, v5], this.axes, 2);
            // const b6 = new Beam([v0, v6], this.axes, 3);
            // v0.beams.push(1, 2, 3, -1, -2, -3);
            // v1.beams.push(-1);
            // v2.beams.push(-2);
            // v3.beams.push(-3);
            // v4.beams.push(1);
            // v5.beams.push(2);
            // v6.beams.push(3);
            // v0.draw();
            // v1.draw();
            // v2.draw();
            // v3.draw();
            // v4.draw();
            // v5.draw();
            // v6.draw();
            // b1.draw();
            // b2.draw();
            // b3.draw();
            // b4.draw();
            // b5.draw();
            // b6.draw();
            vertices.forEach(vertex => vertex.draw());
            beams.forEach(beam => beam.draw());
        }
    }

    class Vertex {
        constructor(position, axes) {
            this.position = position;
            this.axes = axes
            // this.edges = new Set([[-1], [-2], [-3], [1, 2], [1, -2], [1, 3], [1, -3], [2, 3], [2, -3], [2, 1], [2, -1], [3, 1], [3, -1], [3, 2], [3, -2]]);
            this.beams = new Set();
            this.edges = new Set();
        }

        add_edges_1() {
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

        remove_edges() {
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

        add_edges_2() {
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

        draw() {
            this.add_edges_1();
            this.remove_edges();
            this.add_edges_2();

            ctx.beginPath();
            this.edges.forEach(edgeKey => {
                const edge = edgeKey.split(",").map(Number);
                let position = this.position;
                for (let i=0; i<edge.length-1; i++) {
                    position = vec_add(position, vec_scale(this.axes[edge[i] - 1], -1));
                }
                ctx.moveTo(...position);
                const line_end = vec_add(position, vec_scale(this.axes[edge[edge.length - 1] - 1], -1));
                ctx.lineTo(...line_end);
            });
            ctx.closePath();
            ctx.stroke();
        }
    }

    class Beam {
        constructor(vertices, axes, direction) {
            this.vertices = vertices;
            this.axes = axes;
            this.direction = direction;
        }

        draw() {
            const other_axes = this.axes.filter((_, i) => i !== this.direction - 1);
            const direction = this.axes[this.direction - 1];
            let starts = [];
            starts[0] = this.vertices[0].position;
            starts[0] = vec_add(starts[0], vec_scale(direction, -1));
            starts[1] = vec_add(starts[0], vec_scale(direction, -1));
            starts[2] = vec_add(starts[1], vec_scale(other_axes[1], -1));
            starts[1] = vec_add(starts[1], vec_scale(other_axes[0], -1));


            let ends = [];
            ends[0] = this.vertices[1].position;
            ends[1] = vec_add(ends[0], vec_scale(other_axes[0], -1));
            ends[2] = vec_add(ends[0], vec_scale(other_axes[1], -1));

            for (let i=0; i<3; i++) {
                ctx.beginPath();
                ctx.moveTo(...starts[i]);
                ctx.lineTo(...ends[i]);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }

    c = new CanvasControl();
}