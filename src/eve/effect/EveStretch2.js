import { meta, Tw2BaseClass } from "global";

/**
 * EveStretch2
 *
 * @property {String} name          -
 * @property {*} destinationEmitter -
 * @property {*} destinationLight   -
 * @property {Tw2Effect} effect     -
 * @property {TriCurveSet} loop     -
 * @property {*} sourceEmitter      -
 * @property {*} sourceLight        -
 * @property {Number} quadCount     -
 */
@meta.notImplemented
@meta.type("EveStretch2", true)
export class EveStretch2 extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.object
    destinationEmitter = null;

    @meta.black.object
    destinationLight = null;

    @meta.black.object
    effect = null;

    @meta.black.object
    loop = null;

    @meta.black.object
    sourceEmitter = null;

    @meta.black.object
    sourceLight = null;

    @meta.black.uint
    quadCount = 0;

}
