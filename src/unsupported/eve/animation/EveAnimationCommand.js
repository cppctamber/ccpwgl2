import { meta } from "utils";


@meta.notImplemented
@meta.type("EveAnimationCommand")
@meta.define({
    wgl: "EveAnimationCommand",
    ccp: true
})
export class EveAnimationCommand
{

    @meta.uint
    @meta.todo("Identify default value")
    command = -1;

}
