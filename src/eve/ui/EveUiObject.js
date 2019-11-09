import { Tw2BaseClass } from "global";

/**
 * EveUiObject
 * @ccp EveUiObject
 * TODO: Implement
 *
 * @property {String} name                 -
 * @property {Number} boundingSphereRadius -
 * @property {Tw2Mesh} mesh                -
 * @property {Number} modelScale           -
 */
export class EveUiObject extends Tw2BaseClass
{

    name = "";
    boundingSphereRadius = 0;
    mesh = null;
    modelScale = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "boundingSphereRadius", r.float ],
            [ "name", r.string ],
            [ "mesh", r.object ],
            [ "modelScale", r.float ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
