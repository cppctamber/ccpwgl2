import { vec3, quat, vec4, mat4 } from "math";
import { meta } from "utils";
import { Tw2TextureParameter, Tw2Vector4Parameter, Tw2Transform, Tw2Effect } from "core";
import { GL_REPEAT } from "constant/gl";


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

    /**
     * Alias for translation
     * @returns {vec3}
     */
    @meta.vector3
    get position()
    {
        return this.translation;
    }

    /**
     * Alias for translation
     * @param {vec3} v
     */
    set position(v)
    {
        this.SetTranslation(v);
    }

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
        this.SetParentTransform(parentTransform).RebuildTransforms();
        const targets = this.display && visible ? this.targetMaterials : vec4.ZERO;
        perObjectData.ps.Set("CustomMaskTarget" + index, targets);
        perObjectData.ps.SetIndex("CustomMaskMaterialID" + index, 0, this.materialIndex);
        perObjectData.vs.SetIndex("CustomMaskData" + index, 1, this.isMirrored ? 1 : 0);
        perObjectData.vs.Set("CustomMaskMatrix" + index, this._worldInverseTranspose);
    }

    /**
     * Gets parameters as a flat object
     * @param {*} [out={}]
     * @return {{}} out
     */
    GetParameters(out = {})
    {
        return Tw2Effect.getParameterObject(this.parameters, out, false, true, true);
    }

    /**
     * Sets parameters from a flat object
     * @param {*} [values]
     * @param {Boolean} skipUpdate
     * @return {boolean}
     */
    SetParameters(values, skipUpdate)
    {
        const updated = Tw2Effect.setParameterObject(this.parameters, values, false, true, true);
        if (updated && !skipUpdate) this.UpdateValues();
        return updated;
    }

    /**
     * Serializes a custom mask
     * @param {EveCustomMask} a
     * @param {Object} [out={}]
     * @param {Object} [opt]
     * @return {Object} out
     */
    static get(a, out, opt)
    {
        out = super.get(a, out, opt);

        const { PatternMaskMap, PatternMaskMap: { overrides } } = a.parameters;
        out.resourcePath = PatternMaskMap.GetValue();
        out.addressUMode = overrides ? overrides.addressUMode : GL_REPEAT;
        out.addressVMode = overrides ? overrides.addressVMode : GL_REPEAT;

        out.parameters = a.GetParameters();
        return out;
    }

    /**
     * Deserializes a custom mask
     * @param {EveCustomMask} a
     * @param {Object} [values]
     * @param {Object} [opt]
     * @return {boolean}
     */
    static set(a, values, opt = {})
    {
        let { skipUpdate, ...options } = opt;

        let updated = super.set(a, values, { ...options, skipUpdate: true });

        if (values)
        {
            const { parameters, addressUMode, addressVMode, resourcePath } = values;

            if (a.parameters.PatternMaskMap.SetValue(resourcePath))
            {
                updated = true;
            }

            if (a.parameters.PatternMaskMap.SetOverrides({ addressUMode, addressVMode }))
            {
                updated = true;
            }

            if (parameters && a.SetParameters(parameters, true)) updated = true;
        }

        if (updated && !skipUpdate)
        {
            a.UpdateValues(opt);
        }

        return updated;
    }

    /**
     * Applies custom mask's parameters to an effect
     * @param {Tw2Effect} effect
     * @param {EveCustomMask} mask
     * @param index
     */
    static ApplyMaterials(effect, mask, index)
    {
        const
            prefix = index === 0 ? "PMtl1" : "PMtl2",
            patternName = index === 0 ? "PatternMask1Map" : "PatternMask2Map";

        const
            dst = effect.parameters,
            src = mask.parameters;

        function bind(source, destination)
        {
            if (source && destination)
            {
                destination.SetValue(source.GetValue());
                source.OnEvent("modified", () => destination.SetValue(source.GetValue()));

                if (source instanceof Tw2TextureParameter)
                {
                    destination.overrides = source.overrides;

                    source.OnEvent("overrides_modified", () =>
                    {
                        destination.overrides = source.overrides;
                    });
                }
            }
        }

        bind(src.DiffuseColor, dst[prefix + "DiffuseColor"]);
        bind(src.DustDiffuseColor, dst[prefix + "DustDiffuseColor"]);
        bind(src.FresnelColor, dst[prefix + "FresnelColor"]);
        bind(src.Gloss, dst[prefix + "Gloss"]);
        bind(src.PatternMaskMap, dst[patternName]);
    }

}
