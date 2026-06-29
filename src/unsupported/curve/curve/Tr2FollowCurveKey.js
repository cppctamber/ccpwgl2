import { meta } from "utils";
import { mat4, vec3 } from "math";
import { Tw2CurveKey } from "curve";


@meta.type("Tr2ObjectFollowCurveKey")
@meta.ccp.define("Tr2ObjectFollowCurveKey")
export class Tr2ObjectFollowCurveKey extends Tw2CurveKey
{
    static NO_ROTATION = 0;
    static MODEL_ROTATION = 1;
    static LOCATOR_ROTATION = 2;

    @meta.vector3
    leftTangent = vec3.create();

    @meta.vector3
    rightTangent = vec3.create();

    @meta.private
    @meta.vector3
    rotatedLeftTangent = vec3.create();

    @meta.private
    @meta.vector3
    rotatedRightTangent = vec3.create();

    @meta.uint
    interpolation = 1;

    @meta.private
    @meta.notOwned
    @meta.struct()
    object = null;

    @meta.string
    offsetLocatorName = "";

    @meta.vector3
    offset = vec3.create();

    @meta.uint
    rotationSetting = 0;

    locator = null;

    Initialize()
    {
        return true;
    }

    OnModified()
    {
        this.locator = null;
        return true;
    }

    GetValue(out = vec3.create())
    {
        vec3.copy(out, this.offset);
        return out;
    }

    GetTime()
    {
        return this.time;
    }

    GetInterpolationType()
    {
        return this.interpolation;
    }

    GetLeftTangent()
    {
        return this.leftTangent;
    }

    GetRightTangent()
    {
        return this.rightTangent;
    }
}


@meta.type("Tr2CameraFollowCurveKey")
@meta.ccp.define("Tr2CameraFollowCurveKey")
export class Tr2CameraFollowCurveKey extends Tw2CurveKey
{
    @meta.float
    fovMultiplication = 0.5;

    @meta.float
    angle = 0;

    @meta.float
    angleZero = Math.PI / 2;

    @meta.private
    @meta.vector3
    objectBounds = vec3.create();

    @meta.vector3
    offset = vec3.create();

    @meta.vector3
    leftTangent = vec3.create();

    @meta.vector3
    rightTangent = vec3.create();

    @meta.private
    @meta.vector3
    rotatedLeftTangent = vec3.create();

    @meta.private
    @meta.vector3
    rotatedRightTangent = vec3.create();

    @meta.uint
    interpolation = 1;

    @meta.private
    @meta.vector3
    boxPosition = vec3.create();

    frontClip = 0;
    fov = 0;
    minDistanceAlongViewAngle = 0;
    minDistanceFromViewAngle = 0;
    enabled = true;
    lastEnabledFOV = 0;
    lastEnabledFrontClip = 10;
    lastEnabledInverseViewMatrix = mat4.create();

    Initialize()
    {
        return true;
    }

    OnModified()
    {
        return true;
    }

    GetValue(out = vec3.create())
    {
        vec3.copy(out, this.offset);
        return out;
    }

    GetTime()
    {
        return this.time;
    }

    GetInterpolationType()
    {
        return this.interpolation;
    }

    GetLeftTangent()
    {
        return this.leftTangent;
    }

    GetRightTangent()
    {
        return this.rightTangent;
    }
}
