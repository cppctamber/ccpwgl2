import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { skippedObject } from "core/reader/Tw2BlackPropertyReaders";


@meta.notImplemented
@meta.type("EveChildInstanceMeshRenderer", true)
@meta.define({
    wgl: "EveChildInstanceMeshRenderer",
    ccp: true
})
export class EveChildInstanceMeshRenderer
{
    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    castShadow = false;

    @meta.list()
    lights = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.uint
    lowestLodVisible = 2;

    @meta.struct([ "Tw2Mesh", "Tw2InstancedMesh" ])
    mesh = null;

    @meta.float
    minScreenSize = 0;

    @meta.uint
    reflectionType = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    sortValueOffset = 0;

    @meta.boolean
    staticTransform = false;

    @meta.list("EveChildModifier")
    transformModifiers = [];

    @meta.vector3
    translation = vec3.create();

    @meta.boolean
    updateAnimation = true;

    @meta.boolean
    useSRT = true;

    @meta.boolean
    useSpaceObjectData = true;

    @meta.uint
    reflectionMode = 3;

    @meta.unknown
    distribution = null;

    @meta.uint
    rotationConstraint = 0;

    @meta.vector3
    staticOffsetTranslation = vec3.create();

    @meta.quaternion
    staticOffsetRotation = quat.create();

    @meta.vector3
    staticOffsetScale = vec3.fromValues(1, 1, 1);

    static blackReaders = {
        distribution: skippedObject
    };

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
