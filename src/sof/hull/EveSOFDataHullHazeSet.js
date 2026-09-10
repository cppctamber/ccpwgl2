import { meta } from "utils";


@meta.define("EveSOFDataHullHazeSet", true)
export class EveSOFDataHullHazeSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullHazeSetItem")
    items = [];

    @meta.uint
    hazeType = 0;

    @meta.string
    visibilityGroup = "";

    @meta.boolean
    skinned = false;


    /**
     * Which shader draws the set, from Carbon's HazeType (EveSOFData.h:861).
     *
     * Only SPHERICAL is built here. Carbon has a half-spherical shader and one
     * ships for gles2, but the type is blocked in the editor (operator,
     * 2026-09-10), so a hull carrying it would be data nothing authored.
     */
    static Type = Object.freeze({
        SPHERICAL: 0,
        HALF_SPHERICAL: 1
    });
}
