import { meta } from "utils";


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
