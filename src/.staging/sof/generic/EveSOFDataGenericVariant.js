import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataGenericVariant
 *
 * @parameter {EveSOFDataHullArea} hullArea -
 * @parameter {Boolean} isTransparent       -
 */
export default class EveSOFDataGenericVariant extends Tw2BaseClass
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

