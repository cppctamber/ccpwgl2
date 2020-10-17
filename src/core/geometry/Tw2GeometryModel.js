import { meta } from "utils";


@meta.ctor("Tw2GeometryModel")
export class Tw2GeometryModel
{

    @meta.string
    name = "";

    @meta.list("Tw2GeometryMeshBinding")
    meshBindings = [];

    @meta.struct("Tw2GeometrySkeleton")
    skeleton = null;


    /**
     * Finds a bone by it's name
     * @param {String} name
     * @returns {Tw2GeometryBone|null}
     */
    FindBoneByName(name)
    {
        if (!this.skeleton)
        {
            return null;
        }

        for (let i = 0; i < this.skeleton.bones.length; ++i)
        {
            if (this.skeleton.bones[i].name === name)
            {
                return this.skeleton.bones[i];
            }
        }

        return null;
    }

}
