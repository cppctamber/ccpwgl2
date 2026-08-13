import { device, tw2 } from "global";
import { mat4 } from "math";
import { Tw2RenderTarget } from "../Tw2RenderTarget";
import { Tw2DepthRenderTarget } from "../Tw2DepthRenderTarget";
import { Tw2Effect } from "../mesh/Tw2Effect";
import { Tw2RenderBatchContext } from "../batch/Tw2RenderBatchContext";
import { Tw2CarbonResourceBinder } from "./Tw2CarbonResourceBinder";
import { Tw2CarbonShadowProducer } from "./Tw2CarbonShadowProducer";
import { RM_OPAQUE } from "constant";


// Camera transforms saved across the caster pass, which rebinds them to the light.
const _prevView = mat4.create();
const _prevProjection = mat4.create();

/**
 * The resolve draws with NO per-object data bound, deliberately.
 *
 * It reads `cb4[0]` and `cb4[1]` as two analytic sphere occluders - `xyz`
 * centre, `w` radius - and a ray hit writes 0.0 (fully shadowed) and returns.
 * Carbon authors them from the planets
 * (`EveSpaceScene::SetupPlanetsAsShadowCaster`, `EveSpaceScene.cpp:789`);
 * ccpwgl has no equivalent yet, so the honest value is zero - a zero radius
 * cannot intersect.
 *
 * Getting there by NULLING `device.perObjectData` rather than by supplying a
 * zeroed stub. Two reasons. The binder returns early on null, so cb4 is simply
 * never written, and a GL uniform is per-PROGRAM: the resolve effect's own
 * program is only ever drawn by this method, so its cb4 keeps its initial zero.
 * And a stub has to be a real `Tw2RawData` - `Tw2Effect.ApplyPass` calls
 * methods on it, not just `.data` - so faking one couples this pass to the
 * per-object layout for no gain.
 *
 * What must NOT happen is leaving a hull's data bound: for a hull, cb4 holds
 * the TRANSPOSED WORLD MATRIX, whose rows read as a sphere centred on a basis
 * vector with a translation component as its radius. That paints large
 * arbitrary regions fully shadowed - indistinguishable from a broken cascade
 * lookup, and the reason shadows appeared unrelated to the geometry.
 */


/**
 * Authored path, NOT a compiled one. D036: `Tw2Device.ToEffectPath` substitutes
 * the profile directory and appends the quality tier, so this resolves to
 * `effect.dx11/.../shadowdepth.sm_depth` at High.
 */
const SHADOW_RESOLVE_EFFECT = "res:/graphics/effect/managed/space/system/shadowdepth.fx";

/** Casters are selected by technique name, as in Carbon (EveSpaceScene.cpp:778) */
const CASTER_TECHNIQUE = "Shadow";


/**
 * Carbon's sun shadow passes: casters into a cascade atlas, then a screen-space
 * resolve into the R8 visibility buffer object shaders sample.
 *
 * Read `/docs/contracts/carbon-shadow-resolve.md` first. The two globals are
 * different kinds of thing and binding the atlas to both - which ccpwgl's older
 * shadow handler does - gives objects light-space depth in screen space.
 *
 * NOT YET EXERCISED IN A BROWSER. The maths under it is covered by
 * `npm run test:carbon-shadow`; everything in this file is GL orchestration
 * that only a real context can validate.
 */
export class Tw2CarbonShadowRenderer
{

    producer = new Tw2CarbonShadowProducer();

    /**
     * Atlas tile edge. Carbon uses 2048 across 8x2; that is 16384x4096.
     *
     * 2048 rather than 1024 because subject fitting uses a SINGLE tile, so the
     * atlas is one square rather than a 4-wide strip - the memory is the same
     * as the old 4x1024x1024 layout and every texel now lands on the subject.
     * Texel size is the subject's diameter over this, and the staircase edges
     * on a shadow are those texels made visible.
     */
    tileSize = 2048;

    enabled = false;

    /** Colour-codes cascades using ShadowDepth.fx's own SDM_COLOR permutation */
    debug = false;

    /**
     * Draws the cascade atlas itself, bottom-left.
     *
     * The most direct answer to "are the shadows coming from the right angle?",
     * because it does not depend on being able to SEE a shadow. The atlas is
     * what the sun sees: if a recognisable silhouette of the hull is sitting in
     * each tile, the caster pass and the light basis are right, and anything
     * still wrong is downstream in the lookup.
     *
     * Needed because in space the only shadow receiver is the ship itself, so
     * the effect is invisible until the camera is close enough to resolve
     * self-shadowing - which is exactly when it is hardest to judge.
     */
    debugAtlas = false;

    /** Edge of the atlas preview, in pixels */
    debugAtlasSize = 512;

    /**
     * Fits the cascade to the visible objects instead of to camera frustum
     * slices. See the subject-fitting note in `Tw2CarbonShadowData`.
     */
    fitToSubject = true;

    /**
     * Depth bias applied while rendering casters, as `gl.polygonOffset`.
     *
     * A DELIBERATE DEVIATION: Carbon applies no bias anywhere in its cascade
     * path - not in `Tr2ShadowMap.cpp`, not in the cascade loop, and the resolve
     * does one plain compare. It does not need one, because sixteen cascades at
     * 2048 texels put its depth quantisation far below the difference between a
     * surface and itself.
     *
     * ccpwgl runs four cascades at 1024 - roughly an eighth of that density - so
     * a lit surface's own depth and its stored depth land on the same quantum
     * and the comparison is a TIE. Ties resolve as lit, so shadows thin out or
     * vanish entirely, and every knob that widens a cascade box makes it worse:
     * lowering `shadowNear`, raising `shadowDistance`, or extending the box
     * toward the light all killed shadows outright before this existed.
     *
     * Pushing stored depths slightly AWAY from the light breaks the tie in the
     * safe direction - a surface stops shadowing itself, while a genuine
     * occluder is far enough in front to still win. Raise `units` if shadows
     * look absent, lower it if they detach from their caster.
     */
    casterDepthBias = 2;

    /** Slope-scaled component of {@link casterDepthBias}. */
    casterSlopeBias = 2;

    _atlas = null;
    _resolve = null;
    _effect = null;
    _context = null;
    _installed = false;
    _cascade = mat4.create();
    _atlasDebug = null;
    _casterReport = [];

    /**
     * Installs the per-frame producer on the device's Carbon binder.
     *
     * Without this the cascade registers stay zero and the resolve writes
     * "fully lit" everywhere - a working pipeline rendering nothing.
     * @returns {Boolean}
     */
    Install()
    {
        if (this._installed) return true;
        const binder = Tw2CarbonResourceBinder.Get(device);
        if (!binder) return false;
        binder.perFrameProducer = this.producer;
        this._installed = true;
        return true;
    }

    /**
     * Removes the producer, restoring the plain GLES transcode
     * @returns {Boolean}
     */
    Uninstall()
    {
        if (!this._installed) return false;
        const binder = Tw2CarbonResourceBinder.Get(device);
        if (binder && binder.perFrameProducer === this.producer) binder.perFrameProducer = null;
        this._installed = false;
        return true;
    }

    /**
     * Creates or resizes the cascade atlas and the resolve target
     * @param {Number} width - resolve width, matching the scene depth buffer
     * @param {Number} height
     * @returns {Boolean}
     * @private
     */
    _EnsureTargets(width, height)
    {
        // Sized from the cells actually in use, not the configured grid:
        // subject fitting uses a single tile, and allocating four would leave
        // three quarters of the atlas cleared while the subject was squeezed
        // into a quarter of the texels it could have had.
        const
            cells = this.producer.GetActiveCells(),
            cellsX = cells.x,
            cellsY = cells.y,
            atlasWidth = this.tileSize * cellsX,
            atlasHeight = this.tileSize * cellsY;

        if (!this._atlas)
        {
            // Depth TEXTURE, not a renderbuffer - the resolve samples it.
            // 32F rather than the scene default of 16: EVE's far plane makes
            // 16-bit depth useless, which is the same reason the AO pass builds
            // its own 32F target rather than reusing the scene one.
            this._atlas = new Tw2DepthRenderTarget("CarbonShadowCascades", atlasWidth, atlasHeight, 32);
        }
        else
        {
            this._atlas.Update(atlasWidth, atlasHeight, 32);
        }

        if (!this._resolve)
        {
            this._resolve = new Tw2RenderTarget("CarbonShadowVisibility", width, height, false);
        }
        else
        {
            this._resolve.Update(width, height, false);
        }

        // Cascade count is not needed here - the atlas is sized from the cells.
        return this._atlas.IsGood() && this._resolve.IsGood();
    }

    /**
     * Loads the resolve effect on first use
     * @returns {Tw2Effect|null}
     * @private
     */
    _EnsureEffect()
    {
        if (!this._effect)
        {
            this._effect = Tw2Effect.from({
                name: "Carbon shadow resolve",
                effectFilePath: SHADOW_RESOLVE_EFFECT,
                textures: {
                    EveSpaceSceneCascadedShadowMap: "",
                    DepthMap: ""
                }
            });
        }
        return this._effect.IsGood() ? this._effect : null;
    }

    /**
     * Renders the cascade atlas and resolves it to screen-space visibility.
     *
     * @param {Number} dt
     * @param {Object} scene - an EveSpaceScene
     * @returns {Boolean} whether the visibility buffer was produced
     */
    Render(dt, scene)
    {
        if (!this.enabled || !scene) return false;

        const
            width = tw2.width,
            height = tw2.height;

        if (!width || !height) return false;

        const built = this.producer.Update({
            view: device.view,
            projection: device.projection,
            sunDirection: scene.sunDirection || (scene.sunData && scene.sunData.dirWorld),
            near: this.producer.shadowNear,
            subject: this.fitToSubject && scene.GetShadowSubject ? scene.GetShadowSubject() : null
        });

        if (!built || !this._EnsureTargets(width, height)) return false;

        this._RenderCasters(scene);
        return this._Resolve(scene);
    }

    /**
     * Draws every caster into its cascade's atlas tile.
     *
     * Carbon renders casters with their OWN materials and selects the pass by
     * technique name; there is no override effect (EveSpaceScene.cpp:748-783).
     * @param {Object} scene
     * @private
     */
    _RenderCasters(scene)
    {
        const
            { gl } = device,
            cascadeCount = this.producer.GetActiveCascadeCount(),
            cellsX = this.producer.GetActiveCells().x,
            objects = scene.objectsByDistance || scene.objects || [];

        if (!this._context) this._context = new Tw2RenderBatchContext({});

        this._atlas.Set();

        // Cleared to 1.0, and compared with LESSEQUAL - standard forward depth.
        // The surrounding scene may run otherwise; this pass does not inherit it.
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.clearDepth(1);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // Carbon disables depth CLIP for the whole cascade loop
        // (`EveSpaceScene.cpp:745-746`). The cascade ortho's z range is exactly
        // the light-space box of that slice, so an occluder sitting BETWEEN the
        // light and the box - the ordinary case for a ship shadowing something
        // in a nearer cascade - falls outside the near plane and writes nothing.
        //
        // WebGL2 has no core depth clamp, so this needs the extension. Where it
        // is missing the caster near plane is pushed out instead
        // (`Tw2CarbonShadowProducer.casterNearExtend`), which is the same idea
        // as Carbon's commented-out `aabb.m_max.z += 250000` at
        // `Tr2ShadowMap.cpp:208`.
        // Guarded on the enum, not just the extension object: `gl.enable(undefined)`
        // is an INVALID_ENUM that silently poisons the pass.
        const depthClamp = device.GetExtension("EXT_depth_clamp");
        const depthClampEnum = depthClamp && depthClamp.DEPTH_CLAMP_EXT;
        if (depthClampEnum) gl.enable(depthClampEnum);

        // Bias the stored depths away from the light - see `casterDepthBias`.
        const biased = this.casterDepthBias !== 0 || this.casterSlopeBias !== 0;
        if (biased)
        {
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(this.casterSlopeBias, this.casterDepthBias);
        }

        // Casters must be drawn FROM THE LIGHT. Until 2026-08-13 this loop
        // fetched the cascade matrix and then never used it, so every tile was
        // filled with the scene as seen by the CAMERA - the resolve then looked
        // that up with correct light-space UVs, which is why shadows tracked the
        // sun and the cascade controls while bearing no relation to the scene.
        //
        // The camera transforms are restored afterwards: everything downstream
        // in the frame, the resolve included, expects them back.
        const
            prevView = mat4.copy(_prevView, device.view),
            prevProjection = mat4.copy(_prevProjection, device.projection);

        for (let i = 0; i < cascadeCount; i++)
        {
            if (!this.producer.GetCascadeProjection(this._cascade, i)) continue;

            const
                x = (i % cellsX) * this.tileSize,
                y = Math.floor(i / cellsX) * this.tileSize;

            // The tile is the viewport, so the projection carries no tile
            // transform - that belongs to the lookup matrix alone.
            device.SetView(this.producer.lightView);
            device.SetProjection(this._cascade);
            if (scene.UpdateViewProjectionFrameData) scene.UpdateViewProjectionFrameData();

            gl.viewport(x, y, this.tileSize, this.tileSize);

            this._context.Clear();
            this._context.CollectObjectArrayBatches(objects, RM_OPAQUE, {
                techniqueFilter: CASTER_TECHNIQUE,
                techniqueOverride: CASTER_TECHNIQUE
            });

            // A cascade with nothing in it keeps its cleared 1.0 tile, exactly
            // as Carbon skips empty splits.
            this._context.Render(CASTER_TECHNIQUE);

            // Recorded per cascade, because an empty tile has two completely
            // different causes that look identical: nothing was COLLECTED (the
            // objects have no `Shadow` technique at this LOD, or were culled),
            // or batches were collected and then clipped away by the cascade
            // projection. Only the batch count separates them.
            const report = this._context.GetReport ? this._context.GetReport() : null;
            this._casterReport[i] = {
                batches: report ? report.batches : undefined,
                rendered: report ? report.rendered : undefined,
                objects: objects.length
            };
        }

        if (depthClampEnum) gl.disable(depthClampEnum);
        if (biased)
        {
            gl.polygonOffset(0, 0);
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }

        device.SetView(prevView);
        device.SetProjection(prevProjection);
        if (scene.UpdateViewProjectionFrameData) scene.UpdateViewProjectionFrameData();

        this._atlas.Unset();

        // This pass drove GL directly, so the device's cached render state no
        // longer describes the context.
        device.InvalidateStandardStates();
    }

    /**
     * Runs ShadowDepth.fx over the atlas and publishes the result.
     * @param {Object} scene
     * @returns {Boolean}
     * @private
     */
    _Resolve(scene)
    {
        const effect = this._EnsureEffect();
        if (!effect) return false;

        // Taken from the producer DIRECTLY, not through the `DepthMap` global.
        //
        // The global is the right NAME - `EveSpaceSceneDepthMap`, which this
        // pass used to read, is a ccpwgl invention no corpus shader references,
        // and reading it is why the resolve unprojected the 1x1 white
        // placeholder and produced a flat single-cascade debug view. But the
        // global is not currently published, because it is wrong for the soft
        // particle shaders that also read it (see
        // `EveSpaceSceneDepthHandler.publishGlobal`). This pass is safe to feed
        // regardless: `BuildProjectionInverse` folds in the GL/D3D z remap, so
        // it is one of the few consumers that unprojects ccpwgl's buffer
        // correctly.
        const handler = scene && scene.GetDepthHandler ? scene.GetDepthHandler(false) : null;
        const produced = handler && handler.rendered ? handler.depthTextureRes : null;

        const depthMap = produced
            || (tw2.HasVariable("DepthMap") ? tw2.GetVariable("DepthMap") : null);

        if (!depthMap) return false;

        // The producer hands back a Tw2TextureRes; the global is a
        // Tw2TextureParameter wrapping one. Normalise, or the attach below
        // silently skips for one of the two and the resolve unprojects
        // whatever was bound last frame.
        const depthRes = depthMap.textureRes || depthMap;
        if (!depthRes) return false;

        effect.SetOption({ SHADOW_DEBUG_MODE: this.debug ? "SDM_COLOR" : "SDM_NONE" });
        effect.parameters.EveSpaceSceneCascadedShadowMap?.AttachTextureRes(this._atlas.depthTexture);
        effect.parameters.DepthMap?.AttachTextureRes(depthRes);

        const { gl } = device;

        // No sphere occluders for this draw - see the note at the top of the
        // file. Restored afterwards so the next object's data is untouched.
        const previousPerObjectData = device.perObjectData;
        device.perObjectData = null;

        this._resolve.Set();
        gl.disable(gl.DEPTH_TEST);
        device.RenderFullScreenQuad(effect);
        gl.enable(gl.DEPTH_TEST);
        this._resolve.Unset();

        device.perObjectData = previousPerObjectData;

        // The screen-space visibility buffer, NOT the cascade atlas. Binding the
        // atlas here is the mistake this whole class exists to avoid.
        if (tw2.HasVariable("EveSpaceSceneShadowMap"))
        {
            const variable = tw2.GetVariable("EveSpaceSceneShadowMap");
            if (variable && variable.AttachTextureRes) variable.AttachTextureRes(this._resolve.texture);
        }

        // The visibility buffer is offscreen - objects sample it, nothing draws
        // it. So `SDM_COLOR` alone shows NOTHING on screen: it colour-codes a
        // texture the canvas never sees. Debug mode therefore also blits the
        // buffer over the frame, which is the only reason it is a debug view
        // rather than a differently-encoded input.
        device.InvalidateStandardStates();
        void scene;
        return true;
    }

    /**
     * Per-cascade caster batch counts from the last frame.
     *
     * An empty atlas tile is ambiguous - nothing collected, or collected and
     * clipped - and these are what separate the two.
     * @returns {Array<Object>}
     */
    GetCasterReport()
    {
        return this._casterReport;
    }

    /**
     * Blits the visibility buffer over the frame, for `debug`.
     *
     * Deliberately NOT done inside the resolve. The visibility buffer is an
     * offscreen input that objects sample - nothing ever draws it - so
     * `SDM_COLOR` alone shows nothing on screen and the blit is the only reason
     * it is a debug VIEW rather than a differently-encoded input. But the
     * resolve runs BEFORE the main colour pass, so blitting there put the image
     * on the canvas and then let the scene paint over it: the cascade colours
     * survived only where no geometry drew, which reads as "a red background
     * and nothing on the ship" - the exact opposite of what is being looked for.
     *
     * Called at the end of the frame instead, next to the other shadow debug
     * view.
     * @returns {Boolean} true if it drew
     */
    RenderDebug()
    {
        if (!this.enabled) return false;

        const { gl } = device;
        let drew = false;

        if (this.debug && this._resolve && this._resolve.IsGood())
        {
            gl.disable(gl.DEPTH_TEST);
            device.RenderTexture(this._resolve.texture);
            gl.enable(gl.DEPTH_TEST);
            drew = true;
        }

        if (this.debugAtlas && this._atlas && this._atlas.IsGood())
        {
            drew = this._RenderAtlasDebug() || drew;
        }

        if (drew) device.InvalidateStandardStates();
        return drew;
    }

    /**
     * Colour-ramps the cascade atlas into the corner.
     *
     * A depth texture cannot go through `device.RenderTexture` - `blit.fx`
     * samples an ordinary colour texture - and raw depth would be unreadable
     * anyway, so this resolves it with a ramp. Cleared texels come out MAGENTA,
     * which is the important state: a magenta tile means that cascade drew no
     * casters at all, and the tiles are laid out left to right in cascade order.
     * @returns {Boolean}
     * @private
     */
    _RenderAtlasDebug()
    {
        const { gl } = device;
        const view = this._EnsureAtlasDebug();
        if (!view) return false;

        const
            prevViewport = gl.getParameter(gl.VIEWPORT),
            prevVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING),
            prevDepth = gl.isEnabled(gl.DEPTH_TEST),
            prevBlend = gl.isEnabled(gl.BLEND);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        // Preserve the atlas aspect so the tiles are not squashed into squares.
        // One tile is square, so the preview is sized from the ACTIVE tiles.
        // Sizing it by cellsX made a 4x1 strip even when only one cascade had
        // content - short, wide and unreadable, which is exactly the complaint.
        const
            cells = this.producer.GetActiveCells(),
            w = this.debugAtlasSize,
            h = Math.max(1, Math.round(this.debugAtlasSize * cells.y / Math.max(1, cells.x)));

        gl.viewport(0, 0, w, h);
        gl.bindVertexArray(view.vao);
        gl.useProgram(view.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._atlas.depthTextureGL);
        gl.uniform1i(view.sampler, 0);
        gl.uniform1f(view.widthFraction, 1);
        gl.uniform2f(view.size, w, h);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (prevDepth) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
        if (prevBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
        gl.bindVertexArray(prevVao);
        gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
        return true;
    }

    /**
     * Compiles the atlas preview program on first use.
     * @returns {Object|null}
     * @private
     */
    _EnsureAtlasDebug()
    {
        if (this._atlasDebug) return this._atlasDebug;

        const { gl } = device;

        const vs = `#version 300 es
            void main()
            {
                vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
                gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
            }`;

        const fs = `#version 300 es
            precision highp float;
            uniform highp sampler2D atlas;
            uniform float uWidthFraction;
            uniform vec2 uSize;
            out vec4 color;
            void main()
            {
                // Sample only the tiles that were actually drawn.
                vec2 uv = gl_FragCoord.xy / vec2(uSize);
                uv.x *= uWidthFraction;
                float d = texelFetch(atlas, ivec2(uv * vec2(textureSize(atlas, 0))), 0).r;
                if (d >= 1.0) { color = vec4(1.0, 0.0, 1.0, 1.0); return; }
                // Nearest to the light is 0, so invert for a "closer is brighter"
                // read, and gamma it because the useful range is compressed.
                float t = pow(1.0 - d, 0.35);
                color = vec4(t, t, t, 1.0);
            }`;

        const compile = (type, src) =>
        {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
            {
                throw new Error(`Shadow atlas debug compile: ${gl.getShaderInfoLog(sh)}`);
            }
            return sh;
        };

        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            throw new Error(`Shadow atlas debug link: ${gl.getProgramInfoLog(program)}`);
        }

        this._atlasDebug = {
            program,
            vao: gl.createVertexArray(),
            sampler: gl.getUniformLocation(program, "atlas"),
            widthFraction: gl.getUniformLocation(program, "uWidthFraction"),
            size: gl.getUniformLocation(program, "uSize")
        };

        return this._atlasDebug;
    }

    /**
     * Releases GL resources
     */
    Destroy()
    {
        this.Uninstall();
        if (this._atlas) { this._atlas.Destroy(); this._atlas = null; }
        if (this._resolve) { this._resolve.Destroy(); this._resolve = null; }
        if (this._atlasDebug)
        {
            const { gl } = device;
            gl.deleteProgram(this._atlasDebug.program);
            gl.deleteVertexArray(this._atlasDebug.vao);
            this._atlasDebug = null;
        }
        this._context = null;
    }

}
