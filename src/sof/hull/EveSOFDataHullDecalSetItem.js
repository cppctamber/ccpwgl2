import { vec3, quat, meta } from "global";


@meta.ctor("EveSOFDataHullDecalSetItem")
export class EveSOFDataHullDecalSetItem
{

    @meta.string
    name = "";

    @meta.uint
    boneIndex = -1;

    @meta.indexBuffer
    indexBuffer = [];

    @meta.uint
    glowColorType = 0;

    @meta.uint
    logoType = 0;

    @meta.uint
    meshIndex = 0;

    @meta.list("EveSOFDataParameter")
    parameters = [];

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.list("EveSOFDataTexture")
    textures = [];

    @meta.uint
    usage = 0;

    @meta.string
    visibilityGroup = "";

}
