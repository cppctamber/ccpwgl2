import { meta } from "utils";


@meta.type("EveSOFDataHullController")
export class EveSOFDataHullController extends meta.Model
{

    @meta.uint
    buildFilter = -1;

    @meta.path
    path = "";

}
