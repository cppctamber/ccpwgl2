import {num} from "./num";
import {vec3} from "./vec3";
import {mat3} from "./mat3";
import {pln} from "./pln";
import {lne3} from "./lne3";

/**
 * 3d Triangle
 *
 * @typedef {Float32Array} tri3
 */

export const tri3 = {};

/**
 * Gets the area of a triangle
 *
 * @param {tri3} a
 * @returns {number}
 */
tri3.area = function (a)
{
    let ax = a[7] - a[3],
        ay = a[8] - a[4],
        az = a[9] - a[5],
        bx = a[0] - a[3],
        by = a[1] - a[4],
        bz = a[2] - a[5];
    // Cross product
    let x = ax * bz - az * by,
        y = az * bx - ax * bz,
        z = ax * by - ay * bx;
    // Return half length
    return Math.sqrt(x * x + y * y + z * z) * 0.5;
};

/**
 * Creates a tri3
 *
 * @returns {tri3}
 */
tri3.create = function ()
{
    let out = new Float32Array(9);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    return out;
};

/**
 * Clones a tri3
 *
 * @param {tri3} a
 * @returns {tri3}
 */
tri3.clone = mat3.clone;

/**
 * Checks if a tri3 contains a point
 *
 * @param {tri3} a
 * @param {vec3} point
 * @returns {boolean}
 */
tri3.contains = (function()
{
    let vec3_0;
    return function (a, point)
    {
        if (!vec3_0) vec3_0 = vec3.create();
        tri3.getBaryCentricCoordinates(vec3_0, a, point);
        return (vec3_0[0] >= 0) && (vec3_0[1] >= 0) && ((vec3_0[0] + vec3_0[1]) <= 1);
    };
});

/**
 * Copies a tri3
 *
 * @param {tri3} a
 * @param {tri3} b
 * @returns {tri3} a
 */
tri3.copy = mat3.copy;

/**
 * Extracts the vertices of a tri3
 *
 * @param {tri3} a
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {vec3} v3
 */
tri3.extract = function (a, v1, v2, v3)
{
    v1[0] = a[0];
    v1[1] = a[1];
    v1[2] = a[2];
    v2[0] = a[0];
    v2[1] = a[1];
    v2[2] = a[2];
    v3[0] = a[0];
    v3[1] = a[1];
    v3[2] = a[2];
};

/**
 * Sets a tri3 from vertices
 *
 * @param {tri3} out
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {vec3} v3
 * @returns {tri3} out
 */
tri3.from = function (out, v1, v2, v3)
{
    out[0] = v1[0];
    out[1] = v1[1];
    out[2] = v1[2];
    out[3] = v2[0];
    out[4] = v2[1];
    out[5] = v2[2];
    out[6] = v3[0];
    out[7] = v3[1];
    out[8] = v3[2];
    return out;
};

/**
 * Sets a tri3 from an array at an option offset
 *
 * @param {tri3} out
 * @param {Array} arr
 * @param {number} [offset=0]
 * @returns {tri3} out
 */
tri3.fromArray = mat3.fromArray;

/**
 * Gets bary centric coordinates
 *
 * @author three.js (converted)
 * @param {tri3} out
 * @param {tri3} a
 * @param {vec3} point
 * @returns {tri3} out
 */
tri3.getBaryCentricCoordinates = function (out, a, point)
{
    let ax = a[7] - a[0],
        ay = a[8] - a[1],
        az = a[9] - a[2],

        bx = a[3] - a[0],
        by = a[4] - a[1],
        bz = a[5] - a[2],

        cx = point[0] - a[0],
        cy = point[1] - a[1],
        cz = point[2] - a[2];

    let dot00 = ax[0] * ax[0] + ay[1] * ay[1] + az[2] * az[2],
        dot01 = ax[0] * bx[0] + ay[1] * by[1] + az[2] * bz[2],
        dot02 = ax[0] * cx[0] + ay[1] * cy[1] + az[2] * cz[2],
        dot11 = bx[0] * bx[0] + by[1] * by[1] + bz[2] * bz[2],
        dot12 = bx[0] * cx[0] + by[1] * cy[1] + bz[2] * cz[2];

    let denom = (dot00 * dot11 - dot01 * dot01);

    if (denom === 0)
    {
        out[0] = -2;
        out[1] = -1;
        out[2] = -1;
        throw new Error("Denominator error");
    }
    else
    {
        let invDenom = 1 / denom;
        let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        let v = (dot00 * dot12 - dot01 * dot02) * invDenom;
        out[0] = 1 - u - v;
        out[1] = v;
        out[2] = u;
    }
    return out;
};

/**
 *
 * @author three.js (converted)
 * @param {lne3} out
 * @param {tri3} a
 * @param {vec3} point
 * @returns {*}
 */
tri3.getClosestEdgeToPoint = (function ()
{
    let v0, v1, edgeList;

    return function getClosestEdgeToPoint(out, a, point)
    {
        if (!v0)
        {
            v0 = vec3.create();
            v1 = vec3.create();
            edgeList = [lne3.create(), lne3.create(), lne3.create()];
        }

        // Get the closest point on the triangle to the supplied point
        let closestPointOnTriangle = tri3.getClosestPointToPoint(v0, a, point);

        // Convert the triangle's vertices to edges
        lne3.set(edgeList[0], a[0], a[1], a[2], a[3], a[4], a[5]); // vert a - vert b
        lne3.set(edgeList[1], a[3], a[4], a[5], a[6], a[7], a[8]); // vert b - vert c
        lne3.set(edgeList[2], a[6], a[7], a[8], a[0], a[1], a[2]); // vert c - vert a

        let minDistance = Infinity;
        for (let i = 0; i < edgeList.length; i++)
        {
            // Get the closest point on the triangles edge to the closest point on the triangle to the supplied point
            let closestPointOnLine = lne3.getClosestPointToPoint(v1, edgeList[i], closestPointOnTriangle, true);
            let distance = vec3.squaredDistance(closestPointOnLine, closestPointOnTriangle);
            if (distance < minDistance)
            {
                minDistance = distance;
                out[0] = edgeList[i][0];
                out[1] = edgeList[i][1];
                out[2] = edgeList[i][2];
                out[3] = edgeList[i][3];
                out[4] = edgeList[i][4];
                out[5] = edgeList[i][5];
            }
        }

        return out;
    };
});

/**
 * Gets the closest point on a triangle to another point
 *
 * @author three.js (converted)
 * @param {vec3} out      - receiving vec3
 * @param {vec3} a        - tri3 to operate on
 * @param {vec3} point    - the point
 * @returns {vec3} vecOut - receiving vec3
 */
tri3.getClosestPointToPoint = (function ()
{
    let plane, edgeList, projectedPoint, closestPoint, vec3_0, vec3_1, vec3_2;

    return function getClosestPointToPoint(out, a, point)
    {
        if (!plane)
        {
            plane = pln.create();
            edgeList = [lne3.create(), lne3.create(), lne3.create()];
            projectedPoint = vec3.create();
            closestPoint = vec3.create();
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
            vec3_2 = vec3.create();
        }

        // Replace with subarray tri3.v1 .v2 .v3 ?
        tri3.getV1(vec3_0, a);
        tri3.getV2(vec3_1, a);
        tri3.getV3(vec3_2, a);

        // project the point onto the plane of the triangle
        pln.fromCoplanarPoints(plane, vec3_0, vec3_1, vec3_2);
        pln.getProjectedPoint(projectedPoint, plane, point);

        // check if the projection lies within the triangle
        if (tri3.contains(a, projectedPoint) === true)
        {
            out[0] = projectedPoint[0];
            out[1] = projectedPoint[1];
            out[2] = projectedPoint[2];
        }
        // if not, the point falls outside the triangle.
        // the result is the closest point to the triangle's edges or vertices
        else
        {
            lne3.set(edgeList[0], a[0], a[1], a[2], a[3], a[4], a[5]);
            lne3.set(edgeList[1], a[3], a[4], a[5], a[6], a[7], a[8]);
            lne3.set(edgeList[2], a[6], a[7], a[8], a[0], a[1], a[2]);

            let minDistance = Infinity;
            for (let i = 0; i < edgeList.length; i++)
            {
                lne3.getClosestPointToPoint(closestPoint, edgeList[i], projectedPoint, true);
                let distance = vec3.squaredDistance(projectedPoint, closestPoint);
                if (distance < minDistance)
                {
                    minDistance = distance;
                    out[0] = closestPoint[0];
                    out[1] = closestPoint[1];
                    out[2] = closestPoint[2];
                }
            }
        }
        return out;
    };
});

/**
 * Gets the closest vertex to a given point
 *
 * @param {vec3} out
 * @param {tri3} a
 * @param {vec3} point
 * @returns {vec3} out
 */
tri3.getClosestVertexToPoint = (function ()
{
    let vec3_0, vec3_1, vec3_2;

    return function (out, a, point)
    {
        if (!vec3_0)
        {
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
            vec3_2 = vec3.create();
        }

        // Get the closest point on the triangle to the supplied point
        tri3.getClosestPointToPoint(out, a, point);

        let minDistance = Infinity,
            distance,
            x, y, z,
            vertices = [
                tri3.getV1(vec3_0, a),
                tri3.getV2(vec3_1, a),
                tri3.getV3(vec3_2, a)
            ];

        // Find the closest triangle vertex
        for (let i = 0; i < vertices.length; i++)
        {
            distance = vec3.squaredDistance(vertices[i], out);
            if (distance < minDistance)
            {
                minDistance = distance;
                x = vertices[i][0];
                y = vertices[i][1];
                z = vertices[i][2];
            }
        }

        out[0] = x;
        out[1] = y;
        out[2] = z;
        return out;
    };
});

/**
 * Sets a vec3 as the midpoint of a triangle
 *
 * @param {vec3} out    - receiving vec3
 * @param {tri3} a      - tri3 to get the midpoint of         -
 * @returns {vec3} out  - receiving vec3
 */
tri3.getMidpoint = function (out, a)
{
    let s = 1 / 3;
    out[0] = (a[0] + a[3] + a[6]) * s;
    out[1] = (a[1] + a[4] + a[7]) * s;
    out[2] = (a[2] + a[5] + a[8]) * s;
    return out;
};

/**
 * Gets a triangle's normal
 *
 * @param {vec3} out
 * @param {tri3} a
 * @returns {vec3} out
 */
tri3.getNormal = function (out, a)
{
    let ax = a[7] - a[3],
        ay = a[8] - a[4],
        az = a[9] - a[5],
        bx = a[0] - a[3],
        by = a[1] - a[4],
        bz = a[2] - a[5];

    // Get cross product
    let x = ay * bz - az * by,
        y = az * bx - ax * bz,
        z = ax * by - ay * bx;

    // Normalize
    let len = x * x + y * y + z * z;
    if (len > 0)
    {
        len = 1 / Math.sqrt(len);
        out[0] = x * len;
        out[1] = y * len;
        out[2] = z * len;
    }
    else
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        throw new Error("Normalization error");
    }
    return out;
};

/**
 * Sets a vec3 with the tri3's first vert
 *
 * @param {vec3} out     - receiving vec3
 * @param {tri3} a       - source tri3
 * @returns {vec3} [out] - receiving vec3
 */
tri3.getV1 = function (out, a)
{
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Sets a vec3 with the tri3's second vert
 *
 * @param {vec3} out     - receiving vec3
 * @param {tri3} a       - source tri3
 * @returns {vec3} [out] - receiving vec3
 */
tri3.getV2 = function (out, a)
{
    out[0] = a[3];
    out[1] = a[4];
    out[2] = a[5];
    return out;
};

/**
 * Sets a vec3 with the tri3's third vert
 *
 * @param {vec3} out     - receiving vec3
 * @param {tri3} v       - source tri3
 * @returns {vec3} [out] - receiving vec3
 */
tri3.getV3 = function (out, v)
{
    out[0] = v[6];
    out[1] = v[7];
    out[2] = v[8];
    return out;
};

/**
 * Sets an array at an optional offset
 *
 * @param {mat3} a
 * @param {Array} arr
 * @param {number} [index=0]
 * @returns {mat3} a
 */
tri3.toArray = mat3.toArray;


/*-------------------------------------------------------------------------------

                         Helper classes for sub arrays

 ------------------------------------------------------------------------------*/

/**
 * Handles getting valid subarrays
 * @param a
 * @param start
 * @param end
 * @returns {Int32Array | Uint8Array | Int8Array | Int16Array | Uint16Array | Uint32Array | Float32Array | Uint8ClampedArray | Float64Array}
 * @throws when passed an array
 * @throws when passed a typed array of the incorrect length (which would return an invalid result)
 */
function getSubarray(a, start, end)
{
    if (a.length < end)
    {
        throw new Error("Invalid length");
    }

    if (!a.subarray)
    {
        throw new Error("Invalid subarray");
    }

    return a.subarray(start, end);
}

/**
 * Gets a subarray of a tri3's first vertex
 *
 * @param {tri3} a
 * @returns {vec3}
 */
tri3.v1 = function (a)
{
    return getSubarray(a, 0, 3);
};

/**
 * Clones the first component of a tri3
 *
 * @param {tri3} v
 * @returns {vec3}
 */
tri3.v1.clone = vec3.clone;

/**
 * Copies a vec3 into the first component of a tri3
 *
 * @param {tri3} v
 * @param {vec3} b
 * @returns {tri3} v
 */
tri3.v1.copy = vec3.copy;

/**
 * Checks if the first component of a tri3 is equal to a vec3
 *
 * @param {tri3} v
 * @param {vec3} b
 * @returns {boolean}
 */
tri3.v1.equals = vec3.equals;

/**
 * Checks if the first component of a tri3 is exactly equal to a vec3
 *
 * @param {tri3} v
 * @param {vec3} b
 * @returns {boolean}
 */
tri3.v1.exactEquals = vec3.exactEquals;

/**
 * Gets the first vec3 from a tri3 and copies it into a vec3
 *
 * @param {vec3} out
 * @param {tri3} v
 * @returns {vec3} out
 */
tri3.v1.get = vec3.copy;

/**
 * Sets the first component of a tri3 from values
 *
 * @param {tri3} v
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {tri3} v
 */
tri3.v1.set = vec3.set;

/**
 * Gets a subarray of a tri3's second vertex
 *
 * @param {tri3} a
 * @returns {vec3}
 */
tri3.v2 = function (a)
{
    return getSubarray(a, 3, 6);
};

/**
 * Clones the second component of a tri3
 *
 * @param {tri3} v
 * @returns {vec3}
 */
tri3.v2.clone = function (v)
{
    let out = vec3.create();
    out[0] = v[3];
    out[1] = v[4];
    out[2] = v[5];
    return out;
};

/**
 * Copies a vec3 into the third vert of a face
 *
 * @param {tri3} v
 * @param {vec3} a
 * @returns {tri3} v
 */
tri3.v2.copy = function (v, a)
{
    v[3] = a[0];
    v[4] = a[1];
    v[5] = a[2];
    return v;
};

/**
 * Checks if the second component of a tri3 is equal to v vec3
 *
 * @param {tri3} v
 * @param {vec3} b
 * @returns {boolean}
 */
tri3.v2.equals = function (v, b)
{
    let a0 = v[3],
        a1 = v[4],
        a2 = v[5],
        b0 = b[0],
        b1 = b[1],
        b2 = b[2];

    return (
        Math.abs(a0 - b0) <= num.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= num.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= num.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2))
    );
};

/**
 * Checks if the second component of a tri3 is exactly equal to a vec3
 *
 * @param {tri3} v
 * @param {vec3} b
 * @returns {boolean}
 */
tri3.v2.exactEquals = function (v, b)
{
    return v[3] === b[0] && v[4] === b[1] && v[5] === b[2];
};

/**
 * Gets the second component and copies it into a vec3
 *
 * @param {vec3} out
 * @param {tri3} v
 * @returns {vec3} out
 */
tri3.v2.get = function (out, v)
{
    out[0] = v[3];
    out[1] = v[4];
    out[2] = v[5];
    return out;
};

/**
 * Sets the second component of a tri3 from values
 *
 * @param {tri3} v
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {tri3} v
 */
tri3.v2.set = function (v, x, y, z)
{
    v[3] = x;
    v[4] = y;
    v[5] = z;
    return v;
};

/**
 * Gets a subarray of a tri3's third vertex
 *
 * @param {tri3} a
 * @returns {vec3}
 */
tri3.v3 = function (a)
{
    return getSubarray(a, 6, 9);
};

/**
 * Clones the second component of a tri3
 *
 * @param {tri3} v
 * @returns {vec3}
 */
tri3.v3.clone = function (v)
{
    let out = vec3.create();
    out[0] = v[6];
    out[1] = v[7];
    out[2] = v[8];
    return out;
};

/**
 * Copies a vec3 into the third vert of a tri3
 *
 * @param {tri3} v
 * @param {vec3} a
 * @returns {tri3} v
 */
tri3.v3.copy = function (v, a)
{
    v[6] = a[0];
    v[7] = a[1];
    v[8] = a[2];
    return v;
};

/**
 * Checks if the second component of a tri3 is equal to a vec3
 *
 * @param {tri3} v
 * @param {vec3} b
 * @returns {boolean}
 */
tri3.v3.equals = function (v, b)
{
    let a0 = v[6],
        a1 = v[7],
        a2 = v[8],
        b0 = b[0],
        b1 = b[1],
        b2 = b[2];

    return (
        Math.abs(a0 - b0) <= num.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= num.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= num.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2))
    );
};

/**
 * Checks if the second component of a tri3 is exactly equal to tri3 vec3
 *
 * @param {tri3} v
 * @param {vec3} b
 * @returns {boolean}
 */
tri3.v3.exactEquals = function (v, b)
{
    return v[6] === b[0] && v[7] === b[1] && v[8] === b[2];
};

/**
 * Gets the third vertex from a triangle and sets it to a vec3
 *
 * @param {vec3} out
 * @param {tri3} t
 * @returns {vec3}
 */
tri3.v3.get = function (out, t)
{
    out[0] = t[6];
    out[1] = t[7];
    out[2] = t[8];
    return out;
};

/**
 * Sets the second component of a tri3 from values
 *
 * @param {tri3} v
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {tri3} out
 */
tri3.v3.set = function (v, x, y, z)
{
    v[3] = x;
    v[4] = y;
    v[5] = z;
    return v;
};