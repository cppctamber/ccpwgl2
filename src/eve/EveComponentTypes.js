// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/EveEntity.h
//   trinity/trinity/Eve/EveEntity.cpp
// Shared component-name vocabulary for the EveComponentRegistry. Carbon binds
// each registry collection to a compile-time interface through
// REGISTER_COMPONENT_TYPE(name, interface); JavaScript has no template
// specialization, so the verbatim name strings are the load-bearing contract.

// TODO(port): ccpwgl has no shared ReflectionMode/ReflectionSetting enum
// modules yet (runtime-trinity keeps them at
// @carbonenginejs/runtime-utils/graphics `trinityEnums.js` and
// src/generated/eve/enums.js respectively - neither is ported here). Values
// verified against those sources and kept verbatim so ShouldReflect below is
// byte-for-byte faithful; move these to a shared module if/when one is
// ported, rather than leaving a second copy to drift.

/** Shared EVE entity reflection vocabulary from EntityComponents. */
export const ReflectionMode = Object.freeze({
    REFLECT_HIGH: 0,
    REFLECT_MEDIUM_AND_HIGH: 1,
    REFLECT_LOW_MEDIUM_HIGH: 2,
    REFLECT_NEVER: 3
});

export const ReflectionSetting = Object.freeze({
    REFLECTION_SETTING_OFF: 0,
    REFLECTION_SETTING_LOW: 1,
    REFLECTION_SETTING_MEDIUM: 2,
    REFLECTION_SETTING_HIGH: 3,
    REFLECTION_SETTING_ULTRA: 4
});

/**
 * The nine Carbon component-name strings (VERBATIM). Each entry cites the
 * REGISTER_COMPONENT_TYPE declaration that binds the name to its interface.
 */
export const EveComponentType = Object.freeze({
    /** ITr2Renderable (ITr2Renderable.h:58). */
    ReflectionRenderable: "ReflectionRenderable",

    /** ITr2VolumetricRenderable (ITr2VolumetricRenderable.h:55). */
    VolumetricRenderable: "VolumetricRenderable",

    /** ITr2MeshMorph (ITr2MeshMorph.h:14). */
    MeshMorph: "MeshMorph",

    /** ITr2PostProcessOwner (PostProcess/ITr2PostProcessOwner.h:15). */
    PostProcessOwner: "PostProcessOwner",

    /** IEveInstanceMeshProvider (Eve/EveInstancedMeshManager.h:273). */
    InstancedMeshProvider: "InstancedMeshProvider",

    /** ITr2LightOwner (Lights/ITr2LightOwner.h:18). */
    LightOwner: "LightOwner",

    /** ITr2FroxelFogSettings (Tr2VolumetricsRenderer.h:57). */
    FroxelFogSettings: "FroxelFogSettings",

    /** IEveShadowCaster (Eve/IEveShadowCaster.h:164). */
    ShadowCaster: "ShadowCaster",

    /** IEveLightingOverride (EveChildLightingOverride.h:35). */
    EveLightingOverride: "EveLightingOverride"
});

/**
 * Required duck methods per component name: each Carbon interface's
 * pure-virtual surface (methods Carbon gives default implementations - e.g.
 * ITr2Renderable::IsVisible, ITr2LightOwner::AddLight/ClearLights,
 * IEveShadowCaster::PushRtGeometry/MarkRtDirty/IsShadowCastingDirty and the
 * sphere-overload IsCastingShadow - are not required). Consumed fail-closed by
 * EveComponentRegistry.RegisterComponent.
 */
export const EveComponentRequiredMethods = Object.freeze({
    /** ITr2Renderable.h:47-57 pure virtuals. */
    ReflectionRenderable: Object.freeze([ "GetBatches", "HasTransparentBatches", "GetSortValue", "GetPerObjectData" ]),

    /** ITr2VolumetricRenderable.h:44-51 pure virtuals. */
    VolumetricRenderable: Object.freeze([
        "GetSortValue",
        "GetVolumetricBatches",
        "UpdateVolumetricLightmap",
        "SetSceneInformation",
        "GetVolumetricShadowBatches",
        "GetVolumetricShadowInfo",
        "PrepareCloudShadowMap",
        "SetCloudShadowMapHandle"
    ]),

    /** ITr2MeshMorph.h:11. */
    MeshMorph: Object.freeze([ "UpdateMeshMorphs" ]),

    /** PostProcess/ITr2PostProcessOwner.h:12. */
    PostProcessOwner: Object.freeze([ "GetPostProcessAttributes" ]),

    /** Eve/EveInstancedMeshManager.h:270. */
    InstancedMeshProvider: Object.freeze([ "AddMeshesToManager" ]),

    /** Lights/ITr2LightOwner.h:13. */
    LightOwner: Object.freeze([ "GetLights" ]),

    /** Tr2VolumetricsRenderer.h:55. */
    FroxelFogSettings: Object.freeze([ "GetFroxelFogSettings" ]),

    /** Eve/IEveShadowCaster.h:143-149 pure virtuals. */
    ShadowCaster: Object.freeze([ "IsCastingShadow", "GetShadowBatches", "GetShadowPerObjectData" ]),

    /** EveChildLightingOverride.h:31. */
    EveLightingOverride: Object.freeze([ "GetOverrides" ])
});

// Carbon's global reflection knob g_eveReflectionMode (scene setting
// "eveReflectionSetting"). CARBON QUIRK: EveSpaceScene.cpp:112 initializes the
// global with the WRONG enum - EntityComponents::REFLECT_NEVER (== 3), which
// read as a ReflectionSetting is REFLECTION_SETTING_HIGH - so Carbon's shipped
// default is effectively HIGH. The port keeps the shipped behavior by
// defaulting to REFLECTION_SETTING_HIGH directly.
let eveReflectionSetting = ReflectionSetting.REFLECTION_SETTING_HIGH;

/**
 * Reads the module-level reflection setting (Carbon g_eveReflectionMode).
 * @returns {Number} a ReflectionSetting value
 */
export function GetReflectionSetting()
{
    return eveReflectionSetting;
}

/**
 * Stamps the module-level reflection setting (Carbon TRI_REGISTER_SETTING
 * "eveReflectionSetting", EveSpaceScene.cpp:113).
 * @param {Number} setting - a ReflectionSetting value
 */
export function SetReflectionSetting(setting)
{
    eveReflectionSetting = setting;
}

/**
 * Carbon EntityComponents::ShouldReflect (EveEntity.cpp:13-33): whether an
 * entity with the given per-entity ReflectionMode registers as
 * "ReflectionRenderable" under the current global ReflectionSetting.
 * @param {Number} mode - a ReflectionMode value
 * @returns {Boolean}
 */
export function ShouldReflect(mode)
{
    if (eveReflectionSetting === ReflectionSetting.REFLECTION_SETTING_OFF)
    {
        return false;
    }

    switch (mode)
    {
        case ReflectionMode.REFLECT_NEVER:
            return false;
        case ReflectionMode.REFLECT_LOW_MEDIUM_HIGH:
            return true;
        case ReflectionMode.REFLECT_MEDIUM_AND_HIGH:
            // Carbon: "we have either medium, high or highest settings".
            return eveReflectionSetting !== ReflectionSetting.REFLECTION_SETTING_LOW;
        case ReflectionMode.REFLECT_HIGH:
            return eveReflectionSetting === ReflectionSetting.REFLECTION_SETTING_HIGH ||
                eveReflectionSetting === ReflectionSetting.REFLECTION_SETTING_ULTRA;
        default:
            return false;
    }
}
