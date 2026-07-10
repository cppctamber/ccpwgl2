import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { device } from "global";


/**
 * EveChildModifierTranslateWithCamera
 *
 * Source: carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/
 * EveChildModifierTranslateWithCamera.h/.cpp; persisted properties from
 * EveChildModifierTranslateWithCamera_Blue.cpp's ExposeToBlue() (1 property:
 * "attachedToCamera").
 */
@meta.notImplemented
@meta.type("EveChildModifierTranslateWithCamera")
@meta.define({
    wgl: "EveChildModifierTranslateWithCamera",
    ccp: true
})
export class EveChildModifierTranslateWithCamera extends EveChildModifier
{

    @meta.boolean
    attachedToCamera = false;

    /**
     * Applies this modifier's transform, mutating `transform` in place
     *
     * Reproduces `EveChildModifierTranslateWithCamera::ApplyTransform`
     * (EveChildModifierTranslateWithCamera.cpp:16-27): when `attachedToCamera`
     * the child's translation is replaced by the camera's world position
     * (ignoring the parent's position entirely); otherwise the camera's
     * position is added on top of the existing translation.
     * @param {mat4} transform
     * @returns {mat4}
     */
    ApplyTransform(transform)
    {
        const eye = device.eyePosition;

        if (this.attachedToCamera)
        {
            transform[12] = eye[0];
            transform[13] = eye[1];
            transform[14] = eye[2];
        }
        else
        {
            transform[12] += eye[0];
            transform[13] += eye[1];
            transform[14] += eye[2];
        }

        return transform;
    }

}
