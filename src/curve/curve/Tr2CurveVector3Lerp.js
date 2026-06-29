import { meta } from "utils";
import { vec3 } from "math";


const Tr2CurveVector3LerpKeyInterpolation = {
    LINEAR: 1,
    HERMITE: 2
};


@meta.ccp.define("Tr2CurveVector3Lerp")
export class Tr2CurveVector3Lerp extends meta.Model
{
    @meta.string
    name = "";

    @meta.vector3
    initialValue = vec3.create();

    @meta.vector3
    currentValue = vec3.create();

    @meta.float
    curveStartTime = 1;

    @meta.uint
    startInterpolation = Tr2CurveVector3LerpKeyInterpolation.HERMITE;

    @meta.struct()
    curve = null;

    UpdateValue(time)
    {
        this.Update(time, this.currentValue);
    }

    Update(time, out = this.currentValue)
    {
        this.GetValueAt(time, this.currentValue);
        if (out !== this.currentValue)
        {
            out[0] = this.currentValue[0];
            out[1] = this.currentValue[1];
            out[2] = this.currentValue[2];
        }
        return out;
    }

    GetValue(time)
    {
        return this.GetValueAt(time, [ 0, 0, 0 ]);
    }

    GetValueAt(time, out = [ 0, 0, 0 ])
    {
        if (!this.curve || !this.curve.GetValueAt)
        {
            return CopyVector3(out, this.initialValue);
        }

        if (time < this.curveStartTime && this.curveStartTime > 0)
        {
            return this.LerpToFirstKey(time, out);
        }

        return this.curve.GetValueAt(time - this.curveStartTime, out);
    }

    LerpToFirstKey(time, out = [ 0, 0, 0 ])
    {
        const curveStartValue = this.curve.GetValueAt(0, [ 0, 0, 0 ]);
        if (this.curveStartTime <= 0)
        {
            return CopyVector3(out, curveStartValue);
        }

        const s = time / this.curveStartTime;
        const t = this.startInterpolation === Tr2CurveVector3LerpKeyInterpolation.LINEAR ? s : -2 * s * s * s + 3 * s * s;
        out[0] = this.initialValue[0] * (1 - t) + curveStartValue[0] * t;
        out[1] = this.initialValue[1] * (1 - t) + curveStartValue[1] * t;
        out[2] = this.initialValue[2] * (1 - t) + curveStartValue[2] * t;
        return out;
    }

    GetValueDotAt(time, out = [ 0, 0, 0 ])
    {
        return out;
    }

    GetValueDoubleDotAt(time, out = [ 0, 0, 0 ])
    {
        return out;
    }

    InterpolatedPosition(time, out = [ 0, 0, 0 ])
    {
        return out;
    }

    Length()
    {
        if (!this.curve)
        {
            return this.curveStartTime;
        }

        if (this.curve.Length)
        {
            return this.curveStartTime + this.curve.Length();
        }

        if (this.curve.GetLength)
        {
            return this.curveStartTime + this.curve.GetLength();
        }

        return this.curveStartTime;
    }

    GetLength()
    {
        return this.Length();
    }

    Sort()
    {
        if (this.curve && this.curve.Sort)
        {
            this.curve.Sort();
        }
    }
}

function CopyVector3(out, value)
{
    out[0] = value[0] || 0;
    out[1] = value[1] || 0;
    out[2] = value[2] || 0;
    return out;
}
