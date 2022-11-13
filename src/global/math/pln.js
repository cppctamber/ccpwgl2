import { num } from "./num";
import { vec3 } from "./vec3";
import { vec4 } from "./vec4";
import { mat3 } from "./mat3";
import { box3 } from "./box3";
import { pool } from "./pool";

/**
 * Plane
 *
 * @typedef {Float32Array} pln
 */

export const pln = {};

/**
 * Allocates a pooled pln
 * @returns {Float32Array|pln}
 */
pln.alloc = function()
{
    return pool.allocF32(4);
};

/**
 * Unallocates a pooled pln
 * @param {pln|Float32Array} a
 */
pln.unalloc = function(a)
{
    pool.freeType(a);
};

/**
 * Returns a subarray of a plane's normal
 *
 * @param {pln} a - source plane
 * @returns {*}   - plane normal reference
 */
pln.$normal = function(a)
{
    return a.subarray(0, 3);
};


/**
 * Clones a pln
 *
 * @param {pln} a - Source plane
 * @returns {pln} - Cloned plane
 */
pln.clone = vec4.clone;

/**
 * Returns the constant component of the pln
 *
 * @param {pln} a    - Source plane
 * @returns {number} - plane's constant
 */
pln.constant = function(a)
{
    return a[3];
};

/**
 * Copies a pln
 *
 * @param {pln} a - Target plane
 * @param {pln} b - Source plane
 * @returns {pln} - Target plane
 */
pln.copy = vec4.copy;

/**
 * Creates a plane
 *
 * @returns {pln}
 */
pln.create = vec4.create;

/**
 * Gets the distance from a plane to a point
 *
 * @param {pln} a    - plane to compare
 * @param {vec3} p   - Point to compare
 * @returns {number} - The distance between them
 */
pln.distanceToPoint = function(a, p)
{
    return (a[0] * p[0] + a[1] * p[1] + a[2] * p[2]) + a[3];
};

/**
 * Gets the distance from a plane to the components of a sphere
 *
 * @param {pln} a         - plane to compare
 * @param {vec3} position - sphere position to compare
 * @param {number} radius - sphere radius to compare
 * @returns {number}      - The distance between them
 */
pln.distanceToPositionRadius = function(a, position, radius)
{
    return (a[0] * position[0] + a[1] * position[1] + a[2] * position[2]) - radius;
};

/**
 * Gets the distance from a plane to a Float32Array(4) sphere
 *
 * @param {pln} a       - plane to compare
 * @param {sph3} sphere - sphere to compare
 * @returns {number}    - The distance between them
 */
pln.distanceToSph3 = function(a, sphere)
{
    return (a[0] * sphere[0] + a[1] * sphere[1] + a[2] * sphere[2]) - sphere[3];
};

/**
 * Gets the distance from a plane to a point's values
 *
 * @param {pln} a     - plane to compare
 * @param {Number} px - Point x to compare
 * @param {Number} py - Point y to compare
 * @param {Number} pz - Point z to compare
 * @returns {number}  - The distance between them
 */
pln.distanceToValues = function(a, px, py, pz)
{
    return (a[0] * px + a[1] * py + a[2] * pz) + a[3];
};

/**
 * Compares two plns for equality
 *
 * @param {pln} a     - plane to compare
 * @param {pln} b     - plane to compare
 * @returns {boolean} - true if equal
 */
pln.equals = vec4.equals;

/**
 * Compares a pln to plane components
 *
 * @param {pln} a           - plane to compare
 * @param {vec3} normal     - plane normal to compare
 * @param {number} constant - plane constant to compare
 * @returns {boolean}       - true if equal
 */
pln.equalsNormalConstant = function(a, normal, constant)
{
    let a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        b0 = normal[0],
        b1 = normal[1],
        b2 = normal[2],
        b3 = constant;

    return (
        Math.abs(a0 - b0) <= num.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= num.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= num.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
        Math.abs(a3 - b3) <= num.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3))
    );
};

/**
 * Compares two plns for exact equality
 *
 * @param {pln} a     - plane to compare
 * @param {pln} b     - plane to compare
 * @returns {boolean}
 */
pln.exactEquals = vec4.exactEquals;

/**
 * Compares a pln to plane components for exact equality
 *
 * @param {pln} a           - plane to compare
 * @param {vec3} normal     - plane normal to compare
 * @param {number} constant - plane constant to compare
 * @returns {boolean}
 */
pln.exactEqualsNormalConstant = function(a, normal, constant)
{
    return a[0] === normal[0] && a[1] === normal[1] && a[2] === normal[2] && a[3] === constant;
};

/**
 * Extracts a pln's components
 *
 * @param {pln} a          - Source plane
 * @param {vec3} outNormal - Receiving vec3
 * @returns {number}       - plane constant
 */
pln.extract = function(a, outNormal)
{
    outNormal[0] = a[0];
    outNormal[1] = a[1];
    outNormal[2] = a[2];
    return a[3];
};

/**
 * Sets a pln from plane components
 *
 * @param {pln} out   - Receiving plane
 * @param {vec3} n    - plane normal to set
 * @param {number} c  - plane constant to set
 * @returns {pln} out - receiving plane
 */
pln.fromNormalConstant = function(out, n, c)
{
    out[0] = n[0];
    out[1] = n[1];
    out[2] = n[2];
    out[3] = c;
    return out;
};

/**
 * Sets from coplanar points
 *
 * @author three.js (conversion)
 * @param {pln} out   - Receiving plane
 * @param {vec3} a    - Coplanar point a
 * @param {vec3} b    - Coplanar point b
 * @param {vec3} c    - Coplanar point c
 * @returns {pln} out - Receiving pln
 */
pln.fromCoplanarPoints = function(out, a, b, c)
{
    let ax = c[0] - b[0],
        ay = c[1] - b[1],
        az = c[2] - b[2],
        bx = a[0] - b[0],
        by = a[1] - b[1],
        bz = a[2] - b[2];

    // get cross product
    let x = ay * bz - az * by,
        y = az * bx - ax * bz,
        z = ax * by - ay * bx;

    // normalize
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

    // set coplanar point
    out[3] = -(a[0] * out[0] + a[1] * out[1] + a[2] * out[2]);
    return out;
};

/**
 * Sets a pln from normal and a coplanar point
 *
 * @param {pln} out     - receiving plane
 * @param {vec3} normal - normal
 * @param {vec3} point  - coplanar point
 * @returns {pln} out   - receiving plane
 */
pln.fromNormalAndCoplanarPoint = function(out, normal, point)
{
    out[0] = normal[0];
    out[1] = normal[1];
    out[2] = normal[2];
    out[3] = -(point[0] * normal[0] + point[1] * normal[1] + point[2] * normal[2]);
    return out;
};

/**
 * Gets a pln's coplanar point
 *
 * @param {vec3} out   - receiving vec3
 * @param {pln} a      - the source plane
 * @returns {vec3} out - receiving vec3
 */
pln.getCoplanarPoint = function(out, a)
{
    out[0] = a[0] * -a[3];
    out[1] = a[1] * -a[3];
    out[2] = a[2] * -a[3];
    return out;
};

/**
 * Sets a vec3 with the intersection point of a plane and a Float32Array(6) line
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @author Three.js (conversion)
 * @param {vec3} out                 - receiving vec3
 * @param {pln} a                    - plane
 * @param {(lne3|Float32Array)} l    - line
 * @returns {(null|vec3)} null|out   - null or receiving vec3
 */
pln.getIntersectLne3 = function(out, a, l)
{
    let lsx = l[0],
        lsy = l[1],
        lsz = l[2],
        lex = l[3],
        ley = l[4],
        lez = l[5];

    // Clear the out in case of fails?
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;

    // Get line delta
    let dirX = lex - lsx,
        dirY = ley - lsy,
        dirZ = lez - lsz;

    // Get dot of the plane normal and line delta
    let den = a[0] * dirX + a[1] * dirY + a[2] * dirZ;

    if (den === 0)
    {
        // Check if distance to the line start is 0
        if ((a[0] * lsx + a[1] * lsy + a[2] * lsz) + a[3] === 0)
        {
            out[0] = lsx;
            out[1] = lsy;
            out[2] = lsz;
            return out;
        }

        throw new Error("Denominator error");
    }

    let t = ((lsx * a[0] + lsy * a[1] + lsz * a[2]) + a[3]) / den;

    if (t < 0 || t > 1)
    {
        throw new Error("Normalization error");
    }

    out[0] = (dirX * t) + lsx;
    out[1] = (dirY * t) + lsy;
    out[2] = (dirZ * t) + lsz;
    return out;
};


/**
 * Sets a vec3 with the intersection point of a plane and a 3d line's components
 * Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @param {vec3} out
 * @param {pln} a
 * @param {vec3} lineStart
 * @param {vec3} lineEnd
 * @returns {vec3}
 */
pln.getIntersectStartEnd = function(out, a, lineStart, lineEnd)
{
    const vec6_0 = box3.alloc();
    box3.from(vec6_0, lineStart, lineEnd);
    pln.getIntersectLne3(out, a, vec6_0);
    box3.unalloc(vec6_0);
    return out;
};

/**
 * Sets a vec3 with the normal component of the pln
 *
 * @param {vec3} out   - receiving vec3
 * @param {pln} a      - source plane
 * @returns {vec3} out - receiving vec3
 */
pln.getNormal = function(out, a)
{
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Gets an orthographic point
 *
 * @param {vec3} out    - receiving vec3
 * @param {pln} a       - the plane to project from
 * @param {vec3} p      - the point to project
 * @returns {vec3} out  - receiving vec3
 */
pln.getOrthoPoint = function(out, a, p)
{
    let pMag = (a[0] * p[0] + a[1] * p[1] + a[2] * p[2]) + a[3];
    vec3.multiplyScalar(out, a, pMag);
    return out;
};

/**
 * Gets a projected point
 *
 * @param {vec3} out   - receiving vec3
 * @param {pln} a      - the plane to project from
 * @param {vec3} p     - the point to project
 * @returns {vec3} out - receiving vec3
 */
pln.getProjectedPoint = function(out, a, p)
{
    pln.getOrthoPoint(out, a, p);
    out[0] = -(out[0] - p[0]);
    out[1] = -(out[1] - p[1]);
    out[2] = -(out[2] - p[2]);
    return out;
};

/**
 * Checks if a plane intersects min and max bounds
 *
 * @param {pln} a     - plane to compare
 * @param {vec3} min  - box min bounds to compare
 * @param {vec3} max  - box max bounds to compare
 * @returns {boolean} - true if intersection occurs
 */
pln.intersectsBounds = function(a, min, max)
{
    const box3_0 = box3.from(box3.alloc(), min, max);
    let result = box3.intersectsPln(box3_0, a);
    box3.unalloc(box3_0);
    return result;
};

/**
 * Checks if a plane intersects a Float32Array(6) bounding box
 *
 * @param {pln} a                 - plane to compare
 * @param {(box3|Float32Array)} b - box to compare
 * @returns {boolean}             - true if intersection occurs
 */
pln.intersectsBox3 = function(a, b)
{
    return box3.intersectsPln(b, a);
};

/**
 * Checks if a plane intersects a Float32Array(6) lne3
 *
 * @author three.js (conversion)
 * @param {pln} a                  - plane to compare
 * @param {lne3|Float32Array} l    - line to compare
 * @returns {boolean}              - true if intersection occurs
 */
pln.intersectsLne3 = function(a, l)
{
    let startSign = (a[0] * l[0] + a[1] * l[1] + a[2] * l[2]) + a[3];
    let endSign = (a[0] * l[3] + a[1] * l[4] + a[2] * l[5]) + a[3];
    return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
};

/**
 * Checks if a plane intersects spherical bounds
 *
 * @param {pln} a         - plane to compare
 * @param {vec3} position - sphere position to compare
 * @param {number} radius - sphere radius compare
 * @returns {boolean}     - true if intersection occurs
 */
pln.intersectsPositionRadius = function(a, position, radius)
{
    let dot = position[0] * a[0] + position[1] * a[1] + position[2] * a[2];
    return Math.abs(dot - a[3]) <= radius;
};

/**
 * Checks if a plane intersects a sph3
 *
 * @param {pln} a     - plane to compare
 * @param {sph3} s    - sphere to compare
 * @returns {boolean} - true if intersection occurs
 */
pln.intersectsSph3 = function(a, s)
{
    let dot = s[0] * a[0] + s[1] * a[1] + s[2] * a[2];
    return Math.abs(dot - a[3]) <= s[3];
};

/**
 * Checks if a plane intersects a lne3's components
 *
 * @param {pln} a      - plane to compare
 * @param {vec3} start - line start to compare
 * @param {vec3} end   - line end to compare
 * @returns {boolean}  - true if intersection occurs
 */
pln.intersectsStartEnd = function(a, start, end)
{
    let startSign = (a[0] * start[0] + a[1] * start[1] + a[2] * start[2]) + a[3];
    let endSign = (a[0] * end[0] + a[1] * end[1] + a[2] * end[2]) + a[3];
    return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
};

/**
 * Negates a plane
 *
 * @param {pln} out   - receiving plane
 * @param {pln} a     - the plane to negate
 * @returns {pln} out - receiving plane
 */
pln.negate = function(out, a)
{
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3] * -1;
    return out;
};

/**
 * Normalizes a plane
 *
 * @param {pln} out   - receiving plane
 * @param {pln} a     - the plane to normalize
 * @returns {pln} out - receiving plane
 */
pln.normalize = function(out, a)
{
    let x = a[0],
        y = a[1],
        z = a[2];

    let len = x * x + y * y + z * z;

    if (len > 0)
    {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
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
 * Sets a plane from values
 *
 * @param {pln} out
 * @param {number} nX
 * @param {number} nY
 * @param {number} nZ
 * @param {number} c
 * @returns {pln} out
 */
pln.set = vec4.set;


/**
 * Sets a plane from values and then normalizes the results
 * @param {pln} out
 * @param {Number} nx
 * @param {Number} ny
 * @param {Number} nz
 * @param {Number} c
 * @returns {pln} out
 */
pln.setAndNormalize = function(out, nx, ny, nz, c)
{
    out[0] = nx;
    out[1] = ny;
    out[2] = nz;
    out[3] = c;
    return pln.normalize(out, out);
};


/**
 * Sets a pln from an array at an optional offset
 *
 * @param {pln} out
 * @param {Array} arr
 * @param {number} [index=0]
 * @returns {pln} out
 */
pln.setArray = vec4.setArray;

/**
 * Sets an array at an optional offset, with the values of a pln
 *
 * @param {pln} a
 * @param {Array} arr
 * @param {number} [offset = 0]
 * @returns {pln} a
 */
pln.toArray = function(a, arr, offset = 0)
{
    arr[offset] = a[0];
    arr[offset + 1] = a[1];
    arr[offset + 2] = a[2];
    arr[offset + 3] = a[3];
    return a;
};

/**
 * Transforms a plane by a mat4
 *
 * @author three.js (conversion)
 * @param {pln} out        - the receiving plane
 * @param {pln} a          - the plane to transform
 * @param {mat4} m         - the affine matrix to transform with
 * @param {mat3} [nMatrix] - optional normal matrix
 * @returns {pln} out      - the receiving plane
 */
pln.transformMat4 = function(out, a, m, nMatrix)
{
    let mat3_0;
    if (!nMatrix)
    {
        mat3_0 = mat3.alloc();
        nMatrix = mat3.normalFromMat4(mat3_0, m);
    }

    // Coplanar Point
    let cpX = a[0] * -a[3],
        cpY = a[1] * -a[3],
        cpZ = a[2] * -a[3];

    // Create reference point from Coplanar Point transformed by the affine mat4
    let rX = m[0] * cpX + m[4] * cpY + m[8] * cpZ + m[12],
        rY = m[1] * cpX + m[5] * cpY + m[9] * cpZ + m[13],
        rZ = m[2] * cpX + m[6] * cpY + m[10] * cpZ + m[14];

    // Transform plane normal by normal matrix
    let nX = a[0],
        nY = a[1],
        nZ = a[2],
        pX = nX * nMatrix[0] + nY * nMatrix[3] + nZ * nMatrix[6],
        pY = nX * nMatrix[1] + nY * nMatrix[4] + nZ * nMatrix[7],
        pZ = nX * nMatrix[2] + nY * nMatrix[5] + nZ * nMatrix[8];

    if (mat3_0) mat3.unalloc(mat3_0);

    // Normalize plane normal
    let len = pX * pX + pY * pY + pZ * pZ;
    if (len > 0)
    {
        len = 1 / Math.sqrt(len);
        out[0] = pX * len;
        out[1] = pY * len;
        out[2] = pZ * len;
    }
    else
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        throw new Error("Normalization error");
    }

    // recalculate constant from negative dot of reference point and the resulting plane normal
    out[3] = -(rX * out[0] + rY * out[1] + rZ * out[2]);

    return out;
};

/**
 * Translates a plane with the given vector
 *
 * @param {pln} out   - the receiving plane
 * @param {pln} a     - the plane to translate
 * @param {vec3} v    - the vector to translate with
 * @returns {pln} out - the receiving plane
 */
pln.translate = function(out, a, v)
{
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3] - (v[0] * a[0] + v[1] * a[1] + v[2] * a[2]);
    return out;
};
