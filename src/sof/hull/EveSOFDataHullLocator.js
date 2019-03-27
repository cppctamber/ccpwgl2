import {mat4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullLocator
 *
 * @property {String} name    -
 * @property {mat4} transform -
 */
export class EveSOFDataHullLocator extends EveSOFBaseClass
{

    name = "";
    transform = mat4.create();

}

EveSOFDataHullLocator.define(r =>
{
    return {
        type: "EveSOFDataHullLocator",
        black: [
            ["name", r.string],
            ["transform", r.matrix]
        ]
    };
});