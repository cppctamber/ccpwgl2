import {Tw2BaseClass} from "../../global/index";

/**
 * EveTrailsSet
 * @implements EveObjectSet
 * Todo: Implement
 *
 * @property {Tr2Effect} effect       -
 * @property {String} geometryResPath -
 */
export class EveTrailsSet extends Tw2BaseClass
{

    // ccp
    effect = null;
    geometryResPath = "";

    //ccpwgl
    display = true;

}

Tw2BaseClass.define(EveTrailsSet, Type =>
{
    return {
        type: "EveTrailsSet",
        category: "EveObjectSet",
        isStaging: true,
        props: {
            display: Type.BOOLEAN,
            effect: ["Tr2Effect"],
            geometryResPath: Type.PATH
        },
        notImplemented: ["*"]
    };
});

