import { meta } from "utils";


@meta.define({
    wgl: "Tw2Float",
    ccp: "TriFloat"
})
export class Tw2Float extends meta.Model
{

    @meta.float
    value = 0;

}

