import {Tw2BaseClass} from "../../class";

/**
 * EveSpotlightSet
 * @implements EveObjectSet
 *
 * @parameter {Tr2Effect} coneEffect                    -
 * @parameter {Tr2Effect} glowEffect                    -
 * @parameter {Number} intensity                        -
 * @parameter {Array.<EveObjectSetItem>} spotlightItems -
 */
export default class EveSpotlightSet extends Tw2BaseClass
{

    coneEffect = null;
    glowEffect = null;
    intensity = 0;
    spotlightItems = [];

}

Tw2BaseClass.define(EveSpotlightSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSpotlightSet",
        category: "EveObjectSet",
        props: {
            coneEffect: ["Tr2Effect"],
            glowEffect: ["Tr2Effect"],
            intensity: Type.NUMBER,
            spotlightItems: [["EveSpotlightSetItem"]]
        }
    };
});

