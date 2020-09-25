import { meta } from "global";


@meta.ctor("EveSOFDataMaterial")
export class EveSOFDataMaterial
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataParameter")
    parameters = [];

}
