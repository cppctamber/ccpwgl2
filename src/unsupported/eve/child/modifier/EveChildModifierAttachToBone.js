import { meta } from "global";
import { EveChildModifier } from "./EveChildModifier";


@meta.notImplemented
@meta.type("EveChildModifierAttachToBone", true)
export class EveChildModifierAttachToBone extends EveChildModifier
{

    @meta.black.uint
    boneIndex = -1;

}
