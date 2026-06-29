import { meta } from "utils";
import { vec3 } from "math";
import { Tr2CurveScalar } from "../curve/Tr2CurveScalar";
import { Tr2CurveVector3Key } from "../curve/Tr2CurveKeys";
import { Tr2CurveInterpolation, Tr2CurveTangentType } from "../curve/Tr2CurveMath";


function EnsureScalarCurve(curve)
{
    return curve || new Tr2CurveScalar();
}

function ReadVector3(value, defaultX = 0, defaultY = 0, defaultZ = 0)
{
    return value || [ defaultX, defaultY, defaultZ ];
}

function IsOutput(value)
{
    return value && typeof value.length === "number";
}

function ResolveSampleArgs(a, b, fallback)
{
    if (IsOutput(a))
    {
        return { out: a, time: b };
    }
    return { time: a, out: IsOutput(b) ? b : fallback };
}


@meta.define({
    wgl: "Tw2CurveVector3",
    ccp: "Tr2CurveVector3"
})
export class Tw2CurveVector3 extends meta.Model
{
    @meta.string
    name = "";

    @meta.rawObject("Tr2CurveScalar")
    x = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    y = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    z = new Tr2CurveScalar();

    @meta.list(Tr2CurveVector3Key)
    keys = [];

    @meta.vector3
    currentValue = vec3.create();

    UpdateValue(time)
    {
        this.Update(time, this.currentValue);
    }

    Update(time, out = this.currentValue)
    {
        const args = ResolveSampleArgs(time, out, this.currentValue);
        this.GetValue(args.time, args.out);
        this.currentValue[0] = args.out[0];
        this.currentValue[1] = args.out[1];
        this.currentValue[2] = args.out[2];
        return args.out;
    }

    GetValue(time, out = [ 0, 0, 0 ])
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        this.z = EnsureScalarCurve(this.z);
        out[0] = this.x.GetValueAt(time);
        out[1] = this.y.GetValueAt(time);
        out[2] = this.z.GetValueAt(time);
        return out;
    }

    GetValueAt(time, out = [ 0, 0, 0 ])
    {
        const args = ResolveSampleArgs(time, out, [ 0, 0, 0 ]);
        return this.GetValue(args.time, args.out);
    }

    GetValueDotAt(time, out = [ 0, 0, 0 ])
    {
        const args = ResolveSampleArgs(time, out, [ 0, 0, 0 ]);
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        this.z = EnsureScalarCurve(this.z);
        args.out[0] = this.x.GetTangentAt(args.time);
        args.out[1] = this.y.GetTangentAt(args.time);
        args.out[2] = this.z.GetTangentAt(args.time);
        return args.out;
    }

    GetValueDoubleDotAt(time, out = [ 0, 0, 0 ])
    {
        const args = ResolveSampleArgs(time, out, [ 0, 0, 0 ]);
        args.out[0] = 0;
        args.out[1] = 0;
        args.out[2] = 0;
        return args.out;
    }

    InterpolatedPosition(time, out = [ 0, 0, 0 ])
    {
        const args = ResolveSampleArgs(time, out, [ 0, 0, 0 ]);
        return this.GetValue(args.time, args.out);
    }

    Length()
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        this.z = EnsureScalarCurve(this.z);
        return Math.max(this.x.Length(), this.y.Length(), this.z.Length());
    }

    GetLength()
    {
        return this.Length();
    }

    Sort()
    {
        if (this.x && this.x.Sort) this.x.Sort();
        if (this.y && this.y.Sort) this.y.Sort();
        if (this.z && this.z.Sort) this.z.Sort();
    }

    IsEmpty()
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        this.z = EnsureScalarCurve(this.z);
        return this.x.IsEmpty() && this.y.IsEmpty() && this.z.IsEmpty();
    }

    AddKey(time, value, interpolation = Tr2CurveInterpolation.HERMITE, leftTangent, rightTangent, tangentType = Tr2CurveTangentType.AUTO_CLAMP)
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        this.z = EnsureScalarCurve(this.z);

        const v = ReadVector3(value);
        const lt = ReadVector3(leftTangent);
        const rt = ReadVector3(rightTangent);

        this.x.AddKey(time, v[0], interpolation, lt[0], rt[0], tangentType);
        this.y.AddKey(time, v[1], interpolation, lt[1], rt[1], tangentType);
        this.z.AddKey(time, v[2], interpolation, lt[2], rt[2], tangentType);

        const key = new Tr2CurveVector3Key();
        key.time = time;
        key.value = vec3.fromValues(v[0], v[1], v[2]);
        key.leftTangent = vec3.fromValues(lt[0], lt[1], lt[2]);
        key.rightTangent = vec3.fromValues(rt[0], rt[1], rt[2]);
        key.interpolation = interpolation;
        key.tangentType = tangentType;
        this.keys.push(key);
        return key;
    }

    SetExtrapolation(extrapolation)
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        this.z = EnsureScalarCurve(this.z);
        this.x.SetExtrapolation(extrapolation);
        this.y.SetExtrapolation(extrapolation);
        this.z.SetExtrapolation(extrapolation);
    }

    GetCurrentValue()
    {
        return this.currentValue;
    }

    GetName()
    {
        return this.name;
    }

    SetName(name)
    {
        this.name = name;
    }
}
