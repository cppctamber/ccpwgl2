import { meta } from "utils";
import { tw2, device } from "global";
import { Tw2Effect } from "../mesh/Tw2Effect";
import { Tw2TextureParameter } from "../parameter";


const EFFECT_PATH = "res:/graphics/effect/managed/space/postprocess/tonemapping.fx";

const TOGGLE = (name, on) => on ? `${name}_ENABLED` : `${name}_DISABLED`;


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
 * One is deliberately NOT reproduced: dynamic exposure. Carbon builds, merges
 * and measures a luminance histogram in compute shaders, and WebGL2 has no
 * compute stage. The option is forced off, which is a configuration Carbon
 * supports, and the composite degrades to fixed exposure rather than to none.
 */
@meta.type("Tw2PostProcessRenderer")
export class Tw2PostProcessRenderer
{

    _effect = null;

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
     */
    Apply(postProcess)
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

        // SetOption, never `effect.options = {...}`. Assigning the object sets
        // the values and leaves the effect on its PREVIOUS permutation, because
        // only Rebind re-runs GetShader(options) - and `options` reports the new
        // values the whole time, so nothing looks wrong. Getting this wrong
        // leaves the default all-enabled body running, which samples an Exposure
        // buffer texture nothing has bound and multiplies the image by zero.
        effect.SetOption({
            COLOR_CORRECTION_TOGGLE: TOGGLE("COLOR_CORRECTION", !!colorCorrection),
            DESATURATE_TOGGLE: TOGGLE("DESATURATE", !!desaturate),
            VIGNETTE_TOGGLE: TOGGLE("VIGNETTE", !!vignette),
            LUT_TOGGLE: TOGGLE("LUT", luts.length > 0),
            // Compute-only in Carbon; see the class note.
            DYNAMIC_EXPOSURE_TOGGLE: TOGGLE("DYNAMIC_EXPOSURE", false)
        });

        const p = effect.parameters;

        // Exposure. With no dynamic exposure the composite still applies
        // ExposureAdjust, so this degrades to fixed exposure rather than to none.
        this.SetParameter(p, "ExposureAdjust", Math.pow(2, postProcess ? postProcess.exposureAdjustment : 0));
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

        this.Apply(postProcess);

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

}
