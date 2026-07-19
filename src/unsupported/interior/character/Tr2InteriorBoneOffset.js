import { meta } from "utils";
import { mat4, quat, vec3 } from "math";


@meta.type("Tr2InteriorBoneOffset")
@meta.ccp.define("GrannyBoneOffset")
export class Tr2InteriorBoneOffset extends meta.Model
{

    @meta.plain
    transforms = {};

    _dirty = true;
    _bindingsByModel = new WeakMap();

    /**
     * Sets or replaces an additional local translation for a bone
     * @param {String} bone
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    SetOffset(bone, x = 0, y = 0, z = 0)
    {
        const transform = this.GetTransform(bone);
        if (!transform) return;

        transform.offset[0] = x;
        transform.offset[1] = y;
        transform.offset[2] = z;
        this.ClearRigBindings();
    }

    /**
     * Sets or replaces an additional local rotation for a bone
     * @param {String} bone
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} w
     */
    SetRotation(bone, x = 0, y = 0, z = 0, w = 1)
    {
        const transform = this.GetTransform(bone);
        if (!transform) return;

        transform.rotation[0] = x;
        transform.rotation[1] = y;
        transform.rotation[2] = z;
        transform.rotation[3] = w;
        quat.normalize(transform.rotation, transform.rotation);
        transform.hasRotation = true;
        this.ClearRigBindings();
    }

    /**
     * Clears all offsets and rotations
     */
    ClearTransforms()
    {
        this.transforms = {};
        this.ClearRigBindings();
    }

    /**
     * Clears rig bindings
     */
    ClearRigBindings()
    {
        this._bindingsByModel = new WeakMap();
        this._dirty = true;
    }

    /**
     * Checks if there are any authored transforms
     * @returns {Boolean}
     */
    HaveTransforms()
    {
        return Object.keys(this.transforms).length > 0;
    }

    /**
     * Gets or creates a bone transform
     * @param {String} bone
     * @returns {?Object}
     */
    GetTransform(bone)
    {
        if (!bone) return null;

        if (!this.transforms[bone])
        {
            this.transforms[bone] = {
                offset: vec3.create(),
                rotation: quat.create(),
                hasRotation: false
            };
        }

        return this.transforms[bone];
    }

    /**
     * Binds transforms to a model's bones by name
     * @param {Tw2Model} model
     * @returns {Array}
     */
    BindToModel(model)
    {
        const bones = model && model.bones;
        if (!bones || !this.HaveTransforms())
        {
            this._dirty = false;
            return null;
        }

        const bindings = new Array(bones.length);
        for (let i = 0; i < bones.length; i++)
        {
            const name = bones[i].boneRes && bones[i].boneRes.name;
            bindings[i] = name ? this.transforms[name] || null : null;
        }

        this._bindingsByModel.set(model, bindings);
        this._dirty = false;
        return bindings;
    }

    /**
     * Applies the bound transform to a bone's local matrix
     * @param {Tw2Bone} bone
     * @param {Number} index
     * @param {Tw2Model} model
     * @returns {Boolean}
     */
    ApplyToBone(bone, index, model)
    {
        if (!this.HaveTransforms()) return false;

        const existing = this._bindingsByModel.get(model);
        const bindings = this._dirty || !existing
            ? this.BindToModel(model)
            : existing;

        const transform = bindings && bindings[index];
        if (!transform) return false;

        const local = bone.localTransform;
        if (transform.hasRotation)
        {
            // Apply the authored offset in the bone's local space. Post-
            // multiplication preserves the existing joint translation;
            // premultiplication would orbit it around the parent origin.
            mat4.multiply(local, local, Tr2InteriorBoneOffset.global.rotationMatrix(transform.rotation));
        }

        local[12] += transform.offset[0];
        local[13] += transform.offset[1];
        local[14] += transform.offset[2];

        return true;
    }

    static global = {
        mat4_0: mat4.create(),
        rotationMatrix(rotation)
        {
            return mat4.fromQuat(this.mat4_0, rotation);
        }
    };

}
