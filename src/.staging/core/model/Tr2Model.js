import {Tw2BaseClass} from "../../../global";

/**
 * Tr2Model
 *
 * @property {Array.<Mesh>} meshes -
 */
export default class Tr2Model extends Tw2BaseClass
{

    meshes = [];

}

Tw2BaseClass.define(Tr2Model, Type =>
{
    return {
        isStaging: true,
        type: "Tr2Model",
        props: {
            meshes: [["Tr2Mesh"]]
        }
    };
});

