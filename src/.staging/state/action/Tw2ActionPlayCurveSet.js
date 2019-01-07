import {Tw2StagingClass} from "../../class";

/**
 * Tw2ActionPlayCurveSet
 * @ccp Tr2ActionPlayCurveSet
 * @implements StateAction
 *
 * @parameter {String} curveSetName -
 * @parameter {String} rangeName    -
 * @parameter {Boolean} syncToRange -
 */
export default class Tw2ActionPlayCurveSet extends Tw2StagingClass
{

    curveSetName = "";
    rangeName = "";
    syncToRange = false;

}

Tw2StagingClass.define(Tw2ActionPlayCurveSet, Type =>
{
    return {
        type: "Tw2ActionPlayCurveSet",
        category: "StateAction",
        props: {
            curveSetName: Type.STRING,
            rangeName: Type.STRING,
            syncToRange: Type.BOOLEAN
        }
    };
});

