import { vec3, quat, vec4, mat4 } from "math";
import { meta } from "utils";
import { Tw2TextureParameter, Tw2Vector4Parameter, WglTransform, Tw2Effect } from "core";
import { CustomMaskBlendMode } from "constant/ccpwgl";
import { EveCurveLineSet } from "eve/item/EveCurveLineSet";


const VALID_BLEND_MODES = new Set(Object.values(CustomMaskBlendMode));


@meta.type("EveCustomMask")
@meta.define({
    wgl: "EveCustomMask",
    ccp: true
})
@meta.stage(1)
export class EveCustomMask extends WglTransform
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    isMirrored = false;

    // CUSTOM
    @meta.boolean
    customMasksSwapped = false;

    @meta.string
    blendMode = "overlay";

    @meta.uint
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
        PatternMaskMap: new Tw2TextureParameter("PatternMaskMap", "res:/texture/global/black.dds"),
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
    _customMaskData = vec4.create();
    _customMaskMaterialID = vec4.create();
    _customMaskBlending = vec4.create();
    _perObjectDataBagOfStuff = {};

    /**
     * Gets per object data source values as a bag of stuff
     * @param {mat4} parentTransform
     * @param {Object} [out={}]
     * @param {Number} index
     * @param {Boolean} visible
     * @returns {Object}
     */
    GetPerObjectDataBagOfStuff(parentTransform, out = {}, index, visible)
    {
        this.SetParentTransform(parentTransform).RebuildTransforms();
        const targets = this.display && visible ? this.targetMaterials : vec4.ZERO;

        let clampToBorderU = 0,
            clampToBorderV = 0,
            clampToBorderW = 0;

        // Carbon's customMaskClamps: one vec4 for both masks, two lanes each
        // (EveCustomMask.cpp:80-81), read by translated shaders at cb4[26] to
        // lerp UV toward clamp(uv,0,1). Distinct from the border flags below —
        // same source enum, different value:
        //
        //   projectionType -> address mode 3 (CLAMP_TO_EDGE)   -> Carbon clampU
        //   projectionType -> address mode 4 (CLAMP_TO_BORDER) -> the shader
        //                                                        emulation
        //
        // Same rule runtime-sof uses (EveSOF.js:1130, `=== 3`), so both engines
        // derive it identically from EVE's authored projectionTypeU/V.
        const clamps = out.customMaskClamps || (out.customMaskClamps = vec4.create());
        clamps[index * 2] = 0;
        clamps[index * 2 + 1] = 0;

        if (this.parameters && this.parameters.PatternMaskMap && this.parameters.PatternMaskMap.overrides)
        {
            const { addressUMode, addressVMode, addressWMode } = this.parameters.PatternMaskMap.overrides;
            if (addressUMode === 4) clampToBorderU = 1;
            if (addressVMode === 4) clampToBorderV = 1;
            if (addressWMode === 4) clampToBorderW = 1;

            if (addressUMode === 3) clamps[index * 2] = 1;
            if (addressVMode === 3) clamps[index * 2 + 1] = 1;
        }

        const materialID = this._customMaskMaterialID;
        materialID[0] = this.materialIndex;
        materialID[1] = clampToBorderU;
        materialID[2] = clampToBorderV;
        materialID[3] = clampToBorderW;

        const customMaskData = this._customMaskData;
        customMaskData[0] = 0;
        customMaskData[1] = this.isMirrored ? 1 : 0;
        customMaskData[2] = 0;
        customMaskData[3] = 0;

        // Blend mode + swapped flag for the manual GLES quad shaders
        // (cb4[16]); the Carbon path passes blend mode as a permutation
        // option instead and never reads this register.
        const customMaskBlending = this._customMaskBlending;
        customMaskBlending[0] = this.constructor.GetBlendMode(this.blendMode);
        customMaskBlending[1] = this.customMasksSwapped ? 1 : 0;
        customMaskBlending[2] = 0;
        customMaskBlending[3] = 0;

        out["customMaskTarget" + index] = targets;
        out["customMaskMaterialID" + index] = materialID;
        out["customMaskData" + index] = customMaskData;
        out["customMaskMatrix" + index] = this._worldInverseTranspose;
        out.customMaskBlending = customMaskBlending;
        return out;
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
        const bag = this.GetPerObjectDataBagOfStuff(parentTransform, this._perObjectDataBagOfStuff, index, visible);
        perObjectData.ps.Set("CustomMaskTarget" + index, bag["customMaskTarget" + index]);
        perObjectData.ps.Set("CustomMaskMaterialID" + index, bag["customMaskMaterialID" + index]);
        if (perObjectData.ps.Has("CustomMaskBlending")) perObjectData.ps.Set("CustomMaskBlending", bag.customMaskBlending);
        perObjectData.vs.Set("CustomMaskData" + index, bag["customMaskData" + index]);
        perObjectData.vs.Set("CustomMaskMatrix" + index, bag["customMaskMatrix" + index]);
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
     * Gets a numeric custom mask blend mode
     * @param {*} value
     * @param {Number} [fallback=0]
     * @returns {Number}
     */
    static GetBlendMode(value, fallback = 0)
    {
        if (typeof value === "number" && Number.isFinite(value))
        {
            // Any value the enum declares, not a hand-written subset. The
            // subset this replaced accepted 0, 2, 6, 7 and 8 only, so ADD(1),
            // MULTIPLY(3), DIVIDE(4) and DIFFERENCE(5) silently became NONE.
            return VALID_BLEND_MODES.has(value) ? value : fallback;
        }

        if (typeof value !== "string" || !value) return fallback;

        // camelCase is split before upper-casing, so "nestedInverted",
        // "nested-inverted", "Nested Inverted" and "NESTED_INVERTED" all
        // resolve. The previous normalisation only collapsed spaces and
        // hyphens, so a camelCase label fell through to the fallback and the
        // mode silently became NONE - which is the shape of a UI sending a
        // property name rather than a label.
        const key = value
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[\s-]+/g, "_")
            .toUpperCase();

        // "normal" and "overlay" are ccpwgl spellings of no blending.
        if (key === "NORMAL" || key === "OVERLAY") return CustomMaskBlendMode.NONE;

        const mode = CustomMaskBlendMode[key];
        return mode === undefined ? fallback : mode;
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
        out.addressUMode = overrides ? overrides.addressUMode : 1;
        out.addressVMode = overrides ? overrides.addressVMode : 1;

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
     * Binds a target effect's pattern parameters to this custom mask
     * @param {Tw2Effect} effect
     * @param {Number} index
     */
    BindEffectPatternParameters(effect, index)
    {
        this.constructor.ApplyMaterials(effect, this, index);
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
