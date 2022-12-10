import { meta } from "utils";


@meta.type("EveSOFDataLayout")
export class EveSOFDataLayout extends meta.Model
{
    @meta.string
    name = "";

    @meta.list()
    placements = [];

}
