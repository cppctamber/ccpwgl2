import { EveChildModifier } from "./EveChildModifier";
import { meta } from "utils";
import { mat4, vec3 } from "math";
import { device } from "global";

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
            parentT : mat4.create(),
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
        parentT,
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
    mat4.transpose(parentT, parentTransform);

    device.GetEyePosition(dir);
    dir[0] -= worldTransform[12];
    dir[1] -= worldTransform[13];
    dir[2] -= worldTransform[14];

    vec3.copy(camFwd, dir);
    vec3.transformMat4(camFwd, camFwd, parentT);
    vec3.divide(camFwd, camFwd, parentScaling);
    vec3.normalize(camFwd, camFwd);

    vec3.set(right, device.view[0], device.view[4], device.view[8]);
    vec3.transformMat4(right, right, parentT);
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

@meta.notImplemented
@meta.type("EveChildModifierHalo")
export class EveChildModifierHalo extends EveChildModifier
{

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
