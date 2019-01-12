import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveTurretSet
 * @implements EveObjectSet
 *
 * @property {Number} bottomClipHeight         -
 * @property {vec4} boundingSphere             -
 * @property {Boolean} chooseRandomLocator     -
 * @property {Number} cyclingFireGroupCount    -
 * @property {String} firingEffectResPath      -
 * @property {String} geometryResPath          -
 * @property {Number} impactSize               -
 * @property {Boolean} laserMissBehaviour      -
 * @property {String} locatorName              -
 * @property {Number} maxCyclingFirePos        -
 * @property {Boolean} projectileMissBehaviour -
 * @property {Number} sysBoneHeight            -
 * @property {Number} sysBonePitch01Factor     -
 * @property {Number} sysBonePitch02Factor     -
 * @property {Number} sysBonePitchFactor       -
 * @property {Number} sysBonePitchMax          -
 * @property {Number} sysBonePitchMin          -
 * @property {Number} sysBonePitchOffset       -
 * @property {Tr2Effect} turretEffect          -
 * @property {Boolean} updatePitchPose         -
 * @property {Boolean} useDynamicBounds        -
 * @property {Boolean} useRandomFiringDelay    -
 */
export default class EveTurretSet extends Tw2BaseClass
{

    bottomClipHeight = 0;
    boundingSphere = vec4.create();
    chooseRandomLocator = false;
    cyclingFireGroupCount = 0;
    firingEffectResPath = "";
    geometryResPath = "";
    impactSize = 0;
    laserMissBehaviour = false;
    locatorName = "";
    maxCyclingFirePos = 0;
    projectileMissBehaviour = false;
    sysBoneHeight = 0;
    sysBonePitch01Factor = 0;
    sysBonePitch02Factor = 0;
    sysBonePitchFactor = 0;
    sysBonePitchMax = 0;
    sysBonePitchMin = 0;
    sysBonePitchOffset = 0;
    turretEffect = null;
    updatePitchPose = false;
    useDynamicBounds = false;
    useRandomFiringDelay = false;

}

Tw2BaseClass.define(EveTurretSet, Type =>
{
    return {
        isStaging: true,
        type: "EveTurretSet",
        category: "EveObjectSet",
        props: {
            bottomClipHeight: Type.NUMBER,
            boundingSphere: Type.VECTOR4,
            chooseRandomLocator: Type.BOOLEAN,
            cyclingFireGroupCount: Type.NUMBER,
            firingEffectResPath: Type.PATH,
            geometryResPath: Type.PATH,
            impactSize: Type.NUMBER,
            laserMissBehaviour: Type.BOOLEAN,
            locatorName: Type.STRING,
            maxCyclingFirePos: Type.NUMBER,
            projectileMissBehaviour: Type.BOOLEAN,
            sysBoneHeight: Type.NUMBER,
            sysBonePitch01Factor: Type.NUMBER,
            sysBonePitch02Factor: Type.NUMBER,
            sysBonePitchFactor: Type.NUMBER,
            sysBonePitchMax: Type.NUMBER,
            sysBonePitchMin: Type.NUMBER,
            sysBonePitchOffset: Type.NUMBER,
            turretEffect: ["Tr2Effect"],
            updatePitchPose: Type.BOOLEAN,
            useDynamicBounds: Type.BOOLEAN,
            useRandomFiringDelay: Type.BOOLEAN
        }
    };
});

