import {Tw2BaseClass} from "../../../global";

/**
 * WodPlaceableRes
 *
 * @property {Number} farFadeDistance  -
 * @property {Number} nearFadeDistance -
 * @property {Tr2Model} visualModel    -
 */
export default class WodPlaceableRes extends Tw2BaseClass
{

    farFadeDistance = 0;
    nearFadeDistance = 0;
    visualModel = null;

}

Tw2BaseClass.define(WodPlaceableRes, Type =>
{
    return {
        isStaging: true,
        type: "WodPlaceableRes",
        props: {
            farFadeDistance: Type.NUMBER,
            nearFadeDistance: Type.NUMBER,
            visualModel: ["Tr2Model"]
        }
    };
});

