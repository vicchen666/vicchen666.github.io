const TAU = Math.PI * 2;
// Vectors
export function add(a, b) {
    return a.map((val, i) => val + b[i]);
}
export function sub(a, b) {
    return a.map((val, i) => val - b[i]);
}
export function scale(v, s) {
    return v.map(val => val * s);
}
export function dot(a, b) {
    return a.map((val, i) => val * b[i]).reduce((result, val) => result + val);
}
export function len(v) {
    return Math.sqrt(v.map(val => val ** 2).reduce((result, val) => result + val));
}
export function unit(v) {
    return scale(v, 1 / len(v));
}
/**
 * @description Returns a vector rotated counter-clockwise by `d` degrees
 * @param {[number, number]} v The vector to be rotated
 * @param {number} d The angle in degrees
 * @returns The rotated vector
 */
export function rotate(v, d) {
    const rad = d * TAU / 360;
    return [v[0] * Math.cos(rad) + v[1] * -Math.sin(rad), v[0] * Math.sin(rad) + v[1] * Math.cos(rad)];
}
export function round(v, precision=0) {
    const factor = 10 ** precision;
    return v.map(val => Math.round(val * factor) / factor);
}

// Vector tools
/**
 * Solves a system of two linear equations in the form of ax+by=c. Parameters are provided in the form of arrays of two elements
 * @returns "infinite", "none", or [x, y]
 */
export function lineq2(a, b, c) {
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
// Only for 2D
export function line_intersection(point_a, vec_a, point_b, vec_b) {
    const start_to_end = sub(point_b, point_a);
    const vec_ratio = lineq2(vec_a, scale(vec_b, -1), start_to_end);
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    return add(point_a, scale(vec_a, vec_ratio[0]));
}
// Only for 2D
export function ray_intersection(point_a, vec_a, point_b, vec_b) {
    const start_to_end = sub(point_b, point_a);
    const vec_ratio = lineq2(vec_a, scale(vec_b, -1), start_to_end);
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    if (vec_ratio[0] < 0 || vec_ratio[1] < 0) return null;
    return add(point_a, scale(vec_a, vec_ratio[0]))
}
// Only for 2D
export function ray_seg_intersection(point_a, vec_a, start_b, end_b) {
    const vec_ratio = lineq2(vec_a, scale(sub(end_b, start_b), -1), sub(start_b, point_a));
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    if (vec_ratio[0] < 0 || vec_ratio[1] < 0 || vec_ratio[1] > 1) return null;
    return add(point_a, scale(vec_a, vec_ratio[0]));
}
// Only for 2D
export function seg_intersection(start_a, end_a, start_b, end_b) {
    const vec_ratio = lineq2(sub(end_a, start_a), scale(sub(end_b, start_b), -1), sub(start_b, start_a));
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    if (vec_ratio[0] < 0 || vec_ratio[0] > 1 || vec_ratio[1] < 0 || vec_ratio[1] > 1) return null;
    return add(start_a, scale(sub(end_a, start_a), vec_ratio[0]));
}
export function point_to_line_point(point, origin, dir) {
    if (len(dir) === 0) return origin;
    const v = sub(point, origin);
    const unit_dir = unit(dir);
    const proj = scale(unit_dir, dot(v, unit_dir));
    return add(origin, proj);
}
export function point_to_line_dist(point, origin, dir) {
    const line_point = point_to_line_point(point, origin, dir);
    return len(sub(point, line_point));
}
export function point_to_seg_point(point, start, end) {
    const seg_vec = sub(end, start);
    if (len(seg_vec) === 0) return start;
    const to_start = sub(point, start);
    if (dot(to_start, seg_vec) < 0) return start;
    if (dot(sub(point, end), sub(start, end)) < 0) return end;
    return point_to_line_point(point, start, seg_vec);
}
export function point_to_seg_dist(point, start, end) {
    return len(sub(point, point_to_seg_point(point, start, end)));
}
// Only for 2D
export function polar_to_cartesian(r, theta) {
    const rad = theta * TAU / 360;
    return [r * Math.cos(rad), r * Math.sin(rad)];
}
// Only for 2D
export function cartesian_to_polar(v) {
    const x = v[0];
    const y = v[1];
    const r = Math.sqrt(x ** 2 + y ** 2);
    const theta = Math.atan2(y, x) * 360 / TAU;
    return [r, theta];
}

export function angle_between(v1, v2, directed=false) {
    const dot_product = dot(v1, v2);
    const len_product = len(v1) * len(v2);
    if (len_product === 0) return 0;
    if (directed) {
        const cross_product = v1[0] * v2[1] - v1[1] * v2[0];
        const angle = Math.atan2(cross_product, dot_product) * 360 / TAU;
        return (angle + 360) % 360;
    }
    const cos_theta = dot_product / len_product;
    return Math.acos(Math.min(Math.max(cos_theta, -1), 1)) * 360 / TAU;
}

export function get_bounding_box(points) {
    if (!points.length) return null;
    let box = { min: [], max: [] };
    for (let i = 0; i < points[0].length; i++) {
        box.min[i] = Math.min(...points.map(p => p[i]));
        box.max[i] = Math.max(...points.map(p => p[i]));
    }
    return box;
}