import { meta } from "utils";
import { tw2, device } from "global";
import { RM_FULLSCREEN } from "constant";
import { Tw2Effect } from "../mesh/Tw2Effect";
import { Tw2RenderTarget } from "../Tw2RenderTarget";
import { Tw2TextureParameter } from "../parameter";


// Authored `.fx` paths; the device supplies profile and tier. The effect paths
// and options are Carbon's own (`Tr2PostProcessRenderer.cpp:596-612`, Blur at
// `:906-926`).
const COC_PATH = "res:/graphics/effect/managed/space/postprocess/circleofconfusion.fx";
const BOKEH_PATH = "res:/graphics/effect/managed/space/postprocess/bokeh.fx";
const BOKEH_TAA_PATH = "res:/graphics/effect/managed/space/postprocess/bokehtaa.fx";
const BLUR_PATH = "res:/graphics/effect/managed/space/postprocess/blur.fx";

// `Tr2PPDepthOfFieldEffect::GetBokehShapeString`, indexed by `Tr2Bokeh::Shape`.
const BOKEH_SHAPE_OPTION = [
    "BOKEH_SHAPE_DISK",
    "BOKEH_SHAPE_TRIANGLE",
    "BOKEH_SHAPE_RECTANGLE",
    "BOKEH_SHAPE_PENTAGON",
    "BOKEH_SHAPE_HEXAGON",
    "BOKEH_SHAPE_HEART"
];


/**
 * Draws Carbon's depth of field pass
 *
 * A port of `Tr2PostProcessRenderer::RenderDepthOfField`
 * (`Tr2PostProcessRenderer.cpp:1598-1698`), run on the scene image after god
 * rays and before the composite, as Carbon orders it (`:715-724`):
 *
 * 1. Circle of confusion from `DepthMap` and `FocalInfo` into a target scaled by
 *    `cocScale`. With `foregroundBlurNeeded` it writes two channels and is then
 *    max-blurred horizontally and vertically with Blur.fx (BIG, R, MAXIMUM,
 *    finalize MAX_OF_ALL_CHANNELS on the second pass).
 * 2. Bokeh. `useTAAFriendlyBokeh` draws BokehTAA.fx into a scene-sized target
 *    and copies it back; otherwise Bokeh.fx AVERAGE into the target, then
 *    Bokeh.fx MAX from it back into the scene.
 *
 * ccpwgl differences:
 * - No TAA and no upscaling, so `temporal` is false (golden-angle rotation 0,
 *   2/5 samples per pixel) and the scale is not divided by an upscaling amount.
 * - `DepthMap` is a LOCAL parameter bound to the depth handler's texture, for
 *   the reason `Tw2GodRaysRenderer` note 3 gives.
 * - Targets persist instead of coming from a temp pool; CoC targets are rgba8,
 *   the nearest format ccpwgl's target factory offers to Carbon's R8 / R8G8.
 */
@meta.define("Tw2DepthOfFieldRenderer")
export class Tw2DepthOfFieldRenderer
{

    _cocEffect = null;
    _bokehBlurEffect = null;
    _bokehFillEffect = null;
    _bokehTaaEffect = null;
    _blurEffects = null;

    _cocTarget = null;
    _blurTemp1 = null;
    _blurTemp2 = null;
    _bokehBlend = null;

    _populated = new Set();
    _report = { ok: false, status: "not_run" };

    /**
     * @returns {Object}
     */
    GetReport()
    {
        return this._report;
    }

    /**
     * Gets or creates every effect.
     *
     * Parameters are declared up front: a parameter created after an effect
     * first binds is never wired to a constant (see Tw2PostProcessRenderer).
     * @returns {Boolean} true if all are usable
     */
    EnsureEffects()
    {
        if (!this._cocEffect)
        {
            this._cocEffect = Tw2Effect.from({
                name: "CircleOfConfusion",
                effectFilePath: COC_PATH,
                parameters: { FocalInfo: [ 0, 0, 0, 0 ] }
            });

            // Carbon creates both bokeh blur shaders from the same file with a
            // different BOKEH_PIXEL_METHOD (`:596-606`).
            this._bokehBlurEffect = Tw2Effect.from({
                name: "BokehBlur",
                effectFilePath: BOKEH_PATH,
                parameters: { BokehInfo: [ 0, 0, 0, 0 ] }
            });
            this._bokehFillEffect = Tw2Effect.from({
                name: "BokehFill",
                effectFilePath: BOKEH_PATH,
                parameters: { BokehInfo: [ 0, 0, 0, 0 ] }
            });
            this._bokehTaaEffect = Tw2Effect.from({
                name: "BokehTAA",
                effectFilePath: BOKEH_TAA_PATH,
                parameters: { BokehInfo: [ 0, 0, 0, 0 ] }
            });

            // Horizontal then vertical, in that order (`:899-911`). Only the
            // second sets Direction; the first keeps the shader's default.
            this._blurEffects = [
                Tw2Effect.from({ name: "DofCocBlurH", effectFilePath: BLUR_PATH }),
                Tw2Effect.from({ name: "DofCocBlurV", effectFilePath: BLUR_PATH, parameters: { Direction: [ 0, 1 ] } })
            ];
        }

        return this._cocEffect.IsGood()
            && this._bokehBlurEffect.IsGood()
            && this._bokehFillEffect.IsGood()
            && this._bokehTaaEffect.IsGood()
            && this._blurEffects[0].IsGood()
            && this._blurEffects[1].IsGood();
    }

    /**
     * Renders depth of field into the scene image.
     * @param {Tr2PPDepthOfFieldEffect|null} depthOfField - already gated on IsActive by the caller
     * @param {Tw2TextureRes|null} depth - full resolution scene depth (DepthMap)
     * @param {Tw2RenderTarget|null} dest - the scene image, read and written
     * @returns {Boolean} true if it drew
     */
    Render(depthOfField, depth, dest)
    {
        this._report = { ok: false, status: "not_run" };

        if (!depthOfField || !depthOfField.IsActive())
        {
            this._report.status = "inactive";
            return false;
        }

        if (!dest || !dest.IsGood())
        {
            this._report.status = "no_destination";
            return false;
        }

        if (!depth)
        {
            this._report.status = "no_depth";
            return false;
        }

        // `GetDepthOfFieldIfAvailable` gates on HIGH (Tr2PostProcess2.cpp:172).
        if (device.shaderModel !== "depth")
        {
            this._report.status = `quality_${device.shaderModel} (depth of field needs HIGH)`;
            return false;
        }

        if (!this.EnsureEffects())
        {
            this._report.status = "effects_not_loaded";
            return false;
        }

        const { gl } = tw2;
        const shape = BOKEH_SHAPE_OPTION[depthOfField.bokehShape] || BOKEH_SHAPE_OPTION[0];

        device.SetStandardStates(RM_FULLSCREEN);
        gl.disable(gl.DEPTH_TEST);

        // Circle of confusion.
        const
            cocWidth = Math.max(1, Math.floor(dest.width * depthOfField.cocScale)),
            cocHeight = Math.max(1, Math.floor(dest.height * depthOfField.cocScale)),
            coc = this._cocEffect;

        this._Prepare(coc, {
            COC_OUTPUT_CHANNEL_COUNT: depthOfField.foregroundBlurNeeded ? "COC_OUTPUT_CHANNEL_COUNT_2" : "COC_OUTPUT_CHANNEL_COUNT_1"
        });
        this._SetValue(coc, "FocalInfo", [ depthOfField.focalDistance, depthOfField.focalLength, depthOfField.scale, 0 ]);
        this._AttachTexture(coc, "DepthMap", depth);

        this._cocTarget = this._EnsureTarget(this._cocTarget, "DofCoC", cocWidth, cocHeight, "rgba8");
        this._DrawInto(this._cocTarget, coc);

        let cocMap = this._cocTarget.texture;

        if (depthOfField.foregroundBlurNeeded)
        {
            const [ blurH, blurV ] = this._blurEffects;
            const blurOptions = {
                BLUR_TYPE: "BLUR_TYPE_BIG",
                BLUR_CHANNEL: "BLUR_CHANNEL_R",
                BLUR_PROCESS_TYPE: "BLUR_PROCESS_TYPE_MAXIMUM"
            };
            this._Prepare(blurH, { ...blurOptions, BLUR_FINALIZE_TYPE: "BLUR_FINALIZE_TYPE_NONE" });
            this._Prepare(blurV, { ...blurOptions, BLUR_FINALIZE_TYPE: "BLUR_FINALIZE_TYPE_MAX_OF_ALL_CHANNELS" });

            this._blurTemp1 = this._EnsureTarget(this._blurTemp1, "DofCoCBlur1", cocWidth, cocHeight, "rgba8");
            this._blurTemp2 = this._EnsureTarget(this._blurTemp2, "DofCoCBlur2", cocWidth, cocHeight, "rgba8");

            this._AttachTexture(blurH, "BlitCurrent", this._cocTarget.texture);
            this._DrawInto(this._blurTemp1, blurH);
            this._AttachTexture(blurV, "BlitCurrent", this._blurTemp1.texture);
            this._DrawInto(this._blurTemp2, blurV);

            cocMap = this._blurTemp2.texture;
        }

        // Bokeh. No upscaling in ccpwgl, so the scale is used as authored.
        const adjustedScale = depthOfField.scale;
        this._bokehBlend = this._EnsureTarget(this._bokehBlend, "DofBokehBlend", dest.width, dest.height, dest.colorFormat);

        if (depthOfField.useTAAFriendlyBokeh)
        {
            // `temporal` false: no rotation, and 2/5 samples per pixel.
            const bokeh = this._bokehTaaEffect;
            this._Prepare(bokeh, { BOKEH_SHAPE: shape });
            this._AttachTexture(bokeh, "BlitCurrent", dest.texture);
            this._AttachTexture(bokeh, "CoCMap", cocMap);
            this._SetValue(bokeh, "BokehInfo", [ adjustedScale, 0, 2 / 5, 0 ]);
            this._DrawInto(this._bokehBlend, bokeh);

            // "Copy back".
            dest.SetCallUnset(() => device.RenderTexture(this._bokehBlend.texture));
        }
        else
        {
            const blur = this._bokehBlurEffect;
            this._Prepare(blur, { BOKEH_PIXEL_METHOD: "BOKEH_PIXEL_AVERAGE", BOKEH_SHAPE: shape });
            this._AttachTexture(blur, "BlitCurrent", dest.texture);
            this._AttachTexture(blur, "CoCMap", cocMap);
            this._SetValue(blur, "BokehInfo", [ adjustedScale, 0, 0, 0 ]);
            this._DrawInto(this._bokehBlend, blur);

            const fill = this._bokehFillEffect;
            this._Prepare(fill, { BOKEH_PIXEL_METHOD: "BOKEH_PIXEL_MAX", BOKEH_SHAPE: shape });
            this._AttachTexture(fill, "BlitCurrent", this._bokehBlend.texture);
            this._AttachTexture(fill, "CoCMap", cocMap);
            this._SetValue(fill, "BokehInfo", [ adjustedScale, 0, 0, 0 ]);
            this._DrawInto(dest, fill);
        }

        gl.enable(gl.DEPTH_TEST);
        device.InvalidateStandardStates();

        this._report.ok = true;
        this._report.status = "rendered";
        return true;
    }

    /**
     * Applies permutation options, rebinding once when they changed or the
     * effect has not been populated yet - the order Tw2PostProcessRenderer uses.
     * @param {Tw2Effect} effect
     * @param {Object} options
     * @private
     */
    _Prepare(effect, options)
    {
        const changed = effect.SetOption(options, true);
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
        for (const key of [ "_cocTarget", "_blurTemp1", "_blurTemp2", "_bokehBlend" ])
        {
            if (this[key])
            {
                this[key].Destroy();
                this[key] = null;
            }
        }
    }

}
