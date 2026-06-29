import { meta } from "utils";
import { quat, vec3 } from "math";


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


@meta.ccp.define("Tr2TranslationAdapter")
export class Tr2TranslationAdapter extends meta.Model
{
    @meta.quaternion
    rotationOffset = quat.create();

    @meta.struct()
    curve = null;

    @meta.vector3
    value = vec3.create();

    @meta.vector3
    currentValue = vec3.create();

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
            vec3.copy(this.currentValue, this.value);
        }

        vec3.transformQuat(this.currentValue, this.currentValue, this.rotationOffset);
        return vec3.copy(args.out, this.currentValue);
    }

    GetValueAt(a, b)
    {
        const args = ResolveSampleArgs(a, b, vec3.create());
        if (args.usesStart && this.start === 0)
        {
            this.start = args.time;
        }

        if (this.curve)
        {
            return SampleCurve(this.curve, args.out, this.GetLocalTime(args.time, args.usesStart), false);
        }
        return vec3.copy(args.out, this.value);
    }

    GetValueDotAt(a, b)
    {
        const args = ResolveSampleArgs(a, b, vec3.create());
        if (args.usesStart && this.start === 0)
        {
            this.start = args.time;
        }

        if (!this.curve)
        {
            return vec3.set(args.out, 0, 0, 0);
        }

        const localTime = this.GetLocalTime(args.time, args.usesStart);
        const v0 = vec3.create();
        const v1 = vec3.create();
        SampleCurve(this.curve, v0, localTime, false);
        SampleCurve(this.curve, v1, localTime - 0.1, false);
        return vec3.scale(args.out, vec3.subtract(args.out, v1, v0), 10);
    }

    GetValueDoubleDotAt(a, b)
    {
        const args = ResolveSampleArgs(a, b, vec3.create());
        return vec3.set(args.out, 0, 0, 0);
    }

    InterpolatedPosition(a, b)
    {
        const args = ResolveSampleArgs(a, b, vec3.create());
        return vec3.copy(args.out, this.currentValue);
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
