import { meta, quat, vec3 } from "global";


@meta.type("EveSOFDataPatternTransform", true)
export class EveSOFDataPatternTransform
{

    @meta.black.boolean
    isMirrored = false;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

}
