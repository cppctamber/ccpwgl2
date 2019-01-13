import {quat, vec3, vec4, mat4, Tw2BaseClass} from "../../global";

/**
 * EveCustomMask
 *
 * @property {Number} materialIndex -
 * @property {vec3} position        -
 * @property {quat} rotation        -
 * @property {vec3} scaling         -
 * @property {vec4} targetMaterials -
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
    transform = mat4.create();
    _index = -1;
    _maskMatrix = mat4.create();


    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
        mat4.invert(this._maskMatrix, this.transform);
        mat4.transpose(this._maskMatrix, this._maskMatrix);
    }

    /**
     * Per frame update
     * @param {Tw2PerObjectData} perObjectData
     * @param {Number} visible
     */
    Update(perObjectData, visible)
    {
        const targets = this.display && visible ? this.targetMaterials : [0, 0, 0, 0];
        perObjectData.vs.Set("CustomMaskMatrix" + this._index, this._maskMatrix);
        perObjectData.vs.Set("CustomMaskData" + this._index, [ 1, this.isMirrored ? 1 : 0, 0, 0]);
        perObjectData.ps.Set("CustomMaskMaterialID" + this._index, [this.materialIndex, 0, 0, 0]);
        perObjectData.ps.Set("CustomMaskTarget" + this._index, targets);
    }

}

Tw2BaseClass.define(EveCustomMask, Type =>
{
    return {
        type: "EveCustomMask",
        category: "EveObjectItem",
        isStaging: true,
        props: {
            display: Type.BOOLEAN,
            isMirrored: Type.BOOLEAN,
            materialIndex: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            targetMaterials: Type.VECTOR4,
            transform: Type.TR_LOCAL
        }
    };
});

