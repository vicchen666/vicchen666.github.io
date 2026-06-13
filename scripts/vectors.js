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