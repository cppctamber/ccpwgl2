import { meta } from "utils";


@meta.define({
    wgl: "Tw2CurveSet",
    ccp: "TriCurveSet"
})
export class Tw2CurveSet extends meta.Model
{
    @meta.string
    name = "";

    @meta.list("Tw2ValueBinding")
    bindings = [];

    @meta.list("Tw2Curve")
    curves = [];

    @meta.struct()
    driver = null;

    @meta.list("Tr2CurveSetRange", "Tw2CurveSetRange")
    ranges = [];

    @meta.float
    scale = 1;

    @meta.boolean
    playOnLoad = true;

    @meta.boolean
    isPlaying = false;

    @meta.float
    scaledTime = 0;

    @meta.boolean
    useSimTimeRebase = false;

    @meta.boolean
    useRealTime = false;

    _stopOnNextFrame = false;
    _startTime = 0;
    _lastTime = 0;
    _endTime = 0;
    _hasTimeRange = false;
    _loopedTimeRange = true;
    _timeRangeMin = 0;
    _timeRangeMax = 0;
    _callback = null;
    _isUsingSimTimeRebase = false;
    _deltaTime = 0;

    get _isPlaying()
    {
        return this.isPlaying;
    }

    set _isPlaying(value)
    {
        this.isPlaying = value;
    }

    Initialize()
    {
        if (this.playOnLoad)
        {
            this.Play();
        }

        this._isUsingSimTimeRebase = !!this.useSimTimeRebase;
        return true;
    }

    Update(time)
    {
        if (this.useRealTime)
        {
            time = Date.now() * 0.001;
        }

        if (this.driver && this.driver.GetCurveSetTime)
        {
            time = this.driver.GetCurveSetTime(time);
        }

        if (this._endTime < 0)
        {
            this._endTime = time - this._endTime;
        }

        if (this.isPlaying)
        {
            if (this._startTime < 0)
            {
                this._startTime = this.driver ? 0 : time;
            }

            const elapsed = time - this._startTime;
            const delta = elapsed - this._lastTime;
            this._lastTime = elapsed;

            this.scaledTime += this.scale * delta;
            this.ApplyTimeRange();

            if (this._endTime > 0 && this._startTime + this.scaledTime >= this._endTime)
            {
                this.scaledTime = this._endTime - this._startTime - 0.001;
                this._stopOnNextFrame = true;
            }

            this.Apply();
        }

        if (this._stopOnNextFrame)
        {
            this.FireStopCallback();
            this.isPlaying = false;
            this._stopOnNextFrame = false;
        }
    }

    UpdateDelta(dt)
    {
        this._deltaTime += dt;
        if (!this.useRealTime && this._startTime < 0)
        {
            this._startTime = 0;
        }
        this.Update(this._deltaTime);
    }

    Play()
    {
        this.PlayFrom(0);
    }

    PlayFrom(time = 0)
    {
        this._startTime = -1;
        this._endTime = 0;
        this.isPlaying = true;
        this._lastTime = 0;
        this.scaledTime = time;
        this._deltaTime = 0;

        for (let i = 0; i < this.curves.length; i++)
        {
            if (this.curves[i] && this.curves[i].Reset)
            {
                this.curves[i].Reset();
            }
        }

        this._callback = null;
    }

    PlayTimeRange(name)
    {
        const range = this.GetRangeByName(name);
        if (!range)
        {
            return false;
        }

        this.SetTimeRange(range.startTime, range.endTime, range.looped);
        this.Play();
        return true;
    }

    Stop()
    {
        this.isPlaying = false;
    }

    StopOnNextFrame()
    {
        this._stopOnNextFrame = true;
    }

    StopAfter(seconds)
    {
        this._endTime = -seconds;
    }

    StopAfterWithCallback(seconds, callback)
    {
        this.StopAfter(seconds);
        this._callback = callback;
    }

    IsPlaying()
    {
        return this.isPlaying;
    }

    Apply()
    {
        for (let i = 0; i < this.curves.length; i++)
        {
            if (this.curves[i] && this.curves[i].UpdateValue)
            {
                this.curves[i].UpdateValue(this.scaledTime);
            }
        }

        for (let i = 0; i < this.bindings.length; i++)
        {
            if (this.bindings[i] && this.bindings[i].CopyValue)
            {
                this.bindings[i].CopyValue();
            }
        }
    }

    ApplyTime(time)
    {
        this.scaledTime = time;
        this.Apply();
    }

    GetName()
    {
        return this.name;
    }

    SetName(name)
    {
        this.name = name;
    }

    GetCurvesCount()
    {
        return this.curves.length;
    }

    GetCurve(index)
    {
        return this.curves[index];
    }

    AddCurve(curve)
    {
        this.curves.push(curve);
    }

    GetBindingsCount()
    {
        return this.bindings.length;
    }

    GetBinding(index)
    {
        return this.bindings[index];
    }

    AddBinding(binding)
    {
        this.bindings.push(binding);
    }

    GetMaxCurveDuration()
    {
        let maxDuration = 0;
        for (let i = 0; i < this.curves.length; i++)
        {
            const curve = this.curves[i];
            let length = 0;
            if (curve && curve.Length)
            {
                length = curve.Length();
            }
            else if (curve && curve.GetLength)
            {
                length = curve.GetLength();
            }
            maxDuration = Math.max(maxDuration, length);
        }
        return maxDuration;
    }

    GetRangeDuration(name)
    {
        const range = this.GetRangeByName(name);
        return range ? range.endTime - range.startTime : 0;
    }

    GetTimeScale()
    {
        return this.scale;
    }

    SetTimeScale(scale)
    {
        this.scale = scale;
    }

    GetScaledTime()
    {
        return this.scaledTime;
    }

    OnSimClockRebase(oldTime, newTime)
    {
        const diff = newTime - oldTime;
        this._startTime += diff;
        if (this._endTime > 0)
        {
            this._endTime += diff;
        }
    }

    SetTimeRange(timeMin, timeMax, looped = true)
    {
        this._hasTimeRange = true;
        this._timeRangeMin = Math.min(timeMin, timeMax);
        this._timeRangeMax = Math.max(timeMin, timeMax);
        this._loopedTimeRange = looped;
    }

    ResetTimeRange()
    {
        this._hasTimeRange = false;
        this._timeRangeMin = 0;
        this._timeRangeMax = 0;
    }

    HasTimeRange()
    {
        return this._hasTimeRange;
    }

    GetTimeRange()
    {
        return [ this._timeRangeMin, this._timeRangeMax ];
    }

    GetRangeByName(name)
    {
        return this.ranges.find(range => range.name === name) || null;
    }

    ApplyTimeRange()
    {
        if (!this._hasTimeRange)
        {
            return;
        }

        if (this.scaledTime < this._timeRangeMin)
        {
            this.scaledTime = this._timeRangeMin;
        }

        const length = this._timeRangeMax - this._timeRangeMin;
        if (length <= 0)
        {
            this.scaledTime = this._timeRangeMin;
            return;
        }

        if (this._loopedTimeRange)
        {
            this.scaledTime = ((this.scaledTime - this._timeRangeMin) % length + length) % length + this._timeRangeMin;
        }
        else
        {
            this.scaledTime = Math.min(this.scaledTime, this._timeRangeMax);
        }
    }

    FireStopCallback()
    {
        if (!this._callback)
        {
            return;
        }

        if (typeof this._callback === "function")
        {
            this._callback();
        }
        else if (this._callback.CallVoid)
        {
            this._callback.CallVoid();
        }

        if (this._callback && this._callback.Destroy)
        {
            this._callback.Destroy();
        }

        this._callback = null;
    }
}
