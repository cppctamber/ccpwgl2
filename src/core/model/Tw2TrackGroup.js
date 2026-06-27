import { meta } from "utils";


@meta.type("Tw2TrackGroup")
@meta.wgl.define("Tw2TrackGroup")
export class Tw2TrackGroup
{

    @meta.struct("Tw2GeometryTrackGroup")
    trackGroupRes = null;

    @meta.struct("Tw2GeometryModel")
    model = null;

    @meta.list("Tw2Track")
    transformTracks = [];

}
