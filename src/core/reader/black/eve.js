import * as r from "../Tw2BlackClassReaders";

class Locator
{
    constructor(position, direction)
    {
        this.position = position;
        this.direction = direction;
    }

    static ReadStruct(reader)
    {
        return new Locator(r.vector4(reader), r.vector4(reader));
    }
}

export function eve(map)
{
    map.set("EveBoosterSet2", new Map([
        ["alwaysOn", r.boolean],
        ["alwaysOnIntensity", r.float],
        ["effect", r.object],
        ["glows", r.object],
        ["glowColor", r.color],
        ["glowScale", r.float],
        ["haloColor", r.color],
        ["haloScaleX", r.float],
        ["haloScaleY", r.float],
        ["lightFlickerAmplitude", r.float],
        ["lightFlickerColor", r.color],
        ["lightFlickerFrequency", r.float],
        ["lightFlickerRadius", r.float],
        ["lightColor", r.color],
        ["lightRadius", r.float],
        ["lightWarpColor", r.color],
        ["lightWarpRadius", r.float],
        ["symHaloScale", r.float],
        ["trails", r.object],
        ["warpGlowColor", r.color],
        ["warpHaloColor", r.color]
    ]));

    map.set("EveCamera", new Map([
        ["fieldOfView", r.float],
        ["friction", r.float],
        ["frontClip", r.float],
        ["idleMove", r.boolean],
        ["idleScale", r.float],
        ["idleSpeed", r.float],
        ["intr", r.vector3],
        ["pitch", r.float],
        ["pos", r.vector3],
        ["maxSpeed", r.float],
        ["noiseScale", r.float],
        ["noiseScaleCurve", r.object],
        ["rotationAroundParent", r.vector4],
        ["translationFromParent", r.float],
        ["yaw", r.float],
        ["zoomCurve", r.object]
    ]));

    map.set("EveChildCloud", new Map([
        ["cellScreenSize", r.float],
        ["sortingModifier", r.float],
        ["effect", r.object],
        ["name", r.string],
        ["preTesselationLevel", r.uint],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["translation", r.vector3]
    ]));

    map.set("EveChildBulletStorm", new Map([
        ["effect", r.object],
        ["multiplier", r.uint],
        ["range", r.float],
        ["speed", r.float],
        ["sourceLocatorSet", r.string]
    ]));

    map.set("EveChildContainer", new Map([
        ["boneIndex", r.uint],
        ["controllers", r.array],
        ["display", r.boolean],
        ["localTransform", r.matrix],
        ["name", r.string],
        ["curveSets", r.array],
        ["hideOnLowQuality", r.boolean],
        ["lights", r.array],
        ["observers", r.array],
        ["objects", r.array],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["staticTransform", r.boolean],
        ["transformModifiers", r.array],
        ["translation", r.vector3]
    ]));

    map.set("EveChildExplosion", new Map([
        ["globalDuration", r.float],
        ["globalExplosion", r.object],
        ["globalExplosionDelay", r.float],
        ["globalExplosions", r.array],
        ["globalScaling", r.vector3],
        ["localDuration", r.float],
        ["localExplosion", r.object],
        ["localExplosions", r.array],
        ["localExplosionInterval", r.float],
        ["localExplosionIntervalFactor", r.float],
        ["localExplosionShared", r.object],
        ["localTransform", r.matrix],
        ["name", r.string],
        ["rotation", r.vector4],
        ["scaling", r.vector3]
    ]));

    map.set("EveChildLink", new Map([
        ["linkStrengthBindings", r.array],
        ["linkStrengthCurves", r.array],
        ["mesh", r.object],
        ["name", r.string],
        ["rotation", r.vector4]
    ]));

    map.set("EveChildMesh", new Map([
        ["display", r.boolean],
        ["localTransform", r.matrix],
        ["lowestLodVisible", r.uint],
        ["mesh", r.object],
        ["minScreenSize", r.float],
        ["name", r.string],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["sortValueOffset", r.float],
        ["staticTransform", r.boolean],
        ["transformModifiers", r.array],
        ["translation", r.vector3],
        ["useSpaceObjectData", r.boolean],
        ["useSRT", r.boolean]
    ]));

    map.set("EveChildParticleSphere", new Map([
        ["generators", r.array],
        ["maxSpeed", r.float],
        ["mesh", r.object],
        ["movementScale", r.float],
        ["name", r.string],
        ["particleSystem", r.object],
        ["positionShiftDecreaseSpeed", r.float],
        ["positionShiftIncreaseSpeed", r.float],
        ["positionShiftMax", r.float],
        ["positionShiftMin", r.float],
        ["radius", r.float],
        ["useSpaceObjectData", r.boolean]
    ]));

    map.set("EveChildParticleSystem", new Map([
        ["display", r.boolean],
        ["localTransform", r.matrix],
        ["lodSphereRadius", r.float],
        ["mesh", r.object],
        ["minScreenSize", r.float],
        ["name", r.string],
        ["particleEmitters", r.array],
        ["particleSystems", r.array],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["translation", r.vector3],
        ["useDynamicLod", r.boolean]
    ]));

    map.set("EveChildModifierAttachToBone", new Map([
        ["boneIndex", r.uint]
    ]));

    map.set("EveChildModifierBillboard2D", new Map());
    map.set("EveChildModifierBillboard3D", new Map());
    map.set("EveChildModifierCameraOrientedRotationConstrained", new Map());

    map.set("EveChildModifierSRT", new Map([
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["translation", r.vector3],
    ]));

    map.set("EveChildModifierTranslateWithCamera", new Map());

    map.set("EveChildQuad", new Map([
        ["brightness", r.float],
        ["color", r.color],
        ["effect", r.object],
        ["localTransform", r.matrix],
        ["minScreenSize", r.float],
        ["name", r.string],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["translation", r.vector3],
    ]));

    map.set("EveConnector", new Map([
        ["animationColor", r.color],
        ["animationScale", r.float],
        ["animationSpeed", r.float],
        ["color", r.color],
        ["destObject", r.object],
        ["destPosition", r.vector3],
        ["isAnimated", r.boolean],
        ["lineWidth", r.float],
        ["sourceObject", r.object],
        ["sourcePosition", r.vector3],
        ["type", r.uint],
    ]));

    map.set("EveCurveLineSet", new Map([
        ["lineEffect", r.object],
        ["pickEffect", r.object],
    ]));

    map.set("EveCustomMask", new Map([
        ["materialIndex", r.byte],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["targetMaterials", r.vector4],
    ]));

    map.set("EveEffectRoot2", new Map([
        ["boundingSphereCenter", r.vector3],
        ["boundingSphereRadius", r.float],
        ["curveSets", r.array],
        ["duration", r.float],
        ["dynamicLOD", r.boolean],
        ["effectChildren", r.array],
        ["lights", r.array],
        ["name", r.string],
        ["observers", r.array],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["secondaryLightingEmissiveColor", r.color],
        ["secondaryLightingSphereRadius", r.float],
        ["translation", r.vector3],
    ]));

    map.set("EveLensflare", new Map([
        ["backgroundOccluders", r.array],
        ["bindings", r.array],
        ["distanceToCenterCurves", r.array],
        ["distanceToEdgeCurves", r.array],
        ["mesh", r.object],
        ["name", r.string],
        ["occluders", r.array],
        ["position", r.vector3],
        ["radialAngleCurves", r.array],
        ["xDistanceToCenter", r.array],
        ["yDistanceToCenter", r.array],
        ["zDistanceToCenter", r.array],
    ]));

    map.set("EveLineContainer", new Map([
        ["lineSet", r.object],
    ]));

    map.set("EveLocalPositionCurve", new Map([
        ["value", r.vector3],
    ]));

    map.set("EveLocatorSets", new Map([
        ["locators", r.structList(Locator)],
        ["name", r.string]
    ]));

    map.set("EveLocator2", new Map([
        ["name", r.string],
        ["transform", r.matrix],
    ]));

    map.set("EveMeshOverlayEffect", new Map([
        ["additiveEffects", r.array],
        ["curveSet", r.object],
        ["distortionEffects", r.array],
        ["name", r.string],
        ["opaqueEffects", r.array],
        ["transparentEffects", r.array],
    ]));

    map.set("EveMissile", new Map([
        ["boundingSphereCenter", r.vector3],
        ["boundingSphereRadius", r.float],
        ["modelTranslationCurve", r.object],
        ["name", r.string],
        ["warheads", r.array],
    ]));

    map.set("EveMissileWarhead", new Map([
        ["acceleration", r.float],
        ["durationEjectPhase", r.float],
        ["impactDuration", r.float],
        ["impactSize", r.float],
        ["maxExplosionDistance", r.float],
        ["mesh", r.object],
        ["particleEmitters", r.array],
        ["pathOffsetNoiseScale", r.float],
        ["pathOffsetNoiseSpeed", r.float],
        ["spriteSet", r.object],
        ["startEjectVelocity", r.float],
        ["warheadLength", r.float],
        ["warheadRadius", r.float],
    ]));

    map.set("EveMobile", new Map([
        ["attachments", r.array],
        ["boundingSphereCenter", r.vector3],
        ["boundingSphereRadius", r.float],
        ["children", r.array],
        ["controllers", r.array],
        ["curveSets", r.array],
        ["locatorSets", r.array],
        ["name", r.string],
        ["meshLod", r.object],
        ["observers", r.array],
        ["shadowEffect", r.object],
    ]));

    map.set("EveOccluder", new Map([
        ["name", r.string],
        ["sprites", r.array],
    ]));

    map.set("EveParticleDirectForce", new Map([
        ["force", r.vector3],
    ]));

    map.set("EveParticleDragForce", new Map([
        ["drag", r.float],
    ]));

    map.set("EvePlaneSet", new Map([
        ["effect", r.object],
        ["hideOnLowQuality", r.boolean],
        ["name", r.string],
        ["pickBufferID", r.byte],
        ["planes", r.array],
    ]));

    map.set("EvePlaneSetItem", new Map([
        ["color", r.color],
        ["layer1Scroll", r.vector4],
        ["layer1Transform", r.vector4],
        ["layer2Scroll", r.vector4],
        ["layer2Transform", r.vector4],
        ["maskAtlasID", r.uint],
        ["name", r.string],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
    ]));

    map.set("EveRootTransform", new Map([
        ["boundingSphereRadius", r.float],
        ["children", r.array],
        ["curveSets", r.array],
        ["display", r.boolean],
        ["mesh", r.object],
        ["modifier", r.uint],
        ["name", r.string],
        ["observers", r.array],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["rotationCurve", r.object],
        ["scaling", r.vector3],
        ["sortValueMultiplier", r.float],
        ["translation", r.vector3],
        ["translationCurve", r.object],
        ["useDistanceBasedScale", r.boolean],
    ]));

    map.set("EveShip2", new Map([
        ["attachments", r.array],
        ["boosters", r.object],
        ["boundingSphereCenter", r.vector3],
        ["boundingSphereRadius", r.float],
        ["children", r.array],
        ["customMasks", r.array],
        ["decals", r.array],
        ["dna", r.string],
        ["locatorSets", r.array],
        ["locators", r.array],
        ["mesh", r.object],
        ["name", r.string],
        ["meshLod", r.object],
        ["rotationCurve", r.object],
        ["shadowEffect", r.object],
        ["shapeEllipsoidCenter", r.vector3],
        ["shapeEllipsoidRadius", r.vector3],
        ["translationCurve", r.object],
    ]));

    map.set("EveStation2", new Map([
        ["attachments", r.array],
        ["boundingSphereCenter", r.vector3],
        ["boundingSphereRadius", r.float],
        ["children", r.array],
        ["curveSets", r.array],
        ["decals", r.array],
        ["effectChildren", r.array],
        ["lights", r.array],
        ["locatorSets", r.array],
        ["locators", r.array],
        ["name", r.string],
        ["mesh", r.object],
        ["meshLod", r.object],
        ["modelScale", r.float],
        ["observers", r.array],
        ["rotationCurve", r.object],
        ["modelRotationCurve", r.object],
        ["shadowEffect", r.object],
        ["translationCurve", r.object],
    ]));

    map.set("EveSpaceObjectDecal", new Map([
        ["decalEffect", r.object],
        ["name", r.string],
        ["position", r.vector3],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["indexBuffer", r.indexBuffer]
    ]));

    map.set("EveSpaceScene", new Map([
        ["ambientColor", r.color],
        ["backgroundEffect", r.object],
        ["backgroundObjects", r.array],
        ["backgroundRenderingEnabled", r.boolean],
        ["curveSets", r.array],
        ["enableShadows", r.boolean],
        ["envMapResPath", r.string],
        ["envMap1ResPath", r.string],
        ["envMap2ResPath", r.string],
        ["envMapRotation", r.vector4],
        ["externalParameters", r.array],
        ["fogColor", r.color],
        ["fogStart", r.float],
        ["fogEnd", r.float],
        ["fogMax", r.float],
        ["nebulaIntensity", r.float],
        ["objects", r.array],
        ["postProcessPath", r.string],
        ["selfShadowOnly", r.boolean],
        ["starfield", r.object],
        ["shadowFadeThreshold", r.float],
        ["shadowThreshold", r.float],
        ["shLightingManager", r.object],
        ["sunDiffuseColor", r.color],
        ["sunDiffuseColorWithDynamicLights", r.vector4],
        ["sunDirection", r.vector3],
        ["useSunDiffuseColorWithDynamicLights", r.boolean]
    ]));

    map.set("EveSpherePin", new Map([
        ["centerNormal", r.vector3],
        ["color", r.color],
        ["curveSets", r.array],
        ["enablePicking", r.boolean],
        ["geometryResPath", r.string],
        ["name", r.string],
        ["pinColor", r.color],
        ["pinEffect", r.object],
        ["pinMaxRadius", r.float],
        ["pinRadius", r.float],
        ["pinRotation", r.float],
        ["sortValueMultiplier", r.float]
    ]));

    map.set("EveSpotlightSet", new Map([
        ["coneEffect", r.object],
        ["glowEffect", r.object],
        ["intensity", r.float],
        ["name", r.string],
        ["spotlightItems", r.array]
    ]));

    map.set("EveSpotlightSetItem", new Map([
        ["coneColor", r.color],
        ["flareColor", r.color],
        ["name", r.string],
        ["spriteColor", r.color],
        ["spriteScale", r.vector3],
        ["transform", r.matrix]
    ]));

    map.set("EveSpriteSet", new Map([
        ["effect", r.object],
        ["name", r.string],
        ["intensity", r.float],
        ["skinned", r.boolean],
        ["sprites", r.array]
    ]));

    map.set("EveSpriteSetItem", new Map([
        ["blinkPhase", r.float],
        ["blinkRate", r.float],
        ["boneIndex", r.uint],
        ["color", r.color],
        ["falloff", r.float],
        ["maxScale", r.float],
        ["minScale", r.float],
        ["name", r.string],
        ["position", r.vector3],
        ["warpColor", r.color]
    ]));

    map.set("EveStarfield", new Map([
        ["effect", r.object],
        ["maxDist", r.float],
        ["maxFlashRate", r.float],
        ["minDist", r.float],
        ["minFlashIntensity", r.float],
        ["minFlashRate", r.float],
        ["numStars", r.uint],
        ["seed", r.uint]
    ]));

    map.set("EveStretch", new Map([
        ["curveSets", r.array],
        ["dest", r.object],
        ["destObject", r.object],
        ["length", r.object],
        ["moveCompletion", r.object],
        ["moveObject", r.object],
        ["name", r.string],
        ["progressCurve", r.object],
        ["source", r.object],
        ["sourceLights", r.array],
        ["sourceObject", r.object],
        ["stretchObject", r.object],
        ["useCurveLod", r.boolean]
    ]));

    map.set("EveStretch2", new Map([
        ["destinationEmitter", r.object],
        ["destinationLight", r.object],
        ["effect", r.object],
        ["loop", r.object],
        ["name", r.string],
        ["sourceEmitter", r.object],
        ["sourceLight", r.object],
        ["quadCount", r.uint]
    ]));

    map.set("EveTacticalOverlay", new Map([
        ["anchorEffect", r.object],
        ["arcSegmentMultiplier", r.float],
        ["connectorEffect", r.object],
        ["segmentsLow", r.float],
        ["segmentsMedium", r.float],
        ["segmentsHigh", r.float],
        ["targetMaxSegments", r.float],
        ["velocityEffect", r.object]
    ]));

    map.set("EveTrailsSet", new Map([
        ["effect", r.object],
        ["geometryResPath", r.string]
    ]));

    map.set("EveTransform", new Map([
        ["children", r.array],
        ["curveSets", r.array],
        ["display", r.boolean],
        ["distanceBasedScaleArg1", r.float],
        ["distanceBasedScaleArg2", r.float],
        ["hideOnLowQuality", r.boolean],
        ["name", r.string],
        ["mesh", r.object],
        ["meshLod", r.object],
        ["modifier", r.uint],
        ["observers", r.array],
        ["overrideBoundsMax", r.vector3],
        ["overrideBoundsMin", r.vector3],
        ["particleEmitters", r.array],
        ["particleSystems", r.array],
        ["rotation", r.vector4],
        ["scaling", r.vector3],
        ["sortValueMultiplier", r.float],
        ["translation", r.vector3],
        ["update", r.boolean],
        ["useDistanceBasedScale", r.boolean],
        ["useLodLevel", r.boolean],
        ["visibilityThreshold", r.float]
    ]));

    map.set("EveTurretFiringFX", new Map([
        ["boneName", r.string],
        ["destinationObserver", r.object],
        ["firingDelay1", r.float],
        ["firingDelay2", r.float],
        ["firingDelay3", r.float],
        ["firingDelay4", r.float],
        ["firingDurationOverride", r.float],
        ["firingPeakTime", r.float],
        ["isLoopFiring", r.boolean],
        ["maxRadius", r.float],
        ["maxScale", r.float],
        ["minRadius", r.float],
        ["minScale", r.float],
        ["name", r.string],
        ["scaleEffectTarget", r.boolean],
        ["sourceObserver", r.object],
        ["startCurveSet", r.object],
        ["stopCurveSet", r.object],
        ["stretch", r.array],
        ["useMuzzleTransform", r.boolean]
    ]));

    map.set("EveTurretSet", new Map([
        ["name", r.string],
        ["bottomClipHeight", r.float],
        ["boundingSphere", r.vector4],
        ["chooseRandomLocator", r.boolean],
        ["cyclingFireGroupCount", r.uint],
        ["firingEffectResPath", r.string],
        ["geometryResPath", r.string],
        ["impactSize", r.float],
        ["laserMissBehaviour", r.boolean],
        ["locatorName", r.string],
        ["maxCyclingFirePos", r.uint],
        ["projectileMissBehaviour", r.boolean],
        ["sysBoneHeight", r.float],
        ["sysBonePitchMax", r.float],
        ["sysBonePitchMin", r.float],
        ["sysBonePitchFactor", r.float],
        ["sysBonePitch01Factor", r.float],
        ["sysBonePitch02Factor", r.float],
        ["sysBonePitchOffset", r.float],
        ["turretEffect", r.object],
        ["updatePitchPose", r.boolean],
        ["useDynamicBounds", r.boolean],
        ["useRandomFiringDelay", r.boolean]
    ]));

    map.set("EveUiObject", new Map([
        ["boundingSphereRadius", r.float],
        ["name", r.string],
        ["mesh", r.object],
        ["modelScale", r.float]
    ]));
}
