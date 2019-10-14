import { vec4, mat4, tw2 } from "../../global";
import { Tw2TextureParameter, Tw2TransformParameter, Tw2Vector4Parameter } from "../../core/parameter";


/**
 * Custom mask for patterns
 * @ccp EveCustomMask
 *
 * @property {Boolean} display             - Toggles mask visibility
 * @property {Boolean} isMirrored          - Identifies if the mask is mirrored
 * @property {Number} materialIndex        - The material this mask is for (ie. Mtl1, Mtl2, Mtl3, Mtl4, PMt1, PMt2)
 * @property {Object} parameters           - Mask parameters
 * @property {vec4} targetMaterials        - The target materials this mask is for
 * @property {mat4} _worldInverseTranspose - The custom mask's final matrix
 */
export class EveCustomMask extends Tw2TransformParameter
{
    // ccp
    materialIndex = 0;
    targetMaterials = vec4.create();

    //ccpwgl
    display = true;
    isMirrored = false;
    parameters = {
        PatternMaskMap: new Tw2TextureParameter("PatternMaskMap"),
        DiffuseColor: new Tw2Vector4Parameter("DiffuseColor"),
        FresnelColor: new Tw2Vector4Parameter("FresnelColor"),
        Gloss: new Tw2Vector4Parameter("Gloss")
    };

    _worldInverseTranspose = mat4.create();

    /**
     * Sets a sof material by name
     * @param {String} name
     * @returns {Promise<void>}
     */
    async SetMaterial(name)
    {
        const material = await tw2.eveSof.FetchMaterial(name);
        const { DiffuseColor, FresnelColor, Gloss } = material.parameters;
        this.parameters.DiffuseColor.SetValue(DiffuseColor);
        this.parameters.FresnelColor.SetValue(FresnelColor);
        this.parameters.Gloss.SetValue(Gloss);
    }

    /**
     * Updates the parent's per object data
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} perObjectData
     * @param {Number} index
     * @param {Boolean} visible
     */
    UpdatePerObjectData(parentTransform, perObjectData, index, visible)
    {
        this.SetParentTransform(parentTransform);
        const targets = this.display && visible ? this.targetMaterials : vec4.ZERO;
        perObjectData.ps.Set("CustomMaskTarget" + index, targets);
        perObjectData.ps.SetIndex("CustomMaskMaterialID" + index, 0, this.materialIndex);
        perObjectData.vs.SetIndex("CustomMaskData" + index, 1, this.isMirrored ? 1 : 0);
        perObjectData.vs.Set("CustomMaskMatrix" + index, this._worldInverseTranspose);
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "materialIndex", r.byte ],
            [ "position", r.vector3 ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "targetMaterials", r.vector4 ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 1;

}
