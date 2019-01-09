import {Tw2BaseClass} from "../../class";

/**
 * EveOccluder
 *
 * @parameter {Array.<EveObject>} sprites -
 */
export default class EveOccluder extends Tw2BaseClass
{

    sprites = [];

}

Tw2BaseClass.define(EveOccluder, Type =>
{
    return {
        isStaging: true,
        type: "EveOccluder",
        props: {
            sprites: [["EveTransform"]]
        }
    };
});

