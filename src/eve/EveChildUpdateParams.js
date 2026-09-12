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
@meta.define("EveChildUpdateParams", true)
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

    /**
     * NOT a Carbon field. Carbon's children build their own per-object buffers
     * (`EveChildContainer::DoUpdateAsyncronous` fills `m_vsData`/`m_psData`
     * itself); ccpwgl instead threads the parent's `Tw2PerObjectData` down so a
     * child can read `JointMat` and `activationStrength` off it. That threading
     * predates this struct and rode in the third positional argument, which is
     * exactly how it went wrong - see `EveChild.GetJointMatrices`.
     * @type {?Tw2PerObjectData}
     */
    perObjectData = null;

    /**
     * Carbon derives a child's parameters by copying its own and overwriting a
     * few fields (`EveChildUpdateParams newParams = params;` -
     * EveChildContainer.cpp:499). A copy per child per frame is free in C++ and
     * is not here, so parents keep one instance and refill it. Nothing in a
     * params block may be retained past the call it was passed to.
     *
     * `localToWorldTransform` and `worldVelocity` are copied BY VALUE so a
     * child cannot write through to its parent's matrix; every other field is a
     * reference or a primitive, as in Carbon.
     *
     * @param {EveChildUpdateParams} from
     * @returns {EveChildUpdateParams} this
     */
    CopyFrom(from)
    {
        this.spaceObjectParent = from.spaceObjectParent;
        this.childParent = from.childParent;
        this.boneCount = from.boneCount;
        this.bones = from.bones;
        this.ownerMaxSpeed = from.ownerMaxSpeed;
        this.activationStrength = from.activationStrength;
        this.controllerUpdateFrequency = from.controllerUpdateFrequency;
        this.isVisible = from.isVisible;
        this.perObjectData = from.perObjectData;
        mat4.copy(this.localToWorldTransform, from.localToWorldTransform);
        vec3.copy(this.worldVelocity, from.worldVelocity);
        return this;
    }

    /**
     * The block a child gets when its caller supplies none: Carbon's
     * default-constructed struct, identity transform included
     * (IEveSpaceObjectChild.h:20-32).
     *
     * Read only. It is shared by every child and nothing may write through it.
     * A parent that needs to change a field must own its own instance.
     * @type {EveChildUpdateParams}
     */
    static get DEFAULT()
    {
        // Decorators finish installing field initializers after the class body.
        return this._defaultParams || (this._defaultParams = new this());
    }

}
