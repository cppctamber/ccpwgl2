import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataTransform
 *
 * @parameter {Number} boneIndex -
 * @parameter {vec3} position    -
 * @parameter {quat} rotation    -
 */
export default class EveSOFDataTransform extends Tw2StagingClass
{

    boneIndex = 0;
    position = vec3.create();
    rotation = quat.create();

}

Tw2StagingClass.define(EveSOFDataTransform, Type =>
{
    return {
        type: "EveSOFDataTransform",
        props: {
            boneIndex: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION
        }
    };
});

