import {Tw2BaseClass} from "../../class";

/**
 * Tr2SkinnedModel
 *
 * @parameter {String} geometryResPath -
 * @parameter {Array.<Mesh>} meshes    -
 * @parameter {String} skeletonName    -
 */
export default class Tr2SkinnedModel extends Tw2BaseClass
{

    geometryResPath = "";
    meshes = [];
    skeletonName = "";

}

Tw2BaseClass.define(Tr2SkinnedModel, Type =>
{
    return {
        isStaging: true,
        type: "Tr2SkinnedModel",
        props: {
            geometryResPath: Type.PATH,
            meshes: [["Tr2Mesh"]],
            skeletonName: Type.STRING
        }
    };
});

