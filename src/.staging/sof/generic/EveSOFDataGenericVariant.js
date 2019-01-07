import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataGenericVariant
 *
 * @parameter {EveSOFDataHullArea} hullArea -
 * @parameter {Boolean} isTransparent       -
 */
export default class EveSOFDataGenericVariant extends Tw2StagingClass
{

    hullArea = null;
    isTransparent = false;

}

Tw2StagingClass.define(EveSOFDataGenericVariant, Type =>
{
    return {
        type: "EveSOFDataGenericVariant",
        props: {
            hullArea: ["EveSOFDataHullArea"],
            isTransparent: Type.BOOLEAN
        }
    };
});

