import { meta } from "global";


@meta.notImplemented
@meta.ctor("EveAnimationStateMachine")
export class EveAnimationStateMachine
{

    @meta.string
    name = "";

    @meta.boolean
    autoPlayDefault = true;

    @meta.list("EveAnimationState")
    states = [];

    @meta.list("EveAnimationStateTransition")
    transitions = [];

    @meta.string
    trackMask = "";

    @meta.string
    defaultAnimation = "";

}
