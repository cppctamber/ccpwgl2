import { meta } from "utils";
import { vec3 } from "math";


@meta.notImplemented
@meta.type("EveChildPostProcessVolume")
@meta.define({
    wgl: "EveChildPostProcessVolume",
    ccp: true
})
export class EveChildPostProcessVolume
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

    get isEffectChild()
    {
        return true;
    }

    UpdateLod()
    {

    }

    ResetLod()
    {

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
