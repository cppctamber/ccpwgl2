import {quat, vec3} from "../../global/index";
import {Tw2BaseClass} from "../../global/index";

/**
 * EveSOFDataPatternTransform
 *
 * @property {Boolean} isMirrored -
 * @property {vec3} position      -
 * @property {quat} rotation      -
 * @property {vec3} scaling       -
 */
export class EveSOFDataPatternTransform extends Tw2BaseClass
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

