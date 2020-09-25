import { meta, vec4 } from "global";


@meta.ctor("EveSOFDataParameter")
export class EveSOFDataParameter
{

    @meta.string
    name = "";

    @meta.vector4
    value = vec4.create();

}
