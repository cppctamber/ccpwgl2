/**
 * EveSOFDataHullSpotlightSet
 *
 * @property {String} name                                  -
 * @property {String} coneTextureResPath                    -
 * @property {String} glowTextureResPath                    -
 * @property {Array.<EveSOFDataHullSpotlightSetItem>} items -
 * @property {Boolean} skinned                              -
 * @property {Number} zOffset                               -
 */
export class EveSOFDataHullSpotlightSet
{

    name = "";
    coneTextureResPath = "";
    glowTextureResPath = "";
    items = [];
    skinned = false;
    zOffset = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "coneTextureResPath", r.path ],
            [ "glowTextureResPath", r.path ],
            [ "items", r.array ],
            [ "name", r.string ],
            [ "skinned", r.boolean ],
            [ "zOffset", r.float ]
        ];
    }
}
