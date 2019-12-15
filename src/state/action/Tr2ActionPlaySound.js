import { meta, Tw2BaseClass } from "global"


/**
 * Tr2ActionPlaySound
 *
 * @property {String} emitter
 * @property {String} event
 */
@meta.notImplemented
@meta.type("Tr2ActionPlaySound", true)
export class Tr2ActionPlaySound extends Tw2BaseClass
{

    @meta.black.string
    emitter = "";

    @meta.black.string
    event = "";

}
