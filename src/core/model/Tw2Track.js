import { meta } from "global";


@meta.type("Tw2Track")
export class Tw2Track
{

    @meta.objectOf("Tw2GeometryTransformTrack")
    trackRes = null;

    @meta.objectOf("Tw2Bone")
    bone = null;

}
