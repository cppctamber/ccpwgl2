import { mat4, vec4 } from "global";


/**
 * EveSOFDataHullBoosterItem
 *
 * @property {Number} atlasIndex0 -
 * @property {Number} atlasIndex1 -
 * @property {vec4} functionality -
 * @property {Boolean} hasTrail   -
 * @property {Number} lightScale  -
 * @property {mat4} transform     -
 */
export class EveSOFDataHullBoosterItem
{

    atlasIndex0 = 0;
    atlasIndex1 = 0;
    functionality = vec4.create();
    hasTrail = false;
    lightScale = 1; // What should be the default value here?
    transform = mat4.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "atlasIndex0", r.uint ],
            [ "atlasIndex1", r.uint ],
            [ "functionality", r.vector4 ],
            [ "hasTrail", r.boolean ],
            [ "lightScale", r.float ],
            [ "transform", r.matrix ],
        ];
    }
}
