import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataPatternPerHull
 *
 * @property {String} name                                -
 * @property {EveSOFDataPatternTransform} transformLayer1 -
 * @property {EveSOFDataPatternTransform} transformLayer2 -
 */
export class EveSOFDataPatternPerHull extends EveSOFBaseClass
{

    name = "";
    transformLayer1 = null;
    transformLayer2 = null;

}

EveSOFDataPatternPerHull.define(r =>
{
    return {
        type: "EveSOFDataPatternPerHull",
        black: [
            ["name", r.string],
            ["transformLayer1", r.object],
            ["transformLayer2", r.object]
        ]
    };
});