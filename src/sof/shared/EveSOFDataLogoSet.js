import { meta } from "global";


@meta.type("EveSOFDataLogoSet", true)
export class EveSOFDataLogoSet
{

    @meta.black.objectOf("EveSOFDataLogo")
    Marking_01 = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Marking_02 = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Primary = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Secondary = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Tertiary = null;

}
