import { meta } from "global";


@meta.type("EveSOFDataAreaMaterial", true)
export class EveSOFDataAreaMaterial
{

    @meta.black.uint
    colorType = 0;

    @meta.black.string
    material1 = "";

    @meta.black.string
    material2 = "";

    @meta.black.string
    material3 = "";

    @meta.black.string
    material4 = "";

}
