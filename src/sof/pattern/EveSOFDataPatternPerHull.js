import { meta } from "utils";


@meta.ctor("EveSOFDataPatternPerHull")
export class EveSOFDataPatternPerHull
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataPatternTransform")
    transformLayer1 = null;

    @meta.struct("EveSOFDataPatternTransform")
    transformLayer2 = null;

}
