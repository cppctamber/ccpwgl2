import {Tw2BaseClass} from "../../class";

/**
 * EvePlaneSet
 * @implements EveObjectSet
 *
 * @parameter {Tr2Effect} effect                -
 * @parameter {Boolean} hideOnLowQuality        -
 * @parameter {Number} pickBufferID             -
 * @parameter {Array.<EveObjectSetItem>} planes -
 */
export default class EvePlaneSet extends Tw2BaseClass
{

    effect = null;
    hideOnLowQuality = false;
    pickBufferID = 0;
    planes = [];

}

Tw2BaseClass.define(EvePlaneSet, Type =>
{
    return {
        isStaging: true,
        type: "EvePlaneSet",
        category: "EveObjectSet",
        props: {
            effect: ["Tr2Effect"],
            hideOnLowQuality: Type.BOOLEAN,
            pickBufferID: Type.NUMBER,
            planes: [["EvePlaneSetItem"]]
        }
    };
});

