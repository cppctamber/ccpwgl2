import { vec4 } from "gl-matrix";

export { vec4 };

vec4.ZERO = vec4.fromValues(0,0,0,0);

/**
 * Adds a scalar to a vec4
 *
 * @param {vec4} out
 * @param {vec4} a
 * @param {Number} s
 * @returns {vec4} out
 */
vec4.addScalar = function(out, a, s)
{
    out[0] = a[0] + s;
    out[1] = a[1] + s;
    out[2] = a[2] + s;
    out[3] = a[3] + s;
    return out;
};

/**
 * Checks if all elements are 0
 * @param {vec4} a
 * @returns {boolean}
 */
vec4.isEmpty = function(a)
{
    return a[0] === 0 && a[1] === 0 && a[2] === 0 && a[3] === 0;
};

/**
 * Divides a vec4 by a scalar
 *
 * @param {vec4} out
 * @param {vec4} a
 * @param {Number} s
 * @returns {vec4} out
 */
vec4.divideScalar = function(out, a, s)
{
    return vec4.multiplyScalar(out, a, 1 / s);
};


/**
 * Multiplies a vec4 by a scalar
 *
 * @param {vec4} out
 * @param {vec4} a
 * @param {Number} s
 * @returns {vec4} out
 */
vec4.multiplyScalar = function(out, a, s)
{
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    return out;
};

/**
 * Sets a vec4 from a scalar
 *
 * @param {vec4} out
 * @param {Number} s
 * @returns {vec4} out
 */
vec4.setScalar = function(out, s)
{
    out[0] = s;
    out[1] = s;
    out[2] = s;
    out[3] = s;
    return out;
};

/**
 * Subtracts a scalar from a vec4
 *
 * @param {vec4} out
 * @param {vec4} a
 * @param {Number} s
 * @returns {vec4} out
 */
vec4.subtractScalar = function(out, a, s)
{
    out[0] = a[0] - s;
    out[1] = a[1] - s;
    out[2] = a[2] - s;
    out[3] = a[3] - s;
    return out;
};
