import { vec3, vec4 } from "../../global";

/**
 * EveSOFDataHull
 *
 * @property {String} name                                        -
 * @property {Array.<EveSOFDataHullArea>} additiveAreas           -
 * @property {Array.<EveSOFDataHullAnimation>} animations         -
 * @property {vec3} audioPosition                                 -
 * @property {Array.<EveSOFDataHullBanner>} banners               -
 * @property {EveSOFDataHullBooster} booster                      -
 * @property {vec4} boundingSphere                                -
 * @property {Number} buildClass                                  -
 * @property {Boolean} castShadow                                 -
 * @property {String} category                                    -
 * @property {Array.<EveSOFDataHullChild>} children               -
 * @property {Array.<EveSOFDataHullController>} controllers       -
 * @property {Array.<EveSOFDataHullArea>} decalAreas              -
 * @property {Array.<EveSOFDataHullDecalSet>} decalSets           -
 * @property {EveSOFDataPatternPerHull} defaultPattern            -
 * @property {String} description                                 -
 * @property {Array.<EveSOFDataHullArea>} distortionAreas         -
 * @property {Boolean} enableDynamicBoundingSphere                -
 * @property {String} geometryResFilePath                         -
 * @property {Array.<EveSOFDataHullHazeSet>} hazeSets             -
 * @property {Array.<EveSOFDataHullDecalSet>} hullDecals          -
 * @property {Number} impactEffectType                            -
 * @property {Array.<EveSOFDataInstancedMesh>} instancedMeshes    -
 * @property {Boolean} isSkinned                                  -
 * @property {Array.<EveSOFDataHullLightSet>} lightSets           -
 * @property {Array.<EveSOFDataHullLocatorSet>} locatorSets       -
 * @property {Array.<EveSOFDataHullLocator>} locatorTurrets       -
 * @property {String} modelRotationCurvePath                      -
 * @property {Array.<EveSOFDataHullArea>} opaqueAreas             -
 * @property {Array.<EveSOFDataHullPlaneSet>} planeSets           -
 * @property {vec3} shapeEllipsoidCenter                          -
 * @property {vec3} shapeEllipsoidRadius                          -
 * @property {Array.<EveSOFDataHullSoundEmitter>} soundEmitters   -
 * @property {Array.<EveSOFDataHullSpotlightSet>} spotlightSets   -
 * @property {Array.<EveSOFDataHullSpriteLineSet>} spriteLineSets -
 * @property {Array.<EveSOFDataHullSpriteSet>} spriteSets         -
 * @property {Array.<EveSOFDataHullArea>} transparentAreas        -
 */
export class EveSOFDataHull
{
    name = "";
    additiveAreas = [];
    animations = [];
    audioPosition = vec3.create();
    banners = [];
    booster = null;
    boundingSphere = vec4.create();
    buildClass = 0;
    castShadow = false;
    category = "";
    children = [];
    controllers = [];
    decalAreas = [];
    decalSets = [];
    defaultPattern = null;
    description = "";
    distortionAreas = [];
    enableDynamicBoundingSphere = false;
    geometryResFilePath = "";
    hazeSets = [];
    hullDecals = [];
    impactEffectType = 0;
    instancedMeshes = [];
    isSkinned = false;
    lightSets = [];
    locatorSets = [];
    locatorTurrets = [];
    modelRotationCurvePath = "";
    opaqueAreas = [];
    planeSets = [];
    shapeEllipsoidCenter = vec3.create();
    shapeEllipsoidRadius = vec3.create();
    soundEmitters = [];
    spotlightSets = [];
    spriteLineSets = [];
    spriteSets = [];
    transparentAreas = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "additiveAreas", r.array ],
            [ "animations", r.array ],
            [ "audioPosition", r.vector3 ],
            [ "banners", r.array ],
            [ "booster", r.object ],
            [ "boundingSphere", r.vector4 ],
            [ "buildClass", r.uint ],
            [ "castShadow", r.boolean ],
            [ "category", r.string ],
            [ "children", r.array ],
            [ "controllers", r.array ],
            [ "decalAreas", r.array ],
            [ "decalSets", r.array ],
            [ "defaultPattern", r.object ],
            [ "depthAreas", r.array ],
            [ "description", r.string ],
            [ "distortionAreas", r.array ],
            [ "enableDynamicBoundingSphere", r.boolean ],
            [ "geometryResFilePath", r.path ],
            [ "hazeSets", r.array ],
            [ "hullDecals", r.array ],
            [ "impactEffectType", r.uint ],
            [ "instancedMeshes", r.array ],
            [ "isSkinned", r.boolean ],
            [ "lightSets", r.array ],
            [ "locatorSets", r.array ],
            [ "locatorTurrets", r.array ],
            [ "name", r.string ],
            [ "opaqueAreas", r.array ],
            [ "planeSets", r.array ],
            [ "modelRotationCurvePath", r.string ],
            [ "shapeEllipsoidCenter", r.vector3 ],
            [ "shapeEllipsoidRadius", r.vector3 ],
            [ "soundEmitters", r.array ],
            [ "spotlightSets", r.array ],
            [ "spriteLineSets", r.array ],
            [ "spriteSets", r.array ],
            [ "transparentAreas", r.array ],
        ];
    }
}
