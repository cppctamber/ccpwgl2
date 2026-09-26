import { meta } from "utils";
import { tw2, device } from "global";
import { RM_FULLSCREEN } from "constant";
import { Tw2Effect } from "../mesh/Tw2Effect";
import { Tw2RenderTarget } from "../Tw2RenderTarget";
import { Tw2TextureParameter } from "../parameter";


const COLOR_PATH = "res:/graphics/effect/managed/space/postprocess/environmentfogcolor.fx";
const COMPOSITE_PATH = "res:/graphics/effect/managed/space/postprocess/environmentfogcomposit.fx";
const BLUR_PATH = "res:/graphics/effect/managed/space/postprocess/blur.fx";

/** Carbon's default BlurContext (`Tr2PostProcessRenderer.h:46-57`) as options. */
const BLUR_OPTIONS = {
    BLUR_TYPE: "BLUR_TYPE_BIG",
    BLUR_CHANNEL: "BLUR_CHANNEL_RGBA",
    BLUR_PROCESS_TYPE: "BLUR_PROCESS_TYPE_NONE",
    BLUR_FINALIZE_TYPE: "BLUR_FINALIZE_TYPE_NONE"
};


/**
 * Draws Carbon's environment fog (`Tr2PostProcessRenderer::RenderFog`,
 * `Tr2PostProcessRenderer.cpp:1406-1433`)
 *
 * Three steps, all pixel shaders: the fog colour at half resolution from the
 * scene and the nebula, Carbon's generic two-pass blur of it, then a full
 * resolution composite that fades the original towards the blurred fog by depth
 * through three blend functions and an area box. It runs before god rays, as
 * Carbon's does (cpp:709-718).
 *
 * Carbon writes the composite into a copy of the scene while reading the
 * original; ccpwgl has one scene target, so the original is copied first.
 *
 * `ViewportSize` is a LOCAL parameter on every pass. Carbon's global is
 * (viewport, current render target) and follows each target change
 * (`Tr2EffectStateManager.cpp:1215, 1242`); ccpwgl's global always holds the
 * canvas, so the half-resolution passes would step the wrong texel size.
 */
@meta.define("Tw2FogRenderer")
export class Tw2FogRenderer
{

    _colorEffect = null;
    _compositeEffect = null;
    _blurEffects = null;
    _colorTarget = null;
    _blurTarget = null;
    _sourceTarget = null;
    _populated = new Set();
    _report = { ok: false, status: "not_run" };

    /**
     * Gets the last render report
     * @returns {Object}
     */
    GetReport()
    {
        return this._report;
    }

    /**
     * Creates the effects, answering whether they are all usable
     * @returns {Boolean}
     */
    EnsureEffects()
    {
        if (!this._colorEffect)
        {
            this._colorEffect = Tw2Effect.from({
                name: "EnvironmentFogColor",
                effectFilePath: COLOR_PATH,
                parameters: { Params: [ 0, 0, 0, 0 ], Color: [ 0, 0, 0, 0 ], ViewportSize: [ 0, 0, 0, 0 ] }
            });

            this._compositeEffect = Tw2Effect.from({
                name: "EnvironmentFogComposit",
                effectFilePath: COMPOSITE_PATH,
                parameters: {
                    FogParameters: [ 0, 0, 0, 0 ],
                    BrightnessAdjustment: [ 0, 0, 0, 0 ],
                    BlendFunction0: [ 0, 0, 0, 0 ],
                    BlendFunction1: [ 0, 0, 0, 0 ],
                    BlendFunction2: [ 0, 0, 0, 0 ],
                    AreaSize: [ 0, 0, 0, 0 ],
                    AreaCenter: [ 0, 0, 0, 0 ],
                    ViewportSize: [ 0, 0, 0, 0 ]
                }
            });

            // Horizontal then vertical (`:899-911`); only the second sets Direction.
            this._blurEffects = [
                Tw2Effect.from({ name: "FogBlurH", effectFilePath: BLUR_PATH, parameters: { ViewportSize: [ 0, 0, 0, 0 ] } }),
                Tw2Effect.from({ name: "FogBlurV", effectFilePath: BLUR_PATH, parameters: { Direction: [ 0, 1 ], ViewportSize: [ 0, 0, 0, 0 ] } })
            ];
        }

        return this._colorEffect.IsGood()
            && this._compositeEffect.IsGood()
            && this._blurEffects[0].IsGood()
            && this._blurEffects[1].IsGood();
    }

    /**
     * Renders fog into the scene image
     * @param {Tr2PPFogEffect} fog - already gated on IsActive by the caller
     * @param {Tw2TextureRes|null} depth - full resolution scene depth (DepthMap)
     * @param {Tw2RenderTarget} dest - the scene image, read and written
     * @returns {Boolean} true if it drew
     */
    Render(fog, depth, dest)
    {
        this._report = { ok: false, status: "not_run" };

        if (!dest || !dest.IsGood())
        {
            this._report.status = "no_scene_target";
            return false;
        }

        if (!depth)
        {
            this._report.status = "no_depth";
            return false;
        }

        // `GetFogIfAvailable` gates on HIGH (Tr2PostProcess2.cpp:150-153).
        if (device.shaderModel !== "depth")
        {
            this._report.status = `quality_${device.shaderModel} (fog needs HIGH)`;
            return false;
        }

        if (!this.EnsureEffects())
        {
            this._report.status = "effects_not_loaded";
            return false;
        }

        const
            { gl } = tw2,
            width = dest.width,
            height = dest.height,
            halfWidth = Math.max(1, Math.floor(width * 0.5)),
            halfHeight = Math.max(1, Math.floor(height * 0.5)),
            format = dest.colorFormat || "rgba16f";

        this._colorTarget = this._EnsureTarget(this._colorTarget, "FogColor", halfWidth, halfHeight, format);
        this._blurTarget = this._EnsureTarget(this._blurTarget, "FogBlur", halfWidth, halfHeight, format);
        this._sourceTarget = this._EnsureTarget(this._sourceTarget, "FogSource", width, height, format);

        // The original, which the composite reads while writing the scene target.
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, dest._frameBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this._sourceTarget._frameBuffer);
        gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        device.SetStandardStates(RM_FULLSCREEN);
        gl.disable(gl.DEPTH_TEST);

        const halfSize = [ halfWidth, halfHeight, halfWidth, halfHeight ];

        // Fog colour.
        const color = this._colorEffect;
        this._Prepare(color);
        this._SetValue(color, "Params", [ fog.nebulaInfluence, fog.nebulaBlur, fog.originalBrightenOnly, fog.colorInfluence ]);
        this._SetValue(color, "Color", fog.color);
        this._SetValue(color, "ViewportSize", halfSize);
        this._AttachTexture(color, "BlitCurrent", dest.texture);
        this._DrawInto(this._colorTarget, color);

        // Blur, horizontal into the temp, vertical back.
        const [ blurH, blurV ] = this._blurEffects;
        this._Prepare(blurH, BLUR_OPTIONS);
        this._Prepare(blurV, BLUR_OPTIONS);
        this._SetValue(blurH, "ViewportSize", halfSize);
        this._SetValue(blurV, "ViewportSize", halfSize);
        this._AttachTexture(blurH, "BlitCurrent", this._colorTarget.texture);
        this._DrawInto(this._blurTarget, blurH);
        this._AttachTexture(blurV, "BlitCurrent", this._blurTarget.texture);
        this._DrawInto(this._colorTarget, blurV);

        // Composite over the scene.
        const composite = this._compositeEffect;
        this._Prepare(composite);
        this._SetValue(composite, "FogParameters", [ fog.totalAmount, fog.totalPower, fog.backgroundOcclusion, fog.intensity ]);
        this._SetValue(composite, "BrightnessAdjustment", [ fog.brightnessThreshold0, fog.brightnessThreshold1, fog.brightnessAdjustmentAmount, 0 ]);
        this._SetValue(composite, "BlendFunction0", [ fog.blendDistance0, fog.blendBias0, fog.blendAmount0, fog.blendPower0 ]);
        this._SetValue(composite, "BlendFunction1", [ fog.blendDistance1, fog.blendBias1, fog.blendAmount1, fog.blendPower1 ]);
        this._SetValue(composite, "BlendFunction2", [ fog.blendDistance2, fog.blendBias2, fog.blendAmount2, fog.blendPower2 ]);
        this._SetValue(composite, "AreaSize", [ fog.areaSize[0], fog.areaSize[1], fog.areaSize[2], fog.areaScale[0] ]);
        this._SetValue(composite, "AreaCenter", [ fog.areaCenter[0], fog.areaCenter[1], fog.areaCenter[2], fog.areaScale[1] ]);
        this._SetValue(composite, "ViewportSize", [ width, height, width, height ]);
        this._AttachTexture(composite, "BlitCurrent", this._colorTarget.texture);
        this._AttachTexture(composite, "BlitOriginal", this._sourceTarget.texture);
        this._AttachTexture(composite, "DepthMap", depth);
        this._DrawInto(dest, composite);

        gl.enable(gl.DEPTH_TEST);
        device.InvalidateStandardStates();

        this._report.ok = true;
        this._report.status = "rendered";
        return true;
    }

    /**
     * Sets options once and populates on the first use or a permutation change.
     * @param {Tw2Effect} effect
     * @param {Object} [options]
     * @private
     */
    _Prepare(effect, options)
    {
        const changed = options ? effect.SetOption(options, true) : false;
        if (changed || !this._populated.has(effect))
        {
            effect.AutoPopulate(false);
            this._populated.add(effect);
        }
    }

    /**
     * @param {Tw2Effect} effect
     * @param {String} name
     * @param {Array|Number} value
     * @private
     */
    _SetValue(effect, name, value)
    {
        if (effect.parameters[name])
        {
            effect.parameters[name].SetValue(value);
            return;
        }
        effect.SetParameters({ [name]: value });
        effect.BindParameters();
    }

    /**
     * Binds a live texture as a local parameter.
     * @param {Tw2Effect} effect
     * @param {String} name
     * @param {Tw2TextureRes} textureRes
     * @private
     */
    _AttachTexture(effect, name, textureRes)
    {
        if (!effect.parameters[name])
        {
            effect.parameters[name] = new Tw2TextureParameter(name);
            effect.BindParameters();
        }
        effect.parameters[name].AttachTextureRes(textureRes);
    }

    /**
     * Carbon's `DrawInto(dest, loadAction, effect)`: a screen quad into a target.
     * @param {Tw2RenderTarget} target
     * @param {Tw2Effect} effect
     * @private
     */
    _DrawInto(target, effect)
    {
        target.SetCallUnset(() => device.RenderFullScreenQuad(effect));
    }

    /**
     * @param {Tw2RenderTarget|null} target
     * @param {String} name
     * @param {Number} width
     * @param {Number} height
     * @param {String} format
     * @returns {Tw2RenderTarget}
     * @private
     */
    _EnsureTarget(target, name, width, height, format)
    {
        if (!target) return new Tw2RenderTarget(name, width, height, false, format);
        target.Update(width, height, false, format);
        return target;
    }

    /**
     * Releases GL resources.
     */
    Destroy()
    {
        for (const key of [ "_colorTarget", "_blurTarget", "_sourceTarget" ])
        {
            if (this[key])
            {
                this[key].Destroy();
                this[key] = null;
            }
        }
    }

}
