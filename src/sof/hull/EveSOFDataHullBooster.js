/**
 * EveSOFDataHullBooster
 *
 * @property {Boolean} alwaysOn                        -
 * @property {Boolean} hasTrails                       -
 * @property {Array.<EveSOFDataHullBoosterItem>} items -
 */
export class EveSOFDataHullBooster
{

    alwaysOn = false;
    hasTrails = false;
    items = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "alwaysOn", r.boolean ],
            [ "hasTrails", r.boolean ],
            [ "items", r.array ]
        ];
    }
}
