import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataFactionColorSet
 *
 * @parameter {vec4} Black     -
 * @parameter {vec4} Blue      -
 * @parameter {vec4} Booster   -
 * @parameter {vec4} Cyan      -
 * @parameter {vec4} Darkhull  -
 * @parameter {vec4} Fire      -
 * @parameter {vec4} Glass     -
 * @parameter {vec4} Green     -
 * @parameter {vec4} Hull      -
 * @parameter {vec4} Killmark  -
 * @parameter {vec4} Orange    -
 * @parameter {vec4} Primary   -
 * @parameter {vec4} Reactor   -
 * @parameter {vec4} Red       -
 * @parameter {vec4} Secondary -
 * @parameter {vec4} Tertiary  -
 * @parameter {vec4} White     -
 * @parameter {vec4} Yellow    -
 */
export default class EveSOFDataFactionColorSet extends Tw2StagingClass
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

Tw2StagingClass.define(EveSOFDataFactionColorSet, Type =>
{
    return {
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

