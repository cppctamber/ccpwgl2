import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataGenericVariant
 *
 * @property {String} name                 -
 * @property {EveSOFDataHullArea} hullArea -
 * @property {Boolean} isTransparent       -
 */
export class EveSOFDataGenericVariant extends EveSOFBaseClass
{

    name = "";
    hullArea = null;
    isTransparent = false;

}

EveSOFDataGenericVariant.define(r =>
{
    return {
        type: "EveSOFDataGenericVariant",
        black: [
            ["hullArea", r.object],
            ["isTransparent", r.boolean],
            ["name", r.string],
        ]
    };
});