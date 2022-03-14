import { meta } from "utils";
import { mat3, mat4, quat, vec3, box3 } from "math";


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

    @meta.float32Array
    @meta.isPrivate
    // reference
    boundingBox = null;


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
     * Gets box bounds
     * @param {box3} out
     * @param {Boolean} [force]
     * @return {box3} out
     */
    GetBoundingBox(out, force)
    {
        if (force) this.UpdateTransform();
        if (!this.boundingBox) return box3.empty(out);
        return box3.transformMat4(out, this.boundingBox, this.localTransform);
    }

    /**
     * Gets box bounds
     * @param {box3} out
     * @param {Boolean} [force]
     * @return {box3} out
     */
    GetWorldBoundingBoxInverse(out, force)
    {
        if (force) this.UpdateTransform();
        if (!this.boundingBox) return box3.empty(out);
        return box3.transformMat4(out, this.boundingBox, this.worldTransformInv);
    }

    /**
     * Gets box bounds
     * @param {box3} out
     * @param {Boolean} [force]
     * @return {box3} out
     */
    GetWorldBoundingBox(out, force)
    {
        if (force) this.UpdateTransform();
        if (!this.boundingBox) return box3.empty(out);
        return box3.transformMat4(out, this.boundingBox, this.worldTransform);
    }

    /**
     * Global and scratch variables
     */
    static global = {
        mat4_0: mat4.create()
    };

}

