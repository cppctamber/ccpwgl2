import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataFactionPlaneSet
 *
 * @parameter {vec4} color        -
 * @parameter {Number} groupIndex -
 */
export default class EveSOFDataFactionPlaneSet extends Tw2StagingClass
{

    color = vec4.create();
    groupIndex = 0;

}

Tw2StagingClass.define(EveSOFDataFactionPlaneSet, Type =>
{
    return {
        type: "EveSOFDataFactionPlaneSet",
        props: {
            color: Type.RGBA_LINEAR,
            groupIndex: Type.NUMBER
        }
    };
});

