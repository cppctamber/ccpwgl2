import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullController
 *
 * @property {String} path -
 */
export class EveSOFDataHullController extends EveSOFBaseClass
{

    path = "";

}

EveSOFDataHullController.define(r =>
{
    return {
        type: "EveSOFDataHullController",
        black: [
            ["path", r.string],
        ]
    };
});