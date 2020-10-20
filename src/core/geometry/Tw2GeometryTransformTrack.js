import { meta } from "utils";


@meta.type("Tw2GeometryTransformTrack")
export class Tw2GeometryTransformTrack
{

    @meta.string
    name = "";

    @meta.struct("Tw2GeometryCurve")
    position = null;

    @meta.struct("Tw2GeometryCurve")
    orientation = null;

    @meta.unknown
    scaleShear = null;

}
