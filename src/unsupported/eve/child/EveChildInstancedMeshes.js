import { meta } from "utils";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.define("EveChildInstancedMeshes", true)
export class EveChildInstancedMeshes extends EveChild
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

    GetSofSourceLocator()
    {
        return null;
    }

    GetMeshCount()
    {
        return 0;
    }

    GetMeshInfo()
    {
        return null;
    }

    GetAreaInfo()
    {
        return null;
    }

    GetMeshDisplay()
    {
        return false;
    }

    SetMeshDisplay()
    {

    }

    static __isEffectChild = true;
}
