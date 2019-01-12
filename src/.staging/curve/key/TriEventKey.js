import {Tw2BaseClass} from "../../../global";

/**
 * TriEventKey
 * @implements CurveKey
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
export default class TriEventKey extends Tw2BaseClass
{

    time = 0;
    value = 0;

}

Tw2BaseClass.define(TriEventKey, Type =>
{
    return {
        isStaging: true,
        type: "TriEventKey",
        category: "CurveKey",
        props: {
            time: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});

