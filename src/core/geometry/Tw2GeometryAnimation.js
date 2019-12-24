import { meta } from "global";


@meta.type("Tw2GeometryAnimation")
export class Tw2GeometryAnimation
{

    @meta.string
    name = "";

    @meta.float
    duration = 0;

    @meta.listOf("Tw2GeometryTrackGroup")
    trackGroups = [];

}
