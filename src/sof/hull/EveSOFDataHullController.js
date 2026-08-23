import { meta } from "utils";


@meta.define("EveSOFDataHullController", true)
export class EveSOFDataHullController extends meta.Model
{

    @meta.int32
    buildFilter = -1;

    @meta.path
    path = "";

}
