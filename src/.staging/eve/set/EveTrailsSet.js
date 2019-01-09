import {Tw2BaseClass} from "../../class";

/**
 * EveTrailsSet
 * @implements EveObjectSet
 *
 * @parameter {Tr2Effect} effect       -
 * @parameter {String} geometryResPath -
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

