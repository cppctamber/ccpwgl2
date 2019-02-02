import {Tw2BaseClass} from "../../global";

/**
 * Tr2InteriorScene
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {Array.<Tr2IntSkinnedObject>} dynamics  -
 * @property {Array.<Tr2InteriorLightSource>} lights -
 */
export class Tr2InteriorScene extends Tw2BaseClass
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
        },
        notImplemented: [
            "dynamics",
            "lights"
        ]
    };
});

