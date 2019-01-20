import {vec4} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataFactionPlaneSet
 *
 * @property {vec4} color        -
 * @property {Number} groupIndex -
 */
export default class EveSOFDataFactionPlaneSet extends Tw2BaseClass
{

    color = vec4.create();
    groupIndex = 0;

}

Tw2BaseClass.define(EveSOFDataFactionPlaneSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataFactionPlaneSet",
        props: {
            color: Type.RGBA_LINEAR,
            groupIndex: Type.NUMBER
        }
    };
});

