import { meta, Tw2BaseClass } from "global";


/**
 * Tr2ActionChildEffect
 *
 * @property {String} childName     -
 * @property {String} path          -
 * @property {Boolean} removeOnStop -
 */
@meta.notImplemented
@meta.type("Tr2ActionChildEffect", true)
export class Tr2ActionChildEffect extends Tw2BaseClass
{

    @meta.black.string
    childName = "";

    @meta.black.path
    path = "";

    @meta.black.boolean
    removeOnStop = false;

}
