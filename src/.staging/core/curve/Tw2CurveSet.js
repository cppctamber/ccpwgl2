import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveSet
 * @ccp TriCurveSet
 *
 * @parameter {Array.<Tw2ValueBinding>} bindings                    -
 * @parameter {Array.<Curve|CurveExpression|CurveSequencer>} curves -
 * @parameter {Boolean} playOnLoad                                  -
 * @parameter {Array.<Tw2CurveSetRange>} ranges                     -
 * @parameter {Number} scale                                        -
 * @parameter {Boolean} useSimTimeRebase                            -
 */
export default class Tw2CurveSet extends Tw2StagingClass
{

    bindings = [];
    curves = [];
    playOnLoad = false;
    ranges = [];
    scale = 0;
    useSimTimeRebase = false;

}

Tw2StagingClass.define(Tw2CurveSet, Type =>
{
    return {
        type: "Tw2CurveSet",
        props: {
            bindings: [["Tw2ValueBinding"]],
            curves: Type.ARRAY,
            playOnLoad: Type.BOOLEAN,
            ranges: [["Tw2CurveSetRange"]],
            scale: Type.NUMBER,
            useSimTimeRebase: Type.BOOLEAN
        }
    };
});

