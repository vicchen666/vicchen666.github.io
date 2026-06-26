let c;
const TAU = Math.PI * 2;
const canvas = $("#main-canvas canvas")[0];
const ctx = canvas.getContext("2d");
{
    class CanvasControl extends CanvasControlBase {
        constructor(options = {animate: false}) {
            super(options);
            this.axes = [[Math.cos(TAU * 1/6), Math.sin(TAU * 1/6)], [-1, 0], [Math.cos(TAU * 5/6), Math.sin(TAU * 5/6)]];
            // this.axes = [[0, 1], [Math.cos(TAU * 7/12)*.5, Math.sin(TAU * 7/12)*.5], [Math.cos(TAU * 12/12), Math.sin(TAU * 12/12)]];
            // this.axes = [[0, 1], [Math.cos(TAU * 5/8)*.5, Math.sin(TAU * 5/8)*.5], [1, 0]];
            // this.axes = [[0, 1], [Math.cos(TAU * 7/12), Math.sin(TAU * 7/12)], [Math.cos(TAU * 11/12), Math.sin(TAU * 11/12)]];
            this.axes = this.axes.map(axis => vec_scale(axis, 20));
            this.axis_hovered_style = "rgba(255, 255, 255, 0.5)";
            this.axis_selected_style = "white";
            this.hovered_style = "rgba(173, 216, 230, 0.5)";
            this.selected_style = "rgba(173, 230, 181, 0.8)";
            this.outline_style = "yellow";
            this.vertex_fill_styles = ["white", "gray", "black"];
            this.beams_fill_styles = ["white", "gray", "black"];
            this.vertices = {};
            this.beams = {};
            this.selected_element = { selected: [], hovered: -1, selected_axis: [], hovered_axis: -1 };
            this.element_id = 0;

            Beam.axes = this.axes;
            Beam.outline_style = this.outline_style;
            Beam.fill_styles = this.beams_fill_styles;
            Vertex.hovered_style = this.hovered_style;
            Vertex.selected_style = this.selected_style;
            Vertex.axes = this.axes;
            Vertex.outline_style = this.outline_style;
            Vertex.fill_styles = this.vertex_fill_styles;
            this.setup_listeners();
            this.set_canvas(true);
            this.draw();
        }

        hover_item_from_canvas(e) {
            if (this.can_select_elements.has("vertex")) {
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);

                let nearest_id = -1;
                let nearest_dist = Infinity;

                Object.entries(this.vertices).forEach(([id, vertex]) => {
                    const dist = vec_len(vec_sub(vertex.position, canvas_point));
                    if (dist < nearest_dist) {
                        nearest_dist = dist;
                        nearest_id = id;
                    }
                });

                let hover_dist = Math.max(...this.axes.map(axis => vec_len(axis))) * 2 ** .5;
                if (nearest_id !== -1 && nearest_dist < hover_dist) {
                    this.selected_element.hovered = nearest_id;
                } else {
                    this.selected_element.hovered = -1;
                }
                this.render_frame();
            }
            if (this.can_select_elements.has("beam")) {
                this.selected_element.hovered = -1;
                this.render_frame();
            }
        }

        use_tool(e) {
            if (this.can_select_elements.has("axis")) {
                const vertex_position = this.vertices[this.selected_element.selected[this.selected_element.selected.length - 1]].position;
                const unit_axes = this.axes.map(axis => vec_unit(axis));
                const canvas_point = this.mouse_to_canvas(e.clientX, e.clientY);
                const dot_prods = unit_axes.map(axis => vec_dot(axis, vec_sub(canvas_point, vertex_position)));
                this.selected_element.hovered_axis = dot_prods.indexOf(Math.max(...dot_prods)) + 1;
                this.render_frame();
            }
        }

        render_frame() {
            ctx.clearRect(...vec_scale(this.origin, 1 / this.size), canvas.width / this.size, -canvas.height / this.size);
            Beam.seal_cracks_line_width = 1 / this.size;
            Vertex.seal_cracks_line_width = 1 / this.size;

            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2 / this.size;

            Object.entries(this.beams).forEach(([id, beam]) => {
                beam.fill();
            });
            Object.entries(this.vertices).forEach(([id, vertex]) => {
                vertex.fill();
            });

            this.draw_tools();
            // this.draw_beams();
            // this.display_sierpinski(8);
            // this.display_all_possibilities();
            // this.display_penrose_triangle();
            // this.display_impossible_cube();
        }

        handle_tool_mousedown(e) {
            super.handle_tool_mousedown(e);
            switch (this.selected_tool) {
                case "add-vertex-click":
                    if (e.which !== 1) return;
                    this.add_vertex(e.clientX, e.clientY);
                    break;
                case "extend-beam-vertex":
                    switch (this.tool_status) {
                        case "select_vertex":
                            if (e.which !== 1) return;
                            if (this.selected_element.hovered === -1) return;
                            this.selected_element.selected.push(this.selected_element.hovered);
                            this.selected_element.hovered = -1;
                            this.tool_status = "select_axis";
                            c.can_select_elements.delete("vertex");
                            c.can_select_elements.add("axis");
                            this.render_frame();
                            break;
                        case "select_axis":
                            if (e.which !== 1) return;
                            this.selected_element.selected_axis.push(this.selected_element.hovered_axis);
                            this.selected_element.hovered_axis = -1;

                            c.can_select_elements.delete("axis");
                            c.can_select_elements.add("vertex");
                            this.render_frame();
                            break;
                    }
                    break;
            }
        }

        display_all_possibilities() {
            let centers_vertices = [];
            for (let i=0; i<8; i++) {
                for (let j=0; j<8; j++) {
                    centers_vertices.push(new Vertex(vec_add(vec_scale([0, 1], i * 500), vec_scale([1, 0], j * 500))));
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
                    const v = new Vertex(vec_add(centers_vertices[i].position, vec_scale(this.axes[(beam - 1) % 3], beam > 3 ? -10 : 10)));
                    const b = new Beam(beam < 4 ? [v, centers_vertices[i]] : [centers_vertices[i], v], (beam - 1) % 3 + 1);
                    beams.push(b);
                    vertices.push(v);
                });
            }
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2 / this.size;

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
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[0], 5))));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[1], -5))));

            beams.push(new Beam([vertices[1], vertices[0]], 1));
            beams.push(new Beam([vertices[0], vertices[2]], 2));
            beams.push(new Beam([vertices[2], vertices[1]], 3));

            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = 2 / this.size;
            
            beams.forEach(beam => beam.fill());
            vertices.forEach(vertex => vertex.fill());

            // beams.forEach(beam => beam.draw_outline());
            // vertices.forEach(vertex => vertex.draw_outline());
        }

        display_impossible_cube() {
            let vertices = [];
            let beams = [];

            vertices.push(new Vertex([0, 0]));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[0], 10))));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[1], 10))));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[2], 10))));
            vertices.push(new Vertex(vec_add(vertices[1].position, vec_scale(this.axes[1], 10))));
            vertices.push(new Vertex(vec_add(vertices[2].position, vec_scale(this.axes[2], 10))));
            vertices.push(new Vertex(vec_add(vertices[3].position, vec_scale(this.axes[0], 10))));
            vertices.push(new Vertex(vec_add(vertices[4].position, vec_scale(this.axes[2], 10))));

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

            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2 / this.size;

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
                        vertices.push(new Vertex(vec_add(vertices[bottomLeft].position, vec_scale(this.axes[0], 10))));
                    }
                    let top = vertexCount++;
                    vertices.push(new Vertex(vec_add(vertices[bottomLeft].position, vec_scale(this.axes[1], -10))));

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

            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2 / this.size;

            beams.forEach(beam => beam.fill());
            vertices.forEach(vertex => vertex.fill());

            // beams.forEach(beam => beam.draw_outline());
            // vertices.forEach(vertex => vertex.draw_outline());
        }

        draw_beams() {
            let vertices = [];
            let beams = [];
            vertices.push(new Vertex([0, 0]));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[0], 10))));
            vertices.push(new Vertex(vec_add(vertices[0].position, vec_scale(this.axes[1], 1.5))));
            vertices.push(new Vertex(vec_add(vertices[2].position, vec_scale(this.axes[0], 10))));

            beams.push(new Beam([vertices[1], vertices[0]], 1));
            beams.push(new Beam([vertices[2], vertices[0]], 2));
            beams.push(new Beam([vertices[3], vertices[2]], 1));
            
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2 / this.size;

            beams.forEach(beam => beam.fill());
            vertices.forEach(vertex => vertex.fill());

            // beams.forEach(beam => beam.draw_outline());
            // vertices.forEach(vertex => vertex.draw_outline());
        }

        draw_tools() {
            const draw_tool_axes = () => {
                if (this.selected_element.hovered_axis !== -1) {
                    ctx.strokeStyle = this.axis_hovered_style;
                    let position = this.vertices[this.selected_element.selected[this.selected_element.selected.length - 1]].position;
                    const unit_axis = vec_unit(this.axes[this.selected_element.hovered_axis - 1]);
                    position = vec_add(position, vec_scale(unit_axis, 100));

                    ctx.beginPath();
                    ctx.moveTo(...position);
                    position = vec_add(position, vec_scale(unit_axis, 100));
                    ctx.lineTo(...position);
                    ctx.lineTo(...vec_add(position, vec_rotate(vec_scale(unit_axis, 30), 150)));
                    ctx.lineTo(...position);
                    ctx.lineTo(...vec_add(position, vec_rotate(vec_scale(unit_axis, 30), -150)));
                    ctx.save();
                    ctx.lineWidth = 10 / this.size;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            Object.entries(this.beams).forEach(([id, beam]) => {
                if (id === this.selected_element.hovered) {
                    beam.draw_hovered();
                } else if (this.selected_element.selected.includes(id)) {
                    beam.draw_selected();
                }
            })
            Object.entries(this.vertices).forEach(([id, vertex]) => {
                if (id === this.selected_element.hovered) {
                    vertex.draw_hovered();
                } else if (this.selected_element.selected.includes(id)) {
                    vertex.draw_selected();
                }
            });

            draw_tool_axes();

        }



        add_vertex(mouse_x, mouse_y) {
            this.vertices[this.element_id++] = new Vertex(this.mouse_to_canvas(mouse_x, mouse_y));
            this.render_frame();
        }
    }

    class Vertex {
        static axes;
        static hovered_style;
        static selected_style;
        static outline_style;
        static fill_styles;
        static seal_cracks_line_width;

        constructor(position) {
            this.position = position;
            this.beams = new Set();
            this.edges = new Set();
        }

        draw_outline() {
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

            ctx.strokeStyle = Vertex.outline_style;
            ctx.beginPath();
            this.edges.forEach(edgeKey => {
                const edge = edgeKey.split(",").map(Number);
                let position = this.position;
                for (let i=0; i<edge.length-1; i++) {
                    	position = vec_sub(position, Vertex.axes[edge[i] - 1]);
                }
                ctx.moveTo(...position);
                	const line_end = vec_sub(position, Vertex.axes[edge[edge.length - 1] - 1]);
                ctx.lineTo(...line_end);
            });
            ctx.closePath();
            ctx.stroke();
        }

        fill() {
            for (let i=0; i<3; i++) {
                if (this.beams.has(i + 1)) continue;
                const main_axis = Vertex.axes[i];
                const other_axes = Vertex.axes.filter((_, j) => j !== i);
                ctx.fillStyle = Vertex.fill_styles[i];
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
                ctx.strokeStyle = Vertex.fill_styles[i];
                ctx.lineWidth = Vertex.seal_cracks_line_width;
                ctx.stroke();
                ctx.restore();
            }
        }

        draw_hovered() {
            ctx.fillStyle = Vertex.hovered_style;
            ctx.beginPath();
            let position = vec_sub(this.position, Vertex.axes[0]);
            ctx.moveTo(...position);
            position = vec_sub(position, Vertex.axes[1]);
            ctx.lineTo(...position);
            position = vec_add(position, Vertex.axes[0]);
            ctx.lineTo(...position);
            position = vec_sub(position, Vertex.axes[2]);
            ctx.lineTo(...position);
            position = vec_add(position, Vertex.axes[1]);
            ctx.lineTo(...position);
            position = vec_sub(position, Vertex.axes[0]);
            ctx.lineTo(...position);
            position = vec_add(position, Vertex.axes[2]);
            ctx.closePath();
            ctx.fill();
        }

        draw_selected() {
            ctx.fillStyle = Vertex.selected_style;
            ctx.beginPath();
            let position = vec_sub(this.position, Vertex.axes[0]);
            ctx.moveTo(...position);
            position = vec_sub(position, Vertex.axes[1]);
            ctx.lineTo(...position);
            position = vec_add(position, Vertex.axes[0]);
            ctx.lineTo(...position);
            position = vec_sub(position, Vertex.axes[2]);
            ctx.lineTo(...position);
            position = vec_add(position, Vertex.axes[1]);
            ctx.lineTo(...position);
            position = vec_sub(position, Vertex.axes[0]);
            ctx.lineTo(...position);
            position = vec_add(position, Vertex.axes[2]);
            ctx.closePath();
            ctx.fill();
        }
    }

    class Beam {
        static axes;
        static outline_style;
        static fill_styles;
        static seal_cracks_line_width;

        constructor(vertices, direction) {
            this.vertices = vertices;
            this.direction = direction;
            if (vec_dot(vec_sub(this.vertices[0].position, this.vertices[1].position), Beam.axes[this.direction - 1]) < 0) this.vertices.reverse();
            this.vertices[0].beams.add(-this.direction);
            this.vertices[1].beams.add(this.direction);
        }

        draw_outline() {
            const main_axis = Beam.axes[this.direction - 1];
            const other_axes = Beam.axes.filter((_, i) => i !== this.direction - 1);
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

            ctx.strokeStyle = Beam.outline_style;
            for (let i=0; i<3; i++) {
                ctx.beginPath();
                ctx.moveTo(...starts[i]);
                ctx.lineTo(...ends[i]);
                ctx.closePath();
                ctx.stroke();
            }
        }

        fill() {
            const main_axis = Beam.axes[this.direction - 1];
            const other_axes_index = [1, 2, 3].filter(axis => axis !== this.direction);
            const other_axes = other_axes_index.map(i => Beam.axes[i - 1]);
            for (let i=0; i<2; i++) {
                ctx.fillStyle = Beam.fill_styles[other_axes_index[i] - 1];
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
                ctx.strokeStyle = Beam.fill_styles[other_axes_index[i] - 1];
                ctx.lineWidth = Beam.seal_cracks_line_width;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    c = new CanvasControl();
}