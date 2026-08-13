/**
 * Carbon-convention (D3D) projection builders, mapping z to 0..1.
 *
 * These are NOT gl-matrix's `frustum`/`ortho`, which follow the GL convention
 * and map z to -1..1. The two agree on the x and y terms and differ only in z,
 * which is exactly the kind of difference that produces a plausible image with
 * wrong depths. Carbon and every shader compiled against it assume 0..1.
 *
 * No dependencies and no ccpwgl aliases, so node can import it directly for
 * tests. It is the SINGLE implementation: `mat4.carbonPerspectiveOffCenter`,
 * `mat4.carbonOrthoOffCenter` and the pre-existing `mat4.orthoD3D` all delegate
 * here rather than repeating the formulas.
 *
 * Output is a plain 16-float array in the shared D3D-row-major / GL-column-major
 * layout, so the result drops straight into a gl-matrix `mat4`.
 */

/**
 * Builds a D3D off-center perspective projection, z to 0..1
 *
 * Carbon `PerspectiveOffCenterMatrix`
 * (`e:\carbonengine\math\include\Matrix_inline.h:717-735`).
 * @param {mat4|Array<Number>} out
 * @param {Number} left @param {Number} right
 * @param {Number} bottom @param {Number} top
 * @param {Number} near @param {Number} far
 * @returns {mat4|Array<Number>} out
 */
export function carbonPerspectiveOffCenter(out, left, right, bottom, top, near, far)
{
    out.fill(0);
    out[0] = 2 * near / (right - left);
    out[5] = 2 * near / (top - bottom);
    out[8] = (left + right) / (right - left);
    out[9] = (top + bottom) / (top - bottom);
    out[10] = far / (near - far);
    out[11] = -1;
    out[14] = near * far / (near - far);
    return out;
}

/**
 * Builds a D3D off-center orthographic projection, z to 0..1
 *
 * NOT a literal port of Carbon's `OrthoOffCenterMatrix`
 * (`e:\carbonengine\math\include\Matrix_inline.h:749-765`), despite the name.
 * The x and y rows are algebraically identical, but the z row is NOT:
 *
 *   Carbon:  m22 = 1/(zn-zf), m32 = zn/(zn-zf)  ->  z' = (z + zn)/(zn - zf)
 *   here:    m22 = 1/(far-near)                 ->  z' = (z - near)/(far - near)
 *
 * Carbon's form consumes a NEGATED depth axis, which is why its call sites pass
 * `-max, -min`. Copying such a call site verbatim into this function inverts
 * depth - it lands inside 0..1, so it looks correct and fails silently. To
 * reproduce a Carbon call here, drop the negation and pass the planes in the
 * same order: `(-max, -min)` there is `(max, min)` here.
 * @param {mat4|Array<Number>} out
 * @param {Number} left @param {Number} right
 * @param {Number} bottom @param {Number} top
 * @param {Number} near @param {Number} far
 * @returns {mat4|Array<Number>} out
 */
export function carbonOrthoOffCenter(out, left, right, bottom, top, near, far)
{
    out.fill(0);
    out[0] = 2 / (right - left);
    out[5] = 2 / (top - bottom);
    out[10] = 1 / (far - near);
    out[12] = -(left + right) / (right - left);
    out[13] = -(top + bottom) / (top - bottom);
    out[14] = near / (near - far);
    out[15] = 1;
    return out;
}
