import { vec3, quat, vec4, mat4 } from "math";
import { meta } from "utils";
import { Tw2TextureParameter, Tw2Vector4Parameter, Tw2Transform } from "core";


@meta.type("EveCustomMask")
@meta.stage(1)
export class EveCustomMask extends Tw2Transform
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    isMirrored = false;

    @meta.byte
    materialIndex = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector4
    targetMaterials = vec4.fromValues(1, 1, 1, 1);

    @meta.plain
    @meta.todo("Move to direct class properties")
    @meta.isPrivate
    parameters = {
        PatternMaskMap: new Tw2TextureParameter("PatternMaskMap", "res:/texture/global/black.dds.0.png"),
        DiffuseColor: new Tw2Vector4Parameter("DiffuseColor", [ 0, 0, 0, 1 ]),
        DustDiffuseColor: new Tw2Vector4Parameter("DustDiffuseColor", [ 0, 0, 0, 1 ]),
        FresnelColor: new Tw2Vector4Parameter("FresnelColor", [ 0, 0, 0, 1 ]),
        Gloss: new Tw2Vector4Parameter("Gloss", [ 0, 0, 0, 0 ])
    };

    _worldInverseTranspose = mat4.create();

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
     * Applies custom mask's parameters to an effect
     * TODO: Clean this up
     * @param {Tw2Effect} effect
     * @param {EveCustomMask} mask
     * @param index
     */
    static ApplyMaterials(effect, mask, index)
    {
        const
            prefix = index === 0 ? "PMtl1" : "PMtl2",
            patternName = index === 0 ? "PatternMask1Map" : "PatternMask2Map",
            DiffuseName = effect.parameters[prefix + "DiffuseColor"],
            DustDiffuseName = effect.parameters[prefix + "DustDiffuseColor"],
            FresnelName = effect.parameters[prefix + "FresnelColor"],
            GlossName = effect.parameters[prefix + "Gloss"],
            PatternTexture = effect.parameters[patternName];

        const { DiffuseColor, DustDiffuseColor, FresnelColor, Gloss, PatternMaskMap } = mask.parameters;

        if (DiffuseName)
        {
            DiffuseName.SetValue(DiffuseColor.GetValue());
            DiffuseColor.OnEvent("modified", () => DiffuseName.SetValue(DiffuseColor.GetValue()));
        }

        if (DustDiffuseName)
        {
            DustDiffuseName.SetValue(DustDiffuseColor.GetValue());
            DustDiffuseColor.OnEvent("modified", () => DustDiffuseName.SetValue(DustDiffuseName.GetValue()));
        }

        if (FresnelName)
        {
            FresnelName.SetValue(FresnelColor.GetValue());
            FresnelColor.OnEvent("modified", () => FresnelName.SetValue(FresnelColor.GetValue()));
        }

        if (GlossName)
        {
            GlossName.SetValue(Gloss.GetValue());
            Gloss.OnEvent("modified", () => GlossName.SetValue(Gloss.GetValue()));
        }

        if (PatternTexture)
        {
            const overrides = PatternMaskMap.GetOverrides();
            PatternTexture.SetOverrides(overrides);
            PatternTexture.SetValue(PatternMaskMap.GetValue());

            PatternMaskMap.OnEvent("modified", () =>
            {
                PatternTexture.SetOverrides(PatternMaskMap.GetOverrides());
                PatternTexture.SetValue(PatternMaskMap.resourcePath);
            });

        }
    }

}
