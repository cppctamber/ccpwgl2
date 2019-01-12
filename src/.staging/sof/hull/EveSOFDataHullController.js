import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataHullController
 *
 * @property {String} path -
 */
export default class EveSOFDataHullController extends Tw2BaseClass
{

    path = "";

}

Tw2BaseClass.define(EveSOFDataHullController, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullController",
        props: {
            path: Type.PATH
        }
    };
});

