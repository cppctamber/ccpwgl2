import {Tw2BaseClass} from "../../class";

/**
 * TriCurveSet
 *
 * @parameter {Array.<TriValueBinding>} bindings                    -
 * @parameter {Array.<Curve|CurveExpression|CurveSequencer>} curves -
 * @parameter {Boolean} playOnLoad                                  -
 * @parameter {Array.<Tr2CurveSetRange>} ranges                     -
 * @parameter {Number} scale                                        -
 * @parameter {Boolean} useSimTimeRebase                            -
 */
export default class TriCurveSet extends Tw2BaseClass
{

    bindings = [];
    curves = [];
    playOnLoad = false;
    ranges = [];
    scale = 0;
    useSimTimeRebase = false;

}

Tw2BaseClass.define(TriCurveSet, Type =>
{
    return {
        isStaging: true,
        type: "TriCurveSet",
        props: {
            bindings: [["TriValueBinding"]],
            curves: Type.ARRAY,
            playOnLoad: Type.BOOLEAN,
            ranges: [["Tr2CurveSetRange"]],
            scale: Type.NUMBER,
            useSimTimeRebase: Type.BOOLEAN
        }
    };
});

