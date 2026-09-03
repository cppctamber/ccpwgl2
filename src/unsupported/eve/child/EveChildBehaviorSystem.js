import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.define("EveChildBehaviorSystem", true)
export class EveChildBehaviorSystem extends EveChild
{
    @meta.boolean
    display = true;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    translation = vec3.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.matrix4
    localTransform = mat4.create();

    @meta.matrix4
    worldTransform = mat4.create();

    @meta.uint
    instanceCount = 0;

    @meta.boolean
    useSRT = true;

    @meta.boolean
    staticTransform = false;

    @meta.list()
    behaviorGroups = [];

    @meta.list()
    splineTunnels = [];

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
