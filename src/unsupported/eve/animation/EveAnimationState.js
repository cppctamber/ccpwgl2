import { meta } from "utils";
import { EveAnimationStateTransition } from "./EveAnimationStateTransition";


@meta.notImplemented
@meta.type("EveAnimationState")
export class EveAnimationState
{

    @meta.string
    name = "";

    @meta.struct("EveAnimationCurve")
    animation = null;

    @meta.list("EveAnimationCommand")
    curves = [];

    @meta.list("EveAnimationCommand")
    commands = [];

    @meta.list("EveAnimationCommand")
    initCommands = [];

    @meta.list(EveAnimationStateTransition)
    transitions = [];

}
