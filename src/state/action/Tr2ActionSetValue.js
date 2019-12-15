import { meta, Tw2BaseClass } from "global";


/**
 * Tr2ActionSetValue
 *
 * @property {String} attribute -
 * @property {String} path      -
 * @property {String} value     -
 */
@meta.notImplemented
@meta.type("Tr2ActionSetValue", true)
export class Tr2ActionSetValue extends Tw2BaseClass
{

    @meta.black.string
    attribute = "";

    @meta.black.path
    path = "";

    @meta.black.string
    value = "";

}
