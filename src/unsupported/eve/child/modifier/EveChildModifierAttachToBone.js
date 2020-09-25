import { meta } from "global";
import { EveChildModifier } from "./EveChildModifier";


@meta.notImplemented
@meta.ctor("EveChildModifierAttachToBone")
export class EveChildModifierAttachToBone extends EveChildModifier
{

    @meta.uint
    boneIndex = -1;

}
