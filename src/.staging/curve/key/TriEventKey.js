import {Tw2BaseClass} from "../../class";

/**
 * TriEventKey
 * @implements CurveKey
 *
 * @parameter {Number} time  -
 * @parameter {Number} value -
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

