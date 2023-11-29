import { vec3, mat4 } from "gl-matrix";
import { num } from "./num";
import { pool } from "./pool";
import { vec4 } from "./vec4";

/**
 * Vector 3
 * @typedef {Float32Array} vec3
 */

/**
 * Allocates a pooled vec3
 * @returns {Float32Array|vec3}
 */
vec3.alloc = function ()
{
    return pool.allocF32(3);
};

/**
 * Unallocates a pooled vec3
 * @param {vec3|Float32Array} a
 */
vec3.unalloc = function (a)
{
    pool.freeType(a);
};

/**
 * X_AXIS
 * @type {vec3}
 */
vec3.X_AXIS = vec3.fromValues(1, 0, 0);

/**
 * Y Axis
 * @type {vec3}
 */
vec3.Y_AXIS = vec3.fromValues(0, 1, 0);

/**
 * Z Axis
 * @type {vec3}
 */
vec3.Z_AXIS = vec3.fromValues(0, 0, 1);


/**
 * Adds a scalar to a vec3
 *
 * @param {vec3} out
 * @param {vec3} a
 * @param {Number} s
 * @returns {vec3} out
 */
vec3.addScalar = function (out, a, s)
{
    out[0] = a[0] + s;
    out[1] = a[1] + s;
    out[2] = a[2] + s;
    return out;
};

/**
 * Converts radians to degrees
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.degrees = function (out, a)
{
    out[0] = num.degrees(a[0]);
    out[1] = num.degrees(a[1]);
    out[2] = num.degrees(a[2]);
    return out;
};

/**
 * Converts radians to unwrapped degrees
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.degreesUnwrapped = function (out, a)
{
    out[0] = num.degreesUnwrapped(a[0]);
    out[1] = num.degreesUnwrapped(a[1]);
    out[2] = num.degreesUnwrapped(a[2]);
    return out;
};

/**
 * Gets normalized direction between two points
 * @param {vec3} out
 * @param {vec3} a
 * @param {vec3} b
 * @returns {vec3}
 */
vec3.direction = function (out, a, b)
{
    vec3.subtract(out, a, b);
    vec3.normalize(out, out);
    return out;
};

/**
 * Gets the direction from a quat
 * @param {vec3} out
 * @param {vec3} axis
 * @param {quat} q
 * @returns {vec3} out
 */
vec3.directionFromQuat = function (out, axis, q)
{
    return vec3.transformQuat(out, axis, q);
};

/**
 * Gets the direction from a mat4's axis
 * @param {vec3} out
 * @param {vec3} axis
 * @param {mat4} m
 * @returns {vec3} out
 */
vec3.directionFromMat4 = function (out, axis, m)
{
    const quat_0 = mat4.getRotation(vec4.alloc(), m);
    vec3.transformQuat(out, axis, quat_0);
    vec4.unalloc(quat_0);
    return out;
};

/**
 * Divides a vec3 by a scalar
 *
 * @param {vec3} out
 * @param {vec3} a
 * @param {Number} s
 * @returns {vec3} out
 */
vec3.divideScalar = function (out, a, s)
{
    return vec3.multiplyScalar(out, a, 1 / s);
};

/**
 * Euler functions
 * @type {{*}}
 */
vec3.euler = {};

/**
 * Default euler order
 * @type {string}
 */
vec3.euler.DEFAULT_ORDER = "XYZ";


/**
 * Sets a euler from a quat
 *
 * @param {vec3} out
 * @param {quat} q
 * @param {string} [order=vec3.euler.DEFAULT_ORDER]
 * @returns {vec3} out
 */
vec3.euler.fromQuat = function (out, q, order = vec3.euler.DEFAULT_ORDER)
{
    // mat4.alloc
    const mat4_0 = mat4.fromQuat(pool.allocF32(16), q);
    vec3.euler.fromMat4(out, mat4_0, order);
    pool.unalloc(mat4_0);
    return out;
};

/**
 * Sets a euler from a mat4
 *
 * @author three.js (converted)
 * @param {vec3} out
 * @param {mat4} m
 * @param {string} [order=vec3.euler.DEFAULT_ORDER]
 * @returns {vec3} out
 */
vec3.euler.fromMat4 = function (out, m, order = vec3.euler.DEFAULT_ORDER)
{
    const
        m11 = m[0], m12 = m[4], m13 = m[8],
        m21 = m[1], m22 = m[5], m23 = m[9],
        m31 = m[2], m32 = m[6], m33 = m[10];

    const clamp = num.clamp;

    if (order === "XYZ")
    {
        out[1] = Math.asin(clamp(m13, -1, 1));
        if (Math.abs(m13) < 0.99999)
        {
            out[0] = Math.atan2(-m23, m33);
            out[2] = Math.atan2(-m12, m11);
        }
        else
        {
            out[0] = Math.atan2(m32, m22);
            out[2] = 0;
        }
    }
    else if (order === "YXZ")
    {
        out[0] = Math.asin(-clamp(m23, -1, 1));
        if (Math.abs(m23) < 0.99999)
        {
            out[1] = Math.atan2(m13, m33);
            out[2] = Math.atan2(m21, m22);
        }
        else
        {
            out[1] = Math.atan2(-m31, m11);
            out[2] = 0;
        }
    }
    else if (order === "ZXY")
    {
        out[0] = Math.asin(clamp(m32, -1, 1));
        if (Math.abs(m32) < 0.99999)
        {
            out[1] = Math.atan2(-m31, m33);
            out[2] = Math.atan2(-m12, m22);
        }
        else
        {
            out[1] = 0;
            out[2] = Math.atan2(m21, m11);
        }
    }
    else if (order === "ZYX")
    {
        out[1] = Math.asin(-clamp(m31, -1, 1));
        if (Math.abs(m31) < 0.99999)
        {
            out[0] = Math.atan2(m32, m33);
            out[2] = Math.atan2(m21, m11);
        }
        else
        {
            out[0] = 0;
            out[2] = Math.atan2(-m12, m22);
        }
    }
    else if (order === "YZX")
    {
        out[2] = Math.asin(clamp(m21, -1, 1));
        if (Math.abs(m21) < 0.99999)
        {
            out[0] = Math.atan2(-m23, m22);
            out[1] = Math.atan2(-m31, m11);
        }
        else
        {
            out[0] = 0;
            out[1] = Math.atan2(m13, m33);
        }
    }
    else if (order === "XZY")
    {
        out[2] = Math.asin(-clamp(m12, -1, 1));
        if (Math.abs(m12) < 0.99999)
        {
            out[0] = Math.atan2(m32, m22);
            out[1] = Math.atan2(m13, m11);
        }
        else
        {
            out[0] = Math.atan2(-m23, m33);
            out[1] = 0;
        }
    }
    else
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        throw new Error("Unrecognised euler order: " + order);
    }

    return out;
};

/**
 * Gets a quat from a euler
 * - Differs from quat.getEuler as it allows for different euler ordering
 *
 * - http://www.mathworks.com/matlabcentral/fileexchange/
 * - 20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
 * - content/SpinCalc.m
 *
 * @param {quat} out
 * @param {vec3} euler
 * @param [order=vec3.euler.DEFAULT_ORDER]
 * @returns {quat} out
 */
vec3.euler.getQuat = function (out, euler, order = vec3.euler.DEFAULT_ORDER)
{
    const
        x = euler[0],
        y = euler[1],
        z = euler[2];

    const
        cosYaw = Math.cos(x / 2),
        cosPitch = Math.cos(y / 2),
        cosRoll = Math.cos(z / 2),
        sinYaw = Math.sin(x / 2),
        sinPitch = Math.sin(y / 2),
        sinRoll = Math.sin(z / 2);

    if (order === "XYZ")
    {
        out[0] = sinYaw * cosPitch * cosRoll + cosYaw * sinPitch * sinRoll;
        out[1] = cosYaw * sinPitch * cosRoll - sinYaw * cosPitch * sinRoll;
        out[2] = cosYaw * cosPitch * sinRoll + sinYaw * sinPitch * cosRoll;
        out[3] = cosYaw * cosPitch * cosRoll - sinYaw * sinPitch * sinRoll;
    }
    else if (order === "YXZ")
    {
        out[0] = sinYaw * cosPitch * cosRoll + cosYaw * sinPitch * sinRoll;
        out[1] = cosYaw * sinPitch * cosRoll - sinYaw * cosPitch * sinRoll;
        out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    }
    else if (order === "ZXY")
    {
        out[0] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        out[1] = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
        out[2] = cosYaw * cosPitch * sinRoll + sinYaw * sinPitch * cosRoll;
        out[3] = cosYaw * cosPitch * cosRoll - sinYaw * sinPitch * sinRoll;
    }
    else if (order === "ZYX")
    {
        out[0] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        out[1] = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
        out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    }
    else if (order === "YZX")
    {
        out[0] = sinYaw * cosPitch * cosRoll + cosYaw * sinPitch * sinRoll;
        out[1] = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
        out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        out[3] = cosYaw * cosPitch * cosRoll - sinYaw * sinPitch * sinRoll;
    }
    else if (order === "XZY")
    {
        out[0] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        out[1] = cosYaw * sinPitch * cosRoll - sinYaw * cosPitch * sinRoll;
        out[2] = cosYaw * cosPitch * sinRoll + sinYaw * sinPitch * cosRoll;
        out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    }
    else
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        throw new Error("Unrecognised euler order: " + order);
    }
    return out;
};


/**
 * Gets a quat from a euler values
 *
 * @param {quat} out
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @param {String} [order]
 * @return {quat} out
 */
vec3.euler.getQuatFromValues = function (out, x, y, z, order)
{
    const vec3_0 = vec3.set(vec3.alloc(), x, y, z);
    vec3.euler.getQuat(out, vec3_0, order);
    vec3.unalloc(vec3_0);
    return out;
};

/**
 * Gets a quat from a euler that uses degrees
 *
 * @param {quat} out
 * @param {vec3} v
 * @param {String} [order]
 * @return {quat} out
 */
vec3.euler.getQuatFromDegrees = function (out, v, order)
{
    const vec3_0 = vec3.radians(vec3.alloc(), v);
    vec3.euler.getQuat(out, vec3_0, order);
    vec3.unalloc(vec3_0);
    return out;
};

/**
 * Gets a quat from euler degree values
 *
 * @param {quat} out
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @param {String} [order]
 * @return {quat} out
 */
vec3.euler.getQuatFromDegreeValues = function (out, x, y, z, order)
{
    const vec3_0 = vec3.set(vec3.alloc(), x, y, z);
    vec3.radians(vec3_0, vec3_0);
    vec3.euler.getQuat(out, vec3_0, order);
    vec3.unalloc(vec3_0);
    return out;
};

/**
 * Sets a euler from quat, and stores in degrees
 *
 * @param {vec3} out
 * @param {quat} q
 * @param {String} [order]
 * @return {vec3} out
 */
vec3.euler.fromQuatInDegrees = function (out, q, order)
{
    vec3.euler.fromQuat(out, q, order);
    return vec3.degrees(out, out);
};

/**
 * Exponential decay
 *
 * @param {vec3} out
 * @param {vec3} omega0
 * @param {vec3} torque
 * @param {number} I
 * @param {number} drag
 * @param {number} time
 * @returns {vec3} out
 */
vec3.exponentialDecay = function (out, omega0, torque, I, drag, time)
{
    out[0] = num.exponentialDecay(omega0[0], torque[0], I, drag, time);
    out[1] = num.exponentialDecay(omega0[1], torque[1], I, drag, time);
    out[2] = num.exponentialDecay(omega0[2], torque[2], I, drag, time);
    return out;
};

/**
 * Creates a spherical
 * @returns {vec3}
 */
vec3.createSpherical = function ()
{
    return vec3.fromValues(0, 0, 1);
};

/**
 * Sets a vec3 with cartesian coordinates from spherical coordinates and an optional center point
 * @param {vec3} out       - receiving vec3
 * @param {vec3} spherical - source vec3 with spherical coordinates (phi, theta, radius)
 * @param {vec3} [center]  - Optional center
 * @returns {vec3} out     - receiving vec3
 */
vec3.fromSpherical = function (out, spherical, center)
{
    const
        phi = spherical[0],
        theta = spherical[1],
        radius = spherical[2];

    out[0] = radius * Math.sin(phi) * Math.sin(theta);
    out[1] = radius * Math.cos(theta);
    out[2] = radius * Math.cos(phi) * Math.sin(theta);

    if (center)
    {
        out[0] += center[0];
        out[1] += center[1];
        out[2] += center[2];
    }

    return out;
};

/**
 * Gets spherical coordinates from a vector
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.getSpherical = function (out, a)
{
    let phi = 0,
        theta = 0,
        radius = vec3.length(a);

    if (radius !== 0)
    {
        phi = Math.acos(num.clamp(a[1] / radius, -1, 1));
        theta = Math.atan2(a[0], a[2]);
    }

    out[0] = phi;
    out[1] = theta;
    out[2] = radius;
    return out;
};

/**
 * Makes a spherical value "safe"
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.makeSphericalSafe = function (out, a)
{
    out[0] = Math.max(num.EPSILON, Math.min(Math.PI - num.EPSILON, a[0]));
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Checks if all elements are 0
 * @param {vec3} a
 * @returns {boolean}
 */
vec3.isEmpty = function (a)
{
    return a[0] === 0 && a[1] === 0 && a[2] === 0;
};

/**
 * Multiplies a vec3 by a scalar
 *
 * @param {vec3} out
 * @param {vec3} a
 * @param {Number} s
 * @returns {vec3} out
 */
vec3.multiplyScalar = function (out, a, s)
{
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
};

/**
 * Converts from long, lat and radius to a vector
 * @param {vec3} out
 * @param {Number} radius
 * @param {Number} latitude
 * @param {Number} longitude
 * @returns {vec3} out
 */
vec3.polarToCartesian = function (out, radius, latitude, longitude)
{
    out[0] = radius * Math.cos(latitude) * Math.sin(longitude);
    out[1] = radius * Math.sin(latitude);
    out[2] = radius * Math.cos(latitude) * Math.cos(longitude);
    return out;
};

/**
 * Projects a world vec3 to screen space with viewport settings
 * @param {vec3} out           - receiving vec3
 * @param {vec3} a             - local vec3
 * @param {mat4} m             - model view projection matrix
 * @param {vec4} viewport      - view port settings (x, y, width, height)
 * @returns {vec3} out         - receiving vec3 (x, y, perspectiveDivide)
 */
vec3.project = function (out, a, m, viewport)
{
    let x = a[0],
        y = a[1],
        z = a[2];

    let outX = m[0] * x + m[4] * y + m[8] * z + m[12],
        outY = m[1] * x + m[5] * y + m[9] * z + m[13],
        perD = m[3] * x + m[7] * y + m[11] * z + m[15];

    let projectionX = (outX / perD + 1) / 2;
    let projectionY = 1 - (outY / perD + 1) / 2;

    out[0] = projectionX * viewport[2] + viewport[0];
    out[1] = projectionY * viewport[3] + viewport[1];
    out[2] = perD;
    return out;
};

/**
 * Converts degrees to radians
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.radians = function (out, a)
{
    out[0] = num.radians(a[0]);
    out[1] = num.radians(a[1]);
    out[2] = num.radians(a[2]);
    return out;
};

/**
 * Converts degrees to unwrapped radians
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.radiansUnwrapped = function (out, a)
{
    out[0] = num.radiansUnwrapped(a[0]);
    out[1] = num.radiansUnwrapped(a[1]);
    out[2] = num.radiansUnwrapped(a[2]);
    return out;
};

/**
 * Sets a vec3 from a scalar
 *
 * @param {vec3} out
 * @param {Number} s
 * @returns {vec3} out
 */
vec3.setScalar = function (out, s)
{
    out[0] = s;
    out[1] = s;
    out[2] = s;
    return out;
};

/**
 * Subtracts a scalar from a vec3
 *
 * @param {vec3} out
 * @param {vec3} a
 * @param {Number} s
 * @returns {vec3} out
 */
vec3.subtractScalar = function (out, a, s)
{
    out[0] = a[0] - s;
    out[1] = a[1] - s;
    out[2] = a[2] - s;
    return out;
};

/**
 * Unprojects a vec3 with canvas coordinates to world space
 *
 * @param {vec3} out            - receiving vec3
 * @param {vec3} a              - vec3 to unproject
 * @param {mat4} invViewProj    - inverse view projection matrix
 * @param {vec4|Array} viewport - [ x, y, width, height ]
 * @returns {vec3} out
 * @throw On perspective divide error
 */
vec3.unproject = function (out, a, invViewProj, viewport)
{
    const vec4_0 = vec4.alloc(4);

    let x = a[0],
        y = a[1],
        z = a[2];

    vec4_0[0] = (x - viewport[0]) * 2.0 / viewport[2] - 1.0;
    vec4_0[1] = (y - viewport[1]) * 2.0 / viewport[3] - 1.0;
    vec4_0[2] = 2.0 * z - 1.0;
    vec4_0[3] = 1.0;

    vec4.transformMat4(vec4_0, vec4_0, invViewProj);

    if (vec4_0[3] === 0.0)
    {
        vec4.unalloc(vec4_0);
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        throw new Error("Perspective divide error");
    }

    out[0] = vec4_0[0] / vec4_0[3];
    out[1] = vec4_0[1] / vec4_0[3];
    out[2] = vec4_0[2] / vec4_0[3];

    vec4.unalloc(vec4_0);

    return out;
};

/**
 * Unwraps degrees
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3}
 */
vec3.unwrapDegrees = function (out, a)
{
    out[0] = num.unwrapDegrees(a[0]);
    out[1] = num.unwrapDegrees(a[1]);
    out[2] = num.unwrapDegrees(a[2]);
    return out;
};

/**
 * Unwraps radians
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3}
 */
vec3.unwrapRadians = function (out, a)
{
    out[0] = num.unwrapRadians(a[0]);
    out[1] = num.unwrapRadians(a[1]);
    out[2] = num.unwrapRadians(a[2]);
    return out;
};

/**
 * Converts from linear color to rgb
 * @param {vec3} out
 * @param {vec3} linear
 * @returns {vec3}
 */
vec3.toRGB = function (out, linear)
{
    out[0] = num.colorFromLinear(linear[0]);
    out[1] = num.colorFromLinear(linear[1]);
    out[2] = num.colorFromLinear(linear[2]);
    return out;
};

/**
 * Converts from linear color to rgba
 * @param {vec4} out
 * @param {vec3} linear
 * @param {Number} [linearAlpha=1]
 * @return {vec4} out
 */
vec3.toRGBA = function (out, linear, linearAlpha = 1)
{
    out[0] = num.colorFromLinear(linear[0]);
    out[1] = num.colorFromLinear(linear[1]);
    out[2] = num.colorFromLinear(linear[2]);
    out[3] = num.colorFromLinear(linearAlpha);
    return out;
};

/**
 * Converts to linear color from rgba
 * @param {vec3} out
 * @param {vec3} rgb
 * @returns {vec3} out
 */
vec3.fromRGB = function (out, rgb)
{
    out[0] = num.linearFromColor(rgb[0]);
    out[1] = num.linearFromColor(rgb[1]);
    out[2] = num.linearFromColor(rgb[2]);
    return out;
};

/**
 * Gets hex value from linear color
 * @param {vec4} linear
 * @returns {string} hex value
 */
vec3.toHex = function (linear)
{
    return "#" +
        num.hexFromLinear(linear[0]) +
        num.hexFromLinear(linear[1]) +
        num.hexFromLinear(linear[2]);
};

/**
 * Gets hex rgba from linear colour
 * @param {vec3}  linear
 * @param {Number} [linearAlpha=1]
 * @return {string}
 */
vec3.toHexA = function (linear, linearAlpha = 1)
{
    return "#" +
        num.hexFromLinear(linear[0]) +
        num.hexFromLinear(linear[1]) +
        num.hexFromLinear(linear[2]) +
        num.hexFromColor(linearAlpha);
};

/**
 * Gets RGB from hex
 * @param {vec3} out
 * @param {String} hex
 * @return {vec3} out
 */
vec3.fromHex = function (out, hex)
{
    // Set empty color in case of error
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;

    if (hex.length === 4 || hex.length === 5)
    {
        out[0] = ("0x" + hex[1] + hex[1]) / 255;
        out[1] = ("0x" + hex[2] + hex[2]) / 255;
        out[2] = ("0x" + hex[3] + hex[3]) / 255;
    }
    // RGB hex
    else if (hex.length === 7 || hex.length === 9)
    {
        out[0] = ("0x" + hex[1] + hex[2]) / 255;
        out[1] = ("0x" + hex[3] + hex[4]) / 255;
        out[2] = ("0x" + hex[5] + hex[6]) / 255;
    }
    else
    {
        throw new TypeError("Invalid hex");
    }

    return out;
};


vec3.linearToHSV = function (out, linear)
{
    let rabs,
        gabs,
        babs, rr,
        gg, bb,
        h,
        s,
        v,
        diff,
        diffc,
        percentRoundFn;

    rabs = linear[0];
    gabs = linear[1];
    babs = linear[2];

    v = Math.max(rabs, gabs, babs);
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;

    if (diff == 0)
    {
        h = s = 0;
    }
    else
    {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v)
        {
            h = bb - gg;
        }
        else if (gabs === v)
        {
            h = (1 / 3) + rr - bb;
        }
        else if (babs === v)
        {
            h = (2 / 3) + gg - rr;
        }

        if (h < 0)
        {
            h += 1;
        }
        else if (h > 1)
        {
            h -= 1;
        }
    }

    out[0] = Math.round(h * 360);
    out[1] = percentRoundFn(s * 100);
    out[2] = percentRoundFn(v * 100);
    return out;
};

/**
 * Sets a vec3 from an array with an optional offset
 * @param {vec3} out
 * @param {TypedArray|Array} array
 * @param {Number} [offset=0]
 * @returns {vec3} out
 */
vec3.fromArray = function (out, array, offset = 0)
{
    out[0] = array[offset];
    out[1] = array[offset + 1];
    out[2] = array[offset + 2];
    return out;
};

/**
 * Sets a vec3 from a mat4 column
 * @param {vec3} out
 * @param {mat4} m
 * @param {Number} index
 * @returns {vec3} out
 */
vec3.fromMat4Column = function (out, m, index)
{
    return vec3.fromArray(out, m, index * 4);
};

/**
 * Sets a vec3 from a mat3 column
 * @param {vec3} out
 * @param {mat4} m
 * @param {Number} index
 * @returns {vec3} out
 */
vec3.fromMat3Column = function (out, m, index)
{
    return vec3.fromArray(out, m, index * 3);
};

/**
 * Converts srgb to linear colour
 * @param {vec3} out
 * @param {vec3} srgb
 * @returns {vec3} out
 */
vec3.fromSRGB = function (out, srgb)
{
    out[0] = num.linearFromSRGB(srgb[0]);
    out[1] = num.linearFromSRGB(srgb[0]);
    out[2] = num.linearFromSRGB(srgb[0]);
    return out;
};

/**
 * Converts linear colour to srgb
 * @param {vec3} out
 * @param {vec3} srgb
 * @returns {vec3} out
 */
vec3.toSRGB = function (out, linear)
{
    out[0] = num.srgbFromLinear(linear[0]);
    out[1] = num.srgbFromLinear(linear[0]);
    out[2] = num.srgbFromLinear(linear[0]);
    return out;
};

/**
 * Three js
 * Todo: replace with glMatrix
 */
vec3.applyQuaternion = function (out, a, q)
{

    const
        x = a[0],
        y = a[1],
        z = a[2],
        qx = q[0],
        qy = q[1],
        qz = q[2],
        qw = q[3];

    // calculate quat * vector
    const
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return out;
};


export { vec3 };
