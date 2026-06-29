import { meta } from "utils";
import { quat } from "math";


@meta.ccp.define("Tr2RotationAdapter")
export class Tr2RotationAdapter extends meta.Model
{
    @meta.quaternion
    value = quat.create();

    @meta.struct()
    curve = null;

    @meta.private
    @meta.quaternion
    currentValue = quat.create();

    @meta.private
    @meta.float
    timeScale = 1;

    start = 0;
    offset = 0;

    UpdateValue(time)
    {
        if (this.curve)
        {
            SampleCurve(this.curve, this.currentValue, this.GetLocalTime(time), true);
        }
    }

    Update(a, b)
    {
        const args = ResolveSampleArgs(a, b, this.currentValue);
        if (args.usesStart && this.start === 0)
        {
            this.start = args.time;
        }

        if (this.curve)
        {
            SampleCurve(this.curve, this.currentValue, this.GetLocalTime(args.time, args.usesStart), true);
        }
        else
        {
            quat.copy(this.currentValue, this.value);
        }

        return quat.copy(args.out, this.currentValue);
    }

    GetValueAt(a, b)
    {
        const args = ResolveSampleArgs(a, b, quat.create());
        if (args.usesStart && this.start === 0)
        {
            this.start = args.time;
        }

        if (this.curve)
        {
            return SampleCurve(this.curve, args.out, this.GetLocalTime(args.time, args.usesStart), false) || args.out;
        }
        return quat.copy(args.out, this.value);
    }

    GetValueDotAt(a, b)
    {
        return quat.identity(ResolveSampleArgs(a, b, quat.create()).out);
    }

    GetValueDoubleDotAt(a, b)
    {
        return quat.identity(ResolveSampleArgs(a, b, quat.create()).out);
    }

    RandomizeStart(range = 60)
    {
        if (!range) range = 60;
        this.offset = (Math.random() * 2 - 1) * range;
    }

    ScaleTime(scale)
    {
        this.timeScale = scale;
    }

    ResetStart()
    {
        this.start = 0;
    }

    GetLocalTime(time, usesStart = false)
    {
        return usesStart ? (time - this.start + this.offset) / this.timeScale : time / this.timeScale;
    }
}

function IsOutput(value)
{
    return value && typeof value.length === "number";
}

function ResolveSampleArgs(a, b, fallback)
{
    if (IsOutput(a))
    {
        return { out: a, time: b, usesStart: true };
    }
    return { time: a, out: IsOutput(b) ? b : fallback, usesStart: false };
}

function SampleCurve(curve, out, time, update)
{
    if (!curve)
    {
        return null;
    }

    if (update && curve.Update)
    {
        return curve.Update(time, out) || out;
    }

    if (curve.GetValueAt)
    {
        return curve.GetValueAt(time, out) || out;
    }

    if (curve.GetValue)
    {
        return curve.GetValue(time, out) || out;
    }

    return null;
}
