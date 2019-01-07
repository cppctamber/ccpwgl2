import {Tw2StagingClass} from "../../class";

/**
 * Tw2InteriorScene
 * @ccp Tr2InteriorScene
 *
 * @parameter {Array.<Tw2IntSkinnedObject>} dynamics  -
 * @parameter {Array.<Tw2InteriorLightSource>} lights -
 */
export default class Tw2InteriorScene extends Tw2StagingClass
{

    dynamics = [];
    lights = [];

}

Tw2StagingClass.define(Tw2InteriorScene, Type =>
{
    return {
        type: "Tw2InteriorScene",
        props: {
            dynamics: [["Tw2IntSkinnedObject"]],
            lights: [["Tw2InteriorLightSource"]]
        }
    };
});

