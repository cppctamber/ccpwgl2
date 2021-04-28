import { meta } from "utils";


@meta.type("EveSOFDataPatternPerHull")
export class EveSOFDataPatternPerHull extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataPatternTransform")
    transformLayer1 = null;

    @meta.struct("EveSOFDataPatternTransform")
    transformLayer2 = null;

}
