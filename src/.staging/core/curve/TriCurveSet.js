import {Tw2BaseClass} from "../../../global";

/**
 * TriCurveSet
 *
 * @property {Array.<TriValueBinding>} bindings                    -
 * @property {Array.<Curve|CurveExpression|CurveSequencer>} curves -
 * @property {Boolean} playOnLoad                                  -
 * @property {Array.<Tr2CurveSetRange>} ranges                     -
 * @property {Number} scale                                        -
 * @property {Boolean} useSimTimeRebase                            -
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

