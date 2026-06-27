import { meta } from "utils";


@meta.notImplemented
@meta.type("EveAnimation")
@meta.define({
    wgl: "EveAnimation",
    ccp: true
})
export class EveAnimation
{

    @meta.string
    name = "";

    @meta.uint
    loops = 0;

}
