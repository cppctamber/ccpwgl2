import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ActionPlayCurveSet
 * @implements StateAction
 *
 * @property {String} curveSetName -
 * @property {String} rangeName    -
 * @property {Boolean} syncToRange -
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

