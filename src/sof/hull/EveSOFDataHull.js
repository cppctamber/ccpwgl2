import { meta, vec3, vec4 } from "global";


@meta.type("EveSOFDataHull", true)
export class EveSOFDataHull
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataHullArea")
    additiveAreas = [];

    @meta.black.listOf("EveSOFDataHullAnimation")
    animations = [];

    @meta.black.vector3
    audioPosition = vec3.create();

    @meta.black.listOf("EveSOFDataHullBanner")
    banners = [];

    @meta.black.objectOf("EveSOFDataHullBooster")
    booster = null;

    @meta.black.vector4
    boundingSphere = vec4.create();

    @meta.black.uint
    buildClass = 0;

    @meta.black.boolean
    castShadow = false;

    @meta.black.string
    category = "";

    @meta.black.listOf("EveSOFDataHullChild")
    children = [];

    @meta.black.listOf("EveSOFDataHullController")
    controllers = [];

    @meta.black.listOf("EveSOFDataHullArea")
    decalAreas = [];

    @meta.black.listOf("EveSOFDataHullDecalSet")
    decalSets = [];

    @meta.black.objectOf("EveSOFDataPatternPerHull")
    defaultPattern = null;

    @meta.black.listOf("EveSOFDataHullArea")
    depthAreas = [];

    @meta.black.string
    description = "";

    @meta.black.listOf("EveSOFDataHullArea")
    distortionAreas = [];

    @meta.black.boolean
    enableDynamicBoundingSphere = false;

    @meta.black.path
    geometryResFilePath = "";

    @meta.black.listOf("EveSOFDataHullHazeSet")
    hazeSets = [];

    @meta.black.listOf("EveSOFDataHullDecalSet")
    hullDecals = [];

    @meta.black.uint
    impactEffectType = 0;

    @meta.black.listOf("EveSOFDataInstancedMesh")
    instancedMeshes = [];

    @meta.black.boolean
    isSkinned = false;

    @meta.black.listOf("EveSOFDataHullLightSet")
    lightSets = [];

    @meta.black.listOf("EveSOFDataHullLocatorSet")
    locatorSets = [];

    @meta.black.listOf("EveSOFDataHullLocator")
    locatorTurrets = [];

    @meta.black.path
    modelRotationCurvePath = "";

    @meta.black.listOf("EveSOFDataHullArea")
    opaqueAreas = [];

    @meta.black.listOf("EveSOFDataHullPlaneSet")
    planeSets = [];

    @meta.black.vector3
    shapeEllipsoidCenter = vec3.create();

    @meta.black.vector3
    shapeEllipsoidRadius = vec3.create();

    @meta.black.listOf("EveSOFDataHullSoundEmitter")
    soundEmitters = [];

    @meta.black.listOf("EveSOFDataHullSpotlightSet")
    spotlightSets = [];

    @meta.black.listOf("EveSOFDataHullSpriteLineSet")
    spriteLineSets = [];

    @meta.black.listOf("EveSOFDataHullSpriteSet")
    spriteSets = [];

    @meta.black.listOf("EveSOFDataHullArea")
    transparentAreas = [];

}
