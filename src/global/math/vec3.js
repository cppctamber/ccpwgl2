import {vec3, vec4, mat4} from "gl-matrix";
import {num} from "./num";

export {vec3};

/**
 * Vector 3
 * @typedef {Float32Array} vec3
 */

/**
 * Adds a scalar to a vec3
 *
 * @param {vec3} out
 * @param {vec3} a
 * @param {Number} s
 * @returns {vec3} out
 */
vec3.addScalar = function(out, a, s)
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
vec3.degrees = function(out, a)
{
    out[0] = a[0] * num.RAD2DEG;
    out[1] = a[1] * num.RAD2DEG;
    out[2] = a[2] * num.RAD2DEG;
    return out;
};

/**
 * Converts radians to unwrapped degrees
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.degreesUnwrapped = function(out, a)
{
    out[0] = num.unwrapDegrees(a[0] * num.RAD2DEG);
    out[1] = num.unwrapDegrees(a[1] * num.RAD2DEG);
    out[2] = num.unwrapDegrees(a[2] * num.RAD2DEG);
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
vec3.divideScalar = function(out, a, s)
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
vec3.euler.fromQuat = (function()
{
    let mat4_0;

    return function(out, q, order = vec3.euler.DEFAULT_ORDER)
    {
        if (!mat4_0) mat4_0 = mat4.create();
        mat4.fromQuat(mat4_0, q);
        return vec3.euler.fromMat4(out, mat4_0, order);
    }

})();

/**
 * Sets a euler from a mat4
 *
 * @author three.js (converted)
 * @param {vec3} out
 * @param {mat4} m
 * @param {string} [order=vec3.euler.DEFAULT_ORDER]
 * @returns {vec3} out
 */
vec3.euler.fromMat4 = function(out, m, order = vec3.euler.DEFAULT_ORDER)
{
    let m11 = m[0], m12 = m[4], m13 = m[8],
        m21 = m[1], m22 = m[5], m23 = m[9],
        m31 = m[2], m32 = m[6], m33 = m[10];

    let clamp = num.clamp;

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
vec3.euler.getQuat = function(out, euler, order = vec3.euler.DEFAULT_ORDER)
{
    const
        x = euler[0],
        y = euler[1],
        z = euler[2];

    order = order.toUpperCase();

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
vec3.exponentialDecay = function(out, omega0, torque, I, drag, time)
{
    out[0] = num.exponentialDecay(omega0[0], torque[0], I, drag, time);
    out[1] = num.exponentialDecay(omega0[1], torque[1], I, drag, time);
    out[2] = num.exponentialDecay(omega0[2], torque[2], I, drag, time);
    return out;
};

/**
 * Sets a vec3 with cartesian coordinates from spherical coordinates and an optional center point
 * @param {vec3} out       - receiving vec3
 * @param {vec3} spherical - source vec3 with spherical coordinates (phi, theta, radius)
 * @param {vec3} [center]  - Optional center
 * @returns {vec3} out     - receiving vec3
 */
vec3.fromSpherical = function(out, spherical, center)
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
vec3.getSpherical = function(out, a)
{
    let phi = 0,
        theta = 0,
        radius = vec3.length(a);

    if (radius !== 0)
    {
        phi = Math.acos(Math.max(a[1] / radius, Math.min(-1, 1)));
        theta = Math.atan2(a[0], a[2]);
    }

    out[0] = phi;
    out[1] = theta;
    out[2] = radius;
    return out;
};

/**
 * Checks if all elements are 0
 * @param {vec3} a
 * @returns {boolean}
 */
vec3.isEmpty = function(a)
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
vec3.multiplyScalar = function(out, a, s)
{
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
};

/**
 * Projects a local vec3 to screen space with viewport settings
 * @param {vec3} out           - receiving vec3
 * @param {vec3} a             - local vec3
 * @param {mat4} m             - model view projection matrix
 * @param {vec4} viewport      - view port settings (x, y, width, height)
 * @returns {vec3} out         - receiving vec3 (x, y, perspectiveDivide)
 */
vec3.project = function(out, a, m, viewport)
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
vec3.radians = function(out, a)
{
    out[0] = a[0] * num.DEG2RAD;
    out[1] = a[1] * num.DEG2RAD;
    out[2] = a[2] * num.DEG2RAD;
    return out;
};

/**
 * Converts degrees to unwrapped radians
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3} out
 */
vec3.radiansUnwrapped = function(out, a)
{
    out[0] = num.unwrapRadians(a[0] * num.DEG2RAD);
    out[1] = num.unwrapRadians(a[1] * num.DEG2RAD);
    out[2] = num.unwrapRadians(a[2] * num.DEG2RAD);
    return out;
};

/**
 * Sets a vec3 from a scalar
 *
 * @param {vec3} out
 * @param {Number} s
 * @returns {vec3} out
 */
vec3.setScalar = function(out, s)
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
vec3.subtractScalar = function(out, a, s)
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
vec3.unproject = (function()
{
    let vec4_0;

    return function unProject(out, a, invViewProj, viewport)
    {
        if (!vec4_0)
        {
            vec4_0 = vec4.create();
        }

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
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            throw new Error("Perspective divide error");
        }

        out[0] = vec4_0[0] / vec4_0[3];
        out[1] = vec4_0[1] / vec4_0[3];
        out[2] = vec4_0[2] / vec4_0[3];
        return out;
    };
});

/**
 * Unwraps degrees
 *
 * @param {vec3} out
 * @param {vec3} a
 * @returns {vec3}
 */
vec3.unwrapDegrees = function(out, a)
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
vec3.unwrapRadians = function(out, a)
{
    out[0] = num.unwrapRadians(a[0]);
    out[1] = num.unwrapRadians(a[1]);
    out[2] = num.unwrapRadians(a[2]);
    return out;
};