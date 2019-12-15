import { vec3, quat, meta } from "global";


@meta.type("EveSOFDataHullDecalSetItem", true)
export class EveSOFDataHullDecalSetItem
{

    @meta.black.string
    name = "";

    @meta.black.uint
    boneIndex = -1;

    @meta.black.indexBuffer
    indexBuffer = [];

    @meta.black.uint
    glowColorType = 0;

    @meta.black.uint
    logoType = 0;

    @meta.black.uint
    meshIndex = 0;

    @meta.black.listOf("EveSOFDataParameter")
    parameters = [];

    @meta.black.vector3
    position = vec3.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.listOf("EveSOFDataTexture")
    textures = [];

    @meta.black.uint
    usage = 0;

    @meta.black.string
    visibilityGroup = "";

}
