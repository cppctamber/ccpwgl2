import { meta } from "utils";
import { mat3, mat4, quat, vec3 } from "math";


@meta.type("Tw2GeometryBone")
export class Tw2GeometryBone
{

    @meta.string
    name = "";

    @meta.uint
    parentIndex = -1;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    orientation = quat.create();

    @meta.matrix4
    scaleShear = mat3.create();

    @meta.matrix4
    localTransform = mat4.create();

    @meta.matrix4
    worldTransform = mat4.create();

    @meta.matrix4
    worldTransformInv = mat4.create();


    /**
     * Updates the Bone's transform
     * @returns {mat4}
     */
    UpdateTransform()
    {
        mat4.fromMat3(this.localTransform, this.scaleShear);
        quat.normalize(this.orientation, this.orientation);
        let rm = mat4.fromQuat(Tw2GeometryBone.global.mat4_0, this.orientation);
        mat4.multiply(this.localTransform, this.localTransform, rm);
        this.localTransform[12] = this.position[0];
        this.localTransform[13] = this.position[1];
        this.localTransform[14] = this.position[2];
        return this.localTransform;
    }

    /**
     * Global and scratch variables
     */
    static global = {
        mat4_0: mat4.create()
    };

}

