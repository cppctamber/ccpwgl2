import { meta, Tw2BaseClass } from "global";

/**
 * Tr2ControllerFloatVariable
 *
 * @property {Number} defaultValue -
 * @property {Number} variableType -
 */
@meta.notImplemented
@meta.type("Tr2ControllerFloatVariable", true)
@meta.todo("Identify black definitions")
export class Tr2ControllerFloatVariable extends Tw2BaseClass
{

    @meta.black.float
    defaultValue = 0;

    @meta.black.uint
    @meta.todo("Is this an enum?")
    variableType = 0;

}
