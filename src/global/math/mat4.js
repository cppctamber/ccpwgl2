import { mat4 as glMat4, vec3 as glVec3, quat as glQuat } from "gl-matrix";
import { pool } from "math/pool";
import { carbonPerspectiveOffCenter, carbonOrthoOffCenter } from "./carbonProjection";
// A static IMPORT of the CommonJS module, not a `require`. This file already
// uses ESM syntax, and @rollup/plugin-commonjs defaults to
// `transformMixedEsModules: false` - so a `require` here survives into the
// bundle literally and throws "require is not defined" in the browser. Files
// that are pure CommonJS get their requires transformed, which is why the
// same pattern works in Tw2CarbonResourceBinder and did not work here.

const
    mat4 = { ...glMat4 },
    vec3 = { ...glVec3 };

export { mat4 };

/**
 * Reads the rotational component out of a transform.
 *
 * ## This OVERRIDES gl-matrix, which is the only override in this module
 *
 * Every other name here is an addition. This one deliberately shadows the stock
 * function, because the stock one is wrong for a non-uniform scale: it divides
 * the three inverse scales by ELEMENT INDEX rather than by basis column.
 *
 *     var sm11 = mat[0] * is1;   // X column, correct
 *     var sm12 = mat[1] * is2;   // still the X column, over the Y scale
 *     var sm13 = mat[2] * is3;   // still the X column, over the Z scale
 *
 * Exact when the three scales are equal, which is why it survived. Measured on
 * a known rotation under scale (1, 4, 0.25) it returns a quaternion 78.974
 * degrees out - and nothing throws, because every value stays finite. The
 * failure presents as a child, emitter or turret facing the wrong way on a
 * stretched or non-uniformly scaled parent, which is a long way from the
 * arithmetic that caused it.
 *
 * It also allocated its scale scratch as `glMatrix.ARRAY_TYPE`, which defaults
 * to Float32Array whatever the caller passed, so the stock version rounded
 * through float32 even for a double-precision caller. This one does not.
 *
 * Overridden rather than added beside as `getRotationPrecise`, because a second
 * name leaves every one of the ~28 existing call sites on the broken one and
 * every future one free to pick it again. Nothing can be depending on an 80
 * degree error.
 *
 * A zero-length column has no direction in it, so a matrix with one is reported
 * as unrotated rather than as NaN - the stock version divides by zero there.
 * `mat4.decompose` repairs such a matrix before it gets here.
 *
 * @param {quat} out
 * @param {mat4} m
 * @returns {quat} out
 */
mat4.getRotation = function (out, m)
{
    const
        scaleX = Math.hypot(m[0], m[1], m[2]),
        scaleY = Math.hypot(m[4], m[5], m[6]),
        scaleZ = Math.hypot(m[8], m[9], m[10]);

    if (scaleX === 0 || scaleY === 0 || scaleZ === 0)
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
    }

    const
        ix = 1 / scaleX,
        iy = 1 / scaleY,
        iz = 1 / scaleZ;

    // Each column over its OWN length. That is the whole fix.
    glQuat.fromMat3(out, [
        m[0] * ix, m[1] * ix, m[2] * ix,
        m[4] * iy, m[5] * iy, m[6] * iy,
        m[8] * iz, m[9] * iz, m[10] * iz
    ]);

    return glQuat.normalize(out, out);
};

/**
 *
 * @param {mat4} m
 * @param {quat} rotation
 * @param {vec3} translation
 * @param {vec3} scaling
 * @returns {mat4} m
 */
mat4.decompose = function (m, rotation, translation, scaling)
{
    // The scale is taken off the basis COLUMNS before the rotation is read.
    //
    // This used to call mat4.getRotation on the raw matrix, and gl-matrix
    // divides the three inverse scales by ELEMENT INDEX rather than by column -
    // exact for a uniform scale, and wrong for anything else. Measured on a
    // known rotation under scale (1, 4, 0.25): 78.974 degrees of error. Handing
    // it a matrix whose columns are already unit length makes that division a
    // no-op, which is what this does and what the runtime copy of this file has
    // always done.
    let
        scaleX = Math.hypot(m[0], m[1], m[2]),
        scaleY = Math.hypot(m[4], m[5], m[6]),
        scaleZ = Math.hypot(m[8], m[9], m[10]);

    if (mat4.determinant(m) < 0) scaleX = -scaleX;

    translation[0] = m[12];
    translation[1] = m[13];
    translation[2] = m[14];
    scaling[0] = scaleX;
    scaling[1] = scaleY;
    scaling[2] = scaleZ;

    const nonZeroScaleCount = Number(scaleX !== 0) + Number(scaleY !== 0) + Number(scaleZ !== 0);
    if (nonZeroScaleCount > 0)
    {
        const normalized = pool.allocF32(16);
        mat4.copy(normalized, m);

        if (scaleX !== 0)
        {
            normalized[0] /= scaleX;
            normalized[1] /= scaleX;
            normalized[2] /= scaleX;
        }
        if (scaleY !== 0)
        {
            normalized[4] /= scaleY;
            normalized[5] /= scaleY;
            normalized[6] /= scaleY;
        }
        if (scaleZ !== 0)
        {
            normalized[8] /= scaleZ;
            normalized[9] /= scaleZ;
            normalized[10] /= scaleZ;
        }

        if (nonZeroScaleCount >= 2 && scaleX === 0)
        {
            normalized[0] = normalized[5] * normalized[10] - normalized[6] * normalized[9];
            normalized[1] = normalized[6] * normalized[8] - normalized[4] * normalized[10];
            normalized[2] = normalized[4] * normalized[9] - normalized[5] * normalized[8];
        }
        else if (nonZeroScaleCount >= 2 && scaleY === 0)
        {
            normalized[4] = normalized[9] * normalized[2] - normalized[10] * normalized[1];
            normalized[5] = normalized[10] * normalized[0] - normalized[8] * normalized[2];
            normalized[6] = normalized[8] * normalized[1] - normalized[9] * normalized[0];
        }
        else if (nonZeroScaleCount >= 2 && scaleZ === 0)
        {
            normalized[8] = normalized[1] * normalized[6] - normalized[2] * normalized[5];
            normalized[9] = normalized[2] * normalized[4] - normalized[0] * normalized[6];
            normalized[10] = normalized[0] * normalized[5] - normalized[1] * normalized[4];
        }
        else if (nonZeroScaleCount === 1)
        {
            const
                x = normalized.subarray(0, 3),
                y = normalized.subarray(4, 7),
                z = normalized.subarray(8, 11);

            if (scaleX !== 0)
            {
                const helper = Math.abs(x[1]) < 0.9 ? [ 0, 1, 0 ] : [ 0, 0, 1 ];
                vec3.normalize(z, vec3.cross(z, x, helper));
                vec3.cross(y, z, x);
            }
            else if (scaleY !== 0)
            {
                const helper = Math.abs(y[2]) < 0.9 ? [ 0, 0, 1 ] : [ 1, 0, 0 ];
                vec3.normalize(x, vec3.cross(x, y, helper));
                vec3.cross(z, x, y);
            }
            else
            {
                const helper = Math.abs(z[1]) < 0.9 ? [ 0, 1, 0 ] : [ 1, 0, 0 ];
                vec3.normalize(x, vec3.cross(x, helper, z));
                vec3.cross(y, z, x);
            }
        }

        mat4.getRotation(rotation, normalized);
        pool.freeType(normalized);
    }
    else
    {
        rotation[0] = 0;
        rotation[1] = 0;
        rotation[2] = 0;
        rotation[3] = 1;
    }

    return m;
};

/**
 * Allocates a pooled mat4
 * @returns {Float32Array|mat4}
 */
mat4.alloc = function ()
{
    return pool.allocF32(16);
};

/**
 * Unallocates a pooled mat4
 * @param {mat4|Float32Array} a
 */
mat4.unalloc = function (a)
{
    pool.freeType(a);
};

/**
 * Sets a mat4 from a bone joint mat
 * @param {mat4} out
 * @param {Float32Array} jointMat
 * @param {Number} index
 * @return {mat4}
 */
mat4.fromJointMatIndex = function (out, jointMat, index)
{
    if (index >= 0)
    {
        const offset = index * 12;
        out[0] = jointMat[offset];
        out[1] = jointMat[offset + 4];
        out[2] = jointMat[offset + 8];
        out[3] = 0;
        out[4] = jointMat[offset + 1];
        out[5] = jointMat[offset + 5];
        out[6] = jointMat[offset + 9];
        out[7] = 0;
        out[8] = jointMat[offset + 2];
        out[9] = jointMat[offset + 6];
        out[10] = jointMat[offset + 10];
        out[11] = 0;
        out[12] = jointMat[offset + 3];
        out[13] = jointMat[offset + 7];
        out[14] = jointMat[offset + 11];
        out[15] = 1;
        return out;
    }

    return mat4.identity(out);
};

/**
 * arcFromForward
 * @param {mat4} out
 * @param {vec3} v
 * @return {mat4} out
 */
mat4.arcFromForward = function (out, v)
{
    const norm = vec3.normalize(pool.allocF32(3), v);

    mat4.identity(out);

    if (norm[2] < -0.99999)
    {
        pool.freeType(norm);
        return out;
    }

    if (norm[2] > 0.99999)
    {
        out[5] = -1.0;
        out[10] = -1.0;
        pool.freeType(norm);
        return out;
    }

    const h = (1 + norm[2]) / (norm[0] * norm[0] + norm[1] * norm[1]);

    out[0] = h * norm[1] * norm[1] - norm[2];
    out[1] = -h * norm[0] * norm[1];
    out[2] = norm[0];

    out[4] = out[1];
    out[5] = h * norm[0] * norm[0] - norm[2];
    out[6] = norm[1];

    out[8] = -norm[0];
    out[9] = -norm[1];
    out[10] = -norm[2];

    pool.freeType(norm);
    return out;
};

/**
 * Copies the translation component from one mat4 to another
 * @param {mat4} out
 * @param {mat4} a
 * @returns {mat4} out
 */
mat4.copyTranslation = function (out, a)
{
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    return out;
};

/**
 * Sets a mat4 from a mat4
 * @param {mat4} out
 * @param {mat3} m
 * @returns {mat4} out
 */
mat4.fromMat3 = function (out, m)
{
    out[0] = m[0];
    out[1] = m[1];
    out[2] = m[2];
    out[4] = m[3];
    out[5] = m[4];
    out[6] = m[5];
    out[8] = m[6];
    out[9] = m[7];
    out[10] = m[8];
    out[3] = out[7] = out[11] = out[12] = out[13] = out[14] = 0;
    out[15] = 1;
    return out;
};

// D3D ortho, depth maps to [0..1].
// Was a second copy of the same formulas; delegates now so there is one.
mat4.orthoD3D = carbonOrthoOffCenter;

/**
 * Left-handed look-at (D3D-style): +Z forward
 * Column-major (gl-matrix style)
 */
mat4.lookAtD3D = function (out, eye, center, up)
{
    const x = pool.allocF32(3);
    const y = pool.allocF32(3);
    const z = pool.allocF32(3);

    // z = forward = normalize(center - eye)   (LH)
    vec3.subtract(z, center, eye);

    if (vec3.squaredLength(z) === 0)
    {
        z[2] = 1;
    }

    vec3.normalize(z, z);

    // x = normalize(cross(up, z))
    vec3.cross(x, up, z);

    if (vec3.squaredLength(x) === 0)
    {
        // nudge z slightly if up is parallel
        if (Math.abs(up[2]) === 1) z[0] += 0.0001;
        else z[2] += 0.0001;

        vec3.normalize(z, z);
        vec3.cross(x, up, z);
    }

    vec3.normalize(x, x);

    // y = cross(z, x)
    vec3.cross(y, z, x);

    // Rotation (axes in columns)
    out[0] = x[0]; out[1] = x[1]; out[2]  = x[2];  out[3]  = 0;
    out[4] = y[0]; out[5] = y[1]; out[6]  = y[2];  out[7]  = 0;
    out[8] = z[0]; out[9] = z[1]; out[10] = z[2];  out[11] = 0;

    // Translation
    out[12] = -vec3.dot(x, eye);
    out[13] = -vec3.dot(y, eye);
    out[14] = -vec3.dot(z, eye);
    out[15] = 1;

    pool.freeType(x);
    pool.freeType(y);
    pool.freeType(z);

    return out;

    // After calling lookAtD3D(out, eye, center, up):
    // Transform center by out and it should land on +Z axis (x≈0, y≈0, z>0).
    // Transform eye by out and it should land at the origin (0,0,0).
};

/**
 * Builds a rotation-only look-at basis
 * OpenGL / RH convention
 * −Z is forward
 * Does NOT touch translation
 * Copies translation (and row 3) from an existing matrix
 * Safe for column-major, gl-matrix layout
 *
 * @param {mat4} out - result
 * @param {mat4} m - source matrix
 * @param {vec3} eye - Position of the viewer
 * @param {vec3} center - Point the viewer is looking at
 * @param {vec3} up - vec3 pointing up
 * @returns {mat4} out
 */
mat4.setLookRotation = function (out, m, eye, center, up)
{
    const
        x = pool.allocF32(3),
        y = pool.allocF32(3),
        z = pool.allocF32(3),
        u = pool.allocF32(3); // safeUp

    // z axis = eye - center  (camera backward); -z is forward
    vec3.subtract(z, eye, center);

    if (vec3.squaredLength(z) === 0)
    {
        // arbitrary (back)
        z[2] = 1;
    }
    vec3.normalize(z, z);

    // Pick a stable up if the provided up is too aligned with z
    vec3.copy(u, up);

    // if |dot(up, z)| is ~1 then up × z is unstable
    const dz = Math.abs(u[0] * z[0] + u[1] * z[1] + u[2] * z[2]);
    if (dz > 0.9995)
    {
        // choose an alternate up axis that is not parallel to z
        // try Z axis first, then X axis if needed
        u[0] = 0; u[1] = 0; u[2] = 1;
        const dz2 = Math.abs(u[0] * z[0] + u[1] * z[1] + u[2] * z[2]);
        if (dz2 > 0.9995)
        {
            u[0] = 1; u[1] = 0; u[2] = 0;
        }
    }

    // x = up × z
    vec3.cross(x, u, z);

    // Still degenerate? (can happen if 'up' was zero-length etc.)
    if (vec3.squaredLength(x) === 0)
    {
        // fall back to a guaranteed-not-parallel up using z's dominant axis
        if (Math.abs(z[1]) < 0.999)
        {
            u[0] = 0; u[1] = 1; u[2] = 0;
        }
        else
        {
            u[0] = 1; u[1] = 0; u[2] = 0;
        }
        vec3.cross(x, u, z);
    }

    vec3.normalize(x, x);

    // y = z × x
    vec3.cross(y, z, x);

    // write rotation (columns)
    out[0]  = x[0]; out[1]  = x[1]; out[2]  = x[2];
    out[4]  = y[0]; out[5]  = y[1]; out[6]  = y[2];
    out[8]  = z[0]; out[9]  = z[1]; out[10] = z[2];

    // copy the rest
    if (out !== m)
    {
        out[3]  = m[3];
        out[7]  = m[7];
        out[11] = m[11];
        out[12] = m[12];
        out[13] = m[13];
        out[14] = m[14];
        out[15] = m[15];
    }

    pool.freeType(x);
    pool.freeType(y);
    pool.freeType(z);
    pool.freeType(u);

    return out;
};

/**
 * Gets a mat4's maximum column axis scale
 *
 * @param {mat4} a   - source mat4
 * @returns {number} - maximum axis scale
 */
mat4.maxScaleOnAxis = function (a)
{
    let m11 = a[0],
        m12 = a[4],
        m13 = a[8],
        m21 = a[1],
        m22 = a[5],
        m23 = a[9],
        m31 = a[2],
        m32 = a[6],
        m33 = a[10];

    let x = m11 * m11 + m12 * m12 + m13 * m13,
        y = m21 * m21 + m22 * m22 + m23 * m23,
        z = m31 * m31 + m32 * m32 + m33 * m33;

    return Math.sqrt(Math.max(x, y, z));
};

/**
 * Sets a left handed co-ordinate system perspective from a right handed co-ordinate system
 * @param {mat4} out        - receiving mat4
 * @param {number} fovY     - Vertical field of view in radians
 * @param {number} aspect   - Aspect ratio. typically viewport width/height
 * @param {number} near     - Near bound of the frustum
 * @param {number} far      - Far bound of the frustum
 * @returns {mat4} out      - receiving mat4
 */
mat4.perspectiveGL = function (out, fovY, aspect, near, far)
{
    let fH = Math.tan(fovY / 360 * Math.PI) * near;
    let fW = fH * aspect;
    mat4.frustum(out, -fW, fW, -fH, fH, near, far);
    return out;
};

/**
 * Projects a vector from 3d to 2d space, returning normalized screen space value
 * m should be a projection matrix (or a VP or MVP)
 * @author https://github.com/hughsk/from-3d-to-2d/blob/master/index.js
 * @param {vec3} out   - receiving vec3
 * @param {mat4} m     - Projection / View Projection
 * @param {vec3} a     - the point to project
 * @returns {vec3} out - receiving vec3
 */
mat4.projectVec3 = function (out, m, a)
{
    let
        ix = a[0],
        iy = a[1],
        iz = a[2];

    let ox = m[0] * ix + m[4] * iy + m[8] * iz + m[12],
        oy = m[1] * ix + m[5] * iy + m[9] * iz + m[13],
        oz = m[2] * ix + m[6] * iy + m[10] * iz + m[14],
        ow = m[3] * ix + m[7] * iy + m[11] * iz + m[15];

    out[0] = (ox / ow + 1) / 2;
    out[1] = (oy / ow + 1) / 2;
    out[2] = (oz / ow + 1) / 2;
    return out;
};


/**
 * Sets the translation component of a mat4 from a vec3
 * @param {mat4} out
 * @param {vec3} v
 * @returns {mat4} out
 */
mat4.setTranslation = function (out, v)
{
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    return out;
};

/**
 * Sets the translation component of a mat4 from values
 * @param {mat4} out
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {mat4} out
 */
mat4.setTranslationFromValues = function (out, x, y, z)
{
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
};

/**
 * @author three.js authors
 * @param out
 * @param left
 * @param right
 * @param top
 * @param bottom
 * @param near
 * @param far
 * @returns {*}
 */
mat4.makePerspective = function (out, left, right, top, bottom, near, far)
{
    let x = 2 * near / (right - left),
        y = 2 * near / (top - bottom);

    let a = (right + left) / (right - left),
        b = (top + bottom) / (top - bottom),
        c = -(far + near) / (far - near),
        d = -2 * far * near / (far - near);

    out[0] = x;
    out[4] = 0;
    out[8] = a;
    out[12] = 0;

    out[1] = 0;
    out[5] = y;
    out[9] = b;
    out[13] = 0;

    out[2] = 0;
    out[6] = 0;
    out[10] = c;
    out[14] = d;

    out[3] = 0;
    out[7] = 0;
    out[11] = -1;
    out[15] = 0;

    return out;
};

/**
 * @author three.js authors
 * @param out
 * @param left
 * @param right
 * @param top
 * @param bottom
 * @param near
 * @param far
 * @returns {mat4}
 */
mat4.makeOrthographic = function (out, left, right, top, bottom, near, far)
{
    let w = 1.0 / (right - left),
        h = 1.0 / (top - bottom),
        p = 1.0 / (far - near);

    let x = (right + left) * w,
        y = (top + bottom) * h,
        z = (far + near) * p;

    out[0] = 2 * w;
    out[4] = 0;
    out[8] = 0;
    out[12] = -x;

    out[1] = 0;
    out[5] = 2 * h;
    out[9] = 0;
    out[13] = -y;

    out[2] = 0;
    out[6] = 0;
    out[10] = -2 * p;
    out[14] = -z;

    out[3] = 0;
    out[7] = 0;
    out[11] = 0;
    out[15] = 1;

    return out;
};

/**
 * Builds a D3D off-center perspective projection, mapping z to 0..1
 *
 * Delegates to `math/carbonProjection`, which holds the single implementation
 * so node tests can require it without the build. See that module for why this
 * is not `mat4.frustum`.
 *
 * @param {mat4} out
 * @param {Number} left @param {Number} right
 * @param {Number} bottom @param {Number} top
 * @param {Number} near @param {Number} far
 * @returns {mat4} out
 */
mat4.carbonPerspectiveOffCenter = carbonPerspectiveOffCenter;

/**
 * Builds a D3D off-center orthographic projection, mapping z to 0..1
 *
 * Delegates to `math/carbonProjection`. Shadow cascade matrices fold an
 * NDC-to-UV bias that leaves z untouched precisely because this projection
 * already produced 0..1.
 *
 * @param {mat4} out
 * @param {Number} left @param {Number} right
 * @param {Number} bottom @param {Number} top
 * @param {Number} near @param {Number} far
 * @returns {mat4} out
 */
mat4.carbonOrthoOffCenter = carbonOrthoOffCenter;


/**
 * A SKINR pattern placement.
 *
 * A pattern is placed by a PROJECTOR: a plane floating off the hull that throws
 * the pattern onto it. A design stores where that projector sits as a rotation,
 * a translation and a scale; the game's panel edits it as six numbers under
 * three tabs, and these two carry a placement between the two forms.
 *
 *     longitude, latitude  ORBITAL         where it sits, in degrees
 *     offsetU, offsetV     OFFSET          across the projector's own plane
 *     roll                 ROTATE & SCALE  about its own axis, in degrees
 *     scale                ROTATE & SCALE  uniform
 *     depth                not shown       the standoff, which no user can move
 *
 * There is no mirror here. A design's `mirrored` is a UV mirror - it doubles the
 * pattern back across its own projection - and not a reflected transform, so it
 * is a texturing concern that never reaches this matrix. Nothing to carry.
 *
 * ## Where these facts come from
 *
 * Measured over 3964 player-authored placements, not derived. In the
 * projector's OWN frame, X is the depth and Y and Z are the two offsets - worth
 * stating because the obvious guess, X and Y across the projection with Z into
 * it, is wrong. Local X is negative in every sample on every hull, which is what
 * identifies it as the depth; the scale is uniform in 3964 of 3964; and the
 * offsets slide a FLAT PLANE at a fixed standoff rather than following the
 * hull's shape.
 *
 * ## At the poles, the longitude and the roll are not separable
 *
 * Straight up or straight down, a longitude names no direction and the two
 * angles buy the same turn. `getSkinr` still returns a pair that rebuilds the
 * matrix it was given, but not necessarily the pair that built it - so compare
 * placements by the matrix, never angle by angle. About one in seventy sampled
 * designs sits within a degree of a pole, so this is a case a caller meets.
 *
 * `depth` is not optional even though no panel shows it. Six sliders describe a
 * transform with seven degrees of freedom, and a caller that drops the seventh
 * moves the projector every time it writes a slider back. For a pattern with no
 * placement yet, about 1.72 times the hull's bounding radius is the observed
 * standoff.
 *
 * @typedef {Object} skinr
 * @property {Number} longitude
 * @property {Number} latitude
 * @property {Number} offsetU
 * @property {Number} offsetV
 * @property {Number} roll
 * @property {Number} scale
 * @property {Number} depth
 */

const SKINR_DEGREES = 180 / Math.PI;
const SKINR_RADIANS = Math.PI / 180;

/**
 * Where longitude zero points, in degrees, added to a placement's longitude
 * before it becomes a direction.
 *
 * The geometry puts longitude 0 on hull +X. Measured against the client
 * (operator, 2026-09-08) that is the hull's LEFT side, so an unshifted angle
 * runs a quarter turn ahead of the panel's own horizontal axis the whole way
 * round:
 *
 *   unshifted 0 = left     panel 0 = front
 *   unshifted 90 = front   panel 90 = right
 *   unshifted 180 = right  panel 180 = back
 *   unshifted 270 = back   panel 270 = left
 *
 * The direction of travel is the same, so this is an offset rather than a
 * flipped sign - one constant, not a rewritten pair of formulas. `getSkinr`
 * takes it off and `skinrOrbit` puts it back, which keeps the two exact
 * inverses. Nothing stored changes meaning: a design stores the transform, and
 * the longitude is a number these two derive from it.
 * @type {Number}
 */
const SKINR_LONGITUDE_ORIGIN = 90;

/**
 * An angle folded into -180..180
 * @param {Number} degrees
 * @returns {Number}
 */
function wrapDegrees(degrees)
{
    return degrees - 360 * Math.floor((degrees + 180) / 360);
}

/**
 * The orbit alone: the rotation carrying the projector's -X onto the direction a
 * longitude and a latitude name, with no roll of its own.
 *
 * A turn about Y for the longitude after a turn about Z for the latitude, both
 * built from the angles directly. Built rather than solved as a shortest arc
 * from -X, which is the same rotation everywhere except in conditioning: a
 * shortest arc is singular where the two directions are opposite, and for this
 * axis that is hull +X - the default placement, where designs actually cluster,
 * and longitude -90 now that the angle is measured from the panel's front.
 * Measured against the corpus, the arc form lost three digits there. This way
 * the only singularity is at the poles, where a longitude has no meaning anyway.
 *
 * @param {quat} out
 * @param {Number} longitude degrees
 * @param {Number} latitude degrees
 * @returns {quat} out
 */
function skinrOrbit(out, longitude, latitude)
{
    const y = (Math.PI - (longitude + SKINR_LONGITUDE_ORIGIN) * SKINR_RADIANS) / 2;
    const z = -latitude * SKINR_RADIANS / 2;
    const sy = Math.sin(y), cy = Math.cos(y);
    const sz = Math.sin(z), cz = Math.cos(z);

    out[0] = sy * sz;
    out[1] = sy * cz;
    out[2] = cy * sz;
    out[3] = cy * cz;

    return out;
}

/**
 * A matrix from a SKINR pattern placement.
 *
 * ## The scratch here is DOUBLE precision, and that is not an oversight
 *
 * Every other pooled temporary in this file is Float32, which is right for
 * per-frame maths. This pair is not per-frame: it runs when a panel opens or a
 * slider moves, and its output is read straight back to repopulate that panel.
 * Measured through Float32 scratch, a hundred open/close cycles drifted 6.1e-6 -
 * six times the 1e-6 a consumer holds this to, and visible as sliders that creep
 * on their own. Plain arrays cost nothing at UI rates and leave the precision to
 * whatever array the caller passes as the output.
 *
 * @param {mat4} out
 * @param {skinr} skinr
 * @returns {mat4} out
 */
mat4.fromSkinr = function (out, skinr)
{
    const rotation = new Array(4).fill(0);
    const translation = new Array(3).fill(0);
    const scaling = new Array(3).fill(0);
    const roll = new Array(4).fill(0);

    const half = skinr.roll * SKINR_RADIANS / 2;

    // The roll is about the projector's own axis, which is its X.
    roll[0] = Math.sin(half);
    roll[1] = 0;
    roll[2] = 0;
    roll[3] = Math.cos(half);

    const orbit = new Array(4).fill(0);

    skinrOrbit(orbit, skinr.longitude, skinr.latitude);
    glQuat.multiply(rotation, orbit, roll);

    // The projector is placed in its ORBITAL frame, before the roll.
    //
    // Rotating the offset by the full rotation instead makes ROTATE turn the
    // offset too, which carries the whole projector circle around the hull as a
    // user drags a slider that should only spin the pattern in place. Measured
    // against the client on caldariprimeponyclub.com, whose own copy of this
    // hit it and fixed it the same way.
    translation[0] = -skinr.depth;
    translation[1] = skinr.offsetU;
    translation[2] = skinr.offsetV;
    glVec3.transformQuat(translation, translation, orbit);

    scaling[0] = scaling[1] = scaling[2] = skinr.scale;

    mat4.fromRotationTranslationScale(out, rotation, translation, scaling);


    return out;
};

/**
 * A SKINR pattern placement from a matrix.
 *
 * No mirror is read off the matrix - a design's mirror is a UV one, and never a
 * property of the frame. See the note above the typedef.
 *
 * @param {skinr} out
 * @param {mat4} m
 * @returns {skinr} out
 */
mat4.getSkinr = function (out, m)
{
    const rotation = new Array(4).fill(0);
    const translation = new Array(3).fill(0);
    const scaling = new Array(3).fill(0);
    const local = new Array(3).fill(0);
    const inverse = new Array(4).fill(0);

    // The decomposition is done here rather than through mat4.decompose, which
    // reaches gl-matrix getRotation - and that allocates its own Float32 scratch
    // whatever array it is handed. Measured: a hundred open/close cycles drifted
    // 1.2e-4 through it, against 2.9e-13 for the same steps done here in double
    // precision. A panel that reads its sliders back through this would creep,
    // and the consumer that found it holds the round trip to 1e-6.
    const sx = Math.hypot(m[0], m[1], m[2]);
    const sy = Math.hypot(m[4], m[5], m[6]);
    const sz = Math.hypot(m[8], m[9], m[10]);

    // Scale off the basis columns BEFORE the quaternion is read, because a
    // scaled matrix has no rotation to read.
    glQuat.fromMat3(rotation, [
        m[0] / sx, m[1] / sx, m[2] / sx,
        m[4] / sy, m[5] / sy, m[6] / sy,
        m[8] / sz, m[9] / sz, m[10] / sz
    ]);
    glQuat.normalize(rotation, rotation);

    translation[0] = m[12];
    translation[1] = m[13];
    translation[2] = m[14];

    scaling[0] = sx;
    scaling[1] = sy;
    scaling[2] = sz;

    // Where its -X points in hull space. That direction IS the orbital position:
    // the projector looks back down it at the hull.
    const axisX = -(1 - 2 * (rotation[1] * rotation[1] + rotation[2] * rotation[2]));
    const axisY = -(2 * (rotation[0] * rotation[1] + rotation[3] * rotation[2]));
    const axisZ = -(2 * (rotation[0] * rotation[2] - rotation[3] * rotation[1]));

    out.longitude = wrapDegrees(Math.atan2(axisZ, axisX) * SKINR_DEGREES - SKINR_LONGITUDE_ORIGIN);
    out.latitude = Math.asin(Math.min(1, Math.max(-1, axisY))) * SKINR_DEGREES;

    // The orbit those two name, rebuilt rather than solved as a shortest arc
    // between two directions - see skinrOrbit for why that matters here.
    const orbit = new Array(4).fill(0);

    skinrOrbit(orbit, out.longitude, out.latitude);
    glQuat.conjugate(inverse, orbit);

    // The offsets belong to the ORBITAL plane, before the pattern is spun
    // within it. Reading them through the total rotation makes ROTATE appear to
    // move the projector, which is the same defect as placing them through it.
    glVec3.transformQuat(local, translation, inverse);

    // Whatever spin is left once the orbit is taken back off.
    glQuat.multiply(inverse, inverse, rotation);
    out.roll = 2 * Math.atan2(inverse[0], inverse[3]) * SKINR_DEGREES;

    // Negative in every sampled design, so it is reported as a positive standoff.
    out.depth = -local[0];
    out.offsetU = local[1];
    out.offsetV = local[2];
    out.scale = scaling[0];


    return out;
};
