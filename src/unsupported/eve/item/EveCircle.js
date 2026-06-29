import { meta } from "utils";
import { quat, vec3, vec4 } from "math";
import { IEveLineSetPath } from "./IEveLineSetPath";

@meta.notImplemented
@meta.define({
    wgl: "EveCircle",
    ccp: true
})
export class EveCircle extends IEveLineSetPath
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

    @meta.float
    circleRadius = 100;

    @meta.vector4
    circleDistort = vec4.fromValues(1, 0, 1, 0);

    @meta.float
    numSegments = 64;

    @meta.float
    completeness = 1;

    @meta.float
    startPoint = 0;

    @meta.float
    lineWidth = 1;

    @meta.boolean
    scaleSegmentsByCompleteness = false;

    @meta.boolean
    scaleEndpoints = true;

    @meta.boolean
    billboardObjects = false;

    @meta.vector3
    objectScale = vec3.fromValues(1, 1, 1);

    @meta.float
    movementSpeed = 0;

    @meta.float
    animValue = 0;

    OnModified()
    {
        this.completeness = Math.min(2, Math.max(0, this.completeness));
        this.numSegments = Math.min(Math.max(1, this.numSegments), 128);
        this.startPoint = this.startPoint % 1;
        return true;
    }
}
