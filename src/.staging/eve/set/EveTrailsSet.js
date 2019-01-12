import {Tw2BaseClass} from "../../../global";

/**
 * EveTrailsSet
 * @implements EveObjectSet
 *
 * @property {Tr2Effect} effect       -
 * @property {String} geometryResPath -
 */
export default class EveTrailsSet extends Tw2BaseClass
{

    effect = null;
    geometryResPath = "";

}

Tw2BaseClass.define(EveTrailsSet, Type =>
{
    return {
        isStaging: true,
        type: "EveTrailsSet",
        category: "EveObjectSet",
        props: {
            effect: ["Tr2Effect"],
            geometryResPath: Type.PATH
        }
    };
});

