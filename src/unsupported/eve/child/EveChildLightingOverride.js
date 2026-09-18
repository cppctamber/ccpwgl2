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
@meta.notImplemented
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
