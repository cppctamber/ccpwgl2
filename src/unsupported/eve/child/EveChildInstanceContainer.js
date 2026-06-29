import { meta } from "utils";
import { vec3,  mat4 } from "math";


@meta.notImplemented
@meta.type("EveChildInstanceContainer")
@meta.define({
    wgl: "EveChildInstanceContainer",
    ccp: true
})
export class EveChildInstanceContainer
{

    @meta.struct()
    source = null;

    @meta.vector3
    scaling = vec3.fromValues(1,1,1);

    @meta.boolean
    useStaticRotation = false;

    //@meta.matrix4
    //localTransform = mat4.create()

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
