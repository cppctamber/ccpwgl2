import { meta } from "utils";

/**
 * EveUiObject
 *
 * @property {String} name                 -
 * @property {Number} boundingSphereRadius -
 * @property {Tw2Mesh} mesh                -
 * @property {Number} modelScale           -
 */
@meta.notImplemented
@meta.type("EveUiObject")
export class EveUiObject extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    boundingSphereRadius = 0;

    @meta.struct()
    mesh = null;

    @meta.float
    modelScale = 0;

}
