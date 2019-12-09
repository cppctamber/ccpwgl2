import { meta, Tw2BaseClass } from "global";


/**
 * Tr2KelvinColor
 *
 * @property {Number} temperature -
 * @property {Number} tint        -
 */
@meta.ccp("Tr2KelvinColor")
@meta.notImplemented
export class Tr2KelvinColor extends Tw2BaseClass
{

    @meta.black.float
    temperature = 0;

    @meta.black.float
    tint = 0;

}
