import { meta } from "utils";


@meta.type("EveSOFDataLayout")
export class EveSOFDataLayout extends meta.Model
{
    @meta.string
    name = "";

    @meta.uint
    seed = 0;

    @meta.list()
    placements = [];

    @meta.boolean
    randomizeSeedOnLoad = true;

}
