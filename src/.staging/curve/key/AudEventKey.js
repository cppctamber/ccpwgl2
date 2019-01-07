import {Tw2StagingClass} from "../../class";

/**
 * AudEventKey
 * @implements CurveKey
 *
 * @parameter {Number} time  -
 * @parameter {Number} value -
 */
export default class AudEventKey extends Tw2StagingClass
{

    time = 0;
    value = 0;

}

Tw2StagingClass.define(AudEventKey, Type =>
{
    return {
        type: "AudEventKey",
        category: "CurveKey",
        props: {
            time: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});

