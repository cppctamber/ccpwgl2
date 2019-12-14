import { meta } from "global";

/**
 * EveAnimation
 *
 * @property {String} name  - The animation's name
 * @property {Number} loops - The amount of time the animation should loop
 */
@meta.notImplemented
@meta.type("EveAnimation", true)
export class EveAnimation
{

    @meta.black.string
    name = "";

    @meta.black.uint
    @meta.todo("Figure out the default value?")
    loops = 0;

}
