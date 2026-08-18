import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { device } from "global";


@meta.type("EveCameraFxAttributes", true)
@meta.define({
    wgl: "EveCameraFxAttributes",
    ccp: true
})
export class EveCameraFxAttributes extends meta.Model
{

    @meta.string
    name = "";

    @meta.list()
    @meta.notImplemented
    fxAttributes = [];

    @meta.quaternion
    @meta.notImplemented
    cameraRotation = quat.create();

    @meta.quaternion
    @meta.notImplemented
    objectRotation = quat.create();

    @meta.quaternion
    @meta.notImplemented
    rotationWithChildTransform = quat.create();

    @meta.float
    @meta.notImplemented
    distanceToCamera = 0;

    @meta.float
    @meta.notImplemented
    lookAngleToObject = 0;

    /**
     * Drives the attributes from the camera and the object's transforms.
     *
     * Carbon `EveCameraFxAttributes::UpdateAsyncronous`
     * (`EveSpaceObject/Utils/fxAttributes/EveCameraFxAttributes.cpp:20`).
     *
     * TYPE NOTE: Carbon stores these three as `Vector3` - the THIRD COLUMN of a
     * matrix, `(_13, _23, _33)`, which is a forward direction and not a
     * rotation. ccpwgl declares them `quat` because that is how the field
     * persists. The direction is written into xyz and w is left alone, so the
     * stored value carries Carbon's meaning rather than a quaternion that was
     * never computed. Do not "fix" this by building a real quaternion; nothing
     * downstream is reading one.
     * @param {*} [updateContext]
     * @param {Object} [params]
     * @param {*} [params.spaceObjectParent] - the root space object
     * @param {*} [params.childParent] - the containing child, when nested
     * @param {mat4} [params.localToWorldTransform]
     */
    UpdateAsyncronous(updateContext, params)
    {
        if (!params) return;

        const
            g = EveCameraFxAttributes.global,
            position = g.vec3_0,
            parent = params.spaceObjectParent;

        vec3.set(position, 0, 0, 0);

        if (parent)
        {
            if (typeof parent.GetModelCenterWorldPosition === "function")
            {
                parent.GetModelCenterWorldPosition(position);
            }
            else if (parent._worldTransform)
            {
                vec3.set(position, parent._worldTransform[12], parent._worldTransform[13], parent._worldTransform[14]);
            }
        }

        // A nested child overrides the object position with its OWN, so an
        // attribute inside a container tracks that container rather than the
        // hull it hangs off.
        const childParent = params.childParent;
        if (childParent)
        {
            const child = typeof childParent.GetWorldTransform === "function"
                ? childParent.GetWorldTransform(g.mat4_0)
                : childParent._worldTransform;

            if (child)
            {
                vec3.set(this.rotationWithChildTransform, child[8], child[9], child[10]);
                vec3.set(position, child[12], child[13], child[14]);
            }
        }

        const
            view = device.view,
            toObject = vec3.subtract(g.vec3_1, position, device.eyePosition);

        this.distanceToCamera = vec3.length(toObject);

        // The view matrix's third ROW is the look-at; Carbon reads `_13,_23,_33`
        // off a row-vector matrix, which is this column set in gl-matrix layout.
        vec3.set(g.vec3_2, view[2], view[6], view[10]);
        this.lookAngleToObject = this.distanceToCamera === 0
            ? 0
            : -(vec3.dot(g.vec3_2, toObject) / this.distanceToCamera);

        if (params.localToWorldTransform)
        {
            const m = params.localToWorldTransform;
            vec3.set(this.objectRotation, m[8], m[9], m[10]);
        }

        vec3.set(this.cameraRotation, view[8], view[9], view[10]);
    }

    /**
     * Scratch
     * @type {Object}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        mat4_0: mat4.create()
    };


    /**
     * Per frame update
     *
     */
    @meta.notImplemented
    Update()
    {
        // Nothing yet
    }

}
