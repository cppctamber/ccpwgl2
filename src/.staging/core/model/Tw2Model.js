import {Tw2StagingClass} from "../../class";

/**
 * Tw2Model
 * @ccp Tr2Model
 *
 * @parameter {Array.<Mesh>} meshes -
 */
export default class Tw2Model extends Tw2StagingClass
{

    meshes = [];

}

Tw2StagingClass.define(Tw2Model, Type =>
{
    return {
        type: "Tw2Model",
        props: {
            meshes: [["Tw2Mesh"]]
        }
    };
});

