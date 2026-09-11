import { meta } from "utils";
import { mat3, mat4, quat, vec3, box3 } from "math";


@meta.define("Tw2GeometryBone")
export class Tw2GeometryBone
{

    @meta.string
    name = "";

    @meta.int32
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

    @meta.plain
    @meta.isPrivate
    // Raw granny ExtendedData (named per-bone data, e.g. { TrackMaskStance: 1 } track-mask weights)
    extendedData = null;


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
     * @return {box3|null} `out` when it holds usable bounds, otherwise null
     */
    GetBoundingBox(out, force)
    {
        if (force) this.UpdateTransform();

        // Null, not an empty box. An empty box is a truthy object, so
        // `if (bone.GetBoundingBox(out))` - the shape the rest of the bounds
        // family is written for - took the success branch on a bone that has
        // no bounds at all and unioned a zero-extent box at the origin into
        // the caller's accumulation. `out` is still emptied so it is in a
        // defined state either way, matching WglTransform.js:94.
        if (!this.boundingBox)
        {
            box3.empty(out);
            return null;
        }

        return box3.transformMat4(out, this.boundingBox, this.localTransform);
    }

    /**
     * Gets box bounds
     * @param {box3} out
     * @param {Boolean} [force]
     * @return {box3|null} `out` when it holds usable bounds, otherwise null
     */
    GetWorldBoundingBoxInverse(out, force)
    {
        if (force) this.UpdateTransform();

        // Null, not an empty box. An empty box is a truthy object, so
        // `if (bone.GetWorldBoundingBoxInverse(out))` - the shape the rest of the bounds
        // family is written for - took the success branch on a bone that has
        // no bounds at all and unioned a zero-extent box at the origin into
        // the caller's accumulation. `out` is still emptied so it is in a
        // defined state either way, matching WglTransform.js:94.
        if (!this.boundingBox)
        {
            box3.empty(out);
            return null;
        }

        return box3.transformMat4(out, this.boundingBox, this.worldTransformInv);
    }

    /**
     * Gets box bounds
     * @param {box3} out
     * @param {Boolean} [force]
     * @return {box3|null} `out` when it holds usable bounds, otherwise null
     */
    GetWorldBoundingBox(out, force)
    {
        if (force) this.UpdateTransform();

        // Null, not an empty box. An empty box is a truthy object, so
        // `if (bone.GetWorldBoundingBox(out))` - the shape the rest of the bounds
        // family is written for - took the success branch on a bone that has
        // no bounds at all and unioned a zero-extent box at the origin into
        // the caller's accumulation. `out` is still emptied so it is in a
        // defined state either way, matching WglTransform.js:94.
        if (!this.boundingBox)
        {
            box3.empty(out);
            return null;
        }

        return box3.transformMat4(out, this.boundingBox, this.worldTransform);
    }

    /**
     * Global and scratch variables
     */
    static global = {
        mat4_0: mat4.create()
    };

}

