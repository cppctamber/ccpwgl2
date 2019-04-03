import {quat, vec3, vec4, mat4, Tw2BaseClass} from "../../global";

/**
 * Custom mask for patterns
 * @ccp EveCustomMask
 *
 * @property {Boolean} display      - Toggles mask visibility
 * @property {Boolean} isMirrored   - Identifies if the mask is mirrored
 * @property {Number} materialIndex - The material this mask is for (ie. Mtl1, Mtl2, Mtl3, Mtl4, PMt1, PMt2)
 * @property {vec3} position        - Mask's position
 * @property {quat} rotation        - Mask's rotation
 * @property {vec3} scaling         - Mask's scale
 * @property {vec4} targetMaterials - The target materials this mask is for
 * @property {mat4} localTransform  - Mask's localTransform
 */
export class EveCustomMask extends Tw2BaseClass
{

    // ccp
    materialIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    targetMaterials = vec4.create();

    //ccpwgl
    display = true;
    isMirrored = false;
    localTransform = mat4.create();

    _dirty = true;
    _index = -1;
    _parentTransformLast = mat4.create();
    _maskMatrix = mat4.create();

    /**
     * Initializes the mask
     */
    Initialize()
    {
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.position, this.scaling);
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.position, this.scaling);
        this._dirty = true;
    }

    /**
     * Updates the parent's per object data
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} perObjectData
     * @param {Boolean} visible
     */
    UpdatePerObjectData(parentTransform, perObjectData, visible)
    {
        // TODO: Find a better way to tell if the parent has been updated
        if (this._dirty || !mat4.equals(this._parentTransformLast, parentTransform))
        {
            mat4.copy(this._parentTransformLast, parentTransform);
            mat4.multiply(this._maskMatrix, parentTransform, this.localTransform);
            mat4.invert(this._maskMatrix, this._maskMatrix);
            mat4.transpose(this._maskMatrix, this._maskMatrix);
            this._dirty = false;
        }

        const targets = this.display && visible ? this.targetMaterials : [0, 0, 0, 0];
        perObjectData.vs.Set("CustomMaskMatrix" + this._index, this._maskMatrix);
        perObjectData.vs.Set("CustomMaskData" + this._index, [1, this.isMirrored ? 1 : 0, 0, 0]);
        perObjectData.ps.Set("CustomMaskMaterialID" + this._index, [this.materialIndex, 0, 0, 0]);
        perObjectData.ps.Set("CustomMaskTarget" + this._index, targets);
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["materialIndex", r.byte],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
            ["targetMaterials", r.vector4],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 1;

}