import {Tw2BaseClass} from "../../../global";

/**
 * AudEventKey
 * @implements CurveKey
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
export default class AudEventKey extends Tw2BaseClass
{

    time = 0;
    value = 0;

}

Tw2BaseClass.define(AudEventKey, Type =>
{
    return {
        isStaging: true,
        type: "AudEventKey",
        category: "CurveKey",
        props: {
            time: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});

