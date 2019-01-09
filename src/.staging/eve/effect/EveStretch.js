import {Tw2BaseClass} from "../../class";

/**
 * EveStretch
 *
 * @parameter {Array.<TriCurveSet>} curveSets -
 * @parameter {Curve|CurveAdapter} dest       -
 * @parameter {EveTransform} destObject       -
 * @parameter {TriFloat} length               -
 * @parameter {TriCurveSet} moveCompletion    -
 * @parameter {EveTransform} moveObject       -
 * @parameter {Tr2CurveScalar} progressCurve  -
 * @parameter {Curve|CurveAdapter} source     -
 * @parameter {Array} sourceLights            -
 * @parameter {EveTransform} sourceObject     -
 * @parameter {EveTransform} stretchObject    -
 * @parameter {Boolean} useCurveLod           -
 */
export default class EveStretch extends Tw2BaseClass
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

Tw2BaseClass.define(EveStretch, Type =>
{
    return {
        isStaging: true,
        type: "EveStretch",
        props: {
            curveSets: [["TriCurveSet"]],
            dest: ["Tr2CurveConstant", "Tr2TranslationAdapter"],
            destObject: ["EveTransform"],
            length: ["TriFloat"],
            moveCompletion: ["TriCurveSet"],
            moveObject: ["EveTransform"],
            progressCurve: ["Tr2CurveScalar"],
            source: ["Tr2CurveConstant", "Tr2TranslationAdapter"],
            sourceLights: Type.ARRAY,
            sourceObject: ["EveTransform"],
            stretchObject: ["EveTransform"],
            useCurveLod: Type.BOOLEAN
        }
    };
});

