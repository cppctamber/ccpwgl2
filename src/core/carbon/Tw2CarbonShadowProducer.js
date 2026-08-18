import { vec3, mat4 } from "math";

import {
    REG,
    SHADOW_FRUSTUM_COUNT,
    buildLightView,
    buildCascadeMatrix,
    BuildProjectionInverse,
    GetFrustumRatios
} from "./Tw2CarbonShadowData";
import Tw2CarbonData from "./Tw2CarbonData";


/**
 * Authors Carbon's cascaded sun-shadow registers into PerFramePS.
 *
 * Install on the device's Carbon binder:
 *
 *     Tw2CarbonResourceBinder.Get(device).perFrameProducer = producer;
 *
 * The binder consults a producer after any per-object packer and before the
 * `Tw2CarbonData` transcode, so this fills the head registers the legacy layout
 * genuinely sources and authors the cascade block it cannot.
 *
 * Contract: `/docs/contracts/carbon-shadow-resolve.md`.
 */
export class Tw2CarbonShadowProducer
{

    /** Cascades to build. Carbon uses 16; see the atlas note below. */
    cascadeCount = 4;

    /** Atlas tile edge in texels */
    tileSize = 1024;

    /** Atlas grid. Carbon hard-codes 8x2 at 2048, which WebGL2 cannot allocate. */
    cellsX = 4;
    cellsY = 1;

    /**
     * How far shadows reach, in scene units.
     *
     * Carbon's static table ends at 1228800 across SIXTEEN cascades. Truncating
     * that table is not an option: its first four splits end at 300, which at
     * EVE's scale covers almost nothing. So this uses Carbon's DYNAMIC split
     * instead - a mode Carbon supports (Tr2ShadowMap.cpp:100-118) - spreading
     * the chosen cascade count logarithmically over the range.
     *
     * **Do not feed the camera far plane in here.** EVE cameras see millions of
     * metres; cascades spread over that resolve nothing, and the symptom is
     * shadows that look too faint rather than anything that reads as a
     * resolution problem. Outermost texel size is about
     * `shadowDistance / tileSize`, so size this to the subject.
     */
    shadowDistance = 5000;

    /**
     * Where the first cascade starts. Separate from the camera near plane:
     * a near of 1 against any sensible distance wastes the first cascade or
     * two on a volume nothing occupies.
     */
    shadowNear = 10;

    /**
     * Extends each cascade box toward the light, as a multiple of its own depth.
     *
     * Stands in for the depth-clip disable Carbon uses for its caster pass
     * (`EveSpaceScene.cpp:745`), which WebGL2 has no core equivalent for. Without
     * it, an occluder between the light and a cascade's box is clipped at the
     * near plane and casts nothing - shadows that vanish at particular sun
     * angles while the atlas looks fine.
     *
     * Costs depth precision in proportion, which is why it is a bounded multiple
     * rather than Carbon's commented-out flat 250000.
     */
    // DEFAULT OFF. It changes the cascade projection, so it is a second
    // variable on top of the depth-direction and V fixes; turning it on before
    // those are confirmed working makes an unreadable experiment. Set it to 1
    // once shadows are known good, and only if occluders between the light and
    // a cascade are visibly failing to cast.
    casterNearExtend = 0;

    /** Whether to snap cascades to their texel grid (Carbon default: on) */
    disableShimmer = true;

    /** Set false to author a shadow-free frame without uninstalling */
    enabled = true;

    _splits = new Float32Array(SHADOW_FRUSTUM_COUNT);
    _matrices = [];
    _orthos = [];
    _lightView = mat4.create();
    _inverseView = mat4.create();
    _projectionInverse = mat4.create();
    _sun = vec3.create();
    _subjectCenter = vec3.create();
    _activeCascades = 1;
    _activeCellsX = 1;
    _activeCellsY = 1;
    _built = false;

    constructor()
    {
        for (let i = 0; i < SHADOW_FRUSTUM_COUNT; i++)
        {
            this._matrices[i] = mat4.create();
            this._orthos[i] = mat4.create();
        }
    }

    /**
     * Computes the split distances.
     *
     * Carbon's logarithmic split with no lambda blend or uniform mix
     * (Tr2ShadowMap.cpp:100-118), evaluated over `cascadeCount` rather than 16.
     *
     * **Slots past the last cascade repeat the shadow distance rather than
     * staying zero.** The resolve walks all sixteen and takes the FIRST slot
     * whose zFar exceeds the fragment, so a zero slot is skipped safely - but
     * `ShadowMapValues[3].w` is slot fifteen and doubles as the global cutoff,
     * and writing the distance only there would let slot fifteen win the search
     * and index a cascade matrix that was never built. Repeating the last real
     * distance keeps the cutoff correct while guaranteeing a real cascade
     * always matches first.
     * @param {Number} near
     * @private
     */
    _UpdateSplits(near)
    {
        const
            n = Math.max(1, Math.min(this.cascadeCount, SHADOW_FRUSTUM_COUNT)),
            logNear = Math.log2(Math.max(near, 1e-3)),
            logFar = Math.log2(this.shadowDistance);

        for (let i = 0; i < n; i++)
        {
            this._splits[i] = Math.pow(2, logNear + (logFar - logNear) * ((i + 1) / n));
        }
        for (let i = n; i < SHADOW_FRUSTUM_COUNT; i++)
        {
            this._splits[i] = this._splits[n - 1];
        }
    }

    /**
     * Rebuilds the cascade data for this frame
     * @param {Object} options
     * @param {mat4} options.view - world to view
     * @param {mat4} options.projection - the projection that produced the depth buffer
     * @param {vec3} options.sunDirection - world-space sun direction
     * @param {Number} [options.near=1]
     * @returns {Boolean} whether cascades were built
     */
    Update({ view, projection, sunDirection, near = this.shadowNear, subject = null })
    {
        this._built = false;
        if (!this.enabled || !view || !projection || !sunDirection) return false;

        vec3.copy(this._sun, sunDirection);
        if (!vec3.squaredLength(this._sun)) return false;

        mat4.invert(this._inverseView, view);
        BuildProjectionInverse(this._projectionInverse, projection);
        buildLightView(this._lightView, this._sun);
        this._UpdateSplits(near);

        // A subject sphere collapses the cascade set to ONE tight box around
        // the object, and every split is set past it so that box always wins
        // the resolve's search. Four frustum-sized cascades give a ship under a
        // tenth of a tile at normal range; one subject-sized cascade gives it
        // the whole tile, which is the difference between invisible and usable.
        let subjectLight = null;
        if (subject && subject.radius > 0)
        {
            vec3.transformMat4(this._subjectCenter, subject.center, this._lightView);
            subjectLight = { center: this._subjectCenter, radius: subject.radius };
            for (let i = 0; i < SHADOW_FRUSTUM_COUNT; i++) this._splits[i] = subject.far;

            // One cascade means one TILE. Keeping the 4-wide atlas layout would
            // spend three quarters of it on nothing and shrink the subject into
            // a quarter-width strip - the texels are what the staircase edges
            // are made of, so every one of them has to land on the ship.
            this._activeCellsX = 1;
            this._activeCellsY = 1;
        }

        if (!subjectLight)
        {
            this._activeCellsX = this.cellsX;
            this._activeCellsY = this.cellsY;
        }

        const
            frustum = GetFrustumRatios(projection),
            n = subjectLight ? 1 : Math.max(1, Math.min(this.cascadeCount, SHADOW_FRUSTUM_COUNT));

        for (let i = 0; i < n; i++)
        {
            buildCascadeMatrix(this._matrices[i], {
                orthoOut: this._orthos[i],
                subjectLight,
                casterNearExtend: this.casterNearExtend,
                inverseView: this._inverseView,
                lightView: this._lightView,
                frustum,
                zNear: i === 0 ? near : this._splits[i - 1],
                zFar: this._splits[i],
                index: i,
                cellsX: this._activeCellsX,
                cellsY: this._activeCellsY,
                tileSize: this.tileSize,
                disableShimmer: this.disableShimmer
            });
        }

        this._activeCascades = n;
        this._built = true;
        return true;
    }

    /**
     * Cascades actually built this frame.
     *
     * Not `cascadeCount`: subject fitting collapses to a single tight box, and
     * the caster loop, the atlas preview and `SplitInfo.x` all have to agree
     * with what was built rather than with what was requested.
     * @returns {Number}
     */
    GetActiveCascadeCount()
    {
        return this._built ? this._activeCascades : 0;
    }

    /**
     * The atlas grid actually in use. Subject fitting collapses it to 1x1.
     * @returns {{x: Number, y: Number}}
     */
    GetActiveCells()
    {
        return { x: this._activeCellsX, y: this._activeCellsY };
    }

    /**
     * Gets a cascade's light view-projection for the caster pass.
     *
     * The caster pass wants the matrix WITHOUT the UV bias and atlas fold, so
     * this is not the register value; it is rebuilt from the same inputs.
     * @param {mat4} out
     * @param {Number} index
     * @returns {mat4|null}
     */
    GetCascadeMatrix(out, index)
    {
        if (!this._built || index < 0 || index >= this._activeCascades) return null;
        return mat4.copy(out, this._matrices[index]);
    }

    /**
     * Gets a cascade's light-space PROJECTION, for rendering casters into it.
     *
     * Distinct from {@link GetCascadeMatrix}, which is the lookup matrix and
     * carries the NDC->UV bias and the atlas tile transform. Rendering with the
     * lookup matrix puts that bias into clip space; rendering with the camera's
     * projection - which is what happened before this existed - fills the atlas
     * with a camera-space depth map that the light-space lookup then samples,
     * producing shadows that respond to the sun but bear no relation to the
     * scene.
     * @param {mat4} out
     * @param {Number} index
     * @returns {mat4|null}
     */
    GetCascadeProjection(out, index)
    {
        if (!this._built || index < 0 || index >= this._activeCascades) return null;
        return mat4.copy(out, this._orthos[index]);
    }

    /**
     * The shared light view transform (world -> light space).
     * @returns {mat4}
     */
    get lightView()
    {
        return this._lightView;
    }

    /**
     * Packs Carbon's PerFramePS, head from the legacy transcode and the cascade
     * block authored here.
     *
     * The binder does NOT zero the per-frame scratch between applies, so the
     * shadow block is always written - zeroed when there is nothing to say -
     * rather than left holding last frame's cascades.
     * @param {Float32Array} out - 118 * 4 floats
     * @param {Float32Array} gles - ccpwgl perFramePSData.data
     * @returns {Float32Array} out
     */
    /**
     * Packs the caster pass's per-frame VS block.
     *
     * The caster pass swaps the device projection for a cascade matrix, which
     * `Tw2CarbonShadowData` builds with `carbonPerspectiveOffCenter` /
     * `carbonOrthoOffCenter` - already `0..w`, NOT the GL `-w..w` a camera
     * produces. The default packer would run its GL converter over that and
     * halve an already-halved range, leaving an atlas whose depths still sit
     * inside 0..1 and therefore still look plausible.
     *
     * So the cascade rows take the D3D-to-Carbon flip instead. ViewProjectionMat
     * (4-7) and ProjectionMat (12-15) are the two the caster reads;
     * ShadowViewProjectionMat (20-23) is the LOOKUP matrix consumed by main-pass
     * shaders as ordinary constants rather than as gl_Position, so it carries no
     * emitter fixup and must stay exactly as built.
     * @param {Float32Array} out - 46 * 4 floats
     * @param {Float32Array} gles - ccpwgl perFrameVSData.data
     * @returns {Float32Array} out
     */
    PackPerFrameVS(out, gles)
    {
        // ONLY the caster pass binds a cascade matrix. Everything else in the
        // frame - the whole main colour pass - still has the camera's GL-form
        // frustum bound, which needs the GL converter, not this one.
        //
        // This guard is load bearing, not defensive. The binder holds
        // `perFrameProducer` from the first enabled frame until `Uninstall`,
        // which only `Destroy` calls and nothing calls `Destroy` - so this
        // method runs for EVERY dx11 draw for the rest of the session, long
        // after shadows are switched back off. Flipping a GL matrix with
        // `z' = w - z` instead of `(w - z) / 2` sends clip z to NDC [-3, 1]
        // once the emitter fixup composes with it, which clips out most of the
        // scene and cannot be undone by disabling shadows.
        if (!this.packingCasterFrame) return Tw2CarbonData.PackPerFrameVS(out, gles);

        Tw2CarbonData.PackPerFrameVSRaw(out, gles);
        for (const reg of Tw2CarbonData.CLIP_MATRIX_REGS)
        {
            Tw2CarbonData.D3DClipToCarbonClip(out, reg);
        }
        return out;
    }

    /**
     * True only while the caster pass has a cascade matrix bound.
     * @type {Boolean}
     */
    packingCasterFrame = false;

    PackPerFramePS(out, gles)
    {
        Tw2CarbonData.PackPerFramePS(out, gles);

        const
            values = REG.SHADOW_MAP_VALUES * 4,
            matrices = REG.SHADOW_MATRIX * 4,
            splitInfo = REG.SPLIT_INFO * 4,
            projInv = REG.PROJECTION_INVERSE * 4;

        if (!this._built)
        {
            out.fill(0, values, projInv + 16);
            return out;
        }

        for (let i = 0; i < SHADOW_FRUSTUM_COUNT; i++) out[values + i] = this._splits[i];

        for (let i = 0; i < SHADOW_FRUSTUM_COUNT; i++)
        {
            const base = matrices + i * 16;
            if (i < this._activeCascades)
            {
                // Carbon stores Transpose(matrix) for the GPU
                // (EveSpaceScene.cpp:3188). Our bytes coincide with Carbon's,
                // so the same transpose produces the same upload.
                mat4.transpose(_transposed, this._matrices[i]);
                out.set(_transposed, base);
            }
            else
            {
                out.fill(0, base, base + 16);
            }
        }

        out[splitInfo] = this._activeCascades;
        out[splitInfo + 1] = 0;
        out[splitInfo + 2] = 0;
        out[splitInfo + 3] = 0;

        mat4.transpose(_transposed, this._projectionInverse);
        out.set(_transposed, projInv);

        return out;
    }

}

const _transposed = mat4.create();
