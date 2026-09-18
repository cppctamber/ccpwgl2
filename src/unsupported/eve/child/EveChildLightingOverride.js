import { meta } from "utils";
import { vec4 } from "math";
import { EveChild } from "eve/child";


/**
 * A volume that overrides the scene's lighting where it applies.
 *
 * Source: trinity/trinity/Eve/SpaceObject/Children/EveChildLightingOverride.h,
 * properties from its `_Blue.cpp` exposure.
 *
 * DECLARED SO THE BLACK FILE READS, AND NOTHING MORE. The reader refuses a
 * property it has no declaration for, so a scene carrying one of these could
 * not be opened at all. Nothing below is wired to the renderer yet.
 *
 * Worth knowing what it carries, because it is where a scene's sun lives:
 * Carbon's `IEveLightingOverride::Overrides` is `sunColor`, `sunIntensity`,
 * `backgroundIntensity` and `reflectionIntensity`, blended between overlapping
 * volumes by `priority` and `intensity` the way post-process volumes are. A
 * scene whose own object states none of those may be stating them here instead.
 */
@meta.define("EveChildLightingOverride", true)
export class EveChildLightingOverride extends EveChild
{
    @meta.string
    name = "";

    /**
     * Blend band against other overrides. `MEDIUM_PRIORITY` in the donor's
     * `OverrideInfo`, which is the same enum the post-process volumes use.
     */
    @meta.uint
    priority = 2;

    /** Weight of this override within its band. Donor default is 1, not 0. */
    @meta.float
    intensity = 1;

    @meta.color
    sunColor = vec4.fromValues(0, 0, 0, 0);

    /** Scales `sunColor`. */
    @meta.float
    sunIntensity = 0;

    @meta.float
    backgroundIntensity = 0;

    @meta.float
    reflectionIntensity = 0;

    /** The volumes this override applies within. */
    @meta.list()
    volumes = [];

    /**
     * This override's contribution, in the shape the scene blends.
     *
     * Source: `IEveLightingOverride::GetOverrides`, and the intensity rule from
     * `EveChildLightingOverride::UpdateAsyncronous` (.cpp:107-110) - with no
     * volumes the override always applies at full intensity.
     *
     * @returns {Object} { priority, intensity, sunColor, sunIntensity,
     *   backgroundIntensity, reflectionIntensity }
     */
    GetOverrides()
    {
        return {
            priority: this.priority,
            intensity: this.intensity,
            sunColor: this.sunColor,
            sunIntensity: this.sunIntensity,
            backgroundIntensity: this.backgroundIntensity,
            reflectionIntensity: this.reflectionIntensity
        };
    }

    /**
     * Adds this override to a collection, when it applies.
     *
     * Carbon gates a VOLUMED override on the camera being inside one of its
     * volumes and derives a falloff from how far in it is; outside, the
     * intensity is 0 and the override contributes nothing
     * (`EveChildLightingOverride.cpp:101-121`).
     *
     * DIVERGENCE: ccpwgl has no `IEveVolume`, so the camera test cannot be
     * performed and a volumed override is skipped rather than guessed at. That
     * matches Carbon for a camera OUTSIDE the volume and understates it for a
     * camera inside. Frontier's `scenesettings.black` override carries no
     * volumes, so nothing shipped is affected today.
     *
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetLightingOverrides(out = [])
    {
        if (this.volumes.length) return out;

        out.push(this.GetOverrides());
        return out;
    }

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
