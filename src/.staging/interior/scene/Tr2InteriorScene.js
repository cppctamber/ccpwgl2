import {Tw2BaseClass} from "../../class";

/**
 * Tr2InteriorScene
 *
 * @parameter {Array.<Tr2IntSkinnedObject>} dynamics  -
 * @parameter {Array.<Tr2InteriorLightSource>} lights -
 */
export default class Tr2InteriorScene extends Tw2BaseClass
{

    dynamics = [];
    lights = [];

}

Tw2BaseClass.define(Tr2InteriorScene, Type =>
{
    return {
        isStaging: true,
        type: "Tr2InteriorScene",
        props: {
            dynamics: [["Tr2IntSkinnedObject"]],
            lights: [["Tr2InteriorLightSource"]]
        }
    };
});

