import {Tw2StagingClass} from "../../class";

/**
 * Tw2EventKey
 * @ccp TriEventKey
 * @implements CurveKey
 *
 * @parameter {Number} time  -
 * @parameter {Number} value -
 */
export default class Tw2EventKey extends Tw2StagingClass
{

    time = 0;
    value = 0;

}

Tw2StagingClass.define(Tw2EventKey, Type =>
{
    return {
        type: "Tw2EventKey",
        category: "CurveKey",
        props: {
            time: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});

