import * as r from "../Tw2BlackClassReaders";

class Instance
{
    constructor(data)
    {
        this.data = data;
    }

    static ReadStruct(reader)
    {
        let data = [
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32()
        ];

        return new Instance(data);
    }
}

export function sof(map)
{
    map.set("EveSOFData", new Map([
        ["faction", r.array],
        ["generic", r.object],
        ["hull", r.array],
        ["material", r.array],
        ["pattern", r.array],
        ["race", r.array],
    ]));

    map.set("EveSOFDataArea", new Map([
        ["Black", r.object],
        ["Blue", r.object],
        ["Booster", r.object],
        ["Cyan", r.object],
        ["Darkhull", r.object],
        ["Fire", r.object],
        ["Glass", r.object],
        ["Green", r.object],
        ["Hull", r.object],
        ["Killmark", r.object],
        ["Monument", r.object],
        ["Orange", r.object],
        ["Primary", r.object],
        ["Reactor", r.object],
        ["Red", r.object],
        ["Rock", r.object],
        ["Sails", r.object],
        ["Secondary", r.object],
        ["Tertiary", r.object],
        ["White", r.object],
        ["Yellow", r.object],
    ]));

    map.set("EveSOFDataAreaMaterial", new Map([
        ["colorType", r.uint],
        ["material1", r.string],
        ["material2", r.string],
        ["material3", r.string],
        ["material4", r.string],
    ]));

    map.set("EveSOFDataBooster", new Map([
        ["glowColor", r.vector4],
        ["glowScale", r.float],
        ["gradient0ResPath", r.string],
        ["gradient1ResPath", r.string],
        ["haloColor", r.vector4],
        ["haloScaleX", r.float],
        ["haloScaleY", r.float],
        ["lightFlickerAmplitude", r.float],
        ["lightFlickerColor", r.vector4],
        ["lightFlickerFrequency", r.float],
        ["lightFlickerRadius", r.float],
        ["lightColor", r.vector4],
        ["lightRadius", r.float],
        ["lightWarpColor", r.vector4],
        ["lightWarpRadius", r.float],
        ["shape0", r.object],
        ["shape1", r.object],
        ["shapeAtlasCount", r.uint],
        ["shapeAtlasHeight", r.uint],
        ["shapeAtlasResPath", r.string],
        ["shapeAtlasWidth", r.uint],
        ["symHaloScale", r.float],
        ["trailColor", r.vector4],
        ["trailSize", r.vector4],
        ["volumetric", r.boolean],
        ["warpGlowColor", r.vector4],
        ["warpHalpColor", r.vector4],
        ["warpShape0", r.object],
        ["warpShape1", r.object],
    ]));

    map.set("EveSOFDataBoosterShape", new Map([
        ["color", r.vector4],
        ["noiseFunction", r.float],
        ["noiseSpeed", r.float],
        ["noiseAmplitureStart", r.vector4],
        ["noiseAmplitureEnd", r.vector4],
        ["noiseFrequency", r.vector4],
    ]));

    map.set("EveSOFDataFaction", new Map([
        ["areas", r.array],
        ["areaTypes", r.object],
        ["colorSet", r.object],
        ["children", r.array],
        ["decals", r.array],
        ["defaultPattern", r.object],
        ["defaultPatternLayer1MaterialName", r.string],
        ["description", r.string],
        ["logoSet", r.object],
        ["materialUsageMtl1", r.uint],
        ["materialUsageMtl2", r.uint],
        ["materialUsageMtl3", r.uint],
        ["materialUsageMtl4", r.uint],
        ["name", r.string],
        ["planeSets", r.array],
        ["resPathInsert", r.string],
        ["spotlightSets", r.array],
        ["spriteSets", r.array],
        ["visibilityGroupSet", r.object],
    ]));

    map.set("EveSOFDataFactionChild", new Map([
        ["groupIndex", r.uint],
        ["name", r.string],
        ["isVisible", r.boolean],
    ]));

    map.set("EveSOFDataFactionColorSet", new Map([
        ["Black", r.vector4],
        ["Blue", r.vector4],
        ["Booster", r.vector4],
        ["Cyan", r.vector4],
        ["Darkhull", r.vector4],
        ["Fire", r.vector4],
        ["Glass", r.vector4],
        ["Green", r.vector4],
        ["Hull", r.vector4],
        ["Killmark", r.vector4],
        ["Orange", r.vector4],
        ["Primary", r.vector4],
        ["Reactor", r.vector4],
        ["Red", r.vector4],
        ["Secondary", r.vector4],
        ["Tertiary", r.vector4],
        ["White", r.vector4],
        ["Yellow", r.vector4],
    ]));

    map.set("EveSOFDataFactionDecal", new Map([
        ["groupIndex", r.uint],
        ["name", r.string],
        ["parameters", r.array],
        ["shader", r.string],
        ["textures", r.array],
        ["isVisible", r.boolean],
    ]));

    map.set("EveSOFDataFactionHullArea", new Map([
        ["name", r.string],
        ["groupIndex", r.uint],
        ["parameters", r.array]
    ]));

    map.set("EveSOFDataLogo", new Map([
        ["textures", r.array]
    ]));

    map.set("EveSOFDataLogoSet", new Map([
        ["Marking_01", r.object],
        ["Marking_02", r.object],
        ["Primary", r.object],
        ["Secondary", r.object],
        ["Tertiary", r.object]
    ]));

    map.set("EveSOFDataFactionPlaneSet", new Map([
        ["color", r.vector4],
        ["groupIndex", r.uint],
        ["name", r.string],
    ]));

    map.set("EveSOFDataFactionSpriteSet", new Map([
        ["color", r.vector4],
        ["groupIndex", r.uint],
        ["name", r.string]
    ]));

    map.set("EveSOFDataFactionVisibilityGroupSet", new Map([
        ["visibilityGroups", r.array],
    ]));

    map.set("EveSOFDataGeneric", new Map([
        ["areaShaderLocation", r.string],
        ["areaShaders", r.array],
        ["bannerShader", r.rawObject],
        ["decalShaderLocation", r.string],
        ["decalShaders", r.array],
        ["damage", r.object],
        ["genericWreckMaterial", r.object],
        ["hullAreas", r.array],
        ["hullDamage", r.object],
        ["materialPrefixes", r.array],
        ["patternMaterialPrefixes", r.array],
        ["resPathDefaultAlliance", r.string],
        ["resPathDefaultCeo", r.string],
        ["resPathDefaultCorp", r.string],
        ["shaderPrefixAnimated", r.string],
        ["swarm", r.object],
        ["variants", r.array],
    ]));

    map.set("EveSOFDataGenericDamage", new Map([
        ["armorParticleAngle", r.float],
        ["armorParticleColor0", r.vector4],
        ["armorParticleColor1", r.vector4],
        ["armorParticleColor2", r.vector4],
        ["armorParticleColor3", r.vector4],
        ["armorParticleDrag", r.float],
        ["armorParticleMinMaxLifeTime", r.vector2],
        ["armorParticleMinMaxSpeed", r.vector2],
        ["armorParticleRate", r.float],
        ["armorParticleSizes", r.vector4],
        ["armorParticleTurbulenceAmplitude", r.float],
        ["armorParticleTurbulenceFrequency", r.float],
        ["armorParticleVelocityStretchRotation", r.float],
        ["armorParticleTextureIndex", r.uint],
        ["armorShader", r.string],
        ["flickerPerlinAlpha", r.float],
        ["flickerPerlinBeta", r.float],
        ["flickerPerlinSpeed", r.float],
        ["flickerPerlinN", r.uint],
        ["shieldGeometryResFilePath", r.string],
        ["shieldShaderEllipsoid", r.string],
        ["shieldShaderHull", r.string],
    ]));

    map.set("EveSOFDataGenericDecalShader", new Map([
        ["defaultParameters", r.array],
        ["defaultTextures", r.array],
        ["parameters", r.array],
        ["parentTextures", r.array],
        ["shader", r.string],
    ]));

    map.set("EveSOFDataGenericHullDamage", new Map([
        ["hullParticleAngle", r.float],
        ["hullParticleColor0", r.vector4],
        ["hullParticleColor1", r.vector4],
        ["hullParticleColor2", r.vector4],
        ["hullParticleColorMidpoint", r.float],
        ["hullParticleDrag", r.float],
        ["hullParticleMinMaxLifeTime", r.vector2],
        ["hullParticleMinMaxSpeed", r.vector2],
        ["hullParticleRate", r.float],
        ["hullParticleSizes", r.vector4],
        ["hullParticleTurbulenceAmplitude", r.float],
        ["hullParticleTurbulenceFrequency", r.float],
        ["hullParticleTextureIndex", r.uint],
    ]));

    map.set("EveSOFDataGenericShader", new Map([
        ["defaultParameters", r.array],
        ["defaultTextures", r.array],
        ["doGenerateDepthArea", r.boolean],
        ["parameters", r.array],
        ["shader", r.string],
        ["textures", r.array],
        ["transparencyTextureName", r.string],
    ]));

    map.set("EveSOFDataGenericString", new Map([
        ["str", r.string],
    ]));

    map.set("EveSOFDataGenericSwarm", new Map([
        ["formationDistance", r.float],
        ["maxDistance0", r.float],
        ["maxDeceleration", r.float],
        ["separationDistance", r.float],
        ["wanderDistance", r.float],
        ["wanderFluctuation", r.float],
        ["wanderRadius", r.float],
        ["weightAlign", r.float],
        ["weightAnchor", r.float],
        ["weightCohesion", r.float],
        ["weightDeceleration", r.float],
        ["weightFormation", r.float],
        ["weightSeparation", r.float],
    ]));

    map.set("EveSOFDataGenericVariant", new Map([
        ["hullArea", r.object],
        ["isTransparent", r.boolean],
        ["name", r.string],
    ]));

    map.set("EveSOFDataHull", new Map([
        ["additiveAreas", r.array],
        ["animations", r.array],
        ["audioPosition", r.vector3],
        ["banners", r.array],
        ["booster", r.object],
        ["boundingSphere", r.vector4],
        ["buildClass", r.uint],
        ["castShadow", r.boolean],
        ["category", r.string],
        ["children", r.array],
        ["controllers", r.array],
        ["decalAreas", r.array],
        ["decalSets", r.array],
        ["defaultPattern", r.object],
        ["depthAreas", r.array],
        ["description", r.string],
        ["distortionAreas", r.array],
        ["enableDynamicBoundingSphere", r.boolean],
        ["geometryResFilePath", r.string],
        ["hazeSets", r.array],
        ["hullDecals", r.array],
        ["impactEffectType", r.uint],
        ["instancedMeshes", r.array],
        ["isSkinned", r.boolean],
        ["lightSets", r.array],
        ["locatorSets", r.array],
        ["locatorTurrets", r.array],
        ["name", r.string],
        ["opaqueAreas", r.array],
        ["planeSets", r.array],
        ["modelRotationCurvePath", r.string],
        ["shapeEllipsoidCenter", r.vector3],
        ["shapeEllipsoidRadius", r.vector3],
        ["soundEmitters", r.array],
        ["spotlightSets", r.array],
        ["spriteLineSets", r.array],
        ["spriteSets", r.array],
        ["transparentAreas", r.array],
    ]));

    map.set("EveSOFDataHullAnimation", new Map([
        ["endRate", r.float],
        ["endRotationTime", r.float],
        ["endRotationValue", r.vector4],
        ["id", r.uint],
        ["name", r.string],
        ["startRate", r.float],
        ["startRotationTime", r.float],
        ["startRotationValue", r.vector4],
    ]));

    map.set("EveSOFDataHullArea", new Map([
        ["areaType", r.uint],
        ["blockedMaterials", r.uint],
        ["count", r.uint],
        ["index", r.uint],
        ["name", r.string],
        ["parameters", r.array],
        ["shader", r.string],
        ["textures", r.array],
    ]));

    map.set("EveSOFDataHullBanner", new Map([
        ["angleX", r.float],
        ["angleY", r.float],
        ["angleZ", r.float],
        ["boneIndex", r.uint],
        ["name", r.string],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["usage", r.uint],
    ]));

    map.set("EveSOFDataHullBooster", new Map([
        ["alwaysOn", r.boolean],
        ["hasTrails", r.boolean],
        ["items", r.array],
    ]));

    map.set("EveSOFDataHullBoosterItem", new Map([
        ["atlasIndex0", r.uint],
        ["atlasIndex1", r.uint],
        ["functionality", r.vector4],
        ["hasTrail", r.boolean],
        ["transform", r.matrix],
    ]));

    map.set("EveSOFDataHullChild", new Map([
        ["groupIndex", r.uint],
        ["id", r.uint],
        ["lowestLodVisible", r.uint],
        ["name", r.string],
        ["redFilePath", r.string],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["translation", r.vector3],
    ]));

    map.set("EveSOFDataHullController", new Map([
        ["path", r.string],
    ]));

    map.set("EveSOFDataHullDecal", new Map([
        ["boneIndex", r.uint],
        ["glowColorType", r.uint],
        ["groupIndex", r.uint],
        ["indexBuffer", r.indexBuffer],
        ["meshIndex", r.uint],
        ["name", r.string],
        ["parameters", r.array],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["shader", r.string],
        ["textures", r.array],
        ["usage", r.uint],
    ]));

    map.set("EveSOFDataHullDecalSet", new Map([
        ["name", r.string],
        ["items", r.array],
        ["visibilityGroup", r.string],
    ]));

    map.set("EveSOFDataHullDecalSetItem", new Map([
        ["name", r.string],
        ["boneIndex", r.uint],
        ["indexBuffer", r.indexBuffer],
        ["glowColorType", r.uint],
        ["logoType", r.uint],
        ["meshIndex", r.uint],
        ["parameters", r.array],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["textures", r.array],
        ["usage", r.uint],
        ["visibilityGroup", r.string],
    ]));

    map.set("EveSOFDataHullHazeSet", new Map([
        ["items", r.array],
        ["name", r.string],
        ["visibilityGroup", r.string],
    ]));

    map.set("EveSOFDataHullHazeSetItem", new Map([
        ["boosterGainInfluence", r.boolean],
        ["colorType", r.uint],
        ["hazeBrightness", r.float],
        ["hazeFalloff", r.float],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["sourceBrightness", r.float],
        ["sourceSize", r.float],
    ]));

    map.set("EveSOFDataHullLightSet", new Map([
        ["name", r.string],
        ["items", r.array],
    ]));

    map.set("EveSOFDataHullLightSetItem", new Map([
        ["name", r.string],
        ["brightness", r.float],
        ["innerRadius", r.float],
        ["lightColor", r.vector4],
        ["position", r.vector3],
        ["radius", r.float],
    ]));

    map.set("EveSOFDataHullLocator", new Map([
        ["name", r.string],
        ["transform", r.matrix],
    ]));

    map.set("EveSOFDataHullLocatorSet", new Map([
        ["name", r.string],
        ["locators", r.array],
    ]));

    map.set("EveSOFDataHullPlaneSet", new Map([
        ["atlasSize", r.uint],
        ["items", r.array],
        ["layer1MapResPath", r.string],
        ["layer2MapResPath", r.string],
        ["maskMapResPath", r.string],
        ["name", r.string],
        ["planeData", r.vector4],
        ["skinned", r.boolean],
        ["usage", r.uint],
    ]));

    map.set("EveSOFDataHullPlaneSetItem", new Map([
        ["boneIndex", r.uint],
        ["color", r.vector4],
        ["groupIndex", r.uint],
        ["layer1Scroll", r.vector4],
        ["layer1Transform", r.vector4],
        ["layer2Scroll", r.vector4],
        ["layer2Transform", r.vector4],
        ["maskMapAtlasIndex", r.uint],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
    ]));

    map.set("EveSOFDataHullSpotlightSet", new Map([
        ["coneTextureResPath", r.string],
        ["glowTextureResPath", r.string],
        ["items", r.array],
        ["name", r.string],
        ["skinned", r.boolean],
        ["zOffset", r.float],
    ]));

    map.set("EveSOFDataHullSpotlightSetItem", new Map([
        ["boneIndex", r.uint],
        ["boosterGainInfluence", r.boolean],
        ["coneIntensity", r.float],
        ["flareIntensity", r.float],
        ["groupIndex", r.uint],
        ["spriteScale", r.vector3],
        ["spriteIntensity", r.float],
        ["transform", r.matrix],
    ]));

    map.set("EveSOFDataHullSoundEmitter", new Map([
        ["name", r.string],
        ["prefix", r.string]
    ]));

    map.set("EveSOFDataHullSpriteLineSet", new Map([
        ["items", r.array],
        ["name", r.string],
        ["skinned", r.boolean],
        ["visibilityGroup", r.string],
    ]));

    map.set("EveSOFDataHullSpriteLineSetItem", new Map([
        ["blinkRate", r.float],
        ["blinkPhase", r.float],
        ["blinkPhaseShift", r.float],
        ["boneIndex", r.uint],
        ["colorType", r.uint],
        ["falloff", r.float],
        ["groupIndex", r.uint],
        ["intensity", r.float],
        ["isCircle", r.boolean],
        ["maxScale", r.float],
        ["minScale", r.float],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["spacing", r.float],
    ]));

    map.set("EveSOFDataHullSpriteSet", new Map([
        ["name", r.string],
        ["items", r.array],
        ["skinned", r.boolean],
        ["visibilityGroup", r.string],
    ]));

    map.set("EveSOFDataHullSpriteSetItem", new Map([
        ["blinkRate", r.float],
        ["blinkPhase", r.float],
        ["boneIndex", r.uint],
        ["colorType", r.uint],
        ["falloff", r.float],
        ["groupIndex", r.uint],
        ["intensity", r.float],
        ["maxScale", r.float],
        ["minScale", r.float],
        ["position", r.vector3],
    ]));

    map.set("EveSOFDataInstancedMesh", new Map([
        ["geometryResPath", r.string],
        ["instanceGeometryResPath", r.string],
        ["instances", r.structList(Instance)],
        ["lowestLodVisible", r.uint],
        ["name", r.string],
        ["shader", r.string],
        ["textures", r.array],
    ]));

    map.set("EveSOFDataMaterial", new Map([
        ["name", r.string],
        ["parameters", r.array],
    ]));

    map.set("EveSOFDataParameter", new Map([
        ["name", r.string],
        ["value", r.vector4],
    ]));

    map.set("EveSOFDataPattern", new Map([
        ["name", r.string],
        ["areas", r.array],
        ["isTargetMtl1", r.boolean],
        ["isTargetMtl2", r.boolean],
        ["isTargetMtl3", r.boolean],
        ["isTargetMtl4", r.boolean],
        ["layer1", r.object],
        ["layer2", r.object],
        ["materialSource", r.uint],
        ["patternTextures", r.array],
        ["projections", r.array],
        ["projectionTypeU", r.uint],
        ["projectionTypeV", r.uint],
    ]));

    map.set("EveSOFDataPatternLayer", new Map([
        ["isTargetMtl1", r.boolean],
        ["isTargetMtl2", r.boolean],
        ["isTargetMtl3", r.boolean],
        ["isTargetMtl4", r.boolean],
        ["materialSource", r.uint],
        ["projectionTypeU", r.uint],
        ["projectionTypeV", r.uint],
        ["textureName", r.string],
        ["textureResFilePath", r.string],
    ]));

    map.set("EveSOFDataPatternPerHull", new Map([
        ["name", r.string],
        ["transformLayer1", r.object],
        ["transformLayer2", r.object],
    ]));

    map.set("EveSOFDataPatternTransform", new Map([
        ["isMirrored", r.boolean],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
    ]));

    map.set("EveSOFDataRace", new Map([
        ["booster", r.object],
        ["damage", r.object],
        ["hullAreas", r.array],
        ["hullDamage", r.object],
        ["name", r.string],
    ]));

    map.set("EveSOFDataRaceDamage", new Map([
        ["armorImpactParameters", r.array],
        ["armorImpactTextures", r.array],
        ["shieldImpactParameters", r.array],
        ["shieldImpactTextures", r.array],
    ]));

    map.set("EveSOFDataFactionSpotlightSet", new Map([
        ["coneColor", r.vector4],
        ["flareColor", r.vector4],
        ["groupIndex", r.uint],
        ["name", r.string],
        ["spriteColor", r.vector4],
    ]));

    map.set("EveSOFDataTexture", new Map([
        ["name", r.string],
        ["resFilePath", r.string],
    ]));

    map.set("EveSOFDataTransform", new Map([
        ["boneIndex", r.uint],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
    ]));
}
