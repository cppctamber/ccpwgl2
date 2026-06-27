import { meta } from "utils";


@meta.type("EveSOFDataHullController")
@meta.define({
    wgl: "EveSOFDataHullController",
    ccp: true
})
export class EveSOFDataHullController extends meta.Model
{

    @meta.int32
    buildFilter = -1;

    @meta.path
    path = "";

}
