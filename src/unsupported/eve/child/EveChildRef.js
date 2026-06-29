import { meta } from "utils";
import { mat4, quat, vec3 } from "math";


@meta.notImplemented
@meta.type("EveChildRef")
@meta.define({
    wgl: "EveChildRef",
    ccp: true
})
export class EveChildRef
{
    @meta.string
    name = "";

    @meta.path
    resPath = "";

    @meta.boolean
    display = true;

    @meta.struct()
    child = null;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.matrix4
    localTransform = mat4.create();

    @meta.matrix4
    worldTransform = mat4.create();

    @meta.boolean
    useSRT = true;

    @meta.boolean
    staticTransform = false;

    @meta.boolean
    loadChildAutomatically = true;

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
