import { meta } from "global";


@meta.ctor("Tw2GeometryAnimation")
export class Tw2GeometryAnimation
{

    @meta.string
    name = "";

    @meta.float
    duration = 0;

    @meta.list("Tw2GeometryTrackGroup")
    trackGroups = [];

}
