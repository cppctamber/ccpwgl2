import { meta } from "utils";


@meta.define("Tw2GeometryTrackGroup")
export class Tw2GeometryTrackGroup
{

    @meta.string
    name = "";

    @meta.struct("Tw2GeometryModel")
    model = null;

    @meta.list("Tw2GeometryTransformTrack")
    transformTracks = [];

}
