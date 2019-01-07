import {Tw2StagingClass} from "../../class";

/**
 * EveOccluder
 *
 * @parameter {Array.<EveObject>} sprites -
 */
export default class EveOccluder extends Tw2StagingClass
{

    sprites = [];

}

Tw2StagingClass.define(EveOccluder, Type =>
{
    return {
        type: "EveOccluder",
        props: {
            sprites: [["EveTransform"]]
        }
    };
});

