import { meta } from "utils";


@meta.type("Tw2GeometryAnimation")
@meta.wgl.define("Tw2GeometryAnimation")
export class Tw2GeometryAnimation
{

    @meta.string
    name = "";

    @meta.float
    duration = 0;

    @meta.list("Tw2GeometryTrackGroup")
    trackGroups = [];

}
