import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { vec3, vec4, quat, mat4 } from "math";
import { device } from "global";



@meta.notImplemented
@meta.type("EveChildModifierCameraOrientedRotationConstrained")
export class EveChildModifierCameraOrientedRotationConstrained extends EveChildModifier
{

    static createRotationMatrix(out, q)
    {
        const
            normal = vec3.normalize(vec3.alloc(), q),
            sinAngle = Math.sin(q[3]),
            cosAngle = Math.cos(q[3]);

        out[0] = (1 - cosAngle) * normal[0] * normal[0] + cosAngle;
        out[4] = (1 - cosAngle) * normal[0] * normal[1] - sinAngle * normal[2];
        out[8] = (1 - cosAngle) * normal[0] * normal[2] + sinAngle * normal[1];
        out[12] = 0;

        out[1] = (1 - cosAngle) * normal[1] * normal[0] + sinAngle * normal[2];
        out[5] = (1 - cosAngle) * normal[1] * normal[1] + cosAngle;
        out[9] = (1 - cosAngle) * normal[1] * normal[2] - sinAngle * normal[0];
        out[13] = 0;

        out[2] = (1 - cosAngle) * normal[2] * normal[0] - sinAngle * normal[1];
        out[6] = (1 - cosAngle) * normal[2] * normal[1] + sinAngle * normal[0];
        out[10] = (1 - cosAngle) * normal[2] * normal[2] + cosAngle;
        out[14] = 0;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        vec3.unalloc(normal);
        return out;
    }

    static getViewPosition(device, out)
    {
        return device.GetEyePosition(out);
    }


    ApplyTransform(transform)
    {

        const
            vec3_0 = vec3.alloc(),
            vec4_0 = vec4.alloc(),
            translation = vec3.alloc(),
            rotation = quat.alloc(),
            rotationMatrix = mat4.alloc();

        mat4.decompose(transform, rotation, translation, vec3_0);
        this.constructor.createRotationMatrix(rotationMatrix, rotation);

        this.constructor.getViewPosition(device, vec3_0);
        vec4_0[0] = vec3_0[0] - translation[0];
        vec4_0[1] = vec3_0[1] - translation[1];
        vec4_0[2] = vec3_0[2] - translation[2];
        vec4_0[3] = 0;
        vec4.transformMat4(vec4_0, vec4_0, rotationMatrix);

        vec4_0[3] = Math.atan2(vec4_0[0], vec4_0[2]);
        vec4_0[0] = 0;
        vec4_0[1] = 1;
        vec4_0[2] = 0;
        this.constructor.createRotationMatrix(rotationMatrix, vec4_0);

        mat4.multiply(transform, rotationMatrix, transform);

        vec3.unalloc(vec3_0);
        vec3.unalloc(translation);
        quat.unalloc(rotation);
        vec4.unalloc(vec4_0);
        mat4.unalloc(rotationMatrix);

        return transform;
    }

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
