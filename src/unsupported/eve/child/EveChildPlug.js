import { meta } from "utils";


@meta.notImplemented
@meta.type("EveChildPlug")
@meta.define({
    wgl: "EveChildPlug",
    ccp: true
})
export class EveChildPlug
{
    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.list()
    objects = [];

    @meta.list()
    externalParameters = [];

    @meta.list("Tr2Controller")
    controllers = [];

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

    SetControllerVariable()
    {

    }

    HandleControllerEvent()
    {

    }

    StartControllers()
    {

    }

    static __isEffectChild = true;
}
