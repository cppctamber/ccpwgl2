import {mat4, vec4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullBoosterItem
 *
 * @property {Number} atlasIndex0 -
 * @property {Number} atlasIndex1 -
 * @property {vec4} functionality -
 * @property {Boolean} hasTrail   -
 * @property {mat4} transform     -
 */
export class EveSOFDataHullBoosterItem extends EveSOFBaseClass
{

    atlasIndex0 = 0;
    atlasIndex1 = 0;
    functionality = vec4.create();
    hasTrail = false;
    transform = mat4.create();

}

EveSOFDataHullBoosterItem.define(r =>
{
    return {
        type: "EveSOFDataHullBoosterItem",
        black: [
            ["atlasIndex0", r.uint],
            ["atlasIndex1", r.uint],
            ["functionality", r.vector4],
            ["hasTrail", r.boolean],
            ["transform", r.matrix],
        ]
    };
});