import { meta } from "utils";


@meta.notImplemented
@meta.define("EveAnimationStateMachine", true)
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
