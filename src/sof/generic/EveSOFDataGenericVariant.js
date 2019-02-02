import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataGenericVariant
 *
 * @property {EveSOFDataHullArea} hullArea -
 * @property {Boolean} isTransparent       -
 */
export class EveSOFDataGenericVariant extends Tw2BaseClass
{

    hullArea = null;
    isTransparent = false;

}

Tw2BaseClass.define(EveSOFDataGenericVariant, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericVariant",
        props: {
            hullArea: ["EveSOFDataHullArea"],
            isTransparent: Type.BOOLEAN
        }
    };
});

