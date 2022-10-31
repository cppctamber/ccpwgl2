import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2PostProcess2")
export class Tr2PostProcess2 extends meta.Model
{

    @meta.struct("Tr2PPBloomEffect")
    bloom = null;

    @meta.struct("Tr2PPDepthOfField")
    depthOfField = null;

    @meta.struct("Tr2DesaturateEffect")
    desaturate = null;

    @meta.struct("Tr2PPDynamicExposureEffect")
    dynamicExposure = null;

    @meta.struct("Tr2PPFadeEffect")
    fade = null;

    @meta.struct("Tr2PPFidelityFXEffect")
    fidelityFX = null;

    @meta.struct("Tr2PPFilmGrainEffect")
    filmGrain = null;

    @meta.struct("Tr2PPFogEffect")
    fog = null;

    @meta.struct("Tr2PPGodRaysEffect")
    godRays = null;

    @meta.struct("Tr2PPLutEffect")
    lut = null;

    @meta.struct("Tr2PPSignalLossEffect")
    signalLoss = null;

    @meta.struct("Tr2PPVignetteEffect")
    vignette = null;

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {

    }

    /**
     * Per frame render
     * @param {Number} dt
     * @param {EveSpaceScene} scene
     */
    Render(dt, scene)
    {

    }

}
