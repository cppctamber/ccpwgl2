import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataPatternPerHull
 *
 * @parameter {EveSOFDataPatternTransform} transformLayer1 -
 * @parameter {EveSOFDataPatternTransform} transformLayer2 -
 */
export default class EveSOFDataPatternPerHull extends Tw2BaseClass
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

