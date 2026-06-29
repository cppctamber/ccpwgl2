import { meta } from "utils";


@meta.notImplemented
@meta.type("EveChildLightingOverride")
@meta.define({
    wgl: "EveChildLightingOverride",
    ccp: true
})
export class EveChildLightingOverride
{
    @meta.string
    name = "";

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
