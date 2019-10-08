/**
 * EveSOFDataGenericVariant
 *
 * @property {String} name                 -
 * @property {EveSOFDataHullArea} hullArea -
 * @property {Boolean} isTransparent       -
 */
export class EveSOFDataGenericVariant
{

    name = "";
    hullArea = null;
    isTransparent = false;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "hullArea", r.object ],
            [ "isTransparent", r.boolean ],
            [ "name", r.string ],
        ];
    }
}
