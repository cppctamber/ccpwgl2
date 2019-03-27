import {vec4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

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
export class EveSOFDataFactionColorSet extends EveSOFBaseClass
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

    /**
     * Gets a faction color set by name
     * @param {String} name
     * @returns {vec4|null}
     */
    Get(name)
    {
        name = name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
        return name in this ? this[name] : null;
    }

}

EveSOFDataFactionColorSet.define(r =>
{
    return {
        type: "EveSOFDataFactionColorSet",
        black: [
            ["Black", r.vector4],
            ["Blue", r.vector4],
            ["Booster", r.vector4],
            ["Cyan", r.vector4],
            ["Darkhull", r.vector4],
            ["Fire", r.vector4],
            ["Glass", r.vector4],
            ["Green", r.vector4],
            ["Hull", r.vector4],
            ["Killmark", r.vector4],
            ["Orange", r.vector4],
            ["Primary", r.vector4],
            ["Reactor", r.vector4],
            ["Red", r.vector4],
            ["Secondary", r.vector4],
            ["Tertiary", r.vector4],
            ["White", r.vector4],
            ["Yellow", r.vector4],
        ]
    };
});