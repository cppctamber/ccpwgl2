import {mat4, vec4} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullBoosterItem
 *
 * @property {Number} atlasIndex0 -
 * @property {Number} atlasIndex1 -
 * @property {vec4} functionality -
 * @property {Boolean} hasTrail   -
 * @property {mat4} transform     -
 */
export class EveSOFDataHullBoosterItem extends Tw2BaseClass
{

    atlasIndex0 = 0;
    atlasIndex1 = 0;
    functionality = vec4.create();
    hasTrail = false;
    transform = mat4.create();

}

Tw2BaseClass.define(EveSOFDataHullBoosterItem, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullBoosterItem",
        props: {
            atlasIndex0: Type.NUMBER,
            atlasIndex1: Type.NUMBER,
            functionality: Type.VECTOR4,
            hasTrail: Type.BOOLEAN,
            transform: Type.MATRIX4
        }
    };
});

