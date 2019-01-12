import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataFactionColorSet
 *
 * @property {vec4} Black     -
 * @property {vec4} Blue      -
 * @property {vec4} Booster   -
 * @property {vec4} Cyan      -
 * @property {vec4} Darkhull  -
 * @property {vec4} Fire      -
 * @property {vec4} Glass     -
 * @property {vec4} Green     -
 * @property {vec4} Hull      -
 * @property {vec4} Killmark  -
 * @property {vec4} Orange    -
 * @property {vec4} Primary   -
 * @property {vec4} Reactor   -
 * @property {vec4} Red       -
 * @property {vec4} Secondary -
 * @property {vec4} Tertiary  -
 * @property {vec4} White     -
 * @property {vec4} Yellow    -
 */
export default class EveSOFDataFactionColorSet extends Tw2BaseClass
{

    Black = vec4.create();
    Blue = vec4.create();
    Booster = vec4.create();
    Cyan = vec4.create();
    Darkhull = vec4.create();
    Fire = vec4.create();
    Glass = vec4.create();
    Green = vec4.create();
    Hull = vec4.create();
    Killmark = vec4.create();
    Orange = vec4.create();
    Primary = vec4.create();
    Reactor = vec4.create();
    Red = vec4.create();
    Secondary = vec4.create();
    Tertiary = vec4.create();
    White = vec4.create();
    Yellow = vec4.create();

}

Tw2BaseClass.define(EveSOFDataFactionColorSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataFactionColorSet",
        props: {
            Black: Type.VECTOR4,
            Blue: Type.VECTOR4,
            Booster: Type.VECTOR4,
            Cyan: Type.VECTOR4,
            Darkhull: Type.VECTOR4,
            Fire: Type.VECTOR4,
            Glass: Type.VECTOR4,
            Green: Type.VECTOR4,
            Hull: Type.VECTOR4,
            Killmark: Type.VECTOR4,
            Orange: Type.VECTOR4,
            Primary: Type.VECTOR4,
            Reactor: Type.VECTOR4,
            Red: Type.VECTOR4,
            Secondary: Type.VECTOR4,
            Tertiary: Type.VECTOR4,
            White: Type.VECTOR4,
            Yellow: Type.VECTOR4
        }
    };
});

