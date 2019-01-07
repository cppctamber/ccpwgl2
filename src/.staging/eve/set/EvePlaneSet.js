import {Tw2StagingClass} from "../../class";

/**
 * EvePlaneSet
 * @implements EveObjectSet
 *
 * @parameter {Tw2Effect} effect                -
 * @parameter {Boolean} hideOnLowQuality        -
 * @parameter {Number} pickBufferID             -
 * @parameter {Array.<EveObjectSetItem>} planes -
 */
export default class EvePlaneSet extends Tw2StagingClass
{

    effect = null;
    hideOnLowQuality = false;
    pickBufferID = 0;
    planes = [];

}

Tw2StagingClass.define(EvePlaneSet, Type =>
{
    return {
        type: "EvePlaneSet",
        category: "EveObjectSet",
        props: {
            effect: ["Tw2Effect"],
            hideOnLowQuality: Type.BOOLEAN,
            pickBufferID: Type.NUMBER,
            planes: [["EvePlaneSetItem"]]
        }
    };
});

