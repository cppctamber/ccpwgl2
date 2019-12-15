import { meta, Tw2BaseClass } from "global";


/**
 * Tr2ActionPlayMeshAnimation
 *
 * @property {String} animation -
 * @property {Number} loops     -
 * @property {String} mask      -
 */
@meta.notImplemented
@meta.type("Tr2ActionPlayMeshAnimation", true)
export class Tr2ActionPlayMeshAnimation extends Tw2BaseClass
{

    @meta.black.string
    animation = "";

    @meta.black.uint
    loops = 0;

    @meta.black.string
    mask = "";

}
