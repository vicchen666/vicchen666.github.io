// Vectors
export function vec_add(a, b) {
    return a.map((val, i) => val + b[i]);
}
export function vec_sub(a, b) {
    return a.map((val, i) => val - b[i]);
}
export function vec_scale(v, s) {
    return v.map(val => val * s);
}
export function vec_dot(a, b) {
    return a.map((val, i) => val * b[i]).reduce((result, val) => result + val);
}
export function vec_len(v) {
    return Math.sqrt(v.map(val => val ** 2).reduce((result, val) => result + val));
}
export function vec_unit(v) {
    return vec_scale(v, 1 / vec_len(v));
}
/**
 * @description Returns a vector rotated counter-clockwise by `d` degrees
 * @param {[number, number]} v The vector to be rotated
 * @param {number} d The angle in degrees
 * @returns The rotated vector
 */
export function vec_rotate(v, d) {
    const rad = d * TAU / 360;
    return [v[0] * Math.cos(rad) + v[1] * -Math.sin(rad), v[0] * Math.sin(rad) + v[1] * Math.cos(rad)];
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
    const start_to_end = vec_sub(point_b, point_a);
    const vec_ratio = lineq2(vec_a, vec_scale(vec_b, -1), start_to_end);
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    return vec_add(point_a, vec_scale(vec_a, vec_ratio[0]));
}
// Only for 2D
export function ray_intersection(point_a, vec_a, point_b, vec_b) {
    const start_to_end = vec_sub(point_b, point_a);
    const vec_ratio = lineq2(vec_a, vec_scale(vec_b, -1), start_to_end);
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    if (vec_ratio[0] < 0 || vec_ratio[1] < 0) return null;
    return vec_add(point_a, vec_scale(vec_a, vec_ratio[0]))
}
// Only for 2D
export function ray_seg_intersection(point_a, vec_a, start_b, end_b) {
    const vec_ratio = lineq2(vec_a, vec_scale(vec_sub(end_b, start_b), -1), vec_sub(start_b, point_a));
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    if (vec_ratio[0] < 0 || vec_ratio[1] < 0 || vec_ratio[1] > 1) return null;
    return vec_add(point_a, vec_scale(vec_a, vec_ratio[0]));
}
// Only for 2D
export function seg_intersection(start_a, end_a, start_b, end_b) {
    const vec_ratio = lineq2(vec_sub(end_a, start_a), vec_scale(vec_sub(end_b, start_b), -1), vec_sub(start_b, start_a));
    if (vec_ratio === "infinite") return null;
    if (vec_ratio === "none") return null;
    if (vec_ratio[0] < 0 || vec_ratio[0] > 1 || vec_ratio[1] < 0 || vec_ratio[1] > 1) return null;
    return vec_add(start_a, vec_scale(vec_sub(end_a, start_a), vec_ratio[0]));
}
export function point_to_line_point(point, origin, dir) {
    if (vec_len(dir) === 0) return origin;
    const v = vec_sub(point, origin);
    const unit_dir = vec_unit(dir);
    const proj = vec_scale(unit_dir, vec_dot(v, unit_dir));
    return vec_add(origin, proj);
}
export function point_to_line_dist(point, origin, dir) {
    const line_point = point_to_line_point(point, origin, dir);
    return vec_len(vec_sub(point, line_point));
}
export function point_to_seg_point(point, start, end) {
    const seg_vec = vec_sub(end, start);
    if (vec_len(seg_vec) === 0) return start;
    const to_start = vec_sub(point, start);
    if (vec_dot(to_start, seg_vec) < 0) return start;
    if (vec_dot(vec_sub(point, end), vec_sub(start, end)) < 0) return end;
    return point_to_line_point(point, start, seg_vec);
}
export function point_to_seg_dist(point, start, end) {
    return vec_len(vec_sub(point, point_to_seg_point(point, start, end)));
}