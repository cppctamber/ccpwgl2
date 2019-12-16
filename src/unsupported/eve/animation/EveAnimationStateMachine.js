import { meta } from "global";


@meta.notImplemented
@meta.type("EveAnimationStateMachine", true)
export class EveAnimationStateMachine
{

    @meta.black.string
    name = "";

    @meta.black.boolean
    autoPlayDefault = true;

    @meta.black.listOf("EveAnimationState")
    states = [];

    @meta.black.listOf("EveAnimationStateTransition")
    transitions = [];

    @meta.black.string
    trackMask = "";

    @meta.black.string
    defaultAnimation = "";

}
