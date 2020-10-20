import { meta } from "utils";
import { vec3, vec4 } from "math";


@meta.type("EveSOFDataHull")
export class EveSOFDataHull
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullArea")
    additiveAreas = [];

    @meta.list("EveSOFDataHullAnimation")
    animations = [];

    @meta.vector3
    audioPosition = vec3.create();

    @meta.list("EveSOFDataHullBanner")
    banners = [];

    @meta.struct("EveSOFDataHullBooster")
    booster = null;

    @meta.vector4
    boundingSphere = vec4.create();

    @meta.uint
    buildClass = 0;

    @meta.boolean
    castShadow = false;

    @meta.string
    category = "";

    @meta.list("EveSOFDataHullChild")
    children = [];

    @meta.list("EveSOFDataHullController")
    controllers = [];

    @meta.list("EveSOFDataHullArea")
    decalAreas = [];

    @meta.list("EveSOFDataHullDecalSet")
    decalSets = [];

    @meta.struct("EveSOFDataPatternPerHull")
    defaultPattern = null;

    @meta.list("EveSOFDataHullArea")
    depthAreas = [];

    @meta.string
    description = "";

    @meta.list("EveSOFDataHullArea")
    distortionAreas = [];

    @meta.boolean
    enableDynamicBoundingSphere = false;

    @meta.path
    geometryResFilePath = "";

    @meta.list("EveSOFDataHullHazeSet")
    hazeSets = [];

    @meta.list("EveSOFDataHullDecalSet")
    hullDecals = [];

    @meta.uint
    impactEffectType = 0;

    @meta.list("EveSOFDataInstancedMesh")
    instancedMeshes = [];

    @meta.boolean
    isSkinned = false;

    @meta.list("EveSOFDataHullLightSet")
    lightSets = [];

    @meta.list("EveSOFDataHullLocatorSet")
    locatorSets = [];

    @meta.list("EveSOFDataHullLocator")
    locatorTurrets = [];

    @meta.path
    modelRotationCurvePath = "";

    @meta.list("EveSOFDataHullArea")
    opaqueAreas = [];

    @meta.list("EveSOFDataHullPlaneSet")
    planeSets = [];

    @meta.vector3
    shapeEllipsoidCenter = vec3.create();

    @meta.vector3
    shapeEllipsoidRadius = vec3.create();

    @meta.list("EveSOFDataHullSoundEmitter")
    soundEmitters = [];

    @meta.list("EveSOFDataHullSpotlightSet")
    spotlightSets = [];

    @meta.list("EveSOFDataHullSpriteLineSet")
    spriteLineSets = [];

    @meta.list("EveSOFDataHullSpriteSet")
    spriteSets = [];

    @meta.list("EveSOFDataHullArea")
    transparentAreas = [];

    /**
     * Initializer
     */
    Initialize()
    {
        // Temporary until animations are handled in .cake files
        if (this.geometryResFilePath.includes(".cake"))
        {
            this.isSkinned = false;
        }
    }
}
