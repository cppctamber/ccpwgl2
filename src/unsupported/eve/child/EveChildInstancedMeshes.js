import { meta } from "utils";


@meta.notImplemented
@meta.define("EveChildInstancedMeshes", true)
export class EveChildInstancedMeshes
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
