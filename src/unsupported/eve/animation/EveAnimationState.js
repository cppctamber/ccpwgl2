import { meta } from "global";
import { EveAnimationStateTransition } from "./EveAnimationStateTransition";


@meta.notImplemented
@meta.type("EveAnimationState", true)
export class EveAnimationState
{

    @meta.black.string
    name = "";

    @meta.black.objectOf("EveAnimationCurve")
    animation = null;

    @meta.black.listOf("EveAnimationCommand")
    curves = [];

    @meta.black.listOf("EveAnimationCommand")
    commands = [];

    @meta.black.listOf("EveAnimationCommand")
    initCommands = [];

    @meta.black.struct([ EveAnimationStateTransition ], "EveAnimationStateTransition")
    transitions = [];

}
