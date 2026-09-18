import { meta } from "utils";
import { vec3, vec4 } from "math";
import { EveChild } from "eve/child";


/**
 * A volume of froxel fog.
 *
 * Source: trinity/trinity/Eve/SpaceObject/Children/EveChildFogVolume.h,
 * properties from its `_Blue.cpp` exposure, where each
 * `VOLUME_ATTRIBUTE_DEFINE` expands to a `<name>` and a `<name>Enabled` pair.
 *
 * DECLARED SO THE BLACK FILE READS, AND NOTHING MORE. Nothing here is wired to
 * the renderer; the reader simply refuses a property it cannot name.
 *
 * Defaults are the donor's, not zeroes - `thickness` 1, `lightDirectionality`
 * 0.5, `environmentIntensity` 1, `environmentDirectionality` 0.75, the noise
 * frequencies 15. A fog volume read with zeroes everywhere would not be
 * neutral, it would be a different fog.
 */
@meta.notImplemented
@meta.define("EveChildFogVolume", true)
export class EveChildFogVolume extends EveChild
{
    @meta.string
    name = "";

    /** Blend band against other fog volumes. */
    @meta.uint
    priority = 2;

    /** Weight within the band. Donor default is 1. */
    @meta.float
    intensity = 1;

    @meta.boolean
    thicknessEnabled = false;

    @meta.float
    thickness = 1;

    @meta.boolean
    lightDirectionalityEnabled = false;

    @meta.float
    lightDirectionality = 0.5;

    @meta.boolean
    environmentIntensityEnabled = false;

    @meta.float
    environmentIntensity = 1;

    @meta.boolean
    environmentDirectionalityEnabled = false;

    @meta.float
    environmentDirectionality = 0.75;

    @meta.boolean
    fogColorEnabled = false;

    @meta.color
    fogColor = vec4.fromValues(1, 1, 1, 1);

    @meta.boolean
    backgroundVisibilityEnabled = false;

    @meta.float
    backgroundVisibility = 0;

    @meta.boolean
    godRayNoiseIntensityEnabled = false;

    @meta.float
    godRayNoiseIntensity = 0;

    @meta.boolean
    godRayNoiseFrequencyEnabled = false;

    @meta.float
    godRayNoiseFrequency = 15;

    @meta.boolean
    godRayNoiseAnimationSpeedEnabled = false;

    @meta.float
    godRayNoiseAnimationSpeed = 0;

    @meta.boolean
    fogNoiseIntensityEnabled = false;

    @meta.float
    fogNoiseIntensity = 0;

    @meta.boolean
    fogNoiseFrequencyEnabled = false;

    @meta.float
    fogNoiseFrequency = 15;

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list()
    volumes = [];

    Update()
    {

    }

    GetResources(out = [])
    {
        return out;
    }

    GetBatches()
    {
        return false;
    }

    static __isEffectChild = true;
}
