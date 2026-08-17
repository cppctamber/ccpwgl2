// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/IEveSpaceObjectChild.h
import { meta } from "utils";
import { mat4, vec3 } from "math";


/**
 * The parameter block a parent passes down when updating a space-object child:
 * the parent references, the parent's bone array, the child's world placement,
 * and the owner's motion and activation state. Rebuilt by the parent for each
 * child update, so nothing in it survives the call.
 */
@meta.type("EveChildUpdateParams")
@meta.ccp.define("EveChildUpdateParams")
export class EveChildUpdateParams extends meta.Model
{

    @meta.struct("IEveSpaceObject2")
    spaceObjectParent = null;

    @meta.struct("IEveSpaceObjectChild")
    childParent = null;

    @meta.uint
    boneCount = 0;

    @meta.struct("Float4x3")
    bones = null;

    @meta.float
    ownerMaxSpeed = 0;

    @meta.float
    activationStrength = 1;

    @meta.float
    controllerUpdateFrequency = 0.5;

    @meta.boolean
    isVisible = true;

    @meta.matrix4
    localToWorldTransform = mat4.create();

    @meta.vector3
    worldVelocity = vec3.create();

}
