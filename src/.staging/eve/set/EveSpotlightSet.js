import {Tw2BaseClass} from "../../../global";

/**
 * EveSpotlightSet
 * @implements EveObjectSet
 *
 * @property {Tr2Effect} coneEffect                    -
 * @property {Tr2Effect} glowEffect                    -
 * @property {Number} intensity                        -
 * @property {Array.<EveObjectSetItem>} spotlightItems -
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

