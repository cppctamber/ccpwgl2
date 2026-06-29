import { meta } from "utils";
import { vec2 } from "math";
import { Tr2CurveScalar } from "./Tr2CurveScalar";
import { Tr2CurveVector2Key } from "./Tr2CurveKeys";
import { Tr2CurveInterpolation, Tr2CurveTangentType } from "./Tr2CurveMath";


function EnsureScalarCurve(curve)
{
    return curve || new Tr2CurveScalar();
}

function ReadVector2(value, defaultX = 0, defaultY = 0)
{
    return value || [ defaultX, defaultY ];
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


@meta.ccp.define("Tr2CurveVector2")
export class Tr2CurveVector2 extends meta.Model
{
    @meta.string
    name = "";

    @meta.rawObject("Tr2CurveScalar")
    x = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    y = new Tr2CurveScalar();

    @meta.list(Tr2CurveVector2Key)
    keys = [];

    @meta.vector2
    currentValue = vec2.create();

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
        return args.out;
    }

    GetValue(time, out = [ 0, 0 ])
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        out[0] = this.x.GetValueAt(time);
        out[1] = this.y.GetValueAt(time);
        return out;
    }

    GetValueAt(time, out = [ 0, 0 ])
    {
        const args = ResolveSampleArgs(time, out, [ 0, 0 ]);
        return this.GetValue(args.time, args.out);
    }

    GetValueDotAt(time, out = [ 0, 0 ])
    {
        const args = ResolveSampleArgs(time, out, [ 0, 0 ]);
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        args.out[0] = this.x.GetTangentAt(args.time);
        args.out[1] = this.y.GetTangentAt(args.time);
        return args.out;
    }

    GetValueDoubleDotAt(time, out = [ 0, 0 ])
    {
        const args = ResolveSampleArgs(time, out, [ 0, 0 ]);
        args.out[0] = 0;
        args.out[1] = 0;
        return args.out;
    }

    Length()
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        return Math.max(this.x.Length(), this.y.Length());
    }

    GetLength()
    {
        return this.Length();
    }

    Sort()
    {
        if (this.x && this.x.Sort) this.x.Sort();
        if (this.y && this.y.Sort) this.y.Sort();
    }

    IsEmpty()
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        return this.x.IsEmpty() && this.y.IsEmpty();
    }

    AddKey(time, value, interpolation = Tr2CurveInterpolation.HERMITE, leftTangent, rightTangent, tangentType = Tr2CurveTangentType.AUTO_CLAMP)
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);

        const v = ReadVector2(value);
        const lt = ReadVector2(leftTangent);
        const rt = ReadVector2(rightTangent);

        this.x.AddKey(time, v[0], interpolation, lt[0], rt[0], tangentType);
        this.y.AddKey(time, v[1], interpolation, lt[1], rt[1], tangentType);

        const key = new Tr2CurveVector2Key();
        key.time = time;
        key.value = vec2.fromValues(v[0], v[1]);
        key.leftTangent = vec2.fromValues(lt[0], lt[1]);
        key.rightTangent = vec2.fromValues(rt[0], rt[1]);
        key.interpolation = interpolation;
        key.tangentType = tangentType;
        this.keys.push(key);
        return key;
    }

    SetExtrapolation(extrapolation)
    {
        this.x = EnsureScalarCurve(this.x);
        this.y = EnsureScalarCurve(this.y);
        this.x.SetExtrapolation(extrapolation);
        this.y.SetExtrapolation(extrapolation);
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
