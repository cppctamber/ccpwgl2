import { meta } from "utils";
import { quat, vec3 } from "math";
import { Tr2GrannyTrack } from "./Tr2GrannyTrack";


@meta.notImplemented
@meta.define("Tr2GrannyTransformTrack", true)
export class Tr2GrannyTransformTrack extends Tr2GrannyTrack
{
    @meta.private
    @meta.vector3
    translation = vec3.create();

    @meta.private
    @meta.quaternion
    rotation = quat.create();

    @meta.private
    @meta.vector3
    scale = vec3.create();

    @meta.private
    @meta.boolean
    compressCurves = false;

    positionCurve = null;

    orientationCurve = null;

    scaleCurve = null;
}
