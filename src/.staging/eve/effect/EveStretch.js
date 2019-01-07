import {Tw2StagingClass} from "../../class";

/**
 * EveStretch
 *
 * @parameter {Array.<Tw2CurveSet>} curveSets -
 * @parameter {Curve|CurveAdapter} dest       -
 * @parameter {EveTransform} destObject       -
 * @parameter {Tw2Float} length               -
 * @parameter {Tw2CurveSet} moveCompletion    -
 * @parameter {EveTransform} moveObject       -
 * @parameter {Tw2CurveScalar} progressCurve  -
 * @parameter {Curve|CurveAdapter} source     -
 * @parameter {Array} sourceLights            -
 * @parameter {EveTransform} sourceObject     -
 * @parameter {EveTransform} stretchObject    -
 * @parameter {Boolean} useCurveLod           -
 */
export default class EveStretch extends Tw2StagingClass
{

    curveSets = [];
    dest = null;
    destObject = null;
    length = null;
    moveCompletion = null;
    moveObject = null;
    progressCurve = null;
    source = null;
    sourceLights = [];
    sourceObject = null;
    stretchObject = null;
    useCurveLod = false;

}

Tw2StagingClass.define(EveStretch, Type =>
{
    return {
        type: "EveStretch",
        props: {
            curveSets: [["Tw2CurveSet"]],
            dest: ["Tw2CurveConstant", "Tw2TranslationAdapter"],
            destObject: ["EveTransform"],
            length: ["Tw2Float"],
            moveCompletion: ["Tw2CurveSet"],
            moveObject: ["EveTransform"],
            progressCurve: ["Tw2CurveScalar"],
            source: ["Tw2CurveConstant", "Tw2TranslationAdapter"],
            sourceLights: Type.ARRAY,
            sourceObject: ["EveTransform"],
            stretchObject: ["EveTransform"],
            useCurveLod: Type.BOOLEAN
        }
    };
});

