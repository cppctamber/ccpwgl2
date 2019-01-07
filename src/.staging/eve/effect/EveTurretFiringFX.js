import {Tw2StagingClass} from "../../class";

/**
 * EveTurretFiringFX
 *
 * @parameter {String} boneName                        -
 * @parameter {Tw2ObserverLocal} destinationObserver   -
 * @parameter {Number} firingDelay1                    -
 * @parameter {Number} firingDelay2                    -
 * @parameter {Number} firingDelay3                    -
 * @parameter {Number} firingDelay4                    -
 * @parameter {Number} firingDurationOverride          -
 * @parameter {Number} firingPeakTime                  -
 * @parameter {Boolean} isLoopFiring                   -
 * @parameter {Number} maxRadius                       -
 * @parameter {Number} maxScale                        -
 * @parameter {Number} minRadius                       -
 * @parameter {Number} minScale                        -
 * @parameter {Boolean} scaleEffectTarget              -
 * @parameter {Tw2ObserverLocal} sourceObserver        -
 * @parameter {Tw2CurveSet} startCurveSet              -
 * @parameter {Tw2CurveSet} stopCurveSet               -
 * @parameter {Array.<EveStretch|EveStretch2>} stretch -
 * @parameter {Boolean} useMuzzleTransform             -
 */
export default class EveTurretFiringFX extends Tw2StagingClass
{

    boneName = "";
    destinationObserver = null;
    firingDelay1 = 0;
    firingDelay2 = 0;
    firingDelay3 = 0;
    firingDelay4 = 0;
    firingDurationOverride = 0;
    firingPeakTime = 0;
    isLoopFiring = false;
    maxRadius = 0;
    maxScale = 0;
    minRadius = 0;
    minScale = 0;
    scaleEffectTarget = false;
    sourceObserver = null;
    startCurveSet = null;
    stopCurveSet = null;
    stretch = [];
    useMuzzleTransform = false;

}

Tw2StagingClass.define(EveTurretFiringFX, Type =>
{
    return {
        type: "EveTurretFiringFX",
        props: {
            boneName: Type.STRING,
            destinationObserver: ["Tw2ObserverLocal"],
            firingDelay1: Type.NUMBER,
            firingDelay2: Type.NUMBER,
            firingDelay3: Type.NUMBER,
            firingDelay4: Type.NUMBER,
            firingDurationOverride: Type.NUMBER,
            firingPeakTime: Type.NUMBER,
            isLoopFiring: Type.BOOLEAN,
            maxRadius: Type.NUMBER,
            maxScale: Type.NUMBER,
            minRadius: Type.NUMBER,
            minScale: Type.NUMBER,
            scaleEffectTarget: Type.BOOLEAN,
            sourceObserver: ["Tw2ObserverLocal"],
            startCurveSet: ["Tw2CurveSet"],
            stopCurveSet: ["Tw2CurveSet"],
            stretch: [["EveStretch", "EveStretch2"]],
            useMuzzleTransform: Type.BOOLEAN
        }
    };
});

