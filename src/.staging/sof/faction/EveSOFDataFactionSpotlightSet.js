import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataFactionSpotlightSet
 *
 * @parameter {vec4} coneColor    -
 * @parameter {vec4} flareColor   -
 * @parameter {Number} groupIndex -
 * @parameter {vec4} spriteColor  -
 */
export default class EveSOFDataFactionSpotlightSet extends Tw2StagingClass
{

    coneColor = vec4.create();
    flareColor = vec4.create();
    groupIndex = 0;
    spriteColor = vec4.create();

}

Tw2StagingClass.define(EveSOFDataFactionSpotlightSet, Type =>
{
    return {
        type: "EveSOFDataFactionSpotlightSet",
        props: {
            coneColor: Type.RGBA_LINEAR,
            flareColor: Type.RGBA_LINEAR,
            groupIndex: Type.NUMBER,
            spriteColor: Type.RGBA_LINEAR
        }
    };
});

