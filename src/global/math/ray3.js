import { vec3 } from "./vec3";
import { pln } from "./pln";
import { sph3 } from "./sph3";
import { box3 } from "./box3";
import { tri3 } from "./tri3";
import { mat3 } from "math/mat3";

/**
 * 3D Ray
 * @typedef {Float32Array} ray3
 */

export const ray3 = {};

/**
 * Gets a subarray of a ray3's origin vector
 * @property {box3} a
 * @returns {TypedArray}
 */
ray3.$origin = box3.$min;

/**
 * Gets a subarray of a ray3's direction vector
 * @property {box3} a
 * @returns {TypedArray}
 */
ray3.$direction = box3.$max;

/**
 * Clones a ray3
 *
 * @param {ray3} a
 * @returns {ray3}
 */
ray3.clone = box3.clone;

/**
 * Copies the values from one ray3 into another
 *
 * @param {ray3} out
 * @param {ray3} a
 * @returns {ray3} out
 */
ray3.copy = box3.copy;

/**
 * Copies the origin vector of one ray3 to another
 *
 * @param {ray3} out
 * @param {ray3} a
 * @returns {ray3}
 */
ray3.copyOrigin = box3.copyMin;

/**
 * Copies the direction vector of one ray3 to another
 *
 * @param {ray3} out
 * @param {ray3} a
 * @returns {ray3}
 */
ray3.copyDirection = box3.copyMax;

/**
 * Creates a ray3
 *
 * @returns {ray3}
 */
ray3.create = box3.create;

/**
 * Gets the distance from a ray3 to a point
 *
 * @param {ray3} a    - source ray3
 * @param {vec3} p   - point to measure distance to
 * @returns {number} - distance
 */
ray3.distance = function (a, p)
{
    return Math.sqrt(ray3.squaredDistance(a, p));
};

/**
 * Gets the distance from a ray3"s origin to a plane"s components
 *
 * @author three.js authors (converted)
 * @param {ray3} a        - source ray3
 * @param {vec3} n        - plane normal
 * @param {number} c      - plane constant
 * @returns {null|number} - distance
 */
ray3.distanceNormalConstant = function (a, n, c)
{
    let den = n[0] * a[3] + n[1] * a[4] + n[2] * a[5];
    let dist = (a[0] * n[0] + a[1] * n[1] + a[2] * n[2]) + c;
    if (den === 0)
    {
        if (dist === 0) return 0;
        throw new Error("Determinant error");
        //return null;
    }

    let t = -dist / den;
    return t >= 0 ? t : null;
};

/**
 * Gets the distance from a ray3"s origin to a Float32Array(4) plane
 *
 * @author three.js authors (converted)
 * @param {ray3} a        - source ray3
 * @param {pln} p         - plane to measure distance to
 * @returns {null|Number} - distance
 */
ray3.distancePln = function (a, p)
{
    let den = p[0] * a[3] + p[1] * a[4] + p[2] * a[5];
    let dist = (a[0] * p[0] + a[1] * p[1] + a[2] * p[2]) + p[3];

    if (den === 0)
    {
        if (dist === 0) return 0;
        throw new Error("Determinant error");
        //return null;
    }

    let t = -dist / den;
    return t >= 0 ? t : null;
};

/**
 * Checks two ray3"s for equality
 *
 * @param {ray3} a
 * @param {ray3} b
 * @returns {boolean}
 */
ray3.equals = box3.equals;

/**
 * Checks a ray3 against it"s components for equality
 *
 * @param {ray3} a
 * @param {vec3} min
 * @param {vec3} max
 * @returns {boolean}
 */
ray3.equalsOriginDestination = box3.equalsBounds;

/**
 * Checks for box3 exact equality
 *
 * @param {ray3} a
 * @param {ray3} b
 * @returns {boolean}
 */
ray3.exactEquals = box3.exactEquals;

/**
 * Checks for exact equality between a ray3 and ray3 components
 *
 * @param {ray3} a
 * @param {vec3} min
 * @param {vec3} max
 * @returns {boolean}
 */
ray3.exactEqualsOriginDestination = box3.exactEqualsBounds;

/**
 * Sets a ray3 from origin and destination
 *
 * @param {ray3} out
 * @param {vec3} o
 * @param {vec3} d
 * @returns {ray3} out
 */
ray3.from = box3.from;

/**
 * Sets a ray3 from an array at an optional offset
 *
 * @param {ray3} out
 * @param {Array} arr
 * @param {number} [index=0]
 * @returns {ray3}
 */
ray3.fromArray = box3.fromArray;

/**
 * Sets a ray 3 from start and end vectors
 *
 * @param {ray3} out
 * @param {vec3} start
 * @param {vec3} end
 * @returns {ray3}
 */
ray3.fromStartEnd = function (out, start, end)
{
    out[0] = start[0];
    out[1] = start[1];
    out[2] = start[2];
    out[3] = end[0] - start[0];
    out[4] = end[1] - start[1];
    out[5] = end[2] - start[2];
    return ray3.normalize(out, out);
};


let mat3_0;

/**
 * Sets a ray3 from a mat4
 * @param {ray3} out
 * @param {mat4} m
 * @return {ray3}
 */
ray3.fromMat4 = function (out, m)
{
    if (!mat3_0) mat3_0 = mat3.create();

    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -1;

    vec3.transformMat4(ray3.$origin(out), ray3.$origin(out), m);
    mat3.fromMat4(mat3_0, m);
    vec3.transformMat3(ray3.$direction(out), ray3.$direction(out), mat3_0);
    return ray3.normalize(out, out);
};

/**
 * Sets a ray3 from a screen coordinates and an inverse view projection matrix
 *
 * @param {vec3} out              - receiving ray3
 * @param {vec2} coords           - canvas coordinates (not client)
 * @param {mat4} m         -      - inverse view projection matrix
 * @param {mat4} viewport         - viewport settings (x, y, width, height)
 */
ray3.fromPerspective = function (out, coords, m, viewport)
{
    // Convert view port co-ordinates
    let x = (coords[0] - viewport[0]) * 2.0 / viewport[2] - 1.0,
        y = (coords[1] - viewport[1]) * 2.0 / viewport[3] - 1.0;
    // Calculate w
    let oW = (m[3] * x + m[7] * y + m[11] * -1 + m[15]),
        dW = (m[3] * x + m[7] * y + m[11] * 1 + m[15]);
    // Check for perspective divide error
    if (oW === 0.0 || dW === 0.0)
    {
        throw new Error("Perspective Divide Error");
    }
    // Transform origin
    out[0] = (m[0] * x + m[4] * y + m[8] * -1 + m[12]) / oW;
    out[1] = (m[1] * x + m[5] * y + m[9] * -1 + m[13]) / oW;
    out[2] = (m[2] * x + m[6] * y + m[10] * -1 + m[14]) / oW;
    // Transform direction
    out[3] = ((m[0] * x + m[4] * y + m[8] * 1 + m[12]) / dW) - out[0];
    out[4] = ((m[1] * x + m[5] * y + m[9] * 1 + m[13]) / dW) - out[1];
    out[5] = ((m[2] * x + m[6] * y + m[10] * 1 + m[14]) / dW) - out[2];

    // Normalize direction
    return ray3.normalize(out, out);
};



/**
 * Alternative to ray3.fromPerspective
 * @param {ray3} out         - receiving ray3
 * @param {vec2} coords      - event.ClientX, canvasHeight - event.clientY
 * @param {mat4} invProjView - inverse projection view matrix
 * @param {vec4} viewport    - x, y, width, height
 * @returns {ray3}
 */
ray3.unproject = function (out, coords, invProjView, viewport)
{
    const
        start = [ coords[0], coords[1], 0 ],
        end = [ coords[0], coords[1], 1 ];

    vec3.unproject(start, start, invProjView, viewport);
    vec3.unproject(end, end, invProjView, viewport);

    return ray3.fromStartEnd(out, start, end);
};

/**
 * Sets a vec3 with the position on a ray3 at a given distance from it"s origin
 *
 * @param {vec3} out   - receiving vec3
 * @param {ray3} a     - source ray3
 * @param {number} t   - distance along the ray3
 * @returns {vec3} out - receiving vec3
 */
ray3.get = function (out, a, t)
{
    out[0] = a[0] + (a[3] * t);
    out[1] = a[1] + (a[4] * t);
    out[2] = a[2] + (a[5] * t);
    return out;
};

/**
 * Sets a vec3 with the ray3's direction
 *
 * @param {vec3} out     - receiving vec3
 * @param {ray3} a       - source ray
 * @returns {vec3} [out] - receiving vec3
 */
ray3.getDirection = box3.getMax;

/**
 * Sets a vec3 with the closest point on a ray3 to a given point
 *
 * @author three.js authors (converted)
 * @param {vec3} out   - receiving vec3
 * @param {ray3} a     - source ray3
 * @param {vec3} p     - point to compare
 * @returns {vec3} out - receiving vec3
 */
ray3.getClosestPointToPoint = function (out, a, p)
{
    let x = p[0] - a[0],
        y = p[1] - a[1],
        z = p[2] - a[2];

    let dirDist = x * a[3] + y * a[4] + z * a[5];

    if (dirDist < 0)
    {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
    }
    else
    {
        ray3.get(out, a, dirDist);
    }

    return out;
};

/**
 * Sets a vec3 with the intersection point of a ray3 and boxes' components
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @author three.js authors (converted)
 * @param {vec3} out            - receiving vec3
 * @param {ray3} a              - source ray3
 * @param {vec3} min            - box min bounds
 * @param {vec3} max            - box max bounds
 * @returns {(null|vec3)} [out] - null or receiving vec3
 */
ray3.getIntersectBounds = function (out, a, min, max)
{
    let tMin, tMax, tyMin, tyMax, tzMin, tzMax;

    let invDirX = 1 / a[3],
        invDirY = 1 / a[4],
        invDirZ = 1 / a[5];

    if (invDirX >= 0)
    {
        tMin = (min[0] - a[0]) * invDirX;
        tMax = (max[0] - a[0]) * invDirX;
    }
    else
    {
        tMin = (max[0] - a[0]) * invDirX;
        tMax = (min[0] - a[0]) * invDirX;
    }

    if (invDirY >= 0)
    {
        tyMin = (min[1] - a[1]) * invDirY;
        tyMax = (max[1] - a[1]) * invDirY;
    }
    else
    {
        tyMin = (max[1] - a[1]) * invDirY;
        tyMax = (min[1] - a[1]) * invDirY;
    }

    if ((tMin > tyMax) || (tyMin > tMax)) return null;

    if (tyMin > tMin || tMin !== tMin) tMin = tyMin;
    if (tyMax < tMax || tMax !== tMax) tMax = tyMax;

    if (invDirZ >= 0)
    {
        tzMin = (min[2] - a[2]) * invDirZ;
        tzMax = (max[2] - a[2]) * invDirZ;
    }
    else
    {
        tzMin = (max[2] - a[2]) * invDirZ;
        tzMax = (min[2] - a[2]) * invDirZ;
    }

    if ((tMin > tzMax) || (tzMin > tMax)) return null;

    if (tzMin > tMin || tMin !== tMin) tMin = tzMin;
    if (tzMax < tMax || tMax !== tMax) tMax = tzMax;
    if (tMax < 0) return null;

    return ray3.get(out, a, tMin >= 0 ? tMin : tMax);
};

/**
 * Sets a vec3 with the intersection point of a ray3 and boxes" components
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 * TODO: Flip internals of getIntersectBounds with this as it will be called more often
 *
 * @param {vec3} out
 * @param {ray3} ray
 * @param {box3|Float32Array} box
 * @returns {null|vec3}
 */
ray3.getIntersectBox3 = (function ()
{
    let vec3_0, vec3_1;

    return function (out, a, b)
    {
        if (!vec3_0)
        {
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
        }

        box3.getMin(vec3_0, b);
        box3.getMax(vec3_1, b);

        return ray3.getIntersectBounds(out, a, vec3_0, vec3_1);
    };
})();

/**
 * Sets a vec3 with the intersection point of a ray3 and a triangle"s components
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 * @TODO: Flip internals with getIntersectVertices as this will be called more often
 *
 * @param {vec3} out            - receiving vec3
 * @param {ray3} a              - source ray3
 * @param {tri3} f              - The tri3 to intersect
 * @param {boolean} bfc         - enables/ disables back face culling
 * @returns {(null|vec3)} [out] - null or receiving vec3
 */
ray3.getIntersectTri3 = (function ()
{
    let vec3_0, vec3_1, vec3_2;

    return function (out, a, f, bfc)
    {
        if (!vec3_0)
        {
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
            vec3_2 = vec3.create();
        }

        tri3.getV1(vec3_0, f);
        tri3.getV2(vec3_1, f);
        tri3.getV3(vec3_2, f);

        return ray3.getIntersectVertices(out, a, vec3_0, vec3_1, vec3_2, bfc);
    };
})();


/**
 * Sets a vec3 with the intersection point of a ray3 and a triangle"s components
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @author three.js authors (converted)
 * @param {vec3} out            - receiving vec3
 * @param {ray3} a              - source ray3
 * @param {vec3} vertA          - first triangle vertex position
 * @param {vec3} vertB          - second triangle vertex position
 * @param {vec3} vertC          - third triangle vertex position
 * @param {boolean} bfc         - enables/ disables back face culling
 * @returns {(null|vec3)} [out] - null or receiving vec3
 */
ray3.getIntersectVertices = (function ()
{
    let vec3_0, vec3_1, vec3_2, vec3_3, vec3_4, vec3_5;

    return function (out, a, vertA, vertB, vertC, bfc)
    {
        if (!vec3_0)
        {
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
            vec3_2 = vec3.create();
            vec3_3 = vec3.create();
            vec3_4 = vec3.create();
            vec3_5 = vec3.create();
        }

        let o = ray3.getOrigin(vec3_4, a);
        let d = ray3.getDirection(vec3_5, a);

        let diff = vec3.subtract(vec3_0, o, vertA);
        let e1 = vec3.subtract(vec3_1, vertB, vertA);
        let e2 = vec3.subtract(vec3_2, vertC, vertA);
        let n = vec3.cross(vec3_3, e1, e2);
        let DdN = vec3.dot(d, n);
        let sign;

        if (DdN > 0)
        {
            if (bfc) return null;
            sign = 1;
        }
        else if (DdN < 0)
        {
            sign = -1;
            DdN = -DdN;
        }
        else return null;

        vec3.cross(e2, diff, e2);
        let b1 = sign * vec3.dot(d, e2);
        if (b1 < 0) return null;

        vec3.cross(e1, e1, diff);
        let b2 = sign * vec3.dot(d, e1);
        if (b2 < 0) return null;
        if (b1 + b2 > DdN) return null;

        let QdN = -sign * vec3.dot(diff, n);
        if (QdN < 0) return null;

        return ray3.get(out, a, QdN / DdN);
    };
})();

/**
 * Sets a vec3 with the intersection point of a ray3 and a plane"s components
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @param {vec3} out             - receiving vec3
 * @param {ray3} a               - source ray3
 * @param {vec3} n               - plane normal
 * @param {number} c             - plane constant
 * @returns {(null|vec3)} vecOut - null or receiving vec3
 */
ray3.getIntersectNormalConstant = function (out, a, n, c)
{
    let t = ray3.distanceNormalConstant(a, n, c);
    return t !== null ? ray3.get(out, a, t) : null;
};

/**
 * Sets a vec3 with the intersection point of a ray3 and a Float32Array(4) Plane
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @param {vec3} out              - receiving vec3
 * @param {ray3} a                    - source ray3
 * @param {(pln|Float32Array)} p      - plane to intersect
 * @returns {(null|vec3)} [out]    - null or receiving vec3
 */
ray3.getIntersectPln = function (out, a, p)
{
    let t = ray3.distancePln(a, p);
    return t !== null ? ray3.get(out, a, t) : null;
};

/**
 * Sets a vec3 with the intersection point of a ray3 and a sphere"s components
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @author three.js authors (converted)
 * @param {vec3} out            - receiving vec3
 * @param {ray3} a              - source ray3
 * @param {vec3} p              - sphere position
 * @param {number} r            - sphere radius
 * @returns {(null|vec3)} [out] - null or receiving vec3
 */
ray3.getIntersectPositionRadius = (function ()
{
    let sph3_0;

    return function (out, a, p, r)
    {
        if (!sph3_0) sph3_0 = sph3.create();
        sph3.from(sph3_0, p, r);
        return ray3.getIntersectSph3(out, a, sph3_0);
    };
})();

/**
 * Sets a vec3 with the intersection point of a ray3 and a Float32Array(4) sphere
 * - Returns null if there was no intersection, or the receiving vec3 if there was
 *
 * @author three.js authors (converted)
 * @param {vec3} out            - receiving vec3
 * @param {ray3} a              - source ray3
 * @param {sph3} s              - sphere
 * @returns {(null|vec3)} [out] - null or receiving vec3
 */
ray3.getIntersectSph3 = function (out, a, s)
{
    let x = s[0] - a[0],
        y = s[1] - a[1],
        z = s[2] - a[2],
        r2 = s[3] * s[3];

    let tca = x * a[3] + y * a[4] + z * a[5];
    let d2 = (x * x + y * y + z * z) - tca * tca;

    if (d2 > r2) return null;

    let thc = Math.sqrt(r2 - d2);
    let t0 = tca - thc;
    let t1 = tca + thc;

    if (t0 < 0 && t1 < 0) return null;
    if (t0 < 0) return ray3.get(out, a, t1);
    return ray3.get(out, a, t0);
};


/**
 * Gets the origin component of a ray3
 *
 * @param {vec3} out
 * @param {ray3} a
 * @returns {vec3} out
 */
ray3.getOrigin = box3.getMin;

/**
 * Checks for ray3 intersection with a Float32Array(6) box
 * TODO: Replace internals with intersectsBounds as this will get called more often
 * @param {ray3} a                - ray3
 * @param {(box3|Float32Array)} b - box
 * @returns {boolean}             - true if intersection occurs
 */
ray3.intersectsBox3 = (function ()
{
    let vec3_0;
    return function (a, b)
    {
        if (!vec3_0) vec3_0 = vec3.create();
        return ray3.vec3_0 = ray3.getIntersectBox3(vec3_0, a, b) !== null;
    };
})();

/**
 * Checks for ray3 intersection with bounds
 *
 * @param {ray3} a     - ray3
 * @param {vec3} min  - box min bounds
 * @param {vec3} max  - box max bounds
 * @returns {boolean} - true if intersection occurs
 */
ray3.intersectsBounds = (function ()
{
    let vec3_0;
    return function intersectsBounds(a, min, max)
    {
        if (!vec3_0) vec3_0 = vec3.create();
        return ray3.getIntersectBounds(vec3_0, a, min, max) !== null;
    };
})();

/**
 * Checks for ray3 intersection with a plane"s components
 *
 * @param {ray3} a    - source ray3
 * @param {vec3} n    - plane normal
 * @param {number} c  - plane constant
 * @returns {boolean} - true if intersection occurs
 */
ray3.intersectsNormalConstant = function (a, n, c)
{
    let dist = (a[0] * n[0] + a[1] * n[1] + a[2] * n[2]) + c;
    return dist === 0 ? true : ((n[0] * a[3] + n[1] * a[4] + n[2] * a[5]) * dist < 0);
};

/**
 * Checks for ray3 intersection with a Float32Array(4) plane
 *
 * @param {ray3} a    - source ray3
 * @param {pln} p     - plane
 * @returns {boolean} - true if intersection occurs
 */
ray3.intersectsPln = function (a, p)
{
    let dist = (a[0] * p[0] + a[1] * p[1] + a[2] * p[2]) + p[3];
    return (dist === 0) ? true : ((p[0] * a[3] + p[1] * a[4] + p[2] * a[5]) * dist < 0);
};

/**
 * Checks for ray3 intersection with a sphere"s components
 *
 * @param {ray3} a     - source ray3
 * @param {vec3} p    - sphere position
 * @param {number} r  - sphere radius
 * @returns {boolean} - true if intersection occurs
 */
ray3.intersectsPositionRadius = function (a, p, r)
{
    return ray3.distance(a, p) <= r;
};

/**
 * Checks for ray3 intersection with a Float32Array(4) Sphere
 *
 * @param {ray3} a              - source ray3
 * @param {sph3|Float32Array} s - sphere
 * @returns {boolean}           - true if intersection occurs
 */
ray3.intersectsSph3 = function (a, s)
{
    return ray3.distance(a, s) <= s[3];
};

/**
 * Sets the direction of a ray3 to be looking at a specific point
 *
 * @param {ray3} out   - receiving ray3
 * @param {vec3} a     - source ray3
 * @param {vec3} p     - point to look at
 * @returns {ray3} out - receiving ray3
 */
ray3.lookAt = function (out, a, p)
{
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = p[0] - a[0];
    out[4] = p[1] - a[1];
    out[5] = p[2] - a[2];
    return ray3.normalize(out, out);
};

/**
 * Sets a ray3 from the results of normalizing another
 *
 * @param {ray3} out   - receiving ray3
 * @param {ray3} a     - source ray3
 * @returns {ray3} out - receiving ray3
 */
ray3.normalize = function (out, a)
{
    if (out !== a)
    {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
    }

    let x = a[3],
        y = a[4],
        z = a[5];

    // Normalize the direction
    let len = x * x + y * y + z * z;
    if (len > 0)
    {
        len = 1 / Math.sqrt(len);
        out[3] = x * len;
        out[4] = y * len;
        out[5] = z * len;
    }
    else
    {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        throw new Error("Normalization error");
    }

    return out;
};

/**
 * Shifts the origin of a ray3 to be further down it"s direction
 *
 * @param {ray3} out  - receiving ray3
 * @param {ray3} a    - source ray3
 * @param {number} t - distance along the ray3
 * @returns {ray3}    - receiving ray3
 */
ray3.recast = function (out, a, t)
{
    out[0] = a[0] + (a[3] * t);
    out[1] = a[1] + (a[4] * t);
    out[2] = a[2] + (a[5] * t);
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Sets a ray3 from values
 *
 * @param {ray3} out
 * @param {vec3} startProp
 * @param {vec3} endProp
 * @returns {ray3} out
 */
ray3.set = box3.set;

/**
 * Ray3 generic sorting
 *
 * @param {{}} a
 * @param {number} a.distance
 * @param {{}} b
 * @param {number} b.distance
 * @returns {number}
 */
ray3.SORT = function (a, b)
{
    return a.distance - b.distance;
};

/**
 * Gets the squared distance from a ray3 to a point
 *
 * @author three.js authors (converted)
 * @param {ray3} a   - source ray3
 * @param {vec3} p   - point to measure distance to
 * @returns {number} - squared distance
 */
ray3.squaredDistance = (function ()
{
    let vec3_0, vec3_1;
    return function distanceSquared(a, p)
    {
        if (!vec3_0)
        {
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
        }

        vec3_0[0] = p[0] - a[0];
        vec3_0[1] = p[1] - a[1];
        vec3_0[2] = p[2] - a[2];

        let dirDist = vec3_0[0] * a[3] + vec3_0[1] * a[4] + vec3_0[2] * a[5];
        if (dirDist < 0)
        {
            ray3.getOrigin(vec3_1, a);
            return vec3.squaredDistance(vec3_1, p); // could just pass in the ray3
        }

        ray3.get(vec3_0, a, dirDist);
        return vec3.squaredDistance(vec3_0, p);
    };
})();

/**
 * Sets an array at at optional offset from a ray3
 *
 * @param {ray3} a
 * @param {Array} arr
 * @param {number} [index]
 * @returns {ray3} a
 */
ray3.toArray = box3.toArray;

/**
 * Sets origin and direction vectors from a ray3
 *
 * @param {ray3} a
 * @param {vec3} origin
 * @param {vec3} direction
 * @returns {ray3} a
 */
ray3.toOriginDirection = function (a, origin, direction)
{
    origin[0] = a[0];
    origin[1] = a[1];
    origin[2] = a[2];
    direction[0] = a[3];
    direction[1] = a[4];
    direction[2] = a[5];
    return a;
};

/**
 * Transforms a ray3 by a mat4
 *
 * @param {ray3} out   - receiving ray3
 * @param {vec3} a     - ray3 to transform
 * @param {mat4} m     - matrix to transform by
 */
ray3.transformMat4 = function (out, a, m)
{
    let oX = a[0],
        oY = a[1],
        oZ = a[2],
        dX = a[3] + a[0],
        dY = a[4] + a[1],
        dZ = a[5] + a[2];

    // Calculate w
    let oW = (m[3] * oX + m[7] * oY + m[11] * oZ + m[15]) || 1.0,
        dW = (m[3] * dX + m[7] * dY + m[11] * dZ + m[15]) || 1.0;
    // Transform origin
    out[0] = (m[0] * oX + m[4] * oY + m[8] * oZ + m[12]) / oW;
    out[1] = (m[1] * oX + m[5] * oY + m[9] * oZ + m[13]) / oW;
    out[2] = (m[2] * oX + m[6] * oY + m[10] * oZ + m[14]) / oW;
    // Transform direction
    out[3] = (m[0] * dX + m[4] * dY + m[8] * dZ + m[12]) / dW - out[0];
    out[4] = (m[1] * dX + m[5] * dY + m[9] * dZ + m[13]) / dW - out[1];
    out[5] = (m[2] * dX + m[6] * dY + m[10] * dZ + m[14]) / dW - out[2];
    // Normalize direction
    return ray3.normalize(out, out);
};

/**
 * Translates a ray3
 *
 * @param {ray3} out
 * @param {ray3} a
 * @param {vec3} v
 * @returns {ray3} out
 */
ray3.translate = function (out, a, v)
{
    out[0] = a[0] + v[0];
    out[1] = a[1] + v[1];
    out[2] = a[2] + v[2];
    return out;
};

let viewPort;

/**
 * Gets a ray3 from an element event
 * @param {ray3} ray
 * @param {mat4} viewProjectionInverse
 * @param {event} event
 * @param {vec2} [mouse]
 * @param {vec2} [pixel]
 * @param {vec2} [css]
 * @returns {ray3}
 */
ray3.fromEvent = function (ray, viewProjectionInverse, event, mouse, pixel, css)
{
    if (!viewPort) viewPort = pln.create();

    const
        el = event.target || event.srcElement,
        rect = el.getBoundingClientRect(),
        mX = event.clientX,
        mY = event.clientY,
        cX = mX - rect.left,
        cY = mY - rect.top,
        pX = cX * el.width / el.clientWidth,
        pY = el.height - cY * el.height / el.clientWidth - 1;

    // Should this be a param?
    viewPort[0] = 0;
    viewPort[1] = 0;
    viewPort[2] = el.width;
    viewPort[3] = el.height;

    if (mouse)
    {
        mouse[0] = mX;
        mouse[1] = mY;
    }

    if (pixel)
    {
        pixel[0] = pX;
        pixel[1] = pY;
    }

    if (css)
    {
        css[0] = cX;
        css[1] = cY;
    }

    return ray3.unproject(ray, pixel, viewProjectionInverse, viewPort);
};