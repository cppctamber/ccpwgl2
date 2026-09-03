import { meta } from "utils";
import { vec3 } from "math";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.define("EveChildPostProcessVolume", true)
export class EveChildPostProcessVolume extends EveChild
{
    @meta.string
    name = "";

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list()
    volumes = [];

    @meta.list()
    exclusionVolumes = [];

    @meta.struct()
    postProcessAttributes = null;

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
