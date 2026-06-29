import { meta } from "utils";
import { quat } from "math";


@meta.ccp.define("Tr2QuaternionLerpCurve")
export class Tr2QuaternionLerpCurve extends meta.Model
{
    @meta.float
    start = 0;

    @meta.float
    length = 0;

    @meta.quaternion
    value = quat.fromValues(0, 0, 0, 1);

    @meta.notOwned
    @meta.struct()
    startCurve = null;

    @meta.notOwned
    @meta.struct()
    endCurve = null;

    _startValue = quat.create();
    _endValue = quat.create();

    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    }

    Update(time, out = this.value)
    {
        this.GetValueAt(time, this.value);
        return quat.copy(out, this.value);
    }

    Length()
    {
        return this.length;
    }

    GetLength()
    {
        return this.Length();
    }

    Sort()
    {
    }

    GetValueAt(time, out = quat.create())
    {
        if (!this.startCurve || !this.endCurve || this.length <= 0)
        {
            return out;
        }

        const ratio = Math.max(0, Math.min(1, (time - this.start) / this.length));
        this.GetChildValue(this.startCurve, time, this._startValue);
        this.GetChildValue(this.endCurve, time, this._endValue);
        return quat.slerp(out, this._startValue, this._endValue, ratio);
    }

    GetValueDotAt(time, out = quat.create())
    {
        return out;
    }

    GetValueDoubleDotAt(time, out = quat.create())
    {
        return out;
    }

    GetChildValue(curve, time, out)
    {
        if (curve.GetValueAt)
        {
            return curve.GetValueAt(time, out);
        }

        if (curve.GetValue)
        {
            return curve.GetValue(time, out);
        }

        if (curve.currentValue)
        {
            return quat.copy(out, curve.currentValue);
        }

        return out;
    }
}
