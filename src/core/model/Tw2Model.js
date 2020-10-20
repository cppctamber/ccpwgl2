import { meta } from "utils";


@meta.type("Tw2Model")
export class Tw2Model
{

    @meta.struct("Tw2GeometryModel")
    modelRes = null;

    @meta.list("Tw2Bone")
    bones = [];

    @meta.plain
    @meta.isPrivate
    bonesByName = {};

    // Todo: Initialize: build bones by name

}
