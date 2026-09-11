// Source: trinity/Eve/SpaceObject/Children/EveChildLink.cpp and EveChildLink_Blue.cpp
import { meta } from "utils";
import { mat4, quat, vec3, sph3 } from "math";
import { EveChildMesh } from "eve/child/EveChildMesh";
import { GLESPerObjectDataEveSpaceObject } from "core/data";
import { device } from "global/tw2";
import { EveChildUpdateParams } from "../../../eve/EveChildUpdateParams";


@meta.define("EveChildLink", true)
export class EveChildLink extends EveChildMesh
{
    @meta.list("Tw2ValueBinding")
    linkStrengthBindings = [];

    @meta.list("Tw2Curve")
    linkStrengthCurves = [];

    @meta.struct()
    target = null;

    @meta.vector3
    currentDirection = vec3.fromValues(0, 0, 1);

    @meta.float
    currentDistance = 0;

    @meta.float
    linkStrength = 0;

    @meta.float
    linkBarrier = 1;

    @meta.float
    targetRadius = 0.5;

    _linkWorldTransform = mat4.create();

    /** Carbon's link bounds use the parent transform, not the shader's arc matrix. */
    PrepareLod(parentTransform)
    {
        if (parentTransform) mat4.copy(this._worldTransform, parentTransform);
    }

    /** Tether links deliberately bypass mesh screen-size culling in Carbon. */
    UpdateLod(updateContext, parentLodLevel, parentTransform)
    {
        this.lodLevel = parentLodLevel;
        this.PrepareLod(parentTransform);
        this.currentScreenSize = -1;
        this._isVisible = this.display && !!this.mesh;
    }

    /** Updates targeting, then strength bindings, then the shader's two transforms. */
    Update(dt, params = EveChildUpdateParams.DEFAULT)
    {
        const
            parentTransform = params.localToWorldTransform,
            parentSpaceObject = params.spaceObjectParent;

        const { targetPosition, sourcePosition, inverseParent, arcRotation, rotation, up } = EveChildLink.global;
        this.UpdateAnimation(dt);

        if (this.target && parentSpaceObject)
        {
            this.target.GetValueAt(device.currentTime, targetPosition);

            // Not every parent that hosts children is an EveShip2 - EveEffectRoot2
            // passes itself as the space object too, and does not carry Carbon's
            // model-centre accessor. Fall back the same way the other callers of
            // it do rather than assuming it is there.
            if (typeof parentSpaceObject.GetModelCenterWorldPosition === "function")
            {
                parentSpaceObject.GetModelCenterWorldPosition(sourcePosition);
            }
            else if (parentSpaceObject.boundingSphereCenter && parentTransform)
            {
                vec3.transformMat4(sourcePosition, parentSpaceObject.boundingSphereCenter, parentTransform);
            }
            else if (parentTransform)
            {
                vec3.set(sourcePosition, parentTransform[12], parentTransform[13], parentTransform[14]);
            }
            else
            {
                vec3.set(sourcePosition, 0, 0, 0);
            }

            vec3.subtract(this.currentDirection, targetPosition, sourcePosition);
            this.currentDistance = vec3.length(this.currentDirection);
            vec3.normalize(this.currentDirection, this.currentDirection);
        }

        // Carbon evaluates bindings with the previous strength, before recalculating it.
        for (const curve of this.linkStrengthCurves) curve.UpdateValue(this.linkStrength);
        for (const binding of this.linkStrengthBindings) binding.CopyValue();
        if (!parentTransform) return;

        mat4.copy(this._worldTransform, parentTransform);
        if (this.currentDistance <= this.targetRadius)
        {
            this.linkStrength = 1;
        }
        else
        {
            const distance = Math.abs(this.linkBarrier - this.targetRadius);
            this.linkStrength = Math.max(0, Math.min(1, 1 - (this.currentDistance - this.targetRadius) / distance));
        }

        quat.rotationTo(rotation, up, this.currentDirection);
        mat4.fromQuat(arcRotation, rotation);
        mat4.copy(inverseParent, parentTransform);
        inverseParent[12] = inverseParent[13] = inverseParent[14] = 0;
        mat4.invert(inverseParent, inverseParent);
        // Carbon row-vector arc * inverseParent: reverse operands for gl-matrix.
        mat4.multiply(this._worldTransformLast, inverseParent, arcRotation);
        vec3.scale(sourcePosition, this.currentDirection, this.currentDistance);
        this._worldTransformLast[12] = sourcePosition[0];
        this._worldTransformLast[13] = sourcePosition[1];
        this._worldTransformLast[14] = sourcePosition[2];

        mat4.copy(this._linkWorldTransform, parentTransform);

        // Only direct space-object children receive the shield-ellipsoid offset.
        //
        // "Direct" is `childParent === null`, which is how Carbon asks the same
        // question (`if( !params.childParent )` - EveChildContainer.cpp:592):
        // every level below the root sets `childParent` to itself before
        // handing the block down. This used to compare the transform BY
        // REFERENCE against the space object's own matrix, which happened to
        // work only while the parent transform was passed down as a shared
        // reference. Carbon holds `localToWorldTransform` as a Matrix VALUE, so
        // no reference survives the hand-off and the identity test could never
        // have been what Carbon meant.
        if (parentSpaceObject && !params.childParent && parentSpaceObject._ellipsoidCenter)
        {
            // Carbon Translation(center) * parent: local offset first.
            mat4.translate(this._linkWorldTransform, parentTransform, parentSpaceObject._ellipsoidCenter);
        }
        this._hasUpdated = true;
        this._isVisible = this.display && !!this.mesh;
    }

    /** Inherit the hull constants intact; WorldMatLast carries arc data, not motion history. */
    GetPerObjectDataBagOfStuff(perObjectData, out = {})
    {
        GLESPerObjectDataEveSpaceObject.Unpack(perObjectData, out);
        out.source = this;
        out.parentPerObjectData = perObjectData;
        out.perObjectData = this._perObjectData;
        out.legacyPerObjectData = this._perObjectData;
        out.worldTransform = this._linkWorldTransform;
        out.worldTransformLast = this._worldTransformLast;
        out.inverseWorldTransform = null;
        out.inverseWorldTransformTranspose = null;
        return out;
    }

    /** Gets Carbon's sphere spanning the link. */
    GetBoundingSphere(out)
    {
        const half = this.currentDistance * 0.5;
        out[0] = this.currentDirection[0] * half;
        out[1] = this.currentDirection[1] * half;
        out[2] = this.currentDirection[2] * half;
        out[3] = half;
        return sph3.transformMat4(out, out, this._worldTransform);
    }

    GetLocalToWorldTransform(out)
    {
        return mat4.copy(out, this._worldTransform);
    }

    static global = {
        targetPosition: vec3.create(),
        sourcePosition: vec3.create(),
        inverseParent: mat4.create(),
        arcRotation: mat4.create(),
        rotation: quat.create(),
        up: vec3.fromValues(0, 1, 0)
    };
}
