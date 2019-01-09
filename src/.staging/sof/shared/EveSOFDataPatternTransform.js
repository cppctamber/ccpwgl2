import {quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataPatternTransform
 *
 * @parameter {Boolean} isMirrored -
 * @parameter {vec3} position      -
 * @parameter {quat} rotation      -
 * @parameter {vec3} scaling       -
 */
export default class EveSOFDataPatternTransform extends Tw2BaseClass
{

    isMirrored = false;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

Tw2BaseClass.define(EveSOFDataPatternTransform, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataPatternTransform",
        props: {
            isMirrored: Type.BOOLEAN,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING
        }
    };
});

