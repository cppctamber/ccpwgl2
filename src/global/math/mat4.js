import { mat4, vec3 } from "gl-matrix";
import { pool } from "math/pool";

export { mat4 };

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
    mat4.getRotation(rotation, m);
    mat4.getTranslation(translation, m);
    mat4.getScaling(scaling, m);
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

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis from a left handed coordinate system
 *
 * @param {mat4} out - mat4 frustum matrix will be written into
 * @param {vec3} eye - Position of the viewer
 * @param {vec3} center - Point the viewer is looking at
 * @param {vec3} up - vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAtGL = function (out, eye, center, up)
{
    const
        vec3_0 = pool.allocF32(3), //x
        vec3_1 = pool.allocF32(3), //y
        vec3_2 = pool.allocF32(3); //z

    vec3.subtract(vec3_2, eye, center);

    if (vec3.squaredLength(vec3_2) === 0)
    {
        vec3_2[2] = 1;
    }

    vec3.normalize(vec3_2, vec3_2);
    vec3.cross(vec3_0, up, vec3_2);

    if (vec3.squaredLength(vec3_0) === 0)
    {
        if (Math.abs(up[2]) === 1)
        {
            vec3_2[0] += 0.0001;
        }
        else
        {
            vec3_2[2] += 0.0001;
        }
        vec3.normalize(vec3_2, vec3_2);
        vec3.cross(vec3_0, up, vec3_2);
    }

    vec3.normalize(vec3_0, vec3_0);
    vec3.cross(vec3_1, vec3_2, vec3_0);

    out[0] = vec3_0[0];
    out[1] = vec3_0[1];
    out[2] = vec3_0[2];
    out[3] = 0;
    out[4] = vec3_1[0];
    out[5] = vec3_1[1];
    out[6] = vec3_1[2];
    out[7] = 0;
    out[8] = vec3_2[0];
    out[9] = vec3_2[1];
    out[10] = vec3_2[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    pool.freeType(vec3_0);
    pool.freeType(vec3_1);
    pool.freeType(vec3_2);

    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis from a left handed coordinate system
 *
 * @param {mat4} out - mat4 frustum matrix will be written into
 * @param {mat4} m - matrix
 * @param {vec3} eye - Position of the viewer
 * @param {vec3} center - Point the viewer is looking at
 * @param {vec3} up - vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAtGLFixed = function (out, m, eye, center, up)
{
    const
        vec3_0 = pool.allocF32(3), //x
        vec3_1 = pool.allocF32(3), //y
        vec3_2 = pool.allocF32(3); //z

    vec3.subtract(vec3_2, eye, center);

    if (vec3.squaredLength(vec3_2) === 0)
    {
        vec3_2[2] = 1;
    }

    vec3.normalize(vec3_2, vec3_2);
    vec3.cross(vec3_0, up, vec3_2);

    if (vec3.squaredLength(vec3_0) === 0)
    {
        if (Math.abs(up[2]) === 1)
        {
            vec3_2[0] += 0.0001;
        }
        else
        {
            vec3_2[2] += 0.0001;
        }
        vec3.normalize(vec3_2, vec3_2);
        vec3.cross(vec3_0, up, vec3_2);
    }

    vec3.normalize(vec3_0, vec3_0);
    vec3.cross(vec3_1, vec3_2, vec3_0);

    out[0] = vec3_0[0];
    out[1] = vec3_0[1];
    out[2] = vec3_0[2];
    out[4] = vec3_1[0];
    out[5] = vec3_1[1];
    out[6] = vec3_1[2];
    out[8] = vec3_2[0];
    out[9] = vec3_2[1];
    out[10] = vec3_2[2];

    if (out !== m)
    {
        out[3] = m[3];
        out[7] = m[7];
        out[11] = m[11];
        out[12] = m[12];
        out[13] = m[13];
        out[14] = m[14];
        out[15] = m[15];
    }

    pool.freeType(vec3_0);
    pool.freeType(vec3_1);
    pool.freeType(vec3_2);

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
