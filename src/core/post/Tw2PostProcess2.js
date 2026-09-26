import { meta } from "utils";
import { Tr2PPTonemappingEffect } from "./effect/Tr2PPTonemappingEffect";
import { Tr2PPDynamicExposureEffect } from "./effect/Tr2PPDynamicExposureEffect";


/**
 * Holds the post process effects a scene wants applied
 *
 * This is DATA ONLY, deliberately. Carbon splits `Tr2PostProcess2` (the slots)
 * from `Tr2PostProcessRenderer` (the targets, the effects, the pass sequence),
 * and that seam has to survive here: this class must stay hydratable from a
 * black file, which it would not be if it owned GL resources.
 *
 * An absent slot is meaningful — it switches a permutation off in the composite
 * rather than skipping a pass. The composite runs whether or not a scene has one
 * of these at all, so a null post process is a valid configuration and not a
 * reason to skip the pass.
 *
 * What shipped EVE data actually populates, measured across the 177
 * `Tr2PostProcess2` assets under `res:/dx9/postprocess/environmenttemplate/`:
 * bloom (158), godRays (147), fog (141), lut (137), desaturate (127),
 * dynamicExposure (100), depthOfField (21), filmGrain (19), colorCorrection (6),
 * signalLoss (2), tonemapping (2), vignette (1). `luts`, `fade` and Carbon's
 * `genericEffect` appear in none of them.
 *
 * So: the singular `lut` is the live path and the four-LUT `luts` list is not
 * used by EVE content, and `colorCorrection` — despite appearing only six times
 * — is where the faction home environments carry their look.
 *
 * @ccp Tr2PostProcess2
 */
@meta.define("Tw2PostProcess2", "Tr2PostProcess2")
export class Tw2PostProcess2 extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.struct("Tr2PPBloomEffect")
    bloom = null;

    @meta.struct("Tr2PPColorCorrectionEffect")
    colorCorrection = null;

    @meta.struct("Tr2PPDepthOfFieldEffect")
    depthOfField = null;

    @meta.struct("Tr2PPDesaturateEffect")
    desaturate = null;

    @meta.struct("Tr2PPDynamicExposureEffect")
    dynamicExposure = null;

    @meta.struct("Tr2PPFadeEffect")
    fade = null;

    @meta.struct("Tr2PPFilmGrainEffect")
    filmGrain = null;

    @meta.struct("Tr2PPFogEffect")
    fog = null;

    @meta.struct("Tr2PPGenericEffect")
    genericEffect = null;

    @meta.struct("Tr2PPGodRaysEffect")
    godRays = null;

    @meta.struct("Tr2PPLutEffect")
    lut = null;

    @meta.list("Tr2PPLutEffect")
    luts = [];

    @meta.struct("Tr2PPSignalLossEffect")
    signalLoss = null;

    @meta.struct("Tr2PPTaaEffect")
    taa = null;

    @meta.struct("Tr2PPTonemappingEffect")
    tonemapping = null;

    @meta.struct("Tr2PPVignetteEffect")
    vignette = null;

    @meta.float
    exposureAdjustment = 0;

    /** Slots filled by InjectClientDefaults rather than by the loaded data. */
    _injected = new Set();

    /**
     * Fills the slots the EVE client supplies itself
     *
     * Carbon takes tonemapping and dynamic exposure only from the scene's
     * default post process (`EveSpaceScene.cpp:391-397`), and the client builds
     * that object: of the shipped environment templates only one carries a
     * tonemapping effect and many carry no dynamic exposure.
     *
     * Only the dynamic exposure changes EVE's image. EVE's compiled composite
     * has no TONE_MAPPING_METHOD axis - its Uncharted2 curve is baked in and
     * runs with or without a tonemapping effect - so the injected tonemapping
     * matters only to composites that have the axis (Frontier). An earlier
     * measurement credited it with removing clipping; that was a first-load
     * transient in the measurement, not the curve.
     *
     * ccpwgl-only (not Carbon): the client's values are not available, so an
     * absent slot gets a Carbon-default effect. Present slots are never touched,
     * and the injected ones stay ordinary effects that can be tuned or nulled.
     *
     * @param {Object} [options]
     * @param {Boolean} [options.tonemapping=true]
     * @param {Boolean} [options.dynamicExposure=true]
     * @returns {Array<String>} the slots injected by this call
     */
    InjectClientDefaults({ tonemapping = true, dynamicExposure = true } = {})
    {
        const injected = [];

        if (tonemapping && !this.tonemapping && !this._injected.has("tonemapping"))
        {
            // Uncharted2, not the class default ACES: EVE's compiled composite
            // carries only the Uncharted2 curve (see Tr2PPTonemappingEffect).
            this.tonemapping = new Tr2PPTonemappingEffect();
            this.tonemapping.method = Tr2PPTonemappingEffect.Method.UNCHARTED2;
            this._injected.add("tonemapping");
            injected.push("tonemapping");
        }

        if (dynamicExposure && !this.dynamicExposure && !this._injected.has("dynamicExposure"))
        {
            this.dynamicExposure = new Tr2PPDynamicExposureEffect();
            this._injected.add("dynamicExposure");
            injected.push("dynamicExposure");
        }

        return injected;
    }

    /**
     * Identifies whether a slot was filled by InjectClientDefaults
     * @param {String} slot
     * @returns {Boolean}
     */
    IsInjected(slot)
    {
        return this._injected.has(slot);
    }

    /**
     * Gets an effect if it is present and active
     *
     * Carbon's `Get…IfAvailable` accessors take a quality tier and return null
     * below it. No tier is modelled here yet, so this is the presence-and-active
     * gate only — adding the tier later must not change what an absent effect
     * means, which is "switch the permutation off".
     *
     * @param {String} slot
     * @returns {Tr2PPEffect|null}
     */
    GetIfAvailable(slot)
    {
        const effect = this[slot];
        if (!effect) return null;
        if (typeof effect.IsActive === "function" && !effect.IsActive()) return null;
        return effect;
    }

    /**
     * Gets the active luts, in slot order, singular slot first
     *
     * Shipped EVE data only ever uses the singular `lut`, but the composite
     * takes four, so both feed one ordered list rather than the caller choosing.
     *
     * @param {Array} [out=[]]
     * @returns {Array<Tr2PPLutEffect>}
     */
    GetAvailableLuts(out = [])
    {
        const single = this.GetIfAvailable("lut");
        if (single) out.push(single);

        for (let i = 0; i < this.luts.length; i++)
        {
            const lut = this.luts[i];
            if (lut && (typeof lut.IsActive !== "function" || lut.IsActive())) out.push(lut);
        }

        return out;
    }

}
