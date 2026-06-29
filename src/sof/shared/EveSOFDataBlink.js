import { meta } from "utils";


@meta.type("EveSOFDataBlink")
@meta.define({
    wgl: "EveSOFDataBlink",
    ccp: true
})
export class EveSOFDataBlink extends meta.Model
{

    /**
     * Carbon class is currently an empty SOF data shape.
     * @returns {boolean}
     */
    IsEmpty()
    {
        return true;
    }

}
