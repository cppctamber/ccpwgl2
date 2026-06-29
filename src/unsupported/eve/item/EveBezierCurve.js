import { meta } from "utils";
import { vec3, quat }  from "math";
import { IEveLineSetPath } from "./IEveLineSetPath";


@meta.notImplemented
@meta.type("EveBezierCurve")
@meta.define({
    wgl: "EveBezierCurve",
    ccp: true
})
export class EveBezierCurve extends IEveLineSetPath
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.boolean
    isVisible = true;

    @meta.boolean
    billboardObjects = true;

    @meta.vector3
    bezierPoint = vec3.create();

    @meta.float
    completeness = 1;

    @meta.float
    lineWidth = 1;

    @meta.float
    segmentOffset = 0;

    @meta.float
    movementSpeed = 0;

    @meta.float
    animValue = 0;

    @meta.vector3
    objectScale = vec3.fromValues(1, 1, 1);

    @meta.vector3
    point1 = vec3.create();

    @meta.vector3
    point2 = vec3.create();

    @meta.boolean
    scaleEndpoints = true;

    @meta.boolean
    scaleSegmentsByCompleteness = true;

    @meta.float
    segments = 24;

    OnModified()
    {
        this.completeness = Math.min(2, Math.max(0, this.completeness));
        this.segments = Math.min(Math.max(1, this.segments), 128);
        this.segmentOffset = Math.min(Math.max(0, this.segmentOffset), 1);
        return true;
    }
}
