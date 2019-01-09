import {Tw2BaseClass} from "../../class";

/**
 * Tr2ActionPlayCurveSet
 * @implements StateAction
 *
 * @parameter {String} curveSetName -
 * @parameter {String} rangeName    -
 * @parameter {Boolean} syncToRange -
 */
export default class Tr2ActionPlayCurveSet extends Tw2BaseClass
{

    curveSetName = "";
    rangeName = "";
    syncToRange = false;

}

Tw2BaseClass.define(Tr2ActionPlayCurveSet, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionPlayCurveSet",
        category: "StateAction",
        props: {
            curveSetName: Type.STRING,
            rangeName: Type.STRING,
            syncToRange: Type.BOOLEAN
        }
    };
});

