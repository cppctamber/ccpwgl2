import { meta } from "utils";


@meta.define("EveSOFDataBlink", true)
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
