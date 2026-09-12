import { EveChildModifier } from "./EveChildModifier";
import { meta } from "utils";
import { mat4, vec3 } from "math";
import { device } from "global";
import { rotateIntoBasis } from "./EveChildModifierTransformCommon";

let scratch = null;

export function modifyHalo(worldTransform, parentTransform, rotation, translation, scaling, isSimpleHalo)
{

    if (!scratch)
    {
        scratch = {
            dir : vec3.create(),
            parentScaling : vec3.create(),
            camFwd : vec3.create(),
            right: vec3.create(),
            up : vec3.create(),
            forward : vec3.create(),
            dirToCamNorm : vec3.create(),
            alignMat : mat4.create(),
            rotationT : mat4.create()
        };
    }

    const {
        dir,
        parentScaling,
        camFwd,
        right,
        up,
        forward,
        dirToCamNorm,
        alignMat,
        rotationT
    } = scratch;
    
    mat4.getScaling(parentScaling, parentTransform);
    if (vec3.equals(parentScaling, [ 0,0,0 ]))
    {
        mat4.set(worldTransform, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1);
        return;
    }

    // 3 4 3 3 3 4 3 3
    mat4.translate(worldTransform, parentTransform, translation);

    device.GetEyePosition(dir);
    dir[0] -= worldTransform[12];
    dir[1] -= worldTransform[13];
    dir[2] -= worldTransform[14];

    // Rotate the camera direction into the parent's basis (pure 3x3, no w-divide;
    // see rotateIntoBasis in EveChildModifierTransformCommon.js).
    rotateIntoBasis(camFwd, dir, parentTransform);
    vec3.divide(camFwd, camFwd, parentScaling);
    vec3.normalize(camFwd, camFwd);

    vec3.set(right, device.view[0], device.view[4], device.view[8]);
    rotateIntoBasis(right, right, parentTransform);
    vec3.normalize(right, right);

    vec3.cross(up, camFwd, right);
    vec3.normalize(up, up);
    vec3.cross(right, up, camFwd);

    mat4.identity(alignMat);
    alignMat[0] = right[0];
    alignMat[1] = right[1];
    alignMat[2] = right[2];
    alignMat[4] = up[0];
    alignMat[5] = up[1];
    alignMat[6] = up[2];
    alignMat[8] = camFwd[0];
    alignMat[9] = camFwd[1];
    alignMat[10] = camFwd[2];
    alignMat[15] = 1;

    mat4.fromQuat(rotationT, rotation);
    mat4.multiply(alignMat, alignMat, rotationT);

    if (isSimpleHalo)
    {
        vec3.normalize(forward, worldTransform.subarray(8));
        vec3.normalize(dirToCamNorm, dir);
        let scale = -vec3.dot(dirToCamNorm, forward);
        if (scale < 0) scale = 0;
        mat4.multiply(worldTransform, worldTransform, alignMat);
        mat4.scale(worldTransform, worldTransform, [ scaling[0] * scale, scaling[1] * scale, scaling[2] * scale ]);
    }
    else
    {
        mat4.scale(worldTransform, worldTransform, scaling);
        mat4.multiply(worldTransform, worldTransform, alignMat);
    }
}

@meta.define("EveChildModifierHalo", true)
export class EveChildModifierHalo extends EveChildModifier
{

    _applyScale = vec3.create();
    _applyDirection = vec3.create();
    _applyForward = vec3.create();

    /** Carbon ApplyTransform: camera-facing basis with squared facing falloff. */
    ApplyTransform(transform, out = mat4.create())
    {
        mat4.getScaling(this._applyScale, transform);
        vec3.set(this._applyDirection, device.eyePosition[0] - transform[12], device.eyePosition[1] - transform[13], device.eyePosition[2] - transform[14]);
        vec3.normalize(this._applyDirection, this._applyDirection);
        vec3.set(this._applyForward, transform[8], transform[9], transform[10]);
        vec3.normalize(this._applyForward, this._applyForward);
        const facing = Math.max(0, vec3.dot(this._applyDirection, this._applyForward));
        vec3.scale(this._applyScale, this._applyScale, facing * facing);
        mat4.copy(out, transform);
        for (let column = 0; column < 3; column++)
        {
            for (let row = 0; row < 3; row++) out[column * 4 + row] = device.viewInverse[column * 4 + row] * this._applyScale[column];
        }
        return out;
    }

    /**
     * Modifies a parent object
     * @param parent
     * @param perObjectData
     */
    Modify(parent, perObjectData, parentTransform)
    {

        if (parent._hasBone)
        {
            mat4.multiply(parent._worldTransform, parent._boneTransform, parent.localTransform);
            mat4.multiply(parent._worldTransform, parentTransform, parent._worldTransform);
        }
        else
        {
            mat4.multiply(parent._worldTransform, parentTransform, parent.localTransform);
        }

        modifyHalo(
            parent._worldTransform,
            parentTransform,
            parent.rotation,
            parent.translation,
            parent.scaling,
            true
        );

        return true;
    }
    
}
