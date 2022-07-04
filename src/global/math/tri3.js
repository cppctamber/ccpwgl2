import { vec3 } from "./vec3";
import { mat3 } from "./mat3";
import { pln } from "./pln";
import { lne3 } from "./lne3";

/**
 * 3d Triangle
 *
 * @typedef {Float32Array} tri3
 */

export const tri3 = {};

/**
 * Gets a subarray of a tri3's first vertex
 *
 * @param {tri3} a
 * @returns {vec3}
 */
tri3.$v1 = lne3.$start;

/**
 * Gets a subarray of a tri3's second vertex
 *
 * @param {tri3} a
 * @returns {vec3}
 */
tri3.$v2 = lne3.$end;

/**
 * Gets a subarray of a tri3's third vertex
 *
 * @param {tri3} a
 * @returns {vec3}
 */
tri3.$v3 = function(a)
{
    return a.subarray(6, 9);
};

/**
 * Gets the area of a triangle
 *
 * @param {tri3} a
 * @returns {number}
 */
tri3.area = function(a)
{
    let ax = a[6] - a[3],
        ay = a[7] - a[4],
        az = a[8] - a[5],
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
tri3.create = function()
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
    return function(a, point)
    {
        if (!vec3_0) vec3_0 = vec3.create();
        tri3.getBaryCentricCoordinates(vec3_0, a, point);
        return (vec3_0[0] >= 0) && (vec3_0[1] >= 0) && ((vec3_0[0] + vec3_0[1]) <= 1);
    };
})();

/**
 * Copies a tri3
 *
 * @param {tri3} a
 * @param {tri3} b
 * @returns {tri3} a
 */
tri3.copy = mat3.copy;

/**
 * Sets a tri3 from vertices
 *
 * @param {tri3} out
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {vec3} v3
 * @returns {tri3} out
 */
tri3.fromVertices = function(out, v1, v2, v3)
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
 * @param {vec3} out
 * @param {tri3} a
 * @param {vec3} point
 * @returns {tri3} out
 */
tri3.getBaryCentricCoordinates = function(out, a, point)
{
    let ax = a[6] - a[0],
        ay = a[7] - a[1],
        az = a[8] - a[2],

        bx = a[3] - a[0],
        by = a[4] - a[1],
        bz = a[5] - a[2],

        cx = point[0] - ax,
        cy = point[1] - ay,
        cz = point[2] - az;

    let dot00 = ax * ax + ay * ay + az * az,
        dot01 = ax * bx + ay * by + az * bz,
        dot02 = ax * cx + ay * cy + az * cz,
        dot11 = bx * bx + by * by + bz * bz,
        dot12 = bx * cx + by * cy + bz * cz;

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
tri3.getClosestEdgeToPoint = (function()
{
    let v0, v1, edgeList;

    return function getClosestEdgeToPoint(out, a, point, debug)
    {
        if (!v0)
        {
            v0 = vec3.create();
            v1 = vec3.create();
            edgeList = [ lne3.create(), lne3.create(), lne3.create() ];
        }

        // Get the closest point on the triangle to the supplied point
        let closestPointOnTriangle = tri3.getClosestPointToPoint(v0, a, point);

        // Convert the triangle's vertices to edges
        lne3.set(edgeList[0], a[0], a[1], a[2], a[3], a[4], a[5]); // vert a - vert b
        lne3.set(edgeList[1], a[3], a[4], a[5], a[6], a[7], a[8]); // vert b - vert c
        lne3.set(edgeList[2], a[6], a[7], a[8], a[0], a[1], a[2]); // vert c - vert a
        
        let minDistance = Infinity,
            edgeIndex;
        
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
                edgeIndex = i;
            }
        }

        // Temporary
        if (debug)
        {
            switch(edgeIndex)
            {
                case 0:
                    debug.edgeStart = 0;
                    debug.edgeEnd = 1;
                    break;
                    
                case 1:
                    debug.edgeStart = 1;
                    debug.edgeEnd = 2;
                    break;
                    
                default:
                    debug.edgeStart = 2;
                    debug.edgeEnd = 1;
                    break;
            }
        }

        return out;
    };
})();

/**
 * Gets the closest point on a triangle to another point
 *
 * @author three.js (converted)
 * @param {vec3} out      - receiving vec3
 * @param {vec3} a        - tri3 to operate on
 * @param {vec3} point    - the point
 * @returns {vec3} vecOut - receiving vec3
 */
tri3.getClosestPointToPoint = (function()
{
    let plane, edgeList, projectedPoint, closestPoint, vec3_0, vec3_1, vec3_2;

    return function getClosestPointToPoint(out, a, point)
    {
        if (!plane)
        {
            plane = pln.create();
            edgeList = [ lne3.create(), lne3.create(), lne3.create() ];
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
})();

/**
 * Gets the closest vertex to a given point
 *
 * @param {vec3} out
 * @param {tri3} a
 * @param {vec3} point
 * @returns {vec3} out
 */
tri3.getClosestVertexToPoint = (function()
{
    let vec3_0, vec3_1, vec3_2;

    return function(out, a, point, debug)
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

        let foundIndex;
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
                foundIndex = i;
            }
        }
        
        if (debug) debug.closest = foundIndex;

        out[0] = x;
        out[1] = y;
        out[2] = z;
        return out;
    };
})();

/**
 * Sets a vec3 as the midpoint of a triangle
 *
 * @param {vec3} out    - receiving vec3
 * @param {tri3} a      - tri3 to get the midpoint of         -
 * @returns {vec3} out  - receiving vec3
 */
tri3.getMidpoint = function(out, a)
{
    let s = 1 / 3;
    out[0] = (a[0] + a[3] + a[6]) * s;
    out[1] = (a[1] + a[4] + a[7]) * s;
    out[2] = (a[2] + a[5] + a[8]) * s;
    return out;
};

let tri3_0 = null;

/**
 * Gets normal vertices
 *
 * @param {vec3} out
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {vec3} v3
 * @return {vec3} out
 */
tri3.getNormalFromVertices =  function(out, v1, v2, v3)
{
    if (!tri3_0) tri3_0 = tri3.create();
    tri3.fromVertices(tri3_0, v1, v2, v3);
    return tri3.getNormal(out, tri3_0);
};

/**
 * Gets a triangle's normal
 *
 * @param {vec3} out
 * @param {tri3} a
 * @returns {vec3} out
 */
tri3.getNormal = function(out, a)
{
    let ax = a[6] - a[3],
        ay = a[7] - a[4],
        az = a[8] - a[5],
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
tri3.getV1 = lne3.getStart;

/**
 * Sets a vec3 with the tri3's second vert
 *
 * @param {vec3} out     - receiving vec3
 * @param {tri3} a       - source tri3
 * @returns {vec3} [out] - receiving vec3
 */
tri3.getV2 = lne3.getEnd;

/**
 * Sets a vec3 with the tri3's third vert
 *
 * @param {vec3} out     - receiving vec3
 * @param {tri3} v       - source tri3
 * @returns {vec3} [out] - receiving vec3
 */
tri3.getV3 = function(out, v)
{
    out[0] = v[6];
    out[1] = v[7];
    out[2] = v[8];
    return out;
};

/**
 * Sets the first position of a triangle
 * @param {tri3} out
 * @param {vec3} v
 * @returns {tri3} out
 */
tri3.setV1 = lne3.setStart;

/**
 * Sets the second position of a triangle
 * @param {tri3} out
 * @param {vec3} v
 * @returns {tri3} out
 */
tri3.setV2 = lne3.setEnd;

/**
 * Sets the second position of a triangle
 * @param {tri3} out
 * @param {vec3} v
 * @returns {tri3} out
 */
tri3.setV3 = function(out, v)
{
    out[6] = v[0];
    out[7] = v[1];
    out[8] = v[2];
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

/**
 * Extracts the vertices of a tri3
 *
 * @param {tri3} a
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {vec3} v3
 */
tri3.toVertices = function(a, v1, v2, v3)
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
    return a;
};

let vec3_0, vec3_1, vec3_2;

/**
 * Transforms a tri3 by a mat4
 * TODO: Optimize
 * @param {tri3} out
 * @param {tri3} a
 * @param {mat4} m
 * @return {tri3}
 */
tri3.transformMat4 = function(out, a, m)
{
    if (!vec3_0)
    {
        vec3_0 = vec3.create();
        vec3_1 = vec3.create();
        vec3_2 = vec3.create();
    }

    tri3.getV1(vec3_0, a);
    tri3.getV2(vec3_1, a);
    tri3.getV3(vec3_2, a);

    vec3.transformMat4(vec3_0, vec3_0, m);
    vec3.transformMat4(vec3_1, vec3_1, m);
    vec3.transformMat4(vec3_2, vec3_2, m);

    return tri3.fromVertices(out, vec3_0, vec3_1, vec3_2);
};

