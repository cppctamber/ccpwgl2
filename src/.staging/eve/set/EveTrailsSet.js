import {Tw2StagingClass} from "../../class";

/**
 * EveTrailsSet
 * @implements EveObjectSet
 *
 * @parameter {Tw2Effect} effect       -
 * @parameter {String} geometryResPath -
 */
export default class EveTrailsSet extends Tw2StagingClass
{

    effect = null;
    geometryResPath = "";

}

Tw2StagingClass.define(EveTrailsSet, Type =>
{
    return {
        type: "EveTrailsSet",
        category: "EveObjectSet",
        props: {
            effect: ["Tw2Effect"],
            geometryResPath: Type.PATH
        }
    };
});

