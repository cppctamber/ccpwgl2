import { meta } from "utils";


@meta.type("Tw2Track")
export class Tw2Track
{

    @meta.struct("Tw2GeometryTransformTrack")
    trackRes = null;

    @meta.struct("Tw2Bone")
    bone = null;

}
