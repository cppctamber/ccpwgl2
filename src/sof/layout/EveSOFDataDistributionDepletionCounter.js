import { meta } from "utils";


@meta.type("EveSOFDataDistributionDepletionCounter")
@meta.define({
    wgl: "EveSOFDataDistributionDepletionCounter",
    ccp: true
})
export class EveSOFDataDistributionDepletionCounter extends meta.Model
{

    @meta.string
    name = "";

    @meta.int32
    value = 1;


}
