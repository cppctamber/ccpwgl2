import { meta } from "utils";


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
@meta.type("Tw2PostProcess2", "Tr2PostProcess2")
@meta.define({
    wgl: "Tw2PostProcess2",
    ccp: "Tr2PostProcess2"
})
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
