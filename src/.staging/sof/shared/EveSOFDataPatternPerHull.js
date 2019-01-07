import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataPatternPerHull
 *
 * @parameter {EveSOFDataPatternTransform} transformLayer1 -
 * @parameter {EveSOFDataPatternTransform} transformLayer2 -
 */
export default class EveSOFDataPatternPerHull extends Tw2StagingClass
{

    transformLayer1 = null;
    transformLayer2 = null;

}

Tw2StagingClass.define(EveSOFDataPatternPerHull, Type =>
{
    return {
        type: "EveSOFDataPatternPerHull",
        props: {
            transformLayer1: ["EveSOFDataPatternTransform"],
            transformLayer2: ["EveSOFDataPatternTransform"]
        }
    };
});

