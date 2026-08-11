import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * A post process slot wrapping an arbitrary authored effect
 *
 * NOT IMPLEMENTED. No shipped asset populates it, so this exists so that one
 * appearing later loads rather than throwing.
 *
 * @ccp Tr2PPGenericEffect
 */
@meta.type("Tr2PPGenericEffect")
@meta.ccp.define("Tr2PPGenericEffect")
export class Tr2PPGenericEffect extends Tr2PPEffect
{

    @meta.uint
    quality = 1;

    @meta.struct("Tw2Effect")
    effect = null;

}
