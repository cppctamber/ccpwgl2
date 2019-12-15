import { meta } from "global";


@meta.type("EveSOFDataLogo", true)
export class EveSOFDataLogo
{

    @meta.black.listOf("EveSOFDataTexture")
    textures = [];

}
