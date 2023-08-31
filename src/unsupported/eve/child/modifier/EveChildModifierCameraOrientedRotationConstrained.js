import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { modifyHalo } from "unsupported";
import { vec3, quat, mat4 } from "math";
import { device } from "global";


@meta.notImplemented
@meta.type("EveChildModifierCameraOrientedRotationConstrained")
export class EveChildModifierCameraOrientedRotationConstrained extends EveChildModifier
{

    Modify(parent, perObjectData, parentTransform)
    {
        let { rotation, translation, scaling, localTransform, _worldTransform, _boneTransform } = parent;

        if (_boneTransform)
        {
            localTransform = mat4.multiply(mat4.create(), _boneTransform, localTransform);
            rotation = mat4.getRotation(quat.create(), localTransform);
            translation = mat4.getTranslation(vec3.create(), localTransform);
            scaling = mat4.getScaling(vec3.create(), localTransform);
        }

        quat.normalize(rotation, rotation);
        mat4.fromRotationTranslationScale(localTransform, rotation, translation, scaling);

        const
            d = device,
            parentScale = vec3.create(),
            dir = vec3.create(),
            camFwd = vec3.create(),
            right = vec3.create(),
            up = vec3.create(),
            parentT =  mat4.create(),
            alignMat = mat4.create(),
            rotationT = mat4.create();

        mat4.getScaling(parentScale, parentTransform);

        // 3 4 3 3 3 4 3 3
        mat4.translate(_worldTransform, parentTransform, translation);
        //mat4.transpose(parentT, parentTransform);

        d.GetEyePosition(dir);
        dir[0] -= _worldTransform[12];
        dir[1] -= _worldTransform[13];
        dir[2] -= _worldTransform[14];

        vec3.copy(camFwd, dir);
        vec3.transformMat4(camFwd, camFwd, parentT);
        vec3.divide(camFwd, camFwd, parentScale);
        vec3.normalize(camFwd, camFwd);

        vec3.set(right, d.view[0], d.view[4], d.view[8]);
        vec3.transformMat4(right, right, parentT);
        vec3.normalize(right, right);

        vec3.cross(up, camFwd, right);
        vec3.normalize(up, up);
        vec3.cross(right, up, camFwd);

        alignMat[0] = right[0];
        alignMat[1] = right[1];
        alignMat[2] = right[2];
        alignMat[4] = this.constructor.up !== null ? this.constructor.up[0] : up[0];
        alignMat[5] = this.constructor.up !== null ? this.constructor.up[1] : up[1];
        alignMat[6] = this.constructor.up !== null ? this.constructor.up[2] : up[2];
        alignMat[8] = camFwd[0];
        alignMat[9] = camFwd[1];
        alignMat[10] = camFwd[2];
        alignMat[15] = 1;

        mat4.fromQuat(rotationT, rotation);
        mat4.multiply(alignMat, alignMat, rotationT);
        mat4.scale(_worldTransform, _worldTransform, scaling);
        mat4.multiply(_worldTransform, _worldTransform, alignMat);

        return true;
    }

    static up = null;

    /**
     * Modifies a parent object
     * @param parent
     * @param perObjectData
     * @param parentTransform
     */
    Modify2(parent, perObjectData, parentTransform)
    {
        let { rotation, translation, scaling, localTransform, _worldTransform, _boneTransform } = parent;

        if (parent._hasBone)
        {
            localTransform = mat4.multiply(mat4.create(), _boneTransform, localTransform);
            rotation = mat4.getRotation(quat.create(), localTransform);
            translation = mat4.getTranslation(vec3.create(), localTransform);
            scaling = mat4.getScaling(vec3.create(), localTransform);
        }

        const
            d = device,
            parentScale = vec3.create(),
            dir = vec3.create(),
            camFwd = vec3.create(),
            right = vec3.create(),
            up = vec3.create(),
            parentT = mat4.create(),
            alignMat = mat4.create(),
            rotationT = mat4.create();

        mat4.getScaling(parentScale, parentTransform);

        // 3 4 3 3 3 4 3 3
        mat4.translate(_worldTransform, parentTransform, translation);
        mat4.transpose(parentT, parentTransform);

        d.GetEyePosition(dir);
        dir[0] -= _worldTransform[12];
        dir[1] -= _worldTransform[13];
        dir[2] -= _worldTransform[14];

        vec3.copy(camFwd, dir);
        vec3.transformMat4(camFwd, camFwd, parentT);
        vec3.divide(camFwd, camFwd, parentScale);
        vec3.normalize(camFwd, camFwd);

        vec3.set(right, d.view[0], d.view[4], d.view[8]);
        vec3.transformMat4(right, right, parentT);
        vec3.normalize(right, right);

        vec3.cross(up, camFwd, right);
        vec3.normalize(up, up);
        vec3.cross(right, up, camFwd);

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
        mat4.scale(_worldTransform, _worldTransform, scaling);
        mat4.multiply(_worldTransform, _worldTransform, alignMat);

        return true;
    }

}
