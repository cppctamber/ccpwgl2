import {Tw2BaseClass} from "../../class";

/**
 * EveTurretFiringFX
 *
 * @parameter {String} boneName                        -
 * @parameter {TriObserverLocal} destinationObserver   -
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
 * @parameter {TriObserverLocal} sourceObserver        -
 * @parameter {TriCurveSet} startCurveSet              -
 * @parameter {TriCurveSet} stopCurveSet               -
 * @parameter {Array.<EveStretch|EveStretch2>} stretch -
 * @parameter {Boolean} useMuzzleTransform             -
 */
export default class EveTurretFiringFX extends Tw2BaseClass
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

Tw2BaseClass.define(EveTurretFiringFX, Type =>
{
    return {
        isStaging: true,
        type: "EveTurretFiringFX",
        props: {
            boneName: Type.STRING,
            destinationObserver: ["TriObserverLocal"],
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
            sourceObserver: ["TriObserverLocal"],
            startCurveSet: ["TriCurveSet"],
            stopCurveSet: ["TriCurveSet"],
            stretch: [["EveStretch", "EveStretch2"]],
            useMuzzleTransform: Type.BOOLEAN
        }
    };
});

