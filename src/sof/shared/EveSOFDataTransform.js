import { meta, quat, vec3 } from "global";


@meta.type("EveSOFDataTransform", true)
export class EveSOFDataTransform
{

    @meta.black.uint
    boneIndex = -1;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

}
