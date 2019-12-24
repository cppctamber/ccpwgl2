import { meta  } from "global";


@meta.type("Tw2GeometryTrackGroup")
export class Tw2GeometryTrackGroup
{

    @meta.string
    name = "";

    @meta.objectOf("Tw2GeometryModel")
    model = null;

    @meta.listOf("Tw2GeometryTransformTrack")
    transformTracks = [];

}
