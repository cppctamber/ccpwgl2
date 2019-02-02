import {Tw2BaseClass} from "../global";

/**
 * Tr2Model
 * TODO: The ccpwgl class Tw2Model is for a different purpose than this one...
 * @ccp Tr2Model
 *
 * @property {Array.<Tr2Mesh>} meshes -
 */
export class Tr2Model extends Tw2BaseClass
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

