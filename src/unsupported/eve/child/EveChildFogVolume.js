import { meta } from "utils";
import { vec3 } from "math";


@meta.notImplemented
@meta.type("EveChildFogVolume")
@meta.define({
    wgl: "EveChildFogVolume",
    ccp: true
})
export class EveChildFogVolume
{
    @meta.string
    name = "";

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list()
    volumes = [];

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
