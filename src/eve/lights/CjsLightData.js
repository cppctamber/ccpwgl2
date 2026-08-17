// Source: E:\carbonengine\trinity\trinity\Lights\Tr2Light.h
// Source: E:\carbonengine\trinity\trinity\Lights\Tr2Light.cpp
import { meta } from "utils";
import { quat, vec3, vec4 } from "math";
import { PerLightShadowSetting } from "../../core/lighting/Tw2CarbonLightMath";


/**
 * Full authored attribute set of a light - position, colour, brightness and
 * noise, radii, orientation and cone angles, texture path, bone index, flags,
 * shadow setting and volumetric flag - used as the compat view over a light's
 * flattened fields.
 */
@meta.type("CjsLightData")
@meta.ccp.define("CjsLightData")
export class CjsLightData extends meta.Model
{
    static Fields = [
        "position", "color", "brightness", "noiseAmplitude", "noiseFrequency",
        "noiseOctaves", "radius", "innerRadius", "rotation", "outerAngle",
        "innerAngle", "texturePath", "boneIndex", "flags", "startTime",
        "castsShadows", "isVolumetric"
    ];

    @meta.vector3
    position = vec3.create();

    // TODO(port): vec4.createLinear() does not exist in ccpwgl's math/vec4 -
    // kept verbatim from runtime-trinity; verify the intended default once a
    // ccpwgl equivalent is ported.
    @meta.color
    color = vec4.createLinear();

    @meta.float
    brightness = 1;

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    @meta.uint
    noiseOctaves = 1;

    @meta.float
    radius = 0;

    @meta.float
    innerRadius = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.float
    outerAngle = 0;

    @meta.float
    innerAngle = 0;

    @meta.string
    texturePath = "";

    @meta.int32
    boneIndex = -1;

    @meta.uint
    flags = 1;

    @meta.float
    startTime = 0;

    @meta.enums(PerLightShadowSetting)
    castsShadows = 0;

    @meta.boolean
    isVolumetric = false;

    static PerLightShadowSetting = PerLightShadowSetting;
}

/**
 * Builds the compat LightData view over an owner's flattened light fields.
 *
 * The 2026-07-23 flatten decision makes the flat decorated fields the real
 * storage on every light parent; this view keeps the Carbon
 * `GetLightData() -> const LightData&` surface (and the runtime-sof
 * separate-node hydration contract) alive by redirecting the owner's
 * flattened field names into the owner. Fields the owner does not flatten
 * keep their own constructor-default storage on the view.
 */
export function createCjsLightDataView(owner, fieldNames)
{
    const view = new CjsLightData();
    const descriptors = {};
    for (const fieldName of fieldNames)
    {
        delete view[fieldName];
        descriptors[fieldName] = {
            configurable: true,
            enumerable: true,
            get()
            {
                return owner[fieldName];
            },
            set(value)
            {
                owner.SetValues({ [fieldName]: value });
            }
        };
    }
    Object.defineProperties(view, descriptors);
    return view;
}

/**
 * Routes a nested `lightData` value bag (the pre-flatten hydration shape,
 * still emitted by runtime-sof) into the owner's flattened fields, then
 * applies everything through one schema-backed SetValues pass. Explicit flat
 * keys win over the nested bag.
 */
export function setCjsLightDataOwnerValues(owner, values, options, setOwnerValues, fieldNames)
{
    if (!values || typeof values !== "object") return setOwnerValues(values, options);
    if (!Object.prototype.hasOwnProperty.call(values, "lightData")) return setOwnerValues(values, options);

    const merged = {};
    for (const [ key, value ] of Object.entries(values))
    {
        if (key !== "lightData") merged[key] = value;
    }

    const nested = values.lightData?.GetValues?.() ?? values.lightData;
    if (nested && typeof nested === "object")
    {
        const fieldSet = new Set(fieldNames);
        for (const fieldName of CjsLightData.Fields)
        {
            if (!fieldSet.has(fieldName)) continue;
            if (!Object.prototype.hasOwnProperty.call(nested, fieldName)) continue;
            if (Object.prototype.hasOwnProperty.call(values, fieldName)) continue;
            merged[fieldName] = nested[fieldName];
        }
    }

    return setOwnerValues(merged, options);
}
