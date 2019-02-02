import {Tw2BaseClass} from "../../global/index";

/**
 * EveSOFDataPatternPerHull
 *
 * @property {EveSOFDataPatternTransform} transformLayer1 -
 * @property {EveSOFDataPatternTransform} transformLayer2 -
 */
export class EveSOFDataPatternPerHull extends Tw2BaseClass
{

    transformLayer1 = null;
    transformLayer2 = null;

}

Tw2BaseClass.define(EveSOFDataPatternPerHull, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataPatternPerHull",
        props: {
            transformLayer1: ["EveSOFDataPatternTransform"],
            transformLayer2: ["EveSOFDataPatternTransform"]
        }
    };
});

