import {Tw2StagingClass} from "../../class";

/**
 * Tw2SkinnedModel
 * @ccp Tr2SkinnedModel
 *
 * @parameter {String} geometryResPath -
 * @parameter {Array.<Mesh>} meshes    -
 * @parameter {String} skeletonName    -
 */
export default class Tw2SkinnedModel extends Tw2StagingClass
{

    geometryResPath = "";
    meshes = [];
    skeletonName = "";

}

Tw2StagingClass.define(Tw2SkinnedModel, Type =>
{
    return {
        type: "Tw2SkinnedModel",
        props: {
            geometryResPath: Type.PATH,
            meshes: [["Tw2Mesh"]],
            skeletonName: Type.STRING
        }
    };
});

