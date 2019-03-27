import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataPattern
 *
 * @property {String} name                                  -
 * @property {EveSOFDataPatternLayer} layer1                -
 * @property {EveSOFDataPatternLayer} layer2                -
 * @property {Array.<EveSOFDataPatternPerHull>} projections -
 */
export class EveSOFDataPattern extends EveSOFBaseClass
{

    name = "";
    layer1 = null;
    layer2 = null;
    projections = [];

}

EveSOFDataPattern.define(r =>
{
    return {
        type: "EveSOFDataPattern",
        black: [
            ["name", r.string],
            ["layer1", r.object],
            ["layer2", r.object],
            ["projections", r.array]
        ]
    };
});