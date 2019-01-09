import {vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataHull
 *
 * @parameter {Array.<EveSOFDataHullArea>} additiveAreas           -
 * @parameter {Array.<EveSOFDataHullAnimation>} animations         -
 * @parameter {vec3} audioPosition                                 -
 * @parameter {Array.<EveSOFDataHullBanner>} banners               -
 * @parameter {EveSOFDataHullBooster} booster                      -
 * @parameter {vec4} boundingSphere                                -
 * @parameter {Number} buildClass                                  -
 * @parameter {Boolean} castShadow                                 -
 * @parameter {String} category                                    -
 * @parameter {Array.<EveSOFDataHullChild>} children               -
 * @parameter {Array.<EveSOFDataHullController>} controllers       -
 * @parameter {Array.<EveSOFDataHullArea>} decalAreas              -
 * @parameter {EveSOFDataPatternPerHull} defaultPattern            -
 * @parameter {String} description                                 -
 * @parameter {Array.<EveSOFDataHullArea>} distortionAreas         -
 * @parameter {Boolean} enableDynamicBoundingSphere                -
 * @parameter {String} geometryResFilePath                         -
 * @parameter {Array.<EveSOFDataHullHazeSet>} hazeSets             -
 * @parameter {Array.<EveSOFDataHullDecal>} hullDecals             -
 * @parameter {Number} impactEffectType                            -
 * @parameter {Array.<EveSOFDataInstancedMesh>} instancedMeshes    -
 * @parameter {Boolean} isSkinned                                  -
 * @parameter {Array.<EveSOFDataHullLocatorSet>} locatorSets       -
 * @parameter {Array.<EveSOFDataHullLocator>} locatorTurrets       -
 * @parameter {String} modelRotationCurvePath                      -
 * @parameter {Array.<EveSOFDataHullArea>} opaqueAreas             -
 * @parameter {Array.<EveSOFDataHullPlaneSet>} planeSets           -
 * @parameter {vec3} shapeEllipsoidCenter                          -
 * @parameter {vec3} shapeEllipsoidRadius                          -
 * @parameter {Array.<EveSOFDataHullSpotlightSet>} spotlightSets   -
 * @parameter {Array.<EveSOFDataHullSpriteLineSet>} spriteLineSets -
 * @parameter {Array.<EveSOFDataHullSpriteSet>} spriteSets         -
 * @parameter {Array.<EveSOFDataHullArea>} transparentAreas        -
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

