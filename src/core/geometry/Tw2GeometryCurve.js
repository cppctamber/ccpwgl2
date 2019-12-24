import { meta } from "global";


@meta.type("Tw2GeometryCurve")
export class Tw2GeometryCurve
{

    @meta.float
    dimension = 0;

    @meta.float
    degree = 0;

    @meta.vector
    knots = null;

    @meta.vector
    controls = null;

}
