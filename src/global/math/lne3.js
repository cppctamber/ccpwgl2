import {vec3} from "./vec3";
import {box3} from "./box3";

/**
 * 3D Line
 * @typedef {Float32Array} lne3
 */
export const lne3 = {};

/**
 * Line3 End methods
 *
 * @param {lne3} a
 * @returns {TypedArray}
 */
lne3.$end = box3.$max;

/**
 * Line3 start helper methods
 *
 * @param {lne3} a
 * @returns {TypedArray}
 */
lne3.$start = box3.$min;

/**
 * Clones a lne3
 *
 * @param {lne3} a
 * @returns {lne3}
 */
lne3.clone = box3.clone;

/**
 * Returns a point parameter based on the closest point as projected on the line segment.
 * If clamp to line is true, then the returned value will be between 0 and 1
 *
 * @author three.js authors (converted)
 * @param {vec3} a              - source lne3
 * @param {vec3} point          - point to compare
 * @param {boolean} clampToLine - optional setting to clamp the result to the lne3
 * @returns {number}            - closest point parameter
 */
lne3.closestPointToPointParameter = (function()
{
    let vec3_0, vec3_1;

    return function(a, point, clampToLine)
    {
        if (!vec3_0)
        {
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
        }

        let startP = vec3_0;
        let startEnd = vec3_1;

        startP[0] = point[0] - a[0];
        startP[1] = point[1] - a[1];
        startP[2] = point[2] - a[2];

        startEnd[0] = a[3] - a[0];
        startEnd[1] = a[4] - a[1];
        startEnd[2] = a[5] - a[2];

        let startEnd2 = startEnd[0] * startEnd[0] + startEnd[1] * startEnd[1] + startEnd[2] * startEnd[2];
        let startEnd_startP = startEnd[0] * startP[0] + startEnd[1] * startP[1] + startEnd[2] * startP[2];
        let t = startEnd_startP / startEnd2;

        if (clampToLine) t = Math.max(0, Math.min(1, t));
        return t;
    };
});

/**
 * Copies the values from one lne3 into another
 *
 * @param {lne3} out
 * @param {lne3} a
 * @returns {lne3} out
 */
lne3.copy = box3.copy;

/**
 * Copies the start component from one lne3 into another
 *
 * @param {lne3} out
 * @param {lne3} a
 * @returns {lne3} out
 */
lne3.copyStart = vec3.copy;

/**
 * Copies the end component from one lne3 into another
 *
 * @param {lne3} out
 * @param {lne3} a
 * @returns {lne3} out
 */
lne3.copyEnd = box3.copyMax;

/**
 * Creates a lne3
 *
 * @returns {lne3}
 */
lne3.create = box3.create;

/**
 * Checks two lne3's for equality
 *
 * @param {lne3} a
 * @param {lne3} b
 * @returns {boolean}
 */
lne3.equals = box3.equals;

/**
 * Checks a lne3 against it's components for equality
 *
 * @param {lne3} a
 * @param {vec3} min
 * @param {vec3} max
 * @returns {boolean}
 */
lne3.equalsStartEnd = box3.equalsBounds;

/**
 * Checks for box3 exact equality
 *
 * @param {lne3} a
 * @param {lne3} b
 * @returns {boolean}
 */
lne3.exactEquals = box3.equals;

/**
 * Checks for exact equality between a lne3 and components
 *
 * @param {lne3} a
 * @param {vec3} min
 * @param {vec3} max
 * @returns {boolean}
 */
lne3.exactEqualsStartEnd = box3.exactEqualsBounds;

/**
 * Sets a lne3 from an array at an optional offset
 *
 * @param {lne3} out
 * @param {Array} arr
 * @param {number} [index=0]
 * @returns {lne3}
 */
lne3.fromArray = box3.fromArray;

/**
 * Sets a line from start and end components
 *
 * @param {lne3} out
 * @param {vec3} start
 * @param {vec3} end
 * @returns {lne3} out
 */
lne3.fromStartEnd = box3.fromBounds;

/**
 * Returns a vector at a certain position along a lne3
 *
 * @author three.js authors (converted)
 * @param {vec3} out     - receiving vec3
 * @param {lne3} a       - source lne3
 * @param {number} t     - Float representing the start (0) and end (1) of the line
 * @returns {vec3} [out] - receiving vec3
 */
lne3.get = function(out, a, t)
{
    if (t < 0 || t > 1)
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        throw new Error("Normalization error");
    }
    else
    {
        out[0] = (a[3] - a[0]) * t + a[0];
        out[1] = (a[4] - a[1]) * t + a[1];
        out[2] = (a[5] - a[2]) * t + a[2];
    }
    return out;
};

/**
 * Sets a vec3 from the lne3's center
 *
 * @param {vec3} out   - receiving vec3
 * @param {lne3} a     - source lne3
 * @returns {vec3} out - receiving vec3
 */
lne3.getCenter = function(out, a)
{
    out[0] = (a[0] + a[3]) * 0.5;
    out[1] = (a[1] + a[4]) * 0.5;
    out[2] = (a[2] + a[5]) * 0.5;
    return out;
};

/**
 * Returns the closets point on a lne3 to a given point.
 * - If clamp to line is true, then the returned value will be clamped to the line segment.
 *
 * @author three.js authors (converted)
 * @param {vec3} out            - receiving vec3
 * @param {lne3} a              - source lne3
 * @param {vec3} point          - point to compare
 * @param {boolean} clampToLine - optional setting to clamp the result to a line segment
 * @returns {vec3} out          - receiving vec3
 */
lne3.getClosestPointToPoint = function(out, a, point, clampToLine)
{
    // const x = a.subarray(0, 3);
    return lne3.get(out, a, lne3.closestPointToPointParameter(a, point, clampToLine));
};

/**
 * Gets the end component of a lne3
 *
 * @param {vec3} out
 * @param {lne3} a
 * @returns {vec3} out
 */
lne3.getEnd = box3.getMax;

/**
 * Gets a lne3's delta
 *
 * @param {vec3} out   - receiving vec3
 * @param {lne3} a       - source lne3
 * @returns {vec3} out - receiving vec3
 */
lne3.getDelta = function(out, a)
{
    out[0] = a[3] - a[0];
    out[1] = a[4] - a[1];
    out[2] = a[5] - a[2];
    return out;
};

/**
 * Gets the start component of a lne3
 *
 * @param {vec3} out
 * @param {lne3} a
 * @returns {vec3} out
 */
lne3.getStart = box3.getMin;

/**
 * Checks for intersection with a plane's components
 *
 * @param {lne3} a    - receiving lne3
 * @param {vec3} n    - plane normal
 * @param {number} c  - plane constant
 * @returns {boolean}
 */
lne3.intersectsNormalConstant = function(a, n, c)
{
    let startSign = (n[0] * a[0] + n[1] * a[1] + n[2] * a[2]) + c;
    let endSign = (n[0] * a[3] + n[1] * a[4] + n[2] * a[5]) + c;
    return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
};

/**
 * Gets the length of the line
 *
 * @param {lne3} a  - source lne3
 * @returns {number} - distance
 */
lne3.length = function(a)
{
    let x = a[0] - a[3],
        y = a[1] - a[4],
        z = a[2] - a[5];

    return Math.sqrt(x * x + y * y + z * z);
};

/**
 * Sets a lne3 from values
 *
 * @param out - Receiving lne3
 * @param sX
 * @param sY
 * @param sZ
 * @param eX
 * @param eY
 * @param eZ
 * @returns {lne3}
 */
lne3.set = box3.set;

/**
 * Gets the squared length of the lne3
 *
 * @param {lne3} a  - source line
 * @returns {number} - squared distance
 */
lne3.squaredLength = function(a)
{
    let x = a[0] - a[3],
        y = a[1] - a[4],
        z = a[2] - a[5];

    return x * x + y * y + z * z;
};

/**
 * Sets an array from the lne3
 *
 * @param {lne3} a
 * @param {Array} arr
 * @param {number} [index]
 * @returns {lne3} a
 */
lne3.toArray = box3.toArray;

/**
 * Sets a start and end vector from a lne3
 *
 * @param {lne3} a
 * @param {vec3} start
 * @param {vec3} end
 * @returns {lne3} a
 */
lne3.toStartEnd = box3.toBounds;

/**
 * Transforms a lne3 by a mat4
 *
 * @param {lne3} out
 * @param {lne3} a
 * @param {mat4} m
 * @returns {lne3} out
 */
lne3.transformMat4 = function(out, a, m)
{
    let ax = a[0],
        ay = a[1],
        az = a[2],
        bx = a[3],
        by = a[4],
        bz = a[5];

    out[0] = m[0] * ax + m[4] * ay + m[8] * az + m[12];
    out[1] = m[1] * ax + m[5] * ay + m[9] * az + m[13];
    out[2] = m[2] * ax + m[6] * ay + m[10] * az + m[14];

    out[3] = m[0] * bx + m[4] * by + m[8] * bz + m[12];
    out[4] = m[1] * bx + m[5] * by + m[9] * bz + m[13];
    out[5] = m[2] * bx + m[6] * by + m[10] * bz + m[14];

    return out;
};

/**
 * Translates a lne3
 *
 * @param {lne3} out
 * @param {lne3} a
 * @param {vec3} v
 * @returns {lne3} out
 */
lne3.translate = function(out, a, v)
{
    out[0] = a[0] + v[0];
    out[1] = a[1] + v[1];
    out[2] = a[2] + v[2];
    out[3] = a[3] + v[0];
    out[4] = a[4] + v[1];
    out[5] = a[5] + v[2];
    return out;
};