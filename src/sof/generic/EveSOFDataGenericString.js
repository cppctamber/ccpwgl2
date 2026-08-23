import { meta } from "utils";


@meta.define({
    wgl: "EveSOFDataGenericString",
    ccp: true
})
export class EveSOFDataGenericString extends meta.Model
{

    @meta.string
    str = "";

}
