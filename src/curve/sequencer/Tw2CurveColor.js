import { meta } from "utils";
import { num, vec4 } from "math";
import { Tr2CurveScalar } from "../curve/Tr2CurveScalar";
import { Tr2CurveColorKey } from "../curve/Tr2CurveKeys";
import { Tr2CurveInterpolation, Tr2CurveTangentType } from "../curve/Tr2CurveMath";


@meta.define({
    wgl: "Tw2CurveColor",
    ccp: "Tr2CurveColor"
})
export class Tw2CurveColor extends meta.Model
{
    @meta.string
    name = "";

    @meta.rawObject("Tr2CurveScalar")
    r = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    g = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    b = new Tr2CurveScalar();

    @meta.rawObject("Tr2CurveScalar")
    a = new Tr2CurveScalar();

    @meta.list(Tr2CurveColorKey)
    keys = [];

    @meta.color
    currentValue = vec4.fromValues(0, 0, 0, 1);

    @meta.float
    timeOffset = 0;

    @meta.boolean
    srgbOutput = false;

    UpdateValue(time)
    {
        this.GetValue(time, this.currentValue);
    }

    Update(time, out = this.currentValue)
    {
        this.GetValue(time, this.currentValue);
        if (out !== this.currentValue)
        {
            out[0] = this.currentValue[0];
            out[1] = this.currentValue[1];
            out[2] = this.currentValue[2];
            out[3] = this.currentValue[3];
        }
        return out;
    }

    GetValueAt(time, out = [ 0, 0, 0, 1 ])
    {
        return this.GetValue(time, out);
    }

    GetValue(time, out = [ 0, 0, 0, 1 ])
    {
        const t = time - this.timeOffset;
        out[0] = GetScalarValue(this.r, t, 0);
        out[1] = GetScalarValue(this.g, t, 0);
        out[2] = GetScalarValue(this.b, t, 0);
        out[3] = IsScalarEmpty(this.a) ? 1 : GetScalarValue(this.a, t, 1);

        if (this.srgbOutput)
        {
            out[0] = num.srgbFromLinear(Math.max(out[0], 0));
            out[1] = num.srgbFromLinear(Math.max(out[1], 0));
            out[2] = num.srgbFromLinear(Math.max(out[2], 0));
            out[3] = Math.max(out[3], 0);
        }

        return out;
    }

    Length()
    {
        return Math.max(
            GetScalarLength(this.r),
            GetScalarLength(this.g),
            GetScalarLength(this.b),
            GetScalarLength(this.a)
        );
    }

    GetLength()
    {
        return this.Length();
    }

    Sort()
    {
        if (this.r && this.r.Sort) this.r.Sort();
        if (this.g && this.g.Sort) this.g.Sort();
        if (this.b && this.b.Sort) this.b.Sort();
        if (this.a && this.a.Sort) this.a.Sort();
    }

    AddKey(time, value, interpolation = Tr2CurveInterpolation.HERMITE, leftTangent = [ 0, 0, 0, 0 ], rightTangent = [ 0, 0, 0, 0 ], tangentType = Tr2CurveTangentType.AUTO_CLAMP)
    {
        this.EnsureScalarChannels();
        const v = value || [ 0, 0, 0, 1 ];
        const lt = leftTangent || [ 0, 0, 0, 0 ];
        const rt = rightTangent || [ 0, 0, 0, 0 ];
        const alpha = v[3] === undefined ? 1 : v[3];

        this.r.AddKey(time, v[0], interpolation, lt[0], rt[0], tangentType);
        this.g.AddKey(time, v[1], interpolation, lt[1], rt[1], tangentType);
        this.b.AddKey(time, v[2], interpolation, lt[2], rt[2], tangentType);
        this.a.AddKey(time, alpha, interpolation, lt[3], rt[3], tangentType);

        const key = new Tr2CurveColorKey();
        key.time = time;
        key.value = vec4.fromValues(v[0], v[1], v[2], alpha);
        key.leftTangent = vec4.fromValues(lt[0], lt[1], lt[2], lt[3]);
        key.rightTangent = vec4.fromValues(rt[0], rt[1], rt[2], rt[3]);
        key.interpolation = interpolation;
        key.tangentType = tangentType;
        this.keys.push(key);
        return key;
    }

    SetExtrapolation(extrapolation)
    {
        this.EnsureScalarChannels();
        this.r.SetExtrapolation(extrapolation);
        this.g.SetExtrapolation(extrapolation);
        this.b.SetExtrapolation(extrapolation);
        this.a.SetExtrapolation(extrapolation);
    }

    EnsureScalarChannels()
    {
        if (!this.r) this.r = new Tr2CurveScalar();
        if (!this.g) this.g = new Tr2CurveScalar();
        if (!this.b) this.b = new Tr2CurveScalar();
        if (!this.a) this.a = new Tr2CurveScalar();
    }
}

function GetScalarValue(curve, time, fallback)
{
    return curve && curve.GetValue ? curve.GetValue(time) : fallback;
}

function GetScalarLength(curve)
{
    return curve && curve.Length ? curve.Length() : 0;
}

function IsScalarEmpty(curve)
{
    return !curve || (curve.IsEmpty && curve.IsEmpty());
}
