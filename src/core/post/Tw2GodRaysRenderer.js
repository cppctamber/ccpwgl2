import { meta } from "utils";
import { tw2, device } from "global";
import { RM_ADDITIVE, RM_FULLSCREEN } from "constant";
import { mat4 } from "math";
import { Tw2Effect } from "../mesh/Tw2Effect";
import { Tw2RenderTarget } from "../Tw2RenderTarget";
import { Tw2TextureParameter } from "../parameter";


// Authored `.fx` paths, NOT compiled ones. `Tw2Device.ToEffectPath` substitutes
// the profile directory and appends the quality tier, so the same path resolves
// to `.sm_depth` / `.sm_hi` / `.sm_lo` per device settings. See D036 in
// `.agents/DECISIONS.md`; the shadow handler's hardcoded compiled path is the
// thing not to copy.
const DOWNSAMPLE_PATH = "res:/graphics/effect/managed/space/postprocess/downsampledepth.fx";
const GODRAYS_PATH = "res:/graphics/effect/managed/space/postprocess/godrays.fx";

/**
 * `grFactors` is NOT serialized.
 *
 * Carbon holds it as a hardcoded `const Vector4` on the effect
 * (`Tr2PPGodRaysEffect`), passed through by the renderer, so ccpwgl's class is
 * right to omit it and this is the only place the value can come from. Zeroes
 * here would produce a march with no step length - a black pass, silently.
 */
const GR_FACTORS = [ 1000.0, 0.2, 128.0, 2.0 ];


/**
 * Draws Carbon's god ray pass
 *
 * Three passes, no blur chain (`Tr2PostProcessRenderer::RenderGodRays`,
 * `Tr2PostProcessRenderer.cpp:1146`): downsample the scene depth to half res,
 * march it into a cleared half-res target, then blit that additively over the
 * scene. It runs BEFORE the composite, on the scene image, exactly as Carbon
 * applies it to `nonMsaaSource` before tone mapping.
 *
 * Four things about this pass are load-bearing and none of them announce
 * themselves when wrong:
 *
 * 1. **High quality only, and ccpwgl defaults to Medium.** Carbon gates it with
 *    `GetGodRaysIfAvailable(HIGH)`, and CCP switches god rays OFF below High
 *    rather than cheapening them: `godrays.sm_hi`'s pixel shader is literally
 *    `SV_Target0 = vec4(0.0)`. A correct implementation on default settings
 *    therefore renders nothing and reads as broken. This class refuses to run
 *    below High and says so in its report, rather than drawing a black pass.
 * 2. **The clear is required.** The vertex shader collapses `gl_Position` to
 *    zero when the sun is behind the camera, so the pass can decline to draw -
 *    and last frame's rays would otherwise persist in the reused target.
 * 3. **`DepthMap` must be a LOCAL parameter on both effects.** It is also a
 *    scene global (`config.js`), and `Tw2Effect` resolves a texture name from
 *    `this.parameters` FIRST and only falls back to `tw2.GetVariable`. Without
 *    a local one, the god ray march would silently sample the full-resolution
 *    scene depth instead of the downsampled copy it was handed.
 * 4. **The result is multiplied by `FlareOcclusionBuffer`.** That comes from the
 *    lens flare occlusion system, which ccpwgl does not have - the shader it
 *    needs uses `atomic_iadd`, which has no WebGL2 lowering. `config.js`
 *    defaults the buffer to white so the rays draw unoccluded; black there
 *    multiplies the whole pass away with nothing to attribute it to.
 */
@meta.type("Tw2GodRaysRenderer")
export class Tw2GodRaysRenderer
{

    _downsampleEffect = null;
    _godRayEffect = null;
    _depthTarget = null;
    _rayTarget = null;
    _width = 0;
    _height = 0;

    _report = { ok: false, status: "not_run" };
    _projection = mat4.create();

    /**
     * Builds the `ProjectionMat` the march needs.
     *
     * `ProjectionMat` is declared NOT autoregistered, so nothing in the variable
     * store supplies it and an unset one is all zeros. The pixel shader uses
     * exactly two of its sixteen floats, to linearise the depth sample:
     *
     *     sceneZ = cb7[7].z / (1.0 + cb7[6].z - depth)
     *
     * which in a column-major upload is `m[14] / (1 + m[10] - depth)`. At zero
     * that is `0 / (1 - depth)`, then divided by another zero one line later -
     * so the whole 40-step march accumulates NaN and the pass writes NaN. It
     * reports as rendered, and adding NaN to the scene shows nothing.
     *
     * Carbon feeds this pass `GetReversedDepthProjectionTransform`, matching
     * ITS depth buffer. Ours is a plain GL buffer holding
     * `A - B/z` with `A = f/(f-n)` and `B = fn/(f-n)`, so solving
     * `m32 / (1 + m22 - depth) = z` for our values gives
     *
     *     m22 = n / (f - n)      m32 = fn / (f - n)
     *
     * Same principle as `Tw2CarbonShadowData.BuildProjectionInverse`: supply the
     * matrix that matches the buffer actually produced, rather than the one
     * Carbon would have produced. Verified numerically - 500m, 2300m and 10000m
     * all reconstruct exactly.
     *
     * Every other element is irrelevant to this shader; the projection is copied
     * through so the buffer is not full of surprises for a future permutation.
     *
     * NOT TRANSPOSED, and that is checked rather than assumed. Carbon's matrices
     * DO go into its constant buffers transposed, and `Tw2RawData` reproduces
     * that for the per-frame and per-object buffers - but this is an effect's
     * own stage buffer, written by `Tw2VectorParameter.Apply`, which is a plain
     * `constantBuffer.set(this.value, offset)` with no reordering
     * (`Tw2Matrix4Parameter` does not override it). So the 16 floats land
     * verbatim, `cb7[6].z` is element 10 and `cb7[7].z` is element 14, which are
     * the two set below.
     *
     * The distinction matters: transposing would move m32 from element 14 to
     * element 11 and leave m22 alone, since it sits on the diagonal - so a
     * wrongly transposed upload would keep the near-plane term and lose the
     * scale, reconstructing a plausible but wrong distance rather than failing.
     * @returns {mat4}
     * @private
     */
    _BuildProjectionMat()
    {
        const out = mat4.copy(this._projection, device.projection);

        // Recovered from the matrix rather than read from `device.nearPlane`:
        // those are only populated by `SetNearFar`, and a camera that builds its
        // own projection never calls it - leaving n at 0, which would put a
        // zero back into m32 and return us to the NaN march.
        const
            a = out[10],
            b = out[14],
            n = b / (a - 1),
            f = b / (a + 1);

        if (Number.isFinite(n) && Number.isFinite(f) && f !== n && n > 0)
        {
            out[10] = n / (f - n);
            out[14] = f * n / (f - n);
        }

        return out;
    }

    /**
     * @returns {Object}
     */
    GetReport()
    {
        return this._report;
    }

    /**
     * Gets or creates both effects.
     * @returns {Boolean} true if both are usable
     */
    EnsureEffects()
    {
        if (!this._downsampleEffect)
        {
            this._downsampleEffect = Tw2Effect.from({
                name: "DownsampleDepth",
                effectFilePath: DOWNSAMPLE_PATH
            });
        }

        if (!this._godRayEffect)
        {
            this._godRayEffect = Tw2Effect.from({
                name: "GodRays",
                effectFilePath: GODRAYS_PATH,
                parameters: {
                    Color: [ 1, 1, 1, 1 ],
                    Intensity: [ 0, 0, 1, 1 ],
                    grFactors: GR_FACTORS,
                    // Declared but not autoregistered, so it exists only if we
                    // create it. See _BuildProjectionMat.
                    ProjectionMat: mat4.create()
                },
                textures: {
                    NoiseTexMap: "res:/Texture/Global/noise.dds"
                }
            });
        }

        return this._downsampleEffect.IsGood() && this._godRayEffect.IsGood();
    }

    /**
     * Renders god rays over the scene.
     *
     * @param {Tr2PPGodRaysEffect|null} godRays - the effect data, already gated
     * on `IsActive` by the caller
     * @param {Tw2TextureRes|null} depth - full resolution scene depth
     * @param {Tw2RenderTarget|null} destination - the scene image; null draws
     * additively into whatever framebuffer is currently bound
     * @returns {Boolean} true if it drew
     */
    Render(godRays, depth, destination)
    {
        this._report = { ok: false, status: "not_run" };

        if (!godRays || !godRays.IsActive())
        {
            this._report.status = "inactive";
            return false;
        }

        if (!depth)
        {
            this._report.status = "no_depth";
            return false;
        }

        // See note 1 on the class. Refusing is the honest outcome: the compiled
        // Medium body returns black, so running anyway would draw a correct
        // implementation of nothing.
        if (device.shaderModel !== "depth")
        {
            this._report.status = `quality_${device.shaderModel} (god rays need HIGH)`;
            return false;
        }

        // The downsampled depth is a copy of hyperbolic depth values that live
        // in the fourth decimal place at EVE ranges. An rgba8 or even rgba16f
        // copy quantises the entire useful signal away, so this pass needs a
        // float target or it should not run at all.
        if (!device.canRenderToFloat)
        {
            this._report.status = "no_float_target";
            return false;
        }

        if (!this.EnsureEffects())
        {
            this._report.status = "effects_not_loaded";
            return false;
        }

        this._EnsureTargets();

        this._RenderDownsample(depth);
        this._RenderRays(godRays);
        this._Blit(destination);

        this._report.ok = true;
        this._report.status = "rendered";
        return true;
    }

    /**
     * Half-resolution depth copy.
     * @param {Tw2TextureRes} depth
     * @private
     */
    _RenderDownsample(depth)
    {
        const effect = this._downsampleEffect;

        // Local, not the global - see note 3 on the class.
        if (!effect.parameters.DepthMap)
        {
            effect.parameters.DepthMap = new Tw2TextureParameter("DepthMap");
            effect.BindParameters();
        }
        effect.parameters.DepthMap.AttachTextureRes(depth);

        device.SetStandardStates(RM_FULLSCREEN);
        this._depthTarget.SetCallUnset(() => device.RenderFullScreenQuad(effect));
    }

    /**
     * The march itself, into a cleared half-resolution target.
     * @param {Tr2PPGodRaysEffect} godRays
     * @private
     */
    _RenderRays(godRays)
    {
        const effect = this._godRayEffect;
        const p = effect.parameters;

        if (p.Color) p.Color.SetValue(godRays.godRayColor);

        // Carbon feeds intensity as a vec4 with a fixed tail, not a float.
        if (p.Intensity) p.Intensity.SetValue([ godRays.intensity, 0, 1, 1 ]);
        if (p.grFactors) p.grFactors.SetValue(GR_FACTORS);
        if (p.ProjectionMat) p.ProjectionMat.SetValue(this._BuildProjectionMat());

        if (godRays.noiseTexturePath)
        {
            effect.SetTextures({ NoiseTexMap: godRays.noiseTexturePath });
        }

        if (!p.DepthMap)
        {
            p.DepthMap = new Tw2TextureParameter("DepthMap");
            effect.BindParameters();
        }
        p.DepthMap.AttachTextureRes(this._depthTarget.texture);

        device.SetStandardStates(RM_FULLSCREEN);

        this._rayTarget.SetCallUnset(() =>
        {
            // See note 2 on the class: the vertex shader can decline to draw.
            tw2.SetClearColor([ 0, 0, 0, 0 ]);
            tw2.ClearBufferBits(true, false, false);
            device.RenderFullScreenQuad(effect);
        });
    }

    /**
     * Additive blit over the scene.
     * @param {Tw2RenderTarget|null} destination
     * @private
     */
    _Blit(destination)
    {
        const { gl } = tw2;

        // RM_ADDITIVE rather than a plain blit: rays ADD light to the frame.
        // `RenderFullScreenQuad` sets no blend state of its own, so the mode
        // applied here is what the draw runs with.
        device.SetStandardStates(RM_ADDITIVE);
        gl.disable(gl.DEPTH_TEST);

        if (destination)
        {
            destination.SetCallUnset(() => device.RenderTexture(this._rayTarget.texture));
        }
        else
        {
            device.RenderTexture(this._rayTarget.texture);
        }

        gl.enable(gl.DEPTH_TEST);
        device.InvalidateStandardStates();
    }

    /**
     * Measures what the march actually produced.
     *
     * `status: "rendered"` only means the three passes ran; it says nothing
     * about whether they produced light. An all-zero ray target and a correct
     * one are indistinguishable once additively blitted - adding zero is
     * invisible, which is the same failure shape as every other trap in this
     * pass.
     *
     * A max of 0 means the march produced nothing. The most likely cause is the
     * vertex shader collapsing `gl_Position` to zero, which it does when the sun
     * is behind the camera - so turn to face the sun before concluding anything.
     * After that, suspect the occlusion multiply (`LensflareFxOccScale.y` must
     * be 0, see config.js) or `Intensity`.
     *
     * Stalls the pipeline on readback. Debug only.
     * @param {Number} [size=32] - square block sampled from the target centre
     * @returns {Object} `{ ok, max, nonZero, samples }`
     */
    Probe(size = 32)
    {
        if (!this._rayTarget || !this._rayTarget.IsGood())
        {
            return { ok: false, reason: "no ray target" };
        }

        const { gl } = tw2;
        const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._rayTarget._frameBuffer);

        // The target may be float, and readPixels only guarantees RGBA/UNSIGNED_
        // BYTE plus one implementation-chosen pair. Ask which, rather than
        // assuming - guessing here throws INVALID_OPERATION and reports as a
        // broken probe rather than a broken pass.
        const
            format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
            type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
            channels = format === gl.RGB ? 3 : 4;

        const
            x = Math.max(0, Math.floor((this._width - size) / 2)),
            y = Math.max(0, Math.floor((this._height - size) / 2)),
            w = Math.min(size, this._width),
            h = Math.min(size, this._height);

        let pixels;
        if (type === gl.FLOAT) pixels = new Float32Array(w * h * channels);
        else if (type === gl.HALF_FLOAT) pixels = new Uint16Array(w * h * channels);
        else pixels = new Uint8Array(w * h * channels);

        let ok = true;
        try { gl.readPixels(x, y, w, h, format, type, pixels); }
        catch (err) { ok = false; }

        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);

        if (!ok) return { ok: false, reason: "readPixels rejected this format" };

        let max = 0, nonZero = 0;
        for (let i = 0; i < pixels.length; i += channels)
        {
            const v = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
            if (v > max) max = v;
            if (v !== 0) nonZero++;
        }

        return { ok: true, max, nonZero, samples: w * h, readType: type === gl.FLOAT ? "float" : type === gl.HALF_FLOAT ? "half" : "byte" };
    }

    /**
     * Allocates the two half-resolution targets.
     * @private
     */
    _EnsureTargets()
    {
        const
            w = Math.max(1, Math.floor(tw2.width / 2)),
            h = Math.max(1, Math.floor(tw2.height / 2));

        if (this._depthTarget && this._width === w && this._height === h) return;

        this.Destroy();
        this._width = w;
        this._height = h;

        // Carbon's downsample target is R32_FLOAT; rgba32f is the nearest thing
        // ccpwgl's target factory offers and carries the same mantissa.
        this._depthTarget = new Tw2RenderTarget("GodRaysDepth", w, h, false, "rgba32f");

        // Renderable is not filterable. `canRenderToFloat` reports
        // EXT_color_buffer_float, which permits rendering INTO rgba32f; linear
        // filtering of it needs OES_texture_float_linear, a separate extension.
        // `Tw2RenderTarget.Create` sets LINEAR unconditionally, and the effect's
        // own sampler asks for LINEAR again on every bind, so without this the
        // march samples a float texture through a LINEAR sampler and the draw
        // fails with a format/sampler mismatch.
        //
        // NEAREST is also the correct sampling for this texture on its own
        // terms: it holds depth, and interpolating between two depth samples
        // produces a distance that is at neither surface.
        if (this._depthTarget.texture) this._depthTarget.texture._forceNearest = true;

        // Carbon matches the destination's format. The rays are additive light,
        // so this wants range rather than precision - half float is the point
        // where that stops costing anything.
        this._rayTarget = new Tw2RenderTarget(
            "GodRays",
            w,
            h,
            false,
            device.canRenderToHalfFloat ? "rgba16f" : "rgba8"
        );
    }

    /**
     * Releases GL resources.
     */
    Destroy()
    {
        if (this._depthTarget) { this._depthTarget.Destroy(); this._depthTarget = null; }
        if (this._rayTarget) { this._rayTarget.Destroy(); this._rayTarget = null; }
        this._width = 0;
        this._height = 0;
    }

}
