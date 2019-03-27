import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullSoundEmitter
 *
 * @property {String} name   -
 * @property {String} prefix -
 */
export class EveSOFDataHullSoundEmitter extends EveSOFBaseClass
{

    name = "";
    prefix = "";

}

EveSOFDataHullSoundEmitter.define(r =>
{
    return {
        type: "EveSOFDataHullSoundEmitter",
        black: [
            ["name", r.string],
            ["prefix", r.string]
        ]
    };
});