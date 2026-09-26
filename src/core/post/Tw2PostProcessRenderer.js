import { meta } from "utils";
import { tw2, device } from "global";
import { Tw2Effect } from "../mesh/Tw2Effect";
import { Tw2TextureParameter } from "../parameter";
import { Tr2PPTonemappingEffect } from "./effect/Tr2PPTonemappingEffect";
import { Tw2DynamicExposureRenderer } from "./Tw2DynamicExposureRenderer";
import { Tw2CarbonResourceBinder } from "../carbon/Tw2CarbonResourceBinder";


const EFFECT_PATH = "res:/graphics/effect/managed/space/postprocess/tonemapping.fx";

const TOGGLE = (name, on) => on ? `${name}_ENABLED` : `${name}_DISABLED`;

// ACES constants as Carbon constructs them, row-major (Tr2PostProcessRenderer.cpp:441-457).
const ACES_INPUT_MAT = [
    0.59719, 0.35458, 0.04823, 0, 0.07600, 0.90834, 0.01566, 0, 0.02840, 0.13383, 0.83777, 0, 0, 0, 0, 1
];
const ACES_OUTPUT_MAT = [
    1.60475, -0.53108, -0.07367, 0, -0.10208, 1.10813, -0.00605, 0, -0.00327, -0.07276, 1.07602, 0, 0, 0, 0, 1
];
const ACES_BLUE_CORRECT = [
    0.9404372683, -0.0183068787, 0.0778696104, 0, 0.0083786969, 0.8286599939, 0.1629613092, 0,
    0.0005471261, -0.0008833746, 1.0003362486, 0, 0, 0, 0, 1
];
const ACES_BLUE_CORRECT_INV = [
    1.06318, 0.0233956, -0.0865726, 0, -0.0106337, 1.20632, -0.19569, 0, -0.000590887, 0.00105248, 0.999538, 0, 0, 0, 0, 1
];


/**
 * Every constant the composite uses, in any permutation, at Carbon's defaults.
 *
 * These MUST all exist before the first bind. `Tw2Effect.OnValueChanged` only
 * calls `BindParameters` when the effect RESOURCE changed, so a parameter
 * created after the effect first bound is never wired to a constant - it holds
 * the value you set while the shader keeps reading its own default, and the
 * symptom is a parameter that appears set and does nothing.
 *
 * A parameter absent from the current permutation is simply unused, so listing
 * them all costs nothing and removes the ordering trap entirely.
 */
const DEFAULT_PARAMETERS = {
    ExposureAdjust: 1,
    ExposureInfluence: 1,
    ExposureMiddleValue: 0.55,
    MinExposure: -3.7,
    MaxExposure: 10,
    BloomBrightness: 0,
    GrimeWeight: 0,

    FadeColor: [ 0, 0, 0 ],
    FadeAmount: 0,

    SaturationFactor: 1,

    LUTInfluence_0: 0,
    LUTInfluence_1: 0,
    LUTInfluence_2: 0,
    LUTInfluence_3: 0,

    ShoulderStrength: 0.125,
    LinearStrength: 0.25,
    LinearAngle: 0.1,
    ToeStrength: 0.15,
    ToeNumerator: 0.021,
    ToeDenominator: 0.3,
    WhiteScale: 2.5,

    SplitScreenRatio: 0,
    AutoSwipe: [ 0, 0 ],
    OutputGamma: 1,

    ColorSaturation: 1,
    ColorContrast: 1,
    ColorGamma: 1,
    ColorGain: [ 1, 1, 1 ],
    ColorOffset: [ 0, 0, 0 ],
    WhiteTemperature: 6500,
    WhiteTint: 0,

    VignetteIntensity: [ 0, 0 ],
    VignetteColor: [ 1, 1, 1 ],
    VignetteDetailSize: [ 16, 16, 16, 16 ],
    VignetteDetailScroll: [ 0, 0, 0, 0 ],
    VignetteSineFrequency: 1,
    VignetteSineRange: [ 0, 1 ]
};


/**
 * Draws Carbon's composite pass
 *
 * Carbon separates `Tr2PostProcess2` — the effect slots, which hydrate from a
 * black file — from `Tr2PostProcessRenderer`, which owns the effects, the
 * targets and the pass order. This is the second half of that split, and the
 * reason `Tw2PostProcess2` owns no GL.
 *
 * The composite is ONE draw. Every effect is a permutation option plus a set of
 * named parameters, so this class is almost entirely the mapping that Carbon
 * performs in its `Apply*` helpers, and almost none of it is rendering.
 *
 * Two Carbon behaviours are deliberately reproduced:
 *
 * - It runs even when the scene carries no post process at all. Every effect is
 *   then switched off, but exposure and OutputGamma still apply, so "no post
 *   process configured" is NOT the same as "no post pass".
 * - `ApplyFade` sets no option; it expresses an absent fade as `FadeAmount` 0,
 *   even though the container declares a `FADE_TOGGLE` axis.
 *
 * Dynamic exposure is measured by `Tw2DynamicExposureRenderer` before the
 * composite draws, and published to the tonemap as its `Exposure` buffer. The
 * option is only enabled on a frame that measured; otherwise the composite
 * degrades to fixed exposure, a configuration Carbon supports.
 */
@meta.define("Tw2PostProcessRenderer")
export class Tw2PostProcessRenderer
{

    _effect = null;
    _populated = false;
    _exposure = new Tw2DynamicExposureRenderer();

    /**
     * Gets or creates the composite effect
     * @returns {Tw2Effect}
     */
    EnsureEffect()
    {
        if (!this._effect)
        {
            this._effect = Tw2Effect.from({
                name: "Tonemapping",
                effectFilePath: EFFECT_PATH,
                parameters: { ...DEFAULT_PARAMETERS },
                textures: {
                    // BlitCurrent is the bloom result and Grime the dirt
                    // overlay. The composite samples both unconditionally, so
                    // both must be bound even with no bloom chain; black is the
                    // identity for each, and Carbon binds a black grime texture
                    // itself when no bloom effect exists. Set once here rather
                    // than per frame, since SetTextures triggers UpdateValues.
                    BlitCurrent: "res:/texture/global/black.dds",
                    Grime: "res:/texture/global/black.dds"
                }
            });
        }
        return this._effect;
    }

    /**
     * Identifies if the renderer can draw
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!this._effect && this._effect.IsGood();
    }

    /**
     * Applies a post process object's effects to the composite
     *
     * Absent effects are switched OFF rather than skipped, because an option
     * left at its previous value persists across frames on a shared effect.
     *
     * @param {Tw2PostProcess2|null} postProcess
     * @param {Tr2PPDynamicExposureEffect|null} [dynamicExposure] - the effect,
     * only when its buffer was measured this frame
     */
    Apply(postProcess, dynamicExposure = null)
    {
        const
            effect = this.EnsureEffect(),
            get = slot => postProcess ? postProcess.GetIfAvailable(slot) : null,
            colorCorrection = get("colorCorrection"),
            tonemapping = get("tonemapping"),
            desaturate = get("desaturate"),
            vignette = get("vignette"),
            fade = get("fade"),
            luts = postProcess ? postProcess.GetAvailableLuts() : [];

        // Tw2Effect documents the order for a permutation-gated swap:
        // SetOption first, THEN set values, THEN AutoPopulate once. Options are
        // batched with skipRebind so the rebind happens exactly once, at the end,
        // with the values already in place.
        //
        // Two traps this order avoids. Assigning `effect.options = {...}` sets
        // the values but leaves the effect on its previous permutation, because
        // only Rebind re-runs GetShader(options). And a parameter created after
        // the effect first bound is never wired to a constant, because
        // OnValueChanged only rebinds when the effect RESOURCE changed - it then
        // holds the value while the shader keeps reading its own default.
        const optionsChanged = effect.SetOption({
            COLOR_CORRECTION_TOGGLE: TOGGLE("COLOR_CORRECTION", !!colorCorrection),
            DESATURATE_TOGGLE: TOGGLE("DESATURATE", !!desaturate),
            VIGNETTE_TOGGLE: TOGGLE("VIGNETTE", !!vignette),
            LUT_TOGGLE: TOGGLE("LUT", luts.length > 0),
            DYNAMIC_EXPOSURE_TOGGLE: TOGGLE("DYNAMIC_EXPOSURE", !!dynamicExposure),
            // Carbon's tone curve selection (Tr2PostProcessRenderer.cpp:1557-1575).
            // EVE's composite declares neither option and ignores both; Frontier's
            // falls back to its default path without them, which with no ACES
            // values set rendered every pixel black.
            ...Tw2PostProcessRenderer.TonemappingOptions(postProcess, tonemapping)
        }, true);

        const p = effect.parameters;

        // Exposure (`Tonemapping::ApplyDynamicExposure`, cpp:350-366). With no
        // dynamic exposure the composite still applies ExposureAdjust, so this
        // degrades to fixed exposure rather than to none.
        const exposureAdjustment = postProcess ? postProcess.exposureAdjustment : 0;
        if (dynamicExposure)
        {
            this.SetParameter(p, "ExposureMiddleValue", dynamicExposure.middleValue);
            this.SetParameter(p, "ExposureInfluence", dynamicExposure.influence);
            this.SetParameter(p, "MinExposure", dynamicExposure.minExposure);
            this.SetParameter(p, "MaxExposure", dynamicExposure.maxExposure);
            this.SetParameter(p, "ExposureAdjust", Math.pow(2, exposureAdjustment + dynamicExposure.adjustment));
        }
        else
        {
            this.SetParameter(p, "ExposureAdjust", Math.pow(2, exposureAdjustment));
        }
        this.SetParameter(p, "OutputGamma", 1);

        // No bloom chain yet: brightness 0 leaves BlitCurrent contributing
        // nothing, and Carbon binds a black grime texture even with no bloom
        // effect, so the grime term is always live.
        this.SetParameter(p, "BloomBrightness", 0);
        this.SetParameter(p, "GrimeWeight", 0);

        // Fade has no option - absence is intensity 0. See the class note.
        this.SetParameter(p, "FadeColor", fade ? fade.color : [ 0, 0, 0 ]);
        this.SetParameter(p, "FadeAmount", fade ? fade.intensity : 0);

        if (colorCorrection)
        {
            this.SetParameter(p, "WhiteTemperature", colorCorrection.whiteTemperature);
            this.SetParameter(p, "WhiteTint", colorCorrection.whiteTint);
            this.SetParameter(p, "ColorSaturation", colorCorrection.colorSaturation);
            this.SetParameter(p, "ColorContrast", colorCorrection.colorContrast);
            this.SetParameter(p, "ColorGamma", colorCorrection.colorGamma);
            this.SetParameter(p, "ColorGain", colorCorrection.colorGain);
            this.SetParameter(p, "ColorOffset", colorCorrection.colorOffset);
        }

        if (desaturate)
        {
            this.SetParameter(p, "SaturationFactor", desaturate.intensity);
        }

        // The tone curve. EVE ships Uncharted2 and its compiled composite carries
        // no ACES path at all, so `tonemapping.method` cannot be honoured here -
        // ACES and AgX belong to Frontier. The curve parameters apply regardless
        // of which method the data asks for.
        this.SetParameter(p, "ShoulderStrength", tonemapping ? tonemapping.shoulderStrength : 0.125);
        this.SetParameter(p, "LinearStrength", tonemapping ? tonemapping.linearStrength : 0.25);
        this.SetParameter(p, "LinearAngle", tonemapping ? tonemapping.linearAngle : 0.1);
        this.SetParameter(p, "ToeStrength", tonemapping ? tonemapping.toeStrength : 0.15);
        this.SetParameter(p, "ToeNumerator", tonemapping ? tonemapping.toeNumerator : 0.021);
        this.SetParameter(p, "ToeDenominator", tonemapping ? tonemapping.toeDenominator : 0.3);
        this.SetParameter(p, "WhiteScale", tonemapping ? tonemapping.whiteScale : 2.5);

        // ACES values, only for the ACES path - AgX takes none
        // (`ApplyAgxTonemappingMethod`). The matrices are 3x3 constants of 11
        // floats; Bind clamps the 16-float value to the slot, which is what
        // Carbon's Matrix upload into a float3x3 does.
        if (tonemapping && tonemapping.method === Tr2PPTonemappingEffect.Method.ACES)
        {
            this.SetParameter(p, "AcesSlope", tonemapping.slope);
            this.SetParameter(p, "AcesToe", tonemapping.toe);
            this.SetParameter(p, "AcesShoulder", tonemapping.shoulder);
            this.SetParameter(p, "AcesBlackClip", tonemapping.blackClip);
            this.SetParameter(p, "AcesWhiteClip", tonemapping.whiteClip);
            const { input, output } = Tw2PostProcessRenderer.AcesMatrices(tonemapping.blueCorrection, tonemapping.scale);
            this.SetParameter(p, "AcesInputMat", input);
            this.SetParameter(p, "AcesOutputMat", output);
        }

        // Debug wipes that select between hardcoded and parameter-driven curve
        // constants. Off means "use the parameters above everywhere".
        this.SetParameter(p, "SplitScreenRatio", 0);
        this.SetParameter(p, "AutoSwipe", [ 0, 0 ]);

        if (vignette)
        {
            this.SetParameter(p, "VignetteIntensity", [ vignette.intensity, vignette.opacity ]);
            this.SetParameter(p, "VignetteColor", vignette.color);
            this.SetParameter(p, "VignetteDetailSize", [
                vignette.detail1Size[0], vignette.detail1Size[1],
                vignette.detail2Size[0], vignette.detail2Size[1]
            ]);
            this.SetParameter(p, "VignetteDetailScroll", [
                vignette.detail1Scroll[0], vignette.detail1Scroll[1],
                vignette.detail2Scroll[0], vignette.detail2Scroll[1]
            ]);
            this.SetParameter(p, "VignetteSineFrequency", vignette.sineFrequency);
            this.SetParameter(p, "VignetteSineRange", [ vignette.sineMinimum, vignette.sineMaximum ]);
            effect.SetTextures({
                VignetteShape: vignette.shapePath,
                VignetteDetail: vignette.detailPath
            });
        }

        // Four LUT slots regardless of how many exist; an unfilled slot must read
        // influence 0 or the composite divides by a total it did not accumulate.
        for (let i = 0; i < 4; i++)
        {
            this.SetParameter(p, `LUTInfluence_${i}`, i < luts.length ? luts[i].influence : 0);
            if (i < luts.length) effect.SetTextures({ [`TexLUT_${i}`]: luts[i].path });
        }

        // The single rebind, after the values are in place, and only when the
        // permutation actually changed - it re-resolves the shader, so running
        // it every frame would too.
        //
        // AutoPopulate(false), not PopulateParameters(): the cleaning variant
        // prunes parameters the permutation does not declare, which would drop
        // BlitOriginal's attachment to the scene render target. Create and keep
        // is what this needs.
        if (optionsChanged || !this._populated)
        {
            effect.AutoPopulate(false);
            this._populated = true;
        }
    }

    /**
     * Sets a parameter by name, creating it if the effect declares it
     *
     * Parameters MUST be addressed by name. The constant layout is
     * permutation-specific - the compiler compacts out what a permutation does
     * not use, so OutputGamma sits at byte 176 in the all-enabled body and byte
     * 72 in a minimal one. A cached offset is wrong the moment an option changes.
     *
     * @param {Object} parameters
     * @param {String} name
     * @param {Number|Array} value
     */
    SetParameter(parameters, name, value)
    {
        if (parameters[name])
        {
            parameters[name].SetValue(value);
            return;
        }

        // Should not happen: everything the composite sets is in
        // DEFAULT_PARAMETERS so that it exists before the first bind. Creating
        // one here needs an explicit BindParameters, because OnValueChanged
        // only rebinds when the effect resource changed - without it the
        // parameter holds the value and the shader keeps its own default.
        this._effect.SetParameters({ [name]: value });
        this._effect.BindParameters();
    }

    /**
     * Renders the composite
     *
     * @param {Tw2RenderTarget} sceneTarget - the HDR scene, becomes BlitOriginal
     * @param {Tw2PostProcess2|null} postProcess
     * @returns {Boolean} true if the composite drew
     */
    Render(sceneTarget, postProcess)
    {
        const effect = this.EnsureEffect();
        if (!effect.IsGood() || !sceneTarget || !sceneTarget.IsGood()) return false;

        // Carbon measures after DoF and TAA, on the image the tonemap is about
        // to read (cpp:726-745); that is this scene target. Carbon's quality
        // gate is MEDIUM (`dynamicExposureQualityRequirement`, cpp:26).
        let dynamicExposure = postProcess ? postProcess.GetIfAvailable("dynamicExposure") : null;
        if (dynamicExposure && device.shaderModel === "lo") dynamicExposure = null;
        if (dynamicExposure)
        {
            Tw2CarbonResourceBinder.Get(device).SetNamedBufferTextureSource("Exposure",
                (gl, format) => this._exposure.GetExposureTexture(gl, format));
            if (!this._exposure.Render(dynamicExposure, sceneTarget)) dynamicExposure = null;
        }

        this.Apply(postProcess, dynamicExposure);

        const { gl } = tw2;

        // BlitOriginal is the scene, which is a live render target rather than a
        // resource path, so it is attached rather than set.
        // Created unconditionally rather than gated on shader.HasTexture: an
        // unused parameter is harmless, whereas failing to create it binds no
        // scene at all and the composite tone maps black - which looks like a
        // broken shader rather than a missing binding.
        if (!effect.parameters.BlitOriginal)
        {
            effect.parameters.BlitOriginal = new Tw2TextureParameter("BlitOriginal");
            effect.BindParameters();
        }

        effect.parameters.BlitOriginal.AttachTextureRes(sceneTarget.texture);

        gl.disable(gl.DEPTH_TEST);
        const drew = device.RenderFullScreenQuad(effect);
        gl.enable(gl.DEPTH_TEST);

        return drew;
    }


    /**
     * The tone curve options Carbon sets for a post process
     *
     * `Tonemapping::Apply*TonemappingMethod` (`Tr2PostProcessRenderer.cpp:431-508`):
     * AgX and Uncharted2 set the method alone, ACES also sets its sweetener
     * toggle, and a post process with no tone mapping disables it. With no post
     * process at all Carbon sets nothing, so neither does this.
     *
     * @param {Tw2PostProcess2|null} postProcess
     * @param {Tr2PPTonemappingEffect|null} tonemapping
     * @returns {Object} options to merge
     */
    static TonemappingOptions(postProcess, tonemapping)
    {
        const { Method } = Tr2PPTonemappingEffect;
        if (!postProcess) return {};
        if (!tonemapping) return { TONE_MAPPING_METHOD: "TONE_MAPPING_DISABLED" };

        switch (tonemapping.method)
        {
            case Method.ACES:
                return {
                    TONE_MAPPING_METHOD: "TONE_MAPPING_ACES",
                    SWEETENER_TOGGLE: TOGGLE("SWEETENER", tonemapping.useSweeteners)
                };

            case Method.AGX:
                return { TONE_MAPPING_METHOD: "TONE_MAPPING_AGX" };

            default:
                return { TONE_MAPPING_METHOD: "TONE_MAPPING_UNCHARTED2" };
        }
    }

    /**
     * Carbon's ACES input and output matrices, as uploaded
     *
     * A literal port of `ApplyAcesTonemappingMethod`
     * (`Tr2PostProcessRenderer.cpp:441-484`), in Carbon's own row-major Matrix
     * memory and operand order - these are uploaded, not composed with anything
     * of ours. Carbon credits the fitted matrices to MJP's BakingLab ACES.hlsl
     * and the blue correction to the ACES Central forum thread it cites.
     *
     * @param {Number} blueCorrection - 0..1 lerp toward the blue-corrected matrix
     * @param {Number} scale
     * @returns {{input: Float32Array, output: Float32Array}}
     */
    static AcesMatrices(blueCorrection, scale)
    {
        const mul = (a, b) =>
        {
            const r = new Float32Array(16);
            for (let i = 0; i < 4; i++)
                for (let j = 0; j < 4; j++)
                    for (let k = 0; k < 4; k++) r[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
            return r;
        };
        const transpose = m =>
        {
            const r = new Float32Array(16);
            for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[j * 4 + i] = m[i * 4 + j];
            return r;
        };
        // Rows lerped from identity toward `target`'s rows, then transposed.
        const correction = target =>
        {
            const m = new Float32Array(16);
            for (let row = 0; row < 3; row++)
                for (let col = 0; col < 3; col++)
                {
                    const identity = row === col ? 1 : 0;
                    m[row * 4 + col] = identity + (target[row * 4 + col] - identity) * blueCorrection;
                }
            m[15] = 1;
            return transpose(m);
        };

        const acesInput = transpose(ACES_INPUT_MAT);
        const acesOutput = transpose(ACES_OUTPUT_MAT);
        const blue = correction(ACES_BLUE_CORRECT);
        const blueInv = correction(ACES_BLUE_CORRECT_INV);
        const scaling = new Float32Array([ scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, 1 ]);

        return {
            input: transpose(mul(mul(acesInput, blue), scaling)),
            output: transpose(mul(blueInv, acesOutput))
        };
    }

}
