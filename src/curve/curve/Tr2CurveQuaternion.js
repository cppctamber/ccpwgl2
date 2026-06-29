import { meta } from "utils";
import { quat } from "math";
import { Tr2CurveQuaternionKey } from "./Tr2CurveKeys";
import { Tr2CurveExtrapolation, Tr2CurveInterpolation } from "./Tr2CurveMath";


@meta.ccp.define("Tr2CurveQuaternion")
export class Tr2CurveQuaternion extends meta.Model
{
    @meta.string
    name = "";

    @meta.list(Tr2CurveQuaternionKey)
    keys = [];

    @meta.quaternion
    currentValue = quat.create();

    @meta.uint
    extrapolationBefore = Tr2CurveExtrapolation.CLAMP;

    @meta.uint
    extrapolationAfter = Tr2CurveExtrapolation.CLAMP;

    _lastSegment = 0;

    Initialize()
    {
        this.OnKeysChanged();
        return true;
    }

    Sort()
    {
        this.OnKeysChanged();
    }

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
        const count = this.keys.length;
        if (!count)
        {
            return quat.identity(out);
        }

        if (count === 1)
        {
            return quat.copy(out, this.keys[0].value);
        }

        if (this.extrapolationBefore === Tr2CurveExtrapolation.CLAMP && time <= this.keys[0].time)
        {
            return quat.copy(out, this.keys[0].value);
        }

        const lastKey = this.keys[count - 1];
        if (this.extrapolationAfter === Tr2CurveExtrapolation.CLAMP && time >= lastKey.time)
        {
            return quat.copy(out, lastKey.value);
        }

        const localTime = this.GetLocalTime(time);
        const segment = this.FindSegment(localTime);
        return this.GetSegmentValue(localTime, segment[0], segment[1], out);
    }

    GetValueDotAt(time, out = quat.create())
    {
        return quat.identity(out);
    }

    GetValueDoubleDotAt(time, out = quat.create())
    {
        return quat.identity(out);
    }

    Length()
    {
        return this.keys.length ? this.keys[this.keys.length - 1].time : 0;
    }

    GetLength()
    {
        return this.Length();
    }

    GetCurrentValue(out)
    {
        return out ? quat.copy(out, this.currentValue) : this.currentValue;
    }

    GetName()
    {
        return this.name;
    }

    SetName(name)
    {
        this.name = name;
    }

    OnKeysChanged()
    {
        this.keys = this.keys
            .map((key, index) => ({ key: key instanceof Tr2CurveQuaternionKey ? key : new Tr2CurveQuaternionKey(key), index }))
            .sort((a, b) => Tr2CurveQuaternionKey.Compare(a.key, b.key) || a.index - b.index)
            .map(entry => entry.key);
        this._lastSegment = 0;
    }

    AddKey(time, value, interpolation = Tr2CurveInterpolation.LINEAR)
    {
        const key = new Tr2CurveQuaternionKey({
            time,
            value,
            id: 0,
            interpolation
        });
        this.keys.push(key);
        this.OnKeysChanged();
        return key;
    }

    SetExtrapolation(extrapolation)
    {
        this.extrapolationBefore = extrapolation;
        this.extrapolationAfter = extrapolation;
    }

    SetDefinition(definition)
    {
        this.extrapolationBefore = definition.extrapolationBefore;
        this.extrapolationAfter = definition.extrapolationAfter;
        this.keys = (definition.keys || [])
            .slice(0, definition.keyCount === undefined ? undefined : definition.keyCount)
            .map(key => key instanceof Tr2CurveQuaternionKey ? key : new Tr2CurveQuaternionKey(key));
        this.OnKeysChanged();
    }

    GetDefinition()
    {
        return {
            keys: this.keys.map(key => key.ToDefinition()),
            keyCount: this.keys.length,
            extrapolationBefore: this.extrapolationBefore,
            extrapolationAfter: this.extrapolationAfter
        };
    }

    GetLocalTime(time)
    {
        if (!this.keys.length)
        {
            return 0;
        }

        const first = this.keys[0].time;
        const last = this.keys[this.keys.length - 1].time;
        const length = last - first;
        if (length === 0)
        {
            return first;
        }

        if (time < first)
        {
            const raw = -(time - first) / length;
            const intPart = Math.trunc(raw);
            let fracPart = raw - intPart;

            if (this.extrapolationBefore === Tr2CurveExtrapolation.CYCLE)
            {
                fracPart = 1 - fracPart;
            }
            else if (intPart % 2 !== 0)
            {
                fracPart = 1 - fracPart;
            }

            return fracPart * length + first;
        }

        if (time < last)
        {
            return time;
        }

        const raw = (time - first) / length;
        const intPart = Math.trunc(raw);
        let fracPart = raw - intPart;

        if (this.extrapolationAfter === Tr2CurveExtrapolation.MIRROR && intPart % 2 !== 0)
        {
            fracPart = 1 - fracPart;
        }

        return fracPart * length + first;
    }

    GetSegmentValue(time, k0, k1, out)
    {
        if (k0.interpolation === Tr2CurveInterpolation.CONSTANT)
        {
            return quat.copy(out, time === k1.time ? k1.value : k0.value);
        }

        const length = k1.time - k0.time;
        if (length === 0)
        {
            return quat.copy(out, k1.value);
        }

        return quat.slerp(out, k0.value, k1.value, (time - k0.time) / length);
    }

    FindSegment(time, updateCache = true)
    {
        const count = this.keys.length;
        if (this._lastSegment + 1 < count)
        {
            let k0 = this.keys[this._lastSegment];
            let k1 = this.keys[this._lastSegment + 1];
            if (time >= k0.time && time < k1.time)
            {
                return [ k0, k1 ];
            }

            if (this._lastSegment + 2 < count)
            {
                k0 = this.keys[this._lastSegment + 1];
                k1 = this.keys[this._lastSegment + 2];
                if (time >= k0.time && time < k1.time)
                {
                    if (updateCache) this._lastSegment++;
                    return [ k0, k1 ];
                }
            }

            if (this._lastSegment > 1)
            {
                k0 = this.keys[this._lastSegment - 1];
                k1 = this.keys[this._lastSegment];
                if (time >= k0.time && time < k1.time)
                {
                    if (updateCache) this._lastSegment--;
                    return [ k0, k1 ];
                }
            }
        }

        for (let i = 0; i + 1 < count; i++)
        {
            const k0 = this.keys[i];
            const k1 = this.keys[i + 1];
            if (time >= k0.time && time < k1.time)
            {
                if (updateCache) this._lastSegment = i;
                return [ k0, k1 ];
            }
        }

        if (updateCache) this._lastSegment = count - 2;
        return [ this.keys[count - 2], this.keys[count - 1] ];
    }
}
