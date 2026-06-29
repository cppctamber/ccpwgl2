import { meta } from "utils";
import { quat } from "math";
import { Tr2CurveScalar } from "../curve/Tr2CurveScalar";
import { Tr2CurveEulerRotationKey } from "../curve/Tr2CurveKeys";
import { Tr2CurveInterpolation, Tr2CurveTangentType } from "../curve/Tr2CurveMath";


@meta.define({
    wgl: "Tw2CurveEulerRotation",
    ccp: "Tr2CurveEulerRotation"
})
export class Tw2CurveEulerRotation extends meta.Model
{
    @meta.string
    name = "";

    @meta.rawObject("Tr2CurveScalar")
    yaw = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    pitch = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    roll = new Tr2CurveScalar();

    @meta.list(Tr2CurveEulerRotationKey)
    keys = [];

    @meta.quaternion
    currentValue = quat.create();

    UpdateValue(time)
    {
        this.GetValue(time, this.currentValue);
    }

    Update(time, out = this.currentValue)
    {
        this.GetValue(time, this.currentValue);
        return quat.copy(out, this.currentValue);
    }

    GetValueAt(time, out = quat.create())
    {
        return this.GetValue(time, out);
    }

    GetValue(time, out = quat.create())
    {
        const
            yaw = GetScalarValue(this.yaw, time),
            pitch = GetScalarValue(this.pitch, time),
            roll = GetScalarValue(this.roll, time);

        return GetYawPitchRollQuaternion(out, yaw, pitch, roll);
    }

    GetValueDotAt(time, out = quat.create())
    {
        return out;
    }

    GetValueDoubleDotAt(time, out = quat.create())
    {
        return out;
    }

    Length()
    {
        return Math.max(
            GetScalarLength(this.yaw),
            GetScalarLength(this.pitch),
            GetScalarLength(this.roll)
        );
    }

    GetLength()
    {
        return this.Length();
    }

    Sort()
    {
        if (this.yaw && this.yaw.Sort) this.yaw.Sort();
        if (this.pitch && this.pitch.Sort) this.pitch.Sort();
        if (this.roll && this.roll.Sort) this.roll.Sort();
    }

    AddKey(time, value, interpolation = Tr2CurveInterpolation.HERMITE, leftTangent = [ 0, 0, 0 ], rightTangent = [ 0, 0, 0 ], tangentType = Tr2CurveTangentType.AUTO_CLAMP)
    {
        this.EnsureScalarChannels();
        const v = value || [ 0, 0, 0 ];
        const lt = leftTangent || [ 0, 0, 0 ];
        const rt = rightTangent || [ 0, 0, 0 ];

        this.yaw.AddKey(time, v[0], interpolation, lt[0], rt[0], tangentType);
        this.pitch.AddKey(time, v[1], interpolation, lt[1], rt[1], tangentType);
        this.roll.AddKey(time, v[2], interpolation, lt[2], rt[2], tangentType);

        const key = new Tr2CurveEulerRotationKey();
        key.time = time;
        key.value = [ v[0], v[1], v[2] ];
        key.leftTangent = [ lt[0], lt[1], lt[2] ];
        key.rightTangent = [ rt[0], rt[1], rt[2] ];
        key.interpolation = interpolation;
        key.tangentType = tangentType;
        this.keys.push(key);
        return key;
    }

    SetExtrapolation(extrapolation)
    {
        this.EnsureScalarChannels();
        this.yaw.SetExtrapolation(extrapolation);
        this.pitch.SetExtrapolation(extrapolation);
        this.roll.SetExtrapolation(extrapolation);
    }

    EnsureScalarChannels()
    {
        if (!this.yaw) this.yaw = new Tr2CurveScalar();
        if (!this.pitch) this.pitch = new Tr2CurveScalar();
        if (!this.roll) this.roll = new Tr2CurveScalar();
    }
}

function GetScalarValue(curve, time)
{
    return curve && curve.GetValue ? curve.GetValue(time) : 0;
}

function GetScalarLength(curve)
{
    return curve && curve.Length ? curve.Length() : 0;
}

function GetYawPitchRollQuaternion(out, yaw, pitch, roll)
{
    const
        sinYaw = Math.sin(yaw / 2.0),
        cosYaw = Math.cos(yaw / 2.0),
        sinPitch = Math.sin(pitch / 2.0),
        cosPitch = Math.cos(pitch / 2.0),
        sinRoll = Math.sin(roll / 2.0),
        cosRoll = Math.cos(roll / 2.0);

    out[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
    out[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

    return out;
}
