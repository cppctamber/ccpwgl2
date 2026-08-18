import { meta } from "utils";
import { device, tw2 } from "global";
import { RM_OPAQUE, RM_DECAL } from "constant";
import { Tw2DepthRenderTarget, Tw2RenderTarget } from "core";

/**
 * EveSpaceSceneDepthHandler
 *
 * Produces the scene depth buffer that Carbon's `DepthMap` global names, and
 * publishes it there. Scene-owned, mirroring {@link EveSpaceSceneShadowHandler}
 * and {@link EveSpaceSceneAO}; gated by `scene.visible.sceneDepth`.
 *
 * READ THIS BEFORE CHANGING THE NAME IT PUBLISHES TO.
 *
 * `DepthMap` and `EveSpaceSceneDepthMap` are two different things and only one
 * of them is read by any shader:
 *
 *   - `DepthMap` is Carbon's global, declared Carbon resource type 2
 *     (`sampler2D`) and autoregistered by its consumers. **96 of the 537**
 *     shaders in the translated corpus sample it. It is what this class writes.
 *   - `EveSpaceSceneDepthMap` is a ccpwgl invention. **Zero** shaders in that
 *     corpus reference it. It is what `EveSpaceScene.RenderDepth` publishes, and
 *     handing it to a consumer that wanted `DepthMap` is the mistake that
 *     produced a flat single-cascade shadow debug view: the resolve got the 1x1
 *     white config placeholder while `EveSpaceSceneDepthMap` sat unused.
 *
 * Three features are blocked on this input alone, not on anything in their own
 * code - Carbon sun shadows (the resolve unprojects it to pick a cascade), god
 * rays (marched, 40 steps toward the sun) and post-process fog (blends by
 * distance). All three are High tier (`.sm_depth`), which is not a coincidence:
 * the High bodies are the ones that ask for scene depth.
 *
 * Per frame:
 *   1. render the scene's `Main` technique into a 32F depth target. Not 16:
 *      `EveSpaceScene.depthPrecision` defaults to 16 and {@link EveSpaceSceneAO}
 *      already refuses to reuse it, because at EVE's ~1e8 far plane 16 bits
 *      cannot separate a hull from the background - and every consumer above
 *      compares distances.
 *   2. point the global `DepthMap` parameter at the result.
 *
 * When it does not run, {@link ResetOutput} puts `DepthMap` back to the config
 * placeholder - `dynamic:/color/1,1,1,1`, white, because 1 is the far plane and
 * so the only value meaning "nothing in front". Absent must mean that, never an
 * unbound sampler or a stale texture from three frames ago; Carbon does the same
 * for its own shadow globals.
 *
 * KNOWN LIMIT: this publishes to the global variable only. That is the contract
 * for an autoregistered name - `Tw2Effect` resolves `DepthMap` through
 * `tw2.GetVariable` for every effect that does not declare its own - but an
 * effect carrying a local `DepthMap` parameter shadows the global and has to be
 * pointed at {@link depthTextureRes} explicitly, the way
 * `Tw2CarbonShadowRenderer` does for its resolve pass.
 */
@meta.type("EveSpaceSceneDepthHandler")
export class EveSpaceSceneDepthHandler extends meta.Model
{

    @meta.boolean
    enabled = true;

    /**
     * Whether to publish the buffer as the global `DepthMap`.
     *
     * OFF, and this is not timidity - publishing it is currently WRONG for most
     * of its readers.
     *
     * 96 corpus shaders sample `DepthMap`, and the soft-particle family
     * linearises it as `sceneZ = m32 / (sample - m22)`, taking m22/m32 from the
     * per-frame projection constants. Carbon's projection is the D3D form, where
     * those are `f/(f-n)` and `-fn/(f-n)`. ccpwgl supplies a GL projection,
     * where they are `-(f+n)/(f-n)` and `-2fn/(f-n)`. The BUFFER is identical
     * either way - the GL and D3D depth mappings agree exactly for the same
     * near/far - but the CONSTANTS the shaders divide by are not, so every
     * consumer that unprojects gets a wrong distance.
     *
     * Publishing it regressed sprites and soft particles on 2026-08-13: with the
     * 1x1 white placeholder they read "nothing in front" and always drew, which
     * looked right; with a real buffer and the wrong constants they fade at the
     * wrong distances, which looks like a sprite bug rather than a projection
     * one.
     *
     * Turning this on requires ONE of: per-frame projection constants in D3D
     * form, or each consumer folding in the remap the way
     * `Tw2CarbonShadowData.BuildProjectionInverse` does for the shadow resolve.
     * Until then, passes that need scene depth take {@link depthTextureRes}
     * explicitly - which is what the shadow resolve and god rays both do.
     */
    @meta.boolean
    publishGlobal = false;

    /**
     * Depth attachment precision. 32 (`DEPTH_COMPONENT32F`) is the working
     * value; see the class header for why 16 is not an option here.
     */
    @meta.uint
    precision = 32;

    /**
     * Debug view mode, for the overlay slot: 0 = auto-stretched colour ramp
     * (the readable default), 1 = the raw buffer as greyscale (nearly always a
     * white rectangle - that is the point of mode 0), 2 = log distance.
     */
    @meta.uint
    debugMode = 0;

    @meta.uint
    debugWidth = 300;

    @meta.uint
    debugHeight = 170;

    scene = null;

    _frame = 0;            // bumped per produced buffer, for debug caching
    _debugTarget = null;   // Tw2RenderTarget holding the viewable resolve
    _debugView = null;     // program + locations
    _debugFrame = -1;
    _target = null;        // Tw2DepthRenderTarget
    _width = 0;
    _height = 0;
    _rendered = false;     // produced a buffer this frame
    _bound = false;        // true while the global DepthMap points at us
    _placeholderRes = null;
    _probe = null;         // lazily built debug readback, see Probe()

    _report = { ok: false, status: "not_run" };

    /**
     * @param {EveSpaceScene} [scene]
     */
    constructor(scene = null)
    {
        super();
        this.scene = scene;
    }

    /**
     * @param {EveSpaceScene} [scene]
     * @returns {Boolean}
     */
    ShouldRender(scene = this.scene)
    {
        return !!(this.enabled && scene && scene.visible && scene.visible.sceneDepth);
    }

    /**
     * True if a depth buffer was produced for the current frame.
     * @returns {Boolean}
     */
    get rendered()
    {
        return this._rendered;
    }

    /**
     * The depth buffer as a texture resource, for consumers that cannot go
     * through the global (an effect with its own `DepthMap` parameter).
     * @returns {Tw2TextureRes|null}
     */
    get depthTextureRes()
    {
        return this._target ? this._target.depthTexture : null;
    }

    /**
     * The raw GL depth texture, for passes that drive GL directly.
     * @returns {WebGLTexture|null}
     */
    get depthTextureGL()
    {
        return this._target ? this._target.depthTextureGL : null;
    }

    /**
     * @returns {Number}
     */
    get width()
    {
        return this._width;
    }

    /**
     * @returns {Number}
     */
    get height()
    {
        return this._height;
    }

    /**
     * @returns {Object}
     */
    GetReport()
    {
        return this._report;
    }

    /**
     * Produces the depth buffer for this frame and binds it to `DepthMap`.
     * @param {Number} dt
     * @param {EveSpaceScene} [scene]
     * @returns {Boolean}
     */
    Render(dt, scene = this.scene)
    {
        this.scene = scene || this.scene;
        this._rendered = false;
        this._report.ok = false;

        if (!this.ShouldRender(this.scene))
        {
            this.ResetOutput();
            this._report.status = "disabled";
            return false;
        }

        this._EnsureTarget();

        const
            context = this.scene.GetDepthContext(),
            objects = this.scene.objectsByDistance || this.scene.objects || [],
            background = this.scene.backgroundObjects || [],
            options = { techniqueFilter: "Main", techniqueOverride: "Main", renderReason: "SceneDepth" };

        // The same set EveSpaceSceneAO's own prepass collects, deliberately, so
        // that one prepass can serve both: AO reads `depthTextureGL` when this
        // handler produced a buffer at its own size, and falls back to its own
        // prepass otherwise. If you change this set, change AO's with it or say
        // plainly that they diverged - a quietly shared prepass that no longer
        // renders what the consumer needs is invisible in the image.
        context.Clear();
        if (objects.length)
        {
            context.CollectObjectArrayBatches(objects, RM_OPAQUE, options);
            context.CollectObjectArrayBatches(objects, RM_DECAL, options);
        }
        if (background.length)
        {
            context.CollectObjectArrayBatches(background, RM_OPAQUE, options);
        }

        const { gl } = device;
        const
            prevDepthTest = gl.isEnabled(gl.DEPTH_TEST),
            prevDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK),
            prevDepthFunc = gl.getParameter(gl.DEPTH_FUNC);

        const ok = this._target.SetCallUnset(() =>
        {
            // Depth state is SET, not inherited.
            //
            // This pass exists to answer "what is nearest the camera at this
            // pixel", and without an explicit test that is whatever drew last.
            // `objectsByDistance` renders far-to-near, so a missing test still
            // happens to leave the nearest object on top - but only until
            // something renders out of that order, and then the buffer holds
            // the wrong surface at those pixels.
            //
            // Everything downstream inherits that error as a POSITION error:
            // the shadow resolve unprojects this buffer, so a pixel carrying
            // another object's depth reconstructs to that object's place in the
            // world and is shaded as if it were there. The symptom is one ship
            // wearing another ship's shadow, with nothing between it and the
            // sun. EveSpaceSceneAO sets the same three states for the same
            // reason.
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(true);

            tw2.ClearBufferBits(true, true, true);
            context.Render("Main");
            this._rendered = true;
        });

        if (prevDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
        gl.depthMask(prevDepthMask);
        gl.depthFunc(prevDepthFunc);

        if (!ok || !this._rendered)
        {
            this.ResetOutput();
            this._report.status = "target_not_ready";
            return false;
        }

        this._BindOutput();
        this._frame++;

        // Carried so the overlay can tell "the pass ran and drew nothing" from
        // "the pass never ran" - they look identical in the image.
        const report = context.GetReport ? context.GetReport() : null;
        this._report.batches = report ? report.batches : undefined;
        this._report.rendered = report ? report.rendered : undefined;

        // The batch render leaves the device's cached view of render state
        // describing the depth pass, not the colour pass that follows - the same
        // reason EveSpaceSceneAO invalidates after its prepass.
        device.InvalidateStandardStates();

        this._report.ok = true;
        this._report.status = "rendered";
        return true;
    }

    /**
     * Points the global `DepthMap` at this frame's depth buffer.
     *
     * The resource is swapped in BY REFERENCE. We must not write our texture
     * onto the parameter's existing res: `DepthMap` defaults to the shared
     * `dynamic:/color/1,1,1,1` resource, so clobbering it would corrupt every
     * other user of that white - which is `EveSpaceSceneShadowMap`,
     * `EveSpaceSceneCascadedShadowMap`, `SSAOMap` and `FlareOcclusionBuffer`.
     * The original is remembered so {@link ResetOutput} can put it back.
     * @private
     */
    _BindOutput()
    {
        // Opt-in; see the field note. When off, anything already bound is put
        // back rather than left pointing at our texture.
        if (!this.publishGlobal)
        {
            this.ResetOutput();
            return;
        }

        const parameter = this._GetGlobal();
        if (!parameter) return;

        const res = this.depthTextureRes;
        if (!res) return;

        if (!this._placeholderRes) this._placeholderRes = parameter.textureRes;
        parameter.textureRes = res;
        this._bound = true;
    }

    /**
     * Restores `DepthMap` to the white config placeholder.
     *
     * Called whenever there is no depth for the frame - disabled, errored, or
     * resized - so consumers read "nothing in front" rather than the last, now
     * stale, depth frame.
     */
    ResetOutput()
    {
        if (!this._bound) return;

        const parameter = this._GetGlobal();
        if (parameter && this._placeholderRes) parameter.textureRes = this._placeholderRes;
        this._bound = false;
    }

    /**
     * @returns {Tw2TextureParameter|null}
     * @private
     */
    _GetGlobal()
    {
        // Named once, here, so the two globals cannot drift apart by a typo.
        return tw2.HasVariable("DepthMap") ? tw2.GetVariable("DepthMap") : null;
    }

    /**
     * Allocates or resizes the depth target for the current viewport.
     * @private
     */
    _EnsureTarget()
    {
        const w = tw2.width, h = tw2.height;

        if (!this._target)
        {
            // The constructor creates the target itself when given a size.
            this._target = new Tw2DepthRenderTarget("SceneDepth", w, h, this.precision);
        }
        else if (this._width !== w || this._height !== h || this._target.precision !== this.precision)
        {
            // A resize replaces the GL texture, so whatever is bound now points
            // at a texture about to be deleted.
            this.ResetOutput();
            this._placeholderRes = null;
            this._target.Create(w, h, this.precision);
        }

        this._width = w;
        this._height = h;
    }

    /**
     * Measures the depth buffer, because looking at it does not work.
     *
     * Every consumer of `DepthMap` degrades to a plausible image rather than an
     * obviously broken one - a constant depth gives shadows one flat cascade,
     * god rays a uniform wash and fog an even haze, none of which read as "the
     * depth input is wrong". The check that distinguishes them is whether the
     * buffer VARIES, and that has to be sampled, not eyeballed.
     *
     * Resolves the depth texture into an RGBA8 grid, reads it back and reports
     * the spread. Expect `min < max` with a healthy `distinct` count, and
     * background reading FARTHER (nearer 1) than geometry. `distinct === 1` is
     * the failure, whatever the image looks like.
     *
     * Debug-only: it compiles a program on first use and stalls the pipeline on
     * `readPixels`. Do not call it per frame.
     * @param {Number} [size=64] - grid resolution to sample at
     * @returns {Object} `{ ok, min, max, mean, distinct, size }`
     */
    Probe(size = 64)
    {
        if (!this._rendered || !this.depthTextureGL)
        {
            return { ok: false, reason: "no depth produced this frame" };
        }

        const { gl } = device;
        const probe = this._EnsureProbe(size);

        const
            prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING),
            prevViewport = gl.getParameter(gl.VIEWPORT),
            prevVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING),
            prevDepthTest = gl.getParameter(gl.DEPTH_TEST),
            prevBlend = gl.getParameter(gl.BLEND);

        gl.bindFramebuffer(gl.FRAMEBUFFER, probe.fbo);
        gl.viewport(0, 0, size, size);
        gl.bindVertexArray(probe.vao);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.useProgram(probe.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.depthTextureGL);
        gl.uniform1i(probe.sampler, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        const pixels = new Uint8Array(size * size * 4);
        gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
        gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
        gl.bindVertexArray(prevVao);
        if (prevDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
        if (prevBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
        device.InvalidateStandardStates();

        let min = 1, max = 0, sum = 0;
        const seen = new Set();
        for (let i = 0; i < pixels.length; i += 4)
        {
            const d = pixels[i] / 255 + pixels[i + 1] / 65025 + pixels[i + 2] / 16581375;
            if (d < min) min = d;
            if (d > max) max = d;
            sum += d;

            // All THREE channels. Keying on the top 16 bits caps the count at
            // the probe's own resolution rather than the buffer's, and at EVE
            // ranges that is the entire signal: with near=1 and far=50000 a
            // whole hull can live inside 0.9995..0.9996, so a 16-bit key
            // collapses it to a handful of values and reports a working buffer
            // as nearly constant.
            seen.add(pixels[i] << 16 | pixels[i + 1] << 8 | pixels[i + 2]);
        }

        const count = pixels.length / 4;
        return {
            ok: max > min,
            min,
            max,
            mean: sum / count,
            distinct: seen.size,
            size,
            // Carried so the report can quote distances rather than raw depth.
            near: EveSpaceSceneDepthHandler.Linearize(min),
            far: EveSpaceSceneDepthHandler.Linearize(max)
        };
    }

    /**
     * Converts a raw depth sample to a view-space distance.
     *
     * GL convention: the buffer holds `(ndc + 1) / 2`, so recover ndc first.
     * Carbon's own shaders skip that step because Carbon's projection already
     * puts ndc z in 0..1 - the same remap `Tw2CarbonShadowData
     * .BuildProjectionInverse` folds in for the shadow path.
     * @param {Number} d - raw depth sample, 0..1
     * @returns {Number} distance in world units, or Infinity at the far plane
     */
    static Linearize(d)
    {
        const
            a = device.projection[10],
            b = device.projection[14],
            ndc = d * 2 - 1,
            denom = ndc + a;

        return Math.abs(denom) < 1e-12 ? Infinity : b / denom;
    }

    /**
     * Compiles and allocates the probe resources on first use.
     * @param {Number} size
     * @returns {Object}
     * @private
     */
    _EnsureProbe(size)
    {
        const { gl } = device;

        if (this._probe && this._probe.size === size) return this._probe;
        this._DestroyProbe();

        // Packs the raw depth sample across RGB so an 8-bit readback keeps
        // enough resolution to tell a varying buffer from a constant one. No
        // unprojection: this reports the buffer as written, which is the
        // quantity in question.
        const fs = `#version 300 es
            precision highp float;
            uniform highp sampler2D depth;
            out vec4 color;
            void main()
            {
                float d = texelFetch(depth, ivec2(gl_FragCoord.xy * ${(1 / size).toFixed(8)} * vec2(textureSize(depth, 0))), 0).r;
                vec3 enc = fract(vec3(1.0, 255.0, 65025.0) * d);
                enc.xy -= enc.yz / 255.0;
                color = vec4(enc, 1.0);
            }`;

        const program = EveSpaceSceneDepthHandler.Program(fs, "probe");

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, size, size);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this._probe = {
            size,
            program,
            tex,
            fbo,
            vao: gl.createVertexArray(),
            sampler: gl.getUniformLocation(program, "depth")
        };

        return this._probe;
    }

    /**
     * Resolves the depth buffer into a viewable colour texture, for the render
     * debug overlay to show as a slot.
     *
     * Depth cannot simply be blitted and looked at, for two separate reasons:
     * `device.RenderTexture` runs it through `blit.fx`, which samples an
     * ordinary colour texture, and at EVE's far plane almost every depth sample
     * rounds to 1.0 anyway - so a correct buffer and a broken one would both
     * present as a white rectangle. This pass therefore auto-stretches the
     * buffer over its own measured min/max (from {@link Probe}) and runs it
     * through a colour ramp, which makes any variation at all loud.
     *
     * Read the tile like this:
     *
     *   - **bands of colour that shift as the camera moves** — working.
     *   - **one flat colour** — constant depth. The pass ran and wrote the same
     *     value everywhere; the fault is in what it rendered, not in the wiring.
     *   - **flat magenta** — nothing was drawn into the depth pass at all. Every
     *     sample is still the cleared 1.0, so no batch reached the target: check
     *     the `batches` line on the same panel, and whether the objects expose a
     *     `Main` technique.
     *
     * Renders at most once per produced frame however many times it is asked,
     * and costs nothing at all while the overlay is not showing the slot.
     *
     * The caller passes the size it intends to display at, so the resolve is
     * done at tile resolution rather than upscaled from a fixed thumbnail - at
     * 300x170 a hull is a few dozen pixels across and the gradient that proves
     * the buffer works is not visible.
     * @param {Number} [width=this.debugWidth]
     * @param {Number} [height=this.debugHeight]
     * @returns {Tw2RenderTarget|null} null when there is nothing to show
     */
    RenderDebugView(width = this.debugWidth, height = this.debugHeight)
    {
        if (!this._rendered || !this.depthTextureGL) return null;

        if (width > 0) this.debugWidth = Math.floor(width);
        if (height > 0) this.debugHeight = Math.floor(height);

        // Cache per produced frame, but a resize rebuilds the target and throws
        // its contents away, so the size is part of the key.
        if (this._debugTarget
            && this._debugFrame === this._frame
            && this._debugTarget.width === this.debugWidth
            && this._debugTarget.height === this.debugHeight)
        {
            return this._debugTarget;
        }

        const { gl } = device;
        const view = this._EnsureDebug();

        // The stretch range has to come from the buffer itself; a fixed range is
        // exactly what makes the unprocessed view unreadable.
        const measured = this.Probe(64);
        const min = measured.ok ? measured.min : 0;
        const max = measured.ok ? measured.max : 1;

        const
            prevVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING),
            prevDepthTest = gl.isEnabled(gl.DEPTH_TEST),
            prevScissor = gl.isEnabled(gl.SCISSOR_TEST),
            prevBlend = gl.isEnabled(gl.BLEND),
            prevDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK);

        this._debugTarget.SetCallUnset(() =>
        {
            gl.disable(gl.SCISSOR_TEST);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);
            gl.depthMask(false);

            gl.bindVertexArray(view.vao);
            gl.useProgram(view.program);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.depthTextureGL);
            gl.uniform1i(view.sampler, 0);
            gl.uniform1i(view.mode, this.debugMode | 0);
            gl.uniform2f(view.range, min, max);
            // Linearisation constants for the distance mode; the pair AO uses.
            gl.uniform2f(view.ab, device.projection[10], device.projection[14]);
            gl.uniform2f(view.viewSize, this._debugTarget.width, this._debugTarget.height);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        });

        if (prevDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
        if (prevScissor) gl.enable(gl.SCISSOR_TEST); else gl.disable(gl.SCISSOR_TEST);
        if (prevBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
        gl.depthMask(prevDepthMask);
        gl.bindVertexArray(prevVao);
        device.InvalidateStandardStates();

        this._debugFrame = this._frame;
        this._report.debug = { min, max, distinct: measured.distinct, mode: this.debugMode };
        return this._debugTarget;
    }

    /**
     * Overlay report lines. Deliberately leads with the two numbers that decide
     * whether the buffer is real - a `distinct` of 1 is the failure, whatever
     * the tile above it looks like.
     * @returns {String[]}
     */
    GetDebugLines()
    {
        const d = this._report.debug;
        const lines = [
            `status: ${this._report.status}${this._bound ? " bound" : " UNBOUND"}`,
            `batches: ${this._report.rendered ?? 0}/${this._report.batches ?? 0}`
        ];

        if (!d) return lines.concat([ "range: -", "distinct: -" ]);

        // Distance, not raw depth. Raw depth at EVE ranges is unreadable - a
        // whole hull sits inside the fourth decimal place - and the question
        // being asked is always about distances.
        const fmt = (v) => (Number.isFinite(v) ? (v >= 1e4 ? v.toExponential(2) : v.toFixed(1)) : "inf");

        lines.push(`range: ${fmt(d.near)}..${fmt(d.far)}m`);
        lines.push(`raw: ${d.min.toFixed(5)}..${d.max.toFixed(5)}`);
        lines.push(`distinct: ${d.distinct}${d.distinct <= 1 ? "  <-- CONSTANT" : ""}`);

        return lines;
    }

    /**
     * Compiles the debug view program on first use.
     * @returns {Object}
     * @private
     */
    _EnsureDebug()
    {
        const { gl } = device;

        if (!this._debugTarget)
        {
            this._debugTarget = new Tw2RenderTarget("SceneDepthDebug", this.debugWidth, this.debugHeight);
        }
        else
        {
            this._debugTarget.Update(this.debugWidth, this.debugHeight);
        }

        if (this._debugView) return this._debugView;

        const fs = `#version 300 es
            precision highp float;
            uniform highp sampler2D depth;
            uniform int uMode;
            uniform vec2 uRange;
            uniform vec2 uAB;
            uniform vec2 uViewSize;
            out vec4 color;

            // Cheap perceptual ramp: dark blue -> cyan -> green -> yellow -> red.
            // Chosen over greyscale because banding in grey at these ranges is
            // near-invisible, which is the whole problem being debugged.
            vec3 ramp(float t)
            {
                t = clamp(t, 0.0, 1.0);
                return clamp(vec3(
                    1.5 - abs(4.0 * t - 3.0),
                    1.5 - abs(4.0 * t - 2.0),
                    1.5 - abs(4.0 * t - 1.0)
                ), 0.0, 1.0);
            }

            void main()
            {
                // The view is smaller than the buffer, so scale into it rather
                // than fetching the top-left corner of a full-resolution image.
                vec2 uv = gl_FragCoord.xy / vec2(uViewSize);
                float d = texelFetch(depth, ivec2(uv * vec2(textureSize(depth, 0))), 0).r;

                // Untouched by the pass. Called out loudly, because "cleared"
                // and "constant" have completely different causes and both look
                // like a flat screen otherwise.
                if (d >= 1.0)
                {
                    color = vec4(1.0, 0.0, 1.0, 1.0);
                    return;
                }

                if (uMode == 1)
                {
                    color = vec4(vec3(d), 1.0);
                    return;
                }

                if (uMode == 2)
                {
                    // GL convention: the buffer holds (ndc + 1) / 2, so recover
                    // ndc before unprojecting. Carbon's own shaders skip this
                    // step because Carbon's projection already puts ndc z in
                    // 0..1 - see Tw2CarbonShadowData.BuildProjectionInverse.
                    float ndc = d * 2.0 - 1.0;
                    float dist = uAB.y / (ndc + uAB.x);
                    color = vec4(ramp(log2(max(dist, 1.0)) / 27.0), 1.0);
                    return;
                }

                color = vec4(ramp((d - uRange.x) / max(uRange.y - uRange.x, 1e-9)), 1.0);
            }`;

        const program = EveSpaceSceneDepthHandler.Program(fs, "debug");

        this._debugView = {
            program,
            vao: gl.createVertexArray(),
            sampler: gl.getUniformLocation(program, "depth"),
            mode: gl.getUniformLocation(program, "uMode"),
            range: gl.getUniformLocation(program, "uRange"),
            ab: gl.getUniformLocation(program, "uAB"),
            viewSize: gl.getUniformLocation(program, "uViewSize")
        };

        return this._debugView;
    }

    /**
     * Compiles and links a fullscreen-triangle program.
     * @param {String} fs - fragment source
     * @param {String} name - for error messages
     * @returns {WebGLProgram}
     */
    static Program(fs, name)
    {
        const { gl } = device;

        const compile = (type, src) =>
        {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
            {
                throw new Error(`Depth ${name} compile: ${gl.getShaderInfoLog(sh)}`);
            }
            return sh;
        };

        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, EveSpaceSceneDepthHandler.FULLSCREEN_VS));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            throw new Error(`Depth ${name} link: ${gl.getProgramInfoLog(program)}`);
        }
        return program;
    }

    /**
     * Fullscreen triangle, no vertex buffer.
     * @type {String}
     */
    static FULLSCREEN_VS = `#version 300 es
        void main()
        {
            vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
            gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
        }`;

    /**
     * @private
     */
    _DestroyDebug()
    {
        const { gl } = device;

        if (this._debugTarget)
        {
            this._debugTarget.Destroy();
            this._debugTarget = null;
        }

        if (this._debugView)
        {
            gl.deleteProgram(this._debugView.program);
            gl.deleteVertexArray(this._debugView.vao);
            this._debugView = null;
        }

        this._debugFrame = -1;
    }

    /**
     * @private
     */
    _DestroyProbe()
    {
        if (!this._probe) return;
        const { gl } = device;
        gl.deleteProgram(this._probe.program);
        gl.deleteTexture(this._probe.tex);
        gl.deleteFramebuffer(this._probe.fbo);
        gl.deleteVertexArray(this._probe.vao);
        this._probe = null;
    }

    /**
     * Releases GL resources.
     */
    Destroy()
    {
        this._DestroyProbe();
        this.ResetOutput();
        this._placeholderRes = null;
        if (this._target)
        {
            this._target.Destroy();
            this._target = null;
        }
        this._width = 0;
        this._height = 0;
        this._rendered = false;
    }

}
