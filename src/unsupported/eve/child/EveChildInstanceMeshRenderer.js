import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { skippedObject } from "core/reader/Tw2BlackPropertyReaders";


/**
 * Still a stub as a RENDERER - `Update` and `GetBatches` do nothing - but no
 * longer base-less.
 *
 * The placeholders in this folder omit `meta.Model` because nothing walks a
 * class that will never be reached. This one IS reached:
 * `EveSmartLightMesh` extends it and is a real implementation, and without a
 * Model base `Model.Traverse` cannot see it or ANYTHING below it - its mesh,
 * its areas, their effects, their textures. Every graph-walking pass in the
 * engine and every console probe silently returns nothing for the beams, which
 * reads as "the beams do not exist" rather than "the walk cannot reach them".
 */
@meta.notImplemented
@meta.type("EveChildInstanceMeshRenderer", true)
@meta.define({
    wgl: "EveChildInstanceMeshRenderer",
    ccp: true
})
export class EveChildInstanceMeshRenderer extends meta.Model
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
