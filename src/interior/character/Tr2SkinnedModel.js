import {Tw2BaseClass} from "../../global";

/**
 * Tr2SkinnedModel
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {String} geometryResPath -
 * @property {Array.<Mesh>} meshes    -
 * @property {String} skeletonName    -
 */
export class Tr2SkinnedModel extends Tw2BaseClass
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
        },
        notImplemented: [
            "geometryResPath",
            "meshes",
            "skeletonName"
        ]
    };
});

