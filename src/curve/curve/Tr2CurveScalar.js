import { meta } from "utils";
import { Tr2CurveScalarKey } from "./Tr2CurveKeys";
import {
    GetAutoClampedTangent,
    GetAutoTangent,
    GetScalarSegmentTangent,
    GetScalarSegmentValue,
    GetWrappedLocalTime,
    Tr2CurveExtrapolation,
    Tr2CurveInterpolation,
    Tr2CurveTangentType
} from "./Tr2CurveMath";


@meta.ccp.define("Tr2CurveScalar")
export class Tr2CurveScalar extends meta.Model
{
    @meta.string
    name = "";

    @meta.list(Tr2CurveScalarKey)
    keys = [];

    @meta.float
    currentValue = 0;

    @meta.uint
    extrapolationBefore = Tr2CurveExtrapolation.CLAMP;

    @meta.uint
    extrapolationAfter = Tr2CurveExtrapolation.CLAMP;

    @meta.float
    timeOffset = 0;

    @meta.float
    timeScale = 1;

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
        this.currentValue = this.GetValue(time);
    }

    Update(time)
    {
        this.currentValue = this.GetValue(time);
        return this.currentValue;
    }

    GetValueAt(time)
    {
        return this.GetValue(time);
    }

    GetValue(time)
    {
        const count = this.keys.length;
        if (!count)
        {
            return 0;
        }

        const scaledTime = this.GetScaledTime(time);

        if (this.extrapolationBefore === Tr2CurveExtrapolation.LINEAR && scaledTime < this.keys[0].time)
        {
            const key = this.keys[0];
            return key.value - (key.time - scaledTime) * key.leftTangent;
        }

        const lastKey = this.keys[count - 1];
        if (this.extrapolationAfter === Tr2CurveExtrapolation.LINEAR && scaledTime > lastKey.time)
        {
            return lastKey.value + (scaledTime - lastKey.time) * lastKey.rightTangent;
        }

        if (count === 1)
        {
            return this.keys[0].value;
        }

        if (this.extrapolationBefore === Tr2CurveExtrapolation.CLAMP && scaledTime <= this.keys[0].time)
        {
            return this.keys[0].value;
        }

        if (this.extrapolationAfter === Tr2CurveExtrapolation.CLAMP && scaledTime >= lastKey.time)
        {
            return lastKey.value;
        }

        const localTime = this.GetLocalTime(time);
        const segment = this.FindSegment(localTime);
        return GetScalarSegmentValue(localTime, segment[0], segment[1]);
    }

    GetTangent(time)
    {
        const count = this.keys.length;
        if (!count)
        {
            return 0;
        }

        const scaledTime = this.GetScaledTime(time);

        if (this.extrapolationBefore === Tr2CurveExtrapolation.LINEAR && scaledTime < this.keys[0].time)
        {
            return this.keys[0].leftTangent;
        }

        const lastKey = this.keys[count - 1];
        if (this.extrapolationAfter === Tr2CurveExtrapolation.LINEAR && scaledTime > lastKey.time)
        {
            return lastKey.rightTangent;
        }

        if (count === 1)
        {
            return this.keys[0].rightTangent;
        }

        if (this.extrapolationBefore === Tr2CurveExtrapolation.CLAMP && scaledTime <= this.keys[0].time)
        {
            return 0;
        }

        if (this.extrapolationAfter === Tr2CurveExtrapolation.CLAMP && scaledTime >= lastKey.time)
        {
            return 0;
        }

        const localTime = this.GetLocalTime(time);
        const segment = this.FindSegment(localTime, false);
        return GetScalarSegmentTangent(localTime, segment[0], segment[1]);
    }

    GetTangentAt(time)
    {
        return this.GetTangent(time);
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

    GetTimeOffset()
    {
        return this.timeOffset;
    }

    SetTimeOffset(timeOffset)
    {
        this.timeOffset = timeOffset;
    }

    GetTimeScale()
    {
        return this.timeScale;
    }

    SetTimeScale(timeScale)
    {
        this.timeScale = timeScale;
    }

    ScaleTime(scale)
    {
        this.timeScale = scale;
    }

    Length()
    {
        return this.keys.length ? this.keys[this.keys.length - 1].time : 0;
    }

    GetLength()
    {
        return this.Length();
    }

    IsEmpty()
    {
        return this.keys.length === 0;
    }

    OnKeysChanged()
    {
        this.keys = this.keys
            .map((key, index) => ({ key: key instanceof Tr2CurveScalarKey ? key : new Tr2CurveScalarKey(key), index }))
            .sort((a, b) => Tr2CurveScalarKey.Compare(a.key, b.key) || a.index - b.index)
            .map(entry => entry.key);
        this._lastSegment = 0;

        for (let i = 0; i < this.keys.length; i++)
        {
            const key = this.keys[i];
            switch (key.tangentType)
            {
                case Tr2CurveTangentType.AUTO_CLAMP:
                    if (i === 0 || i + 1 === this.keys.length)
                    {
                        key.leftTangent = 0;
                        key.rightTangent = 0;
                    }
                    else
                    {
                        const tangent = GetAutoClampedTangent(
                            this.keys[i - 1].time,
                            this.keys[i - 1].value,
                            key.time,
                            key.value,
                            this.keys[i + 1].time,
                            this.keys[i + 1].value
                        );
                        key.leftTangent = tangent;
                        key.rightTangent = tangent;
                    }
                    break;

                case Tr2CurveTangentType.AUTO:
                    if (i === 0 || i + 1 === this.keys.length)
                    {
                        key.leftTangent = 0;
                        key.rightTangent = 0;
                    }
                    else
                    {
                        const tangent = GetAutoTangent(
                            this.keys[i - 1].time,
                            this.keys[i - 1].value,
                            key.time,
                            key.value,
                            this.keys[i + 1].time,
                            this.keys[i + 1].value
                        );
                        key.leftTangent = tangent;
                        key.rightTangent = tangent;
                    }
                    break;

                case Tr2CurveTangentType.FREE_JOINED:
                    key.rightTangent = key.leftTangent;
                    break;
            }
        }
    }

    AddKey(time, value, interpolation = Tr2CurveInterpolation.HERMITE, leftTangent = 0, rightTangent = 0, tangentType = Tr2CurveTangentType.AUTO_CLAMP)
    {
        const key = new Tr2CurveScalarKey({
            time,
            value,
            leftTangent,
            rightTangent,
            interpolation,
            tangentType,
            id: 0
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

    GetKeys()
    {
        return this.keys;
    }

    SetDefinition(definition)
    {
        this.extrapolationBefore = definition.extrapolationBefore;
        this.extrapolationAfter = definition.extrapolationAfter;
        this.keys = (definition.keys || [])
            .slice(0, definition.keyCount === undefined ? undefined : definition.keyCount)
            .map(key => key instanceof Tr2CurveScalarKey ? key : new Tr2CurveScalarKey(key));
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

    Rasterize(destination)
    {
        const width = destination.width || 0;
        const stride = destination.stride || 1;
        const data = destination.data || [];
        for (let i = 0; i < width; i++)
        {
            const t = width === 1 ? 0.5 : i / (width - 1);
            data[i * stride] = this.GetValue(t);
        }
        destination.data = data;
        return destination;
    }

    GetScaledTime(time)
    {
        return time / this.timeScale - this.timeOffset;
    }

    GetLocalTime(time)
    {
        if (!this.keys.length)
        {
            return 0;
        }

        const scaledTime = this.GetScaledTime(time);
        const first = this.keys[0].time;
        const last = this.keys[this.keys.length - 1].time;
        return GetWrappedLocalTime(scaledTime, first, last, this.extrapolationBefore, this.extrapolationAfter);
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

    static Rasterize(destination, definition)
    {
        const curve = new Tr2CurveScalar();
        curve.SetDefinition(definition);
        return curve.Rasterize(destination);
    }
}
