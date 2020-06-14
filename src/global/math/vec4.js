import { vec4 } from "gl-matrix";
import { num } from "./num";

export { vec4 };

vec4.ZERO = vec4.fromValues(0, 0, 0, 0);

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

/**
 * Converts from linear color to rgba
 * @param {vec4} out
 * @param {vec4} linear
 * @param {boolean} [denormalizeAlpha]
 * @returns {vec4}
 */
vec4.toRGBA = function(out, linear, denormalizeAlpha)
{
    out[0] = num.colorFromLinear(linear[0]);
    out[1] = num.colorFromLinear(linear[1]);
    out[2] = num.colorFromLinear(linear[2]);
    out[3] = denormalizeAlpha ? num.colorFromLinear(linear[3]) : linear[3];
    return out;
};

/**
 * Converts to linear color from rgba
 * @param {vec4} out
 * @param {vec4} rgba
 * @param {boolean} [denormalizedAlpha]
 * @returns {vec4} out
 */
vec4.fromRGBA = function(out, rgba, denormalizedAlpha)
{
    out[0] = num.linearFromColor(rgba[0]);
    out[1] = num.linearFromColor(rgba[1]);
    out[2] = num.linearFromColor(rgba[2]);
    out[3] = denormalizedAlpha ? num.linearFromColor(rgba[3]) : rgba[3];
    return out;
};

/**
 * Converts to linear color from rgb
 * @param {vec4} out
 * @param {vec3} rgb
 * @param {Number} [alpha=1]
 * @returns {vec4} out
 */
vec4.fromRGB = function(out, rgb, alpha=1)
{
    out[0] = num.linearFromColor(rgb[0]);
    out[1] = num.linearFromColor(rgb[1]);
    out[2] = num.linearFromColor(rgb[2]);
    out[3] = alpha;
    return out;
};

/**
 * Gets hex value from linear color
 * @param {vec4} linear
 * @returns {string} hex value
 */
vec4.hex = function(linear)
{
    return "#" +
        num.hexFromLinear(linear[0]) +
        num.hexFromLinear(linear[1]) +
        num.hexFromLinear(linear[2]) +
        num.hexFromLinear(linear[3]);
};
