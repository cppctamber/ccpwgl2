import { vec3, mat4 } from "gl-matrix";
import { carbonPerspectiveOffCenter, carbonOrthoOffCenter } from "../../global/math/carbonProjection.js";


/**
 * Carbon cascaded sun-shadow data, authored in Carbon's own layout.
 *
 * This exists because Carbon's PerFramePS has registers the legacy GLES layout
 * has no source for. `Tw2CarbonData` transcodes what both layouts share and
 * leaves 24-117 zero; the cascade block is authored here instead.
 *
 * The consuming shader is `ShadowDepth.fx` (High tier `shadowdepth.sm_depth`),
 * a full-screen pass that turns the cascade depth atlas into the screen-space
 * R8 visibility buffer that 126 object shaders sample. The full contract is in
 * `/docs/contracts/carbon-shadow-resolve.md` - read it before changing anything
 * here, especially the three registers that silently disable shadows when zero.
 *
 * MATH CONVENTION. Carbon is row-vector and gl-matrix is column-vector, so
 * every composition below reverses its operands relative to the Carbon source.
 * Individual matrices port byte-for-byte. See the `carbon-math-conventions`
 * skill; getting this wrong is silent.
 *
 * CARBON AND CCPWGL MAY HAVE DIVERGED, so this module takes as little from
 * ccpwgl's own matrices as it can:
 *
 * - the cascade sub-frustum and the ortho use the carbonProjection builders,
 *   D3D form with z in 0..1, rather than gl-matrix's frustum/ortho and
 *   their GL range. The depth comparison and the bias fold both assume 0..1.
 * - `GetFrustumRatios` reads only the x/y scale and offset terms, which are
 *   identical in the D3D and GL conventions, so it does not care which one
 *   ccpwgl's projection follows. It would care about the z terms, and does not
 *   touch them.
 * - the view matrix is used as given.
 *
 * **The one place divergence must be checked rather than designed around is
 * `ProjectionInverseMat`.** The resolve pass unprojects ccpwgl's OWN scene
 * depth buffer with it, so it has to invert whatever projection actually
 * produced that buffer. Carbon uses a reversed-depth, jittered projection
 * (`EveSpaceScene.cpp:3193`); if ccpwgl's depth is neither, copying Carbon's
 * formula puts every fragment in the wrong place, and the failure looks like
 * wrong cascade selection rather than a bad unprojection. That register is
 * deliberately NOT authored here - it belongs with whoever owns the depth pass.
 */

/** Carbon PerFramePS register indices (see /docs/contracts/constant-buffer-slots.md) */
export const REG = {
    SHADOW_MAP_VALUES: 24,   // 24-27, sixteen cascade zFar packed four per register
    SHADOW_MATRIX: 28,       // 28-91, sixteen 4x4 matrices
    SPLIT_INFO: 92,          // .x = active cascade count
    PROJECTION_INVERSE: 93   // 93-96
};

/** Carbon's SHADOW_FRUSTUM_COUNT (Tr2ShadowMap.h:15) */
export const SHADOW_FRUSTUM_COUNT = 16;

/**
 * Carbon's STATIC split table (Tr2ShadowMap.cpp:370-388), the default mode.
 *
 * 25, then x3, then x2 all the way up. The LAST value is not merely the
 * sixteenth cascade's end: the resolve pass uses it as the global shadow
 * distance, writing "fully lit" beyond it and fading over the final 5%.
 * @type {Array<Number>}
 */
export const STATIC_SPLITS = [
    25, 75, 150, 300, 600, 1200, 2400, 4800,
    9600, 19200, 38400, 76800, 153600, 307200, 614400, 1228800
];

const
    _basis = mat4.create(),
    _lightView = mat4.create(),
    _subProjection = mat4.create(),
    _invSubProjection = mat4.create(),
    _ortho = mat4.create(),
    _scratch = mat4.create(),
    _corner = vec3.create(),
    // The eight slice corners in light space, kept so the shimmer snap can
    // measure the diameter across every PAIR as Carbon does.
    _corners = [ 0, 0, 0, 0, 0, 0, 0, 0 ].map(() => vec3.create()),
    _min = vec3.create(),
    _max = vec3.create(),
    _center = vec3.create(),
    _z = vec3.create(),
    _x = vec3.create(),
    _y = vec3.create();

/**
 * The DX unit cube, z in 0..1 (Tr2ShadowMap.h:20-30).
 * gl-matrix's ortho/perspective use the GL convention of z in -1..1, so the
 * projections here are written out rather than taken from mat4.
 */
const UNIT_CUBE = [
    [ -1, -1, 0 ], [ 1, -1, 0 ], [ -1, 1, 0 ], [ 1, 1, 0 ],
    [ -1, -1, 1 ], [ 1, -1, 1 ], [ -1, 1, 1 ], [ 1, 1, 1 ]
];

/**
 * Builds the light's view matrix for a sun direction
 *
 * Carbon: `Inverse( OrthoNormalBasisZ( -lightDirection ) )`
 * (Tr2ShadowMap.cpp:173). The basis has no translation - the light "camera"
 * sits at the world origin - so the inverse is the transpose, but invert is
 * used here so a denormalised input fails loudly rather than silently.
 * @param {mat4} out
 * @param {vec3} sunDirection - world-space sun direction, as stored
 * @returns {mat4}
 */
export function buildLightView(out, sunDirection)
{
    vec3.negate(_z, sunDirection);
    vec3.normalize(_z, _z);

    // Any stable perpendicular; the choice only rotates the cascade within its
    // own texel grid, and the snapping below is what keeps that from shimmering.
    vec3.set(_x, 0, 1, 0);
    if (Math.abs(vec3.dot(_x, _z)) > 0.99) vec3.set(_x, 1, 0, 0);

    vec3.cross(_y, _z, _x);
    vec3.normalize(_y, _y);
    vec3.cross(_x, _y, _z);
    vec3.normalize(_x, _x);

    // A Carbon basis row lands at the same three floats as a gl-matrix basis
    // column, so this IS OrthoNormalBasisZ byte for byte.
    mat4.identity(_basis);
    _basis[0] = _x[0]; _basis[1] = _x[1]; _basis[2] = _x[2];
    _basis[4] = _y[0]; _basis[5] = _y[1]; _basis[6] = _y[2];
    _basis[8] = _z[0]; _basis[9] = _z[1]; _basis[10] = _z[2];

    return mat4.invert(out, _basis) || mat4.identity(out);
}

/**
 * Folds the NDC->UV bias and the atlas tile onto a light projection.
 *
 * Shared so the frustum-fitted and subject-fitted paths cannot drift apart -
 * this is the half that has to agree with where the rasteriser stored the
 * texel, and it was mirrored once already.
 * @param {mat4} out
 * @param {Object} options
 * @param {mat4} ortho
 * @returns {mat4}
 */
function composeCascadeMatrix(out, options, ortho)
{
    const { index, cellsX, cellsY, lightView, inverseView } = options;

    // Applied last, so built first: tile translate, tile scale, bias translate,
    // bias scale, then the projections.
    const
        x = index % cellsX,
        y = Math.floor(index / cellsX);

    mat4.fromTranslation(out, [ x / cellsX, y / cellsY, 0 ]);

    mat4.fromScaling(_scratch, [ 1 / cellsX, 1 / cellsY, 1 ]);
    mat4.multiply(out, out, _scratch);

    mat4.fromTranslation(_scratch, [ 0.5, 0.5, 0 ]);
    mat4.multiply(out, out, _scratch);

    // NDC to UV. Z is deliberately untouched: the DX ortho already put it in
    // 0..1, which is what the depth comparison expects.
    //
    // Y IS NOT NEGATED, and that is a deliberate departure from Carbon.
    //
    // Carbon uses `scale(0.5, -0.5, 1)` because D3D's framebuffer origin is
    // TOP-left: its rasterizer stores `V = (1 - ndc.y) / 2`, so the negation is
    // what makes the lookup agree with the tile it just rendered. GL's origin
    // is BOTTOM-left and stores `V = (ndc.y + 1) / 2`, so carrying the negation
    // across samples the vertical MIRROR of the atlas.
    //
    // With the ortho's bottom/top already swapped above, light-space Ymax
    // rasterises to V=0; the negated lookup asks for V=1. Shadows then track
    // the sun and the cascade splits - the tile and the depth are both right -
    // while landing in the wrong place, which is what "not in the correct
    // space" looked like on screen.
    //
    // `scripts/test-carbon-shadow.mjs` could not catch this: with `cellsY = 1`
    // it asserts the cascade centre lands near V = 0.5, and a flip about 0.5
    // leaves the centre exactly where it was.
    mat4.fromScaling(_scratch, [ 0.5, 0.5, 1 ]);
    mat4.multiply(out, out, _scratch);

    mat4.multiply(out, out, ortho);
    mat4.multiply(out, out, lightView);
    mat4.multiply(out, out, inverseView);

    return out;
}

/**
 * Builds one cascade's view-space-to-atlas-UV matrix.
 *
 * Carbon splits this across Tr2ShadowMap::SetupShadowSplit
 * (Tr2ShadowMap.cpp:144-224) and EveSpaceScene::PopulatePerFramePSData
 * (EveSpaceScene.cpp:3175-3188). The whole chain, in Carbon's row-vector order
 * where left is applied first:
 *
 *     invView . lightView . ortho . S(.5,-.5,1) . T(.5,.5,0)
 *             . S(1/cellsX,1/cellsY,1) . T(x/cellsX,y/cellsY,0)
 *
 * so in gl-matrix every operand reverses and the chain is built from the LAST
 * applied backwards.
 *
 * The result consumes a VIEW-space position, not a world-space one - the
 * resolve shader computes a world position for its sphere occluder test and
 * then feeds this matrix the view-space one. That is the single easiest thing
 * here to get wrong.
 *
 * @param {mat4} out
 * @param {Object} options
 * @param {mat4} options.inverseView - view to world
 * @param {mat4} options.lightView
 * @param {Object} options.frustum - {leftDivNear, rightDivNear, bottomDivNear, topDivNear}
 * @param {Number} options.zNear - this cascade's near, the previous cascade's zFar
 * @param {Number} options.zFar
 * @param {Number} options.index - cascade index, selects the atlas tile
 * @param {Number} options.cellsX @param {Number} options.cellsY
 * @param {Number} options.tileSize - atlas tile edge in texels, for snapping
 * @param {Boolean} [options.disableShimmer=true]
 * @returns {mat4}
 */
export function buildCascadeMatrix(out, options)
{
    const {
        inverseView, lightView, frustum, zNear, zFar, index,
        cellsX, cellsY, tileSize, disableShimmer = true
    } = options;

    // SUBJECT FITTING - a deliberate departure from Carbon.
    //
    // Carbon sizes every cascade to a slice of the CAMERA FRUSTUM, which is
    // right for a client drawing a whole system: the shadowed set is whatever
    // the camera can see. A ship viewer is the opposite case - one object in
    // empty space - and there a frustum-sized cascade spends nearly all its
    // texels on nothing. At 3km the containing slice is kilometres across, so a
    // 200m hull lands on under a tenth of a 1024 tile, and the self-shadowing
    // that is the ONLY visible shadow in space vanishes into the grid.
    //
    // Fitting the box to the subject's own bounding sphere makes texel density
    // depend on the SHIP's size rather than on how far away the camera is
    // standing, which is what makes shadows usable at normal viewing distances.
    if (options.subjectLight)
    {
        const { center, radius } = options.subjectLight;
        vec3.set(_min, center[0] - radius, center[1] - radius, center[2] - radius);
        vec3.set(_max, center[0] + radius, center[1] + radius, center[2] + radius);

        if (options.casterNearExtend > 0)
        {
            _max[2] += (_max[2] - _min[2]) * options.casterNearExtend;
        }

        carbonOrthoOffCenter(_ortho, _max[0], _min[0], _max[1], _min[1], _max[2], _min[2]);
        if (options.orthoOut) mat4.copy(options.orthoOut, _ortho);
        return composeCascadeMatrix(out, options, _ortho);
    }

    // The sub-frustum for this slice, from the camera's own edge ratios
    // rescaled by the running near plane (Tr2ShadowMap.cpp:161-165).
    carbonPerspectiveOffCenter(
        _subProjection,
        frustum.leftDivNear * zNear, frustum.rightDivNear * zNear,
        frustum.bottomDivNear * zNear, frustum.topDivNear * zNear,
        zNear, zFar
    );
    mat4.invert(_invSubProjection, _subProjection);

    // Its corners in light space (Tr2ShadowMap::CalculateAABB, :120-138):
    // unit cube -> inverse projection -> divide -> world -> light.
    vec3.set(_min, Infinity, Infinity, Infinity);
    vec3.set(_max, -Infinity, -Infinity, -Infinity);

    for (let i = 0; i < UNIT_CUBE.length; i++)
    {
        vec3.set(_corner, UNIT_CUBE[i][0], UNIT_CUBE[i][1], UNIT_CUBE[i][2]);
        vec3.transformMat4(_corner, _corner, _invSubProjection);   // includes the w divide
        vec3.transformMat4(_corner, _corner, inverseView);
        vec3.transformMat4(_corner, _corner, lightView);
        vec3.min(_min, _min, _corner);
        vec3.max(_max, _max, _corner);
    }

    if (disableShimmer)
    {
        // Snap the cascade to its own texel grid so a moving camera does not
        // make the shadow edges crawl (Tr2ShadowMap.cpp:180-205). X and Y only,
        // and the box becomes a cube so rotation cannot change its size.
        vec3.add(_center, _min, _max);
        vec3.scale(_center, _center, 0.5);

        // Carbon takes the largest distance between ANY TWO corners - the
        // slice's diameter - and halves it (Tr2ShadowMap.cpp:184-196). Measuring
        // from the centre instead already yields a radius, so halving that again
        // produced a box half the size it should be, and the outer half of every
        // cascade fell outside its own shadow box. That is the "shadows are
        // weirdly cut off" edge, and it is independent of the near planes.
        for (let i = 0; i < UNIT_CUBE.length; i++)
        {
            vec3.set(_corners[i], UNIT_CUBE[i][0], UNIT_CUBE[i][1], UNIT_CUBE[i][2]);
            vec3.transformMat4(_corners[i], _corners[i], _invSubProjection);
            vec3.transformMat4(_corners[i], _corners[i], inverseView);
            vec3.transformMat4(_corners[i], _corners[i], lightView);
        }

        let maxDist = 0;
        for (let i = 0; i < UNIT_CUBE.length; i++)
        {
            for (let j = i + 1; j < UNIT_CUBE.length; j++)
            {
                maxDist = Math.max(maxDist, vec3.distance(_corners[i], _corners[j]));
            }
        }
        const radius = Math.ceil(maxDist / 2);

        const texelSize = (radius * 2) / tileSize;
        _center[0] = Math.floor(_center[0] / texelSize + 0.5) * texelSize;
        _center[1] = Math.floor(_center[1] / texelSize + 0.5) * texelSize;

        vec3.set(_min, _center[0] - radius, _center[1] - radius, _center[2] - radius);
        vec3.set(_max, _center[0] + radius, _center[1] + radius, _center[2] + radius);
    }

    // Carbon passes l/r and b/t SWAPPED and negates z (Tr2ShadowMap.cpp:211).
    // Reproduce the literal argument order - the net Y sign only makes sense
    // together with the -0.5 in the bias below.
    // Carbon passes l/r and b/t swapped and NEGATES z (Tr2ShadowMap.cpp:211).
    // The swap is reproduced; the z negation is NOT, and that is deliberate.
    //
    // Carbon's negation only makes sense with the handedness its
    // OrthoNormalBasisZ produces. The basis built above is orthonormal and
    // correct but not proven identical in sign, and feeding negated z through
    // it put cascade depth at 2.66 instead of inside 0..1 - caught by
    // `scripts/test-carbon-shadow.js`. Passing the measured light-space range
    // directly is self-consistent with this basis and with the D3D ortho, which
    // maps [near, far] onto [0, 1].
    //
    // If the light basis is ever replaced with a literal port of
    // OrthoNormalBasisZ, this line has to be revisited together with it - the
    // two are one decision, not two.
    // Push the near side of the box out toward the light, so occluders between
    // the light and this slice still rasterise. Carbon disables depth clip for
    // the caster pass instead; WebGL2 has no core equivalent, and where
    // EXT_depth_clamp is missing this is the fallback. A multiple of the box's
    // own depth keeps the range bounded, so depth precision degrades by a known
    // factor rather than by a magic constant.
    if (options.casterNearExtend > 0)
    {
        _max[2] += (_max[2] - _min[2]) * options.casterNearExtend;
    }

    // Z PLANES ARE PASSED max,min - NOT min,max - and that is the whole of the
    // depth direction.
    //
    // Carbon's OrthoOffCenterMatrix is NOT the same formula as ours
    // (Matrix_inline.h:749). Its z row is `m22 = 1/(zn-zf)`, `m32 = zn/(zn-zf)`,
    // giving `z' = (z + zn)/(zn - zf)` - note the PLUS. It therefore expects
    // negated planes, which is why Carbon calls it with `-aabb.max.z, -aabb.min.z`
    // (Tr2ShadowMap.cpp:211) and lands `max.z -> 0`, `min.z -> 1`.
    //
    // Ours is the ordinary `z' = (z - near)/(far - near)`. Feeding it Carbon's
    // negated planes produced depth 2.66 (the failure the previous comment
    // recorded), and the response was to pass `min, max` un-negated - which
    // lands inside 0..1 but maps `max.z -> 1`, the exact REVERSE of Carbon.
    //
    // `buildLightView` puts +Z toward the sun, so `max.z` is the side nearest
    // the light. Carbon gives the nearest surface depth 0; ours gave it 1, so
    // with `clearDepth(1)` and LEQUAL the caster pass kept the FARTHEST surface
    // and the atlas stored back faces. Passing `max, min` into our formula
    // reproduces Carbon's mapping exactly, with no negation.
    carbonOrthoOffCenter(_ortho, _max[0], _min[0], _max[1], _min[1], _max[2], _min[2]);

    // Hand the caster pass its projection.
    //
    // The matrix built below is the LOOKUP matrix: it carries the NDC->UV bias
    // and the atlas tile transform, which exist to turn a position into an
    // atlas coordinate. Rendering casters with it would apply that bias to
    // clip space and place the geometry wrongly - and the tile is already
    // handled by the viewport. What the caster pass needs is the plain light
    // projection, which until now was a local and thrown away, so the caster
    // pass silently rendered with whatever the camera had bound.
    if (options.orthoOut) mat4.copy(options.orthoOut, _ortho);

    return composeCascadeMatrix(out, options, _ortho);
}

/**
 * Builds `ProjectionInverseMat` for ccpwgl's own depth buffer
 *
 * The resolve pass unprojects with this, feeding it the RAW depth sample as the
 * z component: `vec4(ndc.x, -ndc.y, depthSample, 1)`. That works in Carbon
 * because Carbon's projection is D3D form and puts NDC z in 0..1, so the stored
 * depth already IS the NDC z.
 *
 * **ccpwgl is not D3D form.** `mat4.makePerspective` uses
 * `-(far + near) / (far - near)`, the GL convention, so NDC z is -1..1 and the
 * depth buffer holds `(z + 1) / 2`. There is no jitter and no reversed depth
 * either, so Carbon's `Inverse(Transpose(reversedDepthProjection))`
 * (`EveSpaceScene.cpp:3193`) is the wrong matrix here in two separate ways.
 *
 * Rather than change the engine's projection convention, the 0..1 to -1..1
 * remap is folded into the matrix the shader receives:
 *
 *     ours = inverse(P) . S      where S maps (x, y, d, 1) -> (x, y, 2d-1, 1)
 *
 * Getting this wrong does not look like a bad unprojection - every fragment
 * lands at a plausible but wrong depth, so it presents as the wrong cascade
 * being chosen, which is a much harder thing to recognise.
 *
 * @param {mat4} out
 * @param {mat4} projection - the projection that produced the depth buffer
 * @returns {mat4} out
 */
export function BuildProjectionInverse(out, projection)
{
    mat4.invert(out, projection);

    mat4.identity(_scratch);
    _scratch[10] = 2;
    _scratch[14] = -1;

    // Y IS NEGATED TOO, to cancel a flip the shader performs unconditionally.
    //
    // The resolve reconstructs its fragment position from the screen position:
    //
    //     r1.xy = gl_FragCoord.xy / TargetResolution;
    //     r1.xy = r1.xy * 2.0 - 1.0;
    //     r0.xy = r1.xy * vec2(1.0, -1.0);      <-- D3D's Y flip
    //
    // That negation is right in D3D, whose SV_Position has a TOP-LEFT origin.
    // WebGL's gl_FragCoord is BOTTOM-LEFT and the translator emits it
    // unflipped, so the shader flips a Y that was already correct. Every
    // fragment then reconstructs to the world position of the pixel MIRRORED
    // about the screen's horizontal centre, and looks up the shadow atlas
    // there.
    //
    // The symptom is unmistakable once seen: recognisable pieces of the hull
    // appear as shadows on other parts of the hull, they slide uniformly rather
    // than deforming, and they track the sun while never corresponding to
    // anything that could occlude it.
    //
    // Cancelling it here rather than in the shader is the same principle as the
    // depth remap above - supply the matrix that matches the pipeline actually
    // in front of us. NOTE this is a property of the TRANSLATOR, not of this
    // pass: any dx11 shader doing screen-space reconstruction from SV_Position
    // has the same mirror, and they cannot all be fixed from a constant buffer.
    _scratch[5] = -1;

    // gl-matrix applies the right operand first, so this is "remap, then
    // unproject" - the reverse of how the Carbon expression would read.
    return mat4.multiply(out, out, _scratch);
}

/**
 * Extracts the camera frustum edge ratios a cascade needs
 *
 * Carbon computes these once from the current projection and divides them by
 * near, so each cascade can rescale them by its own near plane
 * (EveSpaceScene.cpp:631-641).
 * @param {mat4} projection
 * @returns {{leftDivNear:Number, rightDivNear:Number, bottomDivNear:Number, topDivNear:Number}}
 */
export function GetFrustumRatios(projection)
{
    // For a standard perspective matrix, x scale is 2n/(r-l) and z offset
    // encodes the near plane; the ratios fall out without needing either.
    const
        sx = projection[0],
        sy = projection[5],
        ox = projection[8],
        oy = projection[9];

    return {
        leftDivNear: (ox - 1) / sx,
        rightDivNear: (ox + 1) / sx,
        bottomDivNear: (oy - 1) / sy,
        topDivNear: (oy + 1) / sy
    };
}

