import {mat4, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullBoosterItem
 *
 * @parameter {Number} atlasIndex0 -
 * @parameter {Number} atlasIndex1 -
 * @parameter {vec4} functionality -
 * @parameter {Boolean} hasTrail   -
 * @parameter {mat4} transform     -
 */
export default class EveSOFDataHullBoosterItem extends Tw2StagingClass
{

    atlasIndex0 = 0;
    atlasIndex1 = 0;
    functionality = vec4.create();
    hasTrail = false;
    transform = mat4.create();

}

Tw2StagingClass.define(EveSOFDataHullBoosterItem, Type =>
{
    return {
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

