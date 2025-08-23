{
    const TAU = Math.PI * 2;
    const canvas = $("#main-canvas canvas")[0];
    const ctx = canvas.getContext("2d");

    /**
     * @type {[{
     *     type: "point" | "parallel",
     *     position: [number, number],
     *     density: number,
     *     unit_vector: [number, number],
     *     size?: number
     * }]}
     * 
     * List of light sources, including point sources and parallel sources
     * 
     * For parallel sources, `position` is the center
     * 
     * `density` is
     * - for point sources, the number of equidistant rays
     * - for parallel sources, theoretically the number of rays per 100 units. The actual total number of rays is the ceiling of the theoretical number of rays
     * 
     * `unit_vector` is
     * - for point sources, the direction of one of the rays
     * - for parallel sources, the direction perpendicular and counter-clockwise to the direction of rays
     * 
     * For parallel sources, `size` is the diameter
     */
    const light_sources = [
        // {type: "point", position: [100, 100], density: 30, unit_vector: [1, 0]},
        // {type: "parallel", position: [200, 700], density: 10, unit_vector: [Math.cos(4/7 * TAU), Math.sin(4/7 * TAU)], size: 300},
        {type: "parallel", position: [1500, 200], density: 10, unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], size: 300}
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
     * List of components that interacts with light
     * 
     * `position` is the center
     * 
     * `unit_vector` is the direction perpendicular and counter-clockwise to the component's direction
     * 
     * For curved lenses and mirrors, `focal_length` is the distance between the center and a focus
     */
    const optical_elements = [
        // {type: "lens", position: [400, 400], unit_vector: [Math.cos(2/4 * TAU), Math.sin(2/4 * TAU)], focal_length: 200, size: 300},
        // {type: "flat_mirror", position: [400, 100], unit_vector: [Math.cos(2/4 * TAU), Math.sin(2/4 * TAU)], focal_length: -200, size: 300},

        {type: "lens", position: [1000, 200], unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], focal_length: 200, size: 400},
        {type: "lens", position: [500, 200], unit_vector: [Math.cos(2/7 * TAU), Math.sin(2/7 * TAU)], focal_length: 200, size: 400},
        {type: "mirror", position: [100, 200], unit_vector: [Math.cos(1/4 * TAU), Math.sin(1/4 * TAU)], focal_length: 50, size: 300},
        {type: "flat_mirror", position: [700, 800], unit_vector: [Math.cos(0/4 * TAU), Math.sin(0/4 * TAU)], size: 300},

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

    /** 
     * Draws the canvas
     */
    function draw_canvas() {
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const light_path = simulate_light(3000);

        const fill_length = 20, sep_length = 10;
        let phase = 0;
        clearInterval(animation);
        animation = setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            draw_light(fill_length, sep_length, phase, light_path);
            draw_components();

            phase = (phase + 1) % (fill_length + sep_length);
        }, 10);
    }

    function simulate_light(max_distance=700) {
        /**
         * @type {[{
         *     start_position: [number, number],
         *     unit_vector: [number, number]
         * }]}
         * 
         * List of light rays generated by light sources. `unit_vector` represents the direction
         */
        const light_rays = [];
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
                            if (optical_elements[j].type === "mirror" || optical_elements[j].type === "flat_mirror") {
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

    function draw_light(fill_length, sep_length, phase, light_path) {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;

        for (let i=0;i<light_path.length;i++) {
            let point = light_path[i][0][0];
            let t = phase % (fill_length + sep_length) < fill_length ? phase : phase - fill_length;
            let light_fill = phase % (fill_length + sep_length) < fill_length;
            total_distance = t;

            for (let j=0;j<light_path[i].length-1;j++) {
                
                // console.log(light_path[j], light_path[j+1]);
                segment_length = vec_len(vec_sub(light_path[i][j + 1][0], light_path[i][j][0]));
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

    function draw_components() {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        for (let i=0; i<optical_elements.length; i++) {
            const top = vec_add(optical_elements[i].position, vec_scale(optical_elements[i].unit_vector, optical_elements[i].size / 2));
            const bottom = vec_sub(optical_elements[i].position, vec_scale(optical_elements[i].unit_vector, optical_elements[i].size / 2));
            ctx.beginPath();
            ctx.moveTo(...optical_elements[i].position);
            ctx.lineTo(...top);
            ctx.moveTo(...optical_elements[i].position);
            ctx.lineTo(...bottom);
            const focal_sign = Math.sign(optical_elements[i].focal_length);
            switch (optical_elements[i].type) {
                case "lens":
                    ctx.moveTo(...top);
                    ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90 - focal_sign * 60)));
                    ctx.moveTo(...top);
                    ctx.lineTo(...vec_add(top, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), 90 + focal_sign * 60)));
                    ctx.moveTo(...bottom);
                    ctx.lineTo(...vec_add(bottom, vec_rotate(vec_scale(optical_elements[i].unit_vector, 30), -90 + focal_sign * 60)));
                    ctx.moveTo(...bottom);
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
            }
            ctx.stroke();
        }

        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        for (let i=0; i<light_sources.length; i++) {
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

    let animation;
    draw_canvas();

    window.addEventListener("resize", () => {
        draw_canvas();
    })
}