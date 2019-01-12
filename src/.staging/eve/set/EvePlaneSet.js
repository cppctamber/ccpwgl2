import {Tw2BaseClass} from "../../../global";

/**
 * EvePlaneSet
 * @implements EveObjectSet
 *
 * @property {Tr2Effect} effect                -
 * @property {Boolean} hideOnLowQuality        -
 * @property {Number} pickBufferID             -
 * @property {Array.<EveObjectSetItem>} planes -
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

