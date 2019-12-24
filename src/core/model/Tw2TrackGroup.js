import { meta } from "global";


@meta.type("Tw2TrackGroup")
export class Tw2TrackGroup
{

    @meta.objectOf("Tw2GeometryTrackGroup")
    trackGroupRes = null;

    @meta.objectOf("Tw2GeometryModel")
    model = null;

    @meta.listOf("Tw2Track")
    transformTracks = [];

}
