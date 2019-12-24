import { meta  } from "global";


@meta.type("Tw2GeometryTransformTrack")
export class Tw2GeometryTransformTrack
{

    @meta.string
    name = "";

    @meta.objectOf("Tw2GeometryCurve")
    position = null;

    @meta.objectOf("Tw2GeometryCurve")
    orientation = null;

    @meta.unknown
    scaleShear = null;

}
