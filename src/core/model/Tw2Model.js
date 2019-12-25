import { meta } from "global";


@meta.type("Tw2Model")
export class Tw2Model
{

    @meta.objectOf("Tw2GeometryModel")
    modelRes = null;

    @meta.listOf("Tw2Bone")
    bones = [];

    @meta.plainOf("Tw2Bone")
    bonesByName = {};

}
