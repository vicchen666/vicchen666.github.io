let c;
const TAU = Math.PI * 2;
const canvas = $("#main-canvas canvas")[0];
const ctx = canvas.getContext("2d");
{
    ctx.origin = [0, 0];
    ctx.size = 1;
    let x, y;
    
    const light_sources = [
        {type: "parallel", position: [1500, 200], density: 10, unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], size: 300},
        // {type: "point", position: [1500, 50], density: 30, unit_vector: [1, 0]},
        // {type: "point", position: [1500, 350], density: 30, unit_vector: [1, 0]},
    ];

    /**
     * @type {[{
     *     type: "lens" | "mirror" | "flat_mirror",
     *     position: [number, number],
     *     unit_vector: [number, number],
     *     focal_length?: number,
     *     size: number
     * }]}
     * 
     * List of elements that interacts with light
     * 
     * `position` is the center
     * 
     * `unit_vector` is the direction perpendicular and counter-clockwise to the element's direction
     * 
     * For curved lenses and mirrors, `focal_length` is the distance between the center and a focus
     */
    const optical_elements = [
        {type: "lens", position: [1000, 200], unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], focal_length: 200, size: 400},
        {type: "lens", position: [500, 200], unit_vector: [Math.cos(2/7 * TAU), Math.sin(2/7 * TAU)], focal_length: 250, size: 400},
        {type: "mirror", position: [100, 200], unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], focal_length: 50, size: 300},
        {type: "flat_mirror", position: [700, 800], unit_vector: [Math.cos(0/4 * TAU), Math.sin(0/4 * TAU)], size: 300},
        {type: "barrier", position: [300, 600], unit_vector: [Math.cos(0/4 * TAU), Math.sin(0/4 * TAU)], size: 300},

        // {type: "mirror", position: [400, 400], unit_vector: [Math.cos(2/4 * TAU), Math.sin(2/4 * TAU)], focal_length: 400, size: 300},
        // {type: "mirror", position: [325, 400 + 75 * Math.sqrt(3)], unit_vector: [Math.cos(1/6 * TAU), Math.sin(1/6 * TAU)], focal_length: 400, size: 300},
        // {type: "mirror", position: [475, 400 + 75 * Math.sqrt(3)], unit_vector: [Math.cos(5/6 * TAU), Math.sin(5/6 * TAU)], focal_length: 400, size: 300},
    ];

    /**
     * Solves a system of two linear equations in the form of ax+by=c. Parameters are provided in the form of arrays of two elements
     * @returns "infinite", "none", or [x, y]
     */
    function lineq2(a, b, c) {
        const delta = a[0] * b[1] - a[1] * b[0];
        const delta_x = c[0] * b[1] - c[1] * b[0];
        const delta_y = a[0] * c[1] - a[1] * c[0];
        if (delta === 0) {
            if (delta_x === 0) {
                return "infinite";
            } else {
                return "none";
            }
        }
        return [delta_x / delta, delta_y / delta];
    }
    function vec_add(a, b) {
        return a.map((val, i) => val + b[i]);
    }
    function vec_sub(a, b) {
        return a.map((val, i) => val - b[i]);
    }
    function vec_scale(v, s) {
        return v.map(val => val * s);
    }
    function vec_dot(a, b) {
        return a.map((val, i) => val * b[i]).reduce((result, val) => result + val);
    }
    function vec_len(v) {
        return Math.sqrt(v.map(val => val ** 2).reduce((result, val) => result + val));
    }
    function vec_unit(v) {
        return vec_scale(v, 1 / vec_len(v));
    }
    /**
     * @description Returns a vector rotated counter-clockwise by `d` degrees
     * @param {[number, number]} v The vector to be rotated
     * @param {number} d The angle in degrees
     * @returns The rotated vector
     */
    function vec_rotate(v, d) {
        const rad = d * TAU / 360;
        return [v[0] * Math.cos(rad) + v[1] * -Math.sin(rad), v[0] * Math.sin(rad) + v[1] * Math.cos(rad)];
    }
    class CanvasControl {
        constructor() {
            this.element_id = 0;
            this.phase = 0;
            this.fill_length = 20;
            this.sep_length = 10;
            this.max_distance = 3000;
            this.elements_settings = {
                "lens": ["name", "position", "rotation", "focal_length", "size"],
                "mirror": ["name", "position", "rotation", "focal_length", "size"],
                "flat_mirror": ["name", "position", "rotation", "size"],
                "barrier": ["name", "position", "rotation", "size"],
                "point": ["name", "position", "rotation", "density"],
                "parallel": ["name", "position", "rotation", "size", "density"],
            }
            this.light_sources = [];
            this.optical_elements = [];
            // this.light_sources = [
            //     {id:0, type: "parallel", position: [1500, 200], density: 10, unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], size: 300},
            //     // {type: "point", position: [1500, 50], density: 30, unit_vector: [1, 0]},
            // ];
            // this.optical_elements = [
            //     {id:1, type: "lens", position: [1000, 200], unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], focal_length: 200, size: 400},
            //     {id:2, type: "lens", position: [500, 200], unit_vector: [Math.cos(2/7 * TAU), Math.sin(2/7 * TAU)], focal_length: 250, size: 400},
            //     {id:3, type: "mirror", position: [100, 200], unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], focal_length: 50, size: 300},
            //     {id:4, type: "flat_mirror", position: [700, 800], unit_vector: [Math.cos(0/4 * TAU), Math.sin(0/4 * TAU)], focal_length:50, size: 300},
            //     {id:5, type: "barrier", position: [300, 600], unit_vector: [Math.cos(0/4 * TAU), Math.sin(0/4 * TAU)], size: 300},
            // ];
            this.selected_element = {selected:-1, hovered:-1};
            this.update_light_path();
            this.set_canvas(true);
            this.draw();
        }

        add_element(type, element) {
            this[type].push(element);
        }

        remove_element(type, index) {
            this[type].splice(index, 1);
        }

        update_light_path() {
            this.light_path = this.simulate_light(this.light_sources, this.optical_elements, this.max_distance);
        }

        draw() {
            if (this.animation) clearInterval(this.animation);
            this.animation = setInterval(() => {
                ctx.clearRect(...vec_scale(ctx.origin, 1 / ctx.size), canvas.width / ctx.size, canvas.height / ctx.size);
                this.draw_light(this.fill_length, this.sep_length, this.phase, this.light_path);
                this.draw_elements(this.light_sources, this.optical_elements, this.selected_element);

                this.phase = (this.phase + 1) % (this.fill_length + this.sep_length);
            }, 10);
        }
        
        set_canvas(adjust_size=false) {
            if (adjust_size) {
                canvas.height = canvas.clientHeight;
                canvas.width = canvas.clientWidth; 
            }
            ctx.setTransform(
                ctx.size, 0, 0, ctx.size,
                -ctx.origin[0], -ctx.origin[1]
            );
        }

        simulate_light(light_sources, optical_elements, max_distance=700) {
            /**
             * @type {[{
             *     start_position: [number, number],
             *     unit_vector: [number, number]
             * }]}
             * 
             * List of light rays generated by light sources. `unit_vector` represents the direction
             */
            let light_rays = [];
            // generate rays from sources
            light_sources.forEach(e => {
                switch (e.type) {
                    case "point":
                        for (let i=0; i<e.density; i++) {
                            light_rays.push({start_position: e.position, unit_vector: vec_rotate(e.unit_vector, 360 * i / e.density)});
                        }
                        break;
                    case "parallel":
                        const normal = [-e.unit_vector[1], e.unit_vector[0]]; // direction of rays
                        const top = vec_add(e.position, vec_scale(e.unit_vector, e.size / 2)); // the endpoint counter-clockwise to the ray direction
                        const num_rays = Math.ceil(e.size / 100 * e.density) + 1; // number of rays
                        for (let i=0; i<num_rays; i++) {
                            light_rays.push({start_position: vec_sub(top, vec_scale(e.unit_vector, e.size / (num_rays - 1) * i)), unit_vector: normal});
                        }
                        break;
                }
            });

            let light_path = [];

            for (let i=0; i<light_rays.length; i++) {
                let total_distance = 0;
                light_path.push([[light_rays[i].start_position, light_rays[i].unit_vector]]);

                while (total_distance < max_distance) {
                    let distance = Infinity;
                    let nearest_optical_element = -1;

                    for (let j=0; j<optical_elements.length; j++) {
                        const result = lineq2(light_rays[i].unit_vector, vec_scale(optical_elements[j].unit_vector, -1), vec_sub(optical_elements[j].position, light_rays[i].start_position));
                        if (result !== "infinite" && result !== "none") {
                            if (result[0] > 1e-10 && result[0] < distance && result[0] < max_distance - total_distance) {
                                if (optical_elements[j].type === "mirror" || optical_elements[j].type === "flat_mirror" || optical_elements[j].type === "barrier") {
                                    const normal = [-optical_elements[j].unit_vector[1], optical_elements[j].unit_vector[0]];
                                    const dot_sign = Math.sign(vec_dot(light_rays[i].unit_vector, normal));
                                    if (dot_sign < 0) {
                                        continue;
                                    }
                                }
                                if (Math.abs(result[1]) <= optical_elements[j].size / 2) {
                                    distance = result[0];
                                    nearest_optical_element = j;
                                }
                            }
                        }
                    }

                    if (nearest_optical_element === -1) {
                        light_path[i].push([vec_add(light_rays[i].start_position, vec_scale(light_rays[i].unit_vector, max_distance - total_distance))]);
                        break;
                    }

                    total_distance += distance;
                    const element = optical_elements[nearest_optical_element];
                    let result = lineq2(light_rays[i].unit_vector, vec_scale(element.unit_vector, -1), vec_sub(element.position, light_rays[i].start_position));
                    light_rays[i].start_position = vec_add(light_rays[i].start_position, vec_scale(light_rays[i].unit_vector, result[0]));

                    if (element.type === "barrier") {
                        light_path[i].push([light_rays[i].start_position]);
                        break;
                    }

                    const normal = [-element.unit_vector[1], element.unit_vector[0]];
                    const dot_sign = Math.sign(vec_dot(light_rays[i].unit_vector, normal));

                    if (element.type === "lens" || element.type === "mirror") {
                        const focal_sign = Math.sign(element.focal_length);
                        const front_focus = vec_sub(element.position, vec_scale(normal, element.focal_length * dot_sign));
                        result = lineq2(light_rays[i].unit_vector, vec_scale(element.unit_vector, -1), vec_sub(front_focus, light_rays[i].start_position));
                        const front_focus_point = vec_add(light_rays[i].start_position, vec_scale(light_rays[i].unit_vector, result[0]));
                        if (element.type === "lens") {
                            light_rays[i].unit_vector = vec_unit(vec_scale(vec_sub(element.position, front_focus_point), focal_sign));
                        } else {
                            light_rays[i].unit_vector = vec_unit(vec_scale(vec_add(vec_scale(normal, -2 * element.focal_length * dot_sign), vec_sub(element.position, front_focus_point)), focal_sign));
                        }
                    } else if (element.type = "flat_mirror") {
                        light_rays[i].unit_vector = vec_add(light_rays[i].unit_vector, vec_scale(normal, -2 * vec_dot(light_rays[i].unit_vector, normal)));
                    }

                    light_path[i].push([light_rays[i].start_position, light_rays[i].unit_vector]);
                }
            }
            return light_path;
        }

        draw_light(fill_length, sep_length, phase, light_path) {
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2 / ctx.size;

            for (let i=0;i<light_path.length;i++) {
                let point = light_path[i][0][0];
                let t = phase % (fill_length + sep_length) < fill_length ? phase : phase - fill_length;
                let light_fill = phase % (fill_length + sep_length) < fill_length;
                let total_distance = t;

                for (let j=0;j<light_path[i].length-1;j++) {
                    let segment_length = vec_len(vec_sub(light_path[i][j + 1][0], light_path[i][j][0]));
                    while (true) {
                        ctx.beginPath();
                        ctx.moveTo(...point);
                        if (total_distance > segment_length) {
                            point = light_path[i][j + 1][0];
                            ctx.lineTo(...point);
                            if (light_fill) ctx.stroke();
                            t = total_distance - segment_length;
                            total_distance = t;
                            break;
                        } else {
                            point = vec_add(point, vec_scale(light_path[i][j][1], t));
                            ctx.lineTo(...point);
                            if (light_fill) ctx.stroke();
                            light_fill = !light_fill;
                            t = light_fill ? fill_length : sep_length;
                            total_distance += t;
                        }
                    }
                }
            }
        }

        draw_elements(light_sources, optical_elements, selected_element) {
            ctx.strokeStyle = "white";
            ctx.fillStyle = "white";
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 3 / ctx.size;
            for (let i=0; i<optical_elements.length; i++) {
                draw_optical_elements(i);
            }

            ctx.strokeStyle = "white";
            ctx.fillStyle = "white";
            for (let i=0; i<light_sources.length; i++) {
                draw_light_sources(i);
            }

            let element_index = optical_elements.findIndex(e => e.id === selected_element.hovered);
            if (element_index !== -1) {
                ctx.strokeStyle = "lime";
                ctx.fillStyle = "lime";
                draw_optical_elements(element_index, true);
            }
            element_index = optical_elements.findIndex(e => e.id === selected_element.selected);
            if (element_index !== -1) {
                ctx.strokeStyle = "limegreen";
                ctx.fillStyle = "limegreen";
                draw_optical_elements(element_index, true);
            }

            element_index = light_sources.findIndex(e => e.id === selected_element.hovered);
            if (element_index !== -1) {
                ctx.strokeStyle = "lime";
                ctx.fillStyle = "lime";
                draw_light_sources(element_index, true);
            }
            element_index = light_sources.findIndex(e => e.id === selected_element.selected);
            if (element_index !== -1) {
                ctx.strokeStyle = "limegreen";
                ctx.fillStyle = "limegreen";
                draw_light_sources(element_index, true);
            }

            function draw_optical_elements(i, cover=false) {
                const top = vec_add(optical_elements[i].position, vec_scale(optical_elements[i].unit_vector, optical_elements[i].size / 2));
                const bottom = vec_sub(optical_elements[i].position, vec_scale(optical_elements[i].unit_vector, optical_elements[i].size / 2));
                const focal_sign = Math.sign(optical_elements[i].focal_length);
                if (cover) {
                    ctx.save();
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                    // ctx.globalCompositeOperation = "destination-out";
                    // ctx.globalCompositeOperation = "source-atop";
                    ctx.globalCompositeOperation = "lighter";
                    ctx.beginPath();
                    let rect = {};
                    if ((optical_elements[i].type === "lens" && focal_sign < 0) || (optical_elements[i].type === "mirror" && focal_sign > 0)){
                        rect = {center: optical_elements[i].position, width_vecter: vec_rotate(vec_scale(optical_elements[i].unit_vector, 40), 90), height_vecter: vec_scale(optical_elements[i].unit_vector, optical_elements[i].size / 2 + 50)};
                    } else if (optical_elements[i].type === "barrier") {
                        rect = {center: vec_add(optical_elements[i].position, vec_rotate(vec_scale(optical_elements[i].unit_vector, 15), 90)), width_vecter: vec_rotate(vec_scale(optical_elements[i].unit_vector, 40), 90), height_vecter: vec_scale(optical_elements[i].unit_vector, optical_elements[i].size / 2 + 10)};
                    } else {
                        rect = {center: optical_elements[i].position, width_vecter: vec_rotate(vec_scale(optical_elements[i].unit_vector, 40), 90), height_vecter: vec_scale(optical_elements[i].unit_vector, optical_elements[i].size / 2 + 10)};
                    }
                    ctx.moveTo(...vec_sub(vec_sub(rect.center, rect.width_vecter), rect.height_vecter));
                    ctx.lineTo(...vec_sub(vec_add(rect.center, rect.width_vecter), rect.height_vecter));
                    ctx.lineTo(...vec_add(vec_add(rect.center, rect.width_vecter), rect.height_vecter));
                    ctx.lineTo(...vec_add(vec_sub(rect.center, rect.width_vecter), rect.height_vecter));
                    ctx.fill();
                    ctx.restore();
                }

                ctx.beginPath();
                ctx.moveTo(...top);
                ctx.lineTo(...bottom);
                switch (optical_elements[i].type) {
                    case "lens":
                        ctx.moveTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90 - focal_sign * 60)));
                        ctx.lineTo(...top);
                        ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), 90 + focal_sign * 60)));
                        ctx.moveTo(...vec_add(bottom, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90 + focal_sign * 60)));
                        ctx.lineTo(...bottom);
                        ctx.lineTo(...vec_add(bottom, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), 90 - focal_sign * 60)));
                        break;
                    case "mirror":
                        ctx.moveTo(...top);
                        ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90 + focal_sign * 60)));
                        ctx.moveTo(...bottom);
                        ctx.lineTo(...vec_add(bottom, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90 - focal_sign * 60)));
                        break;
                    case "flat_mirror":
                        ctx.moveTo(...top);
                        ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90)));
                        ctx.moveTo(...bottom);
                        ctx.lineTo(...vec_add(bottom, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90)));
                        break;
                    case "barrier":
                        ctx.lineTo(...vec_add(bottom, vec_rotate(vec_scale(optical_elements[i].unit_vector, 15), 90)));
                        ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 15), 90)));
                        ctx.lineTo(...top);
                        ctx.fill();
                        ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), 90)));
                        ctx.lineTo(...vec_add(bottom, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), 90)));
                        ctx.lineTo(...bottom);
                        break;
                }
                ctx.stroke();
            }
            function draw_light_sources(i, cover=false) {
                if (cover) {
                    ctx.save();
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                    // ctx.globalCompositeOperation = "destination-out";
                    // ctx.globalCompositeOperation = "source-atop";
                    ctx.globalCompositeOperation = "lighter";
                    ctx.beginPath();
                    let rect = {};
                    if (light_sources[i].type === "point"){
                        ctx.moveTo(...vec_add(light_sources[i].position, [30, 0]));
                        ctx.arc(...light_sources[i].position, 30, 0, TAU);
                    } else {
                        rect = {center: light_sources[i].position, width_vecter: vec_rotate(vec_scale(light_sources[i].unit_vector, 40), 90), height_vecter: vec_scale(light_sources[i].unit_vector, light_sources[i].size / 2 + 10)};
                    }
                    if (light_sources[i].type !== "point") {
                        ctx.moveTo(...vec_sub(vec_sub(rect.center, rect.width_vecter), rect.height_vecter));
                        ctx.lineTo(...vec_sub(vec_add(rect.center, rect.width_vecter), rect.height_vecter));
                        ctx.lineTo(...vec_add(vec_add(rect.center, rect.width_vecter), rect.height_vecter));
                        ctx.lineTo(...vec_add(vec_sub(rect.center, rect.width_vecter), rect.height_vecter));
                    }
                    ctx.fill();
                    ctx.restore();
                }

                ctx.beginPath();
                switch (light_sources[i].type) {
                    case "point":
                        ctx.moveTo(...vec_add(light_sources[i].position, [10, 0]));
                        ctx.arc(...light_sources[i].position, 10, 0, TAU);
                        ctx.fill();
                        break;
                    case "parallel":
                        const top = vec_add(light_sources[i].position, vec_scale(light_sources[i].unit_vector, light_sources[i].size / 2));
                        const bottom = vec_sub(light_sources[i].position, vec_scale(light_sources[i].unit_vector, light_sources[i].size / 2));
                        ctx.lineTo(...vec_add(bottom, vec_rotate(vec_scale(light_sources[i].unit_vector, 30), -30)));
                        ctx.lineTo(...bottom);
                        ctx.lineTo(...top);
                        ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(light_sources[i].unit_vector, 30), -150)));
                        ctx.closePath();
                        ctx.stroke();
                        ctx.fill();
                        break;
                }
            }
        }
    }

    c = new CanvasControl();

    let grabbing_canvas = false;
    canvas.addEventListener("wheel", e => {
        const rect = canvas.getBoundingClientRect();
        const canvas_point = vec_sub([e.clientX, e.clientY], [rect.left, rect.top]);
        const origin = vec_sub(vec_scale(vec_add(ctx.origin, canvas_point), e.deltaY > 0 ? 1 / 1.1 : 1.1), canvas_point);
        ctx.size *= e.deltaY > 0 ? 1 / 1.1 : 1.1;
        ctx.origin = origin;
        c.set_canvas();
    });
    canvas.addEventListener("mousedown", e => {
        grabbing_canvas = true;
        x = e.clientX;
        y = e.clientY;
    });
    window.addEventListener("mousemove", e => {
        if (!grabbing_canvas) return;
        ctx.origin = vec_add(ctx.origin, [x - e.clientX, y - e.clientY]);
        // ctx.translate(...vec_scale([e.clientX - x, e.clientY - y], 1 / ctx.size));
        x = e.clientX;
        y = e.clientY;
        c.set_canvas();
    });
    window.addEventListener("mouseup", () => {
        if (grabbing_canvas) {
            grabbing_canvas = false;
        }
    });
    window.addEventListener("resize", () => {
        c.set_canvas(true);
    })
}