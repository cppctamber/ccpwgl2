import { meta, Tw2BaseClass } from "global";

/**
 * EveUiObject
 *
 * @property {String} name                 -
 * @property {Number} boundingSphereRadius -
 * @property {Tw2Mesh} mesh                -
 * @property {Number} modelScale           -
 */
@meta.notImplemented
@meta.type("EveUiObject", true)
export class EveUiObject extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.float
    boundingSphereRadius = 0;

    @meta.black.object
    mesh = null;

    @meta.black.float
    modelScale = 0;

}
