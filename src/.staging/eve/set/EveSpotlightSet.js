import {Tw2StagingClass} from "../../class";

/**
 * EveSpotlightSet
 * @implements EveObjectSet
 *
 * @parameter {Tw2Effect} coneEffect                    -
 * @parameter {Tw2Effect} glowEffect                    -
 * @parameter {Number} intensity                        -
 * @parameter {Array.<EveObjectSetItem>} spotlightItems -
 */
export default class EveSpotlightSet extends Tw2StagingClass
{

    coneEffect = null;
    glowEffect = null;
    intensity = 0;
    spotlightItems = [];

}

Tw2StagingClass.define(EveSpotlightSet, Type =>
{
    return {
        type: "EveSpotlightSet",
        category: "EveObjectSet",
        props: {
            coneEffect: ["Tw2Effect"],
            glowEffect: ["Tw2Effect"],
            intensity: Type.NUMBER,
            spotlightItems: [["EveSpotlightSetItem"]]
        }
    };
});

