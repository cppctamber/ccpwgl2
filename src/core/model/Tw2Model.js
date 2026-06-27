import { meta } from "utils";


@meta.type("Tw2Model")
@meta.wgl.define("Tw2Model")
export class Tw2Model
{

    @meta.struct("Tw2GeometryModel")
    modelRes = null;

    @meta.list("Tw2Bone")
    bones = [];

    @meta.plain
    @meta.isPrivate
    bonesByName = {};

    // TODO: Review how bones by index should be initialized and maintained
    bonesByIndex = [];

}
