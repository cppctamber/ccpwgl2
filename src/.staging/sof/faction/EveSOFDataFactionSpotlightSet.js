import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataFactionSpotlightSet
 *
 * @property {vec4} coneColor    -
 * @property {vec4} flareColor   -
 * @property {Number} groupIndex -
 * @property {vec4} spriteColor  -
 */
export default class EveSOFDataFactionSpotlightSet extends Tw2BaseClass
{

    coneColor = vec4.create();
    flareColor = vec4.create();
    groupIndex = 0;
    spriteColor = vec4.create();

}

Tw2BaseClass.define(EveSOFDataFactionSpotlightSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataFactionSpotlightSet",
        props: {
            coneColor: Type.RGBA_LINEAR,
            flareColor: Type.RGBA_LINEAR,
            groupIndex: Type.NUMBER,
            spriteColor: Type.RGBA_LINEAR
        }
    };
});

