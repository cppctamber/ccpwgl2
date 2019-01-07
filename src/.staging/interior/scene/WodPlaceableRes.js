import {Tw2StagingClass} from "../../class";

/**
 * WodPlaceableRes
 *
 * @parameter {Number} farFadeDistance  -
 * @parameter {Number} nearFadeDistance -
 * @parameter {Tw2Model} visualModel    -
 */
export default class WodPlaceableRes extends Tw2StagingClass
{

    farFadeDistance = 0;
    nearFadeDistance = 0;
    visualModel = null;

}

Tw2StagingClass.define(WodPlaceableRes, Type =>
{
    return {
        type: "WodPlaceableRes",
        props: {
            farFadeDistance: Type.NUMBER,
            nearFadeDistance: Type.NUMBER,
            visualModel: ["Tw2Model"]
        }
    };
});

