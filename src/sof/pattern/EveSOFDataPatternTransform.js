import { meta, quat, vec3 } from "global";


@meta.ctor("EveSOFDataPatternTransform", true)
export class EveSOFDataPatternTransform
{

    @meta.boolean
    isMirrored = false;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

}
