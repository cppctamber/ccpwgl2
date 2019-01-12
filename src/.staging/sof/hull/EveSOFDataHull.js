import {vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataHull
 *
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
 * @property {EveSOFDataPatternPerHull} defaultPattern            -
 * @property {String} description                                 -
 * @property {Array.<EveSOFDataHullArea>} distortionAreas         -
 * @property {Boolean} enableDynamicBoundingSphere                -
 * @property {String} geometryResFilePath                         -
 * @property {Array.<EveSOFDataHullHazeSet>} hazeSets             -
 * @property {Array.<EveSOFDataHullDecal>} hullDecals             -
 * @property {Number} impactEffectType                            -
 * @property {Array.<EveSOFDataInstancedMesh>} instancedMeshes    -
 * @property {Boolean} isSkinned                                  -
 * @property {Array.<EveSOFDataHullLocatorSet>} locatorSets       -
 * @property {Array.<EveSOFDataHullLocator>} locatorTurrets       -
 * @property {String} modelRotationCurvePath                      -
 * @property {Array.<EveSOFDataHullArea>} opaqueAreas             -
 * @property {Array.<EveSOFDataHullPlaneSet>} planeSets           -
 * @property {vec3} shapeEllipsoidCenter                          -
 * @property {vec3} shapeEllipsoidRadius                          -
 * @property {Array.<EveSOFDataHullSpotlightSet>} spotlightSets   -
 * @property {Array.<EveSOFDataHullSpriteLineSet>} spriteLineSets -
 * @property {Array.<EveSOFDataHullSpriteSet>} spriteSets         -
 * @property {Array.<EveSOFDataHullArea>} transparentAreas        -
 */
export default class EveSOFDataHull extends Tw2BaseClass
{

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
    locatorSets = [];
    locatorTurrets = [];
    modelRotationCurvePath = "";
    opaqueAreas = [];
    planeSets = [];
    shapeEllipsoidCenter = vec3.create();
    shapeEllipsoidRadius = vec3.create();
    spotlightSets = [];
    spriteLineSets = [];
    spriteSets = [];
    transparentAreas = [];

}

Tw2BaseClass.define(EveSOFDataHull, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHull",
        props: {
            additiveAreas: [["EveSOFDataHullArea"]],
            animations: [["EveSOFDataHullAnimation"]],
            audioPosition: Type.TR_TRANSLATION,
            banners: [["EveSOFDataHullBanner"]],
            booster: ["EveSOFDataHullBooster"],
            boundingSphere: Type.VECTOR4,
            buildClass: Type.NUMBER,
            castShadow: Type.BOOLEAN,
            category: Type.STRING,
            children: [["EveSOFDataHullChild"]],
            controllers: [["EveSOFDataHullController"]],
            decalAreas: [["EveSOFDataHullArea"]],
            defaultPattern: ["EveSOFDataPatternPerHull"],
            description: Type.STRING,
            distortionAreas: [["EveSOFDataHullArea"]],
            enableDynamicBoundingSphere: Type.BOOLEAN,
            geometryResFilePath: Type.PATH,
            hazeSets: [["EveSOFDataHullHazeSet"]],
            hullDecals: [["EveSOFDataHullDecal"]],
            impactEffectType: Type.NUMBER,
            instancedMeshes: [["EveSOFDataInstancedMesh"]],
            isSkinned: Type.BOOLEAN,
            locatorSets: [["EveSOFDataHullLocatorSet"]],
            locatorTurrets: [["EveSOFDataHullLocator"]],
            modelRotationCurvePath: Type.PATH,
            opaqueAreas: [["EveSOFDataHullArea"]],
            planeSets: [["EveSOFDataHullPlaneSet"]],
            shapeEllipsoidCenter: Type.VECTOR3,
            shapeEllipsoidRadius: Type.VECTOR3,
            spotlightSets: [["EveSOFDataHullSpotlightSet"]],
            spriteLineSets: [["EveSOFDataHullSpriteLineSet"]],
            spriteSets: [["EveSOFDataHullSpriteSet"]],
            transparentAreas: [["EveSOFDataHullArea"]]
        }
    };
});

