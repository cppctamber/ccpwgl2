import { meta } from "utils";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.define("EveChildLightingOverride", true)
export class EveChildLightingOverride extends EveChild
{
    @meta.string
    name = "";

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
