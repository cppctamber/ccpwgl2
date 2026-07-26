import { meta } from "utils";
import { tw2 } from "global";
import { Tw2CurveKey, Tw2Curve } from "curve";
import { AudEmitter } from "@carbonenginejs/runtime-audio";


@meta.type("AudEventKey")
@meta.define({
    wgl: "AudEventKey",
    ccp: true
})
export class AudEventKey extends Tw2CurveKey
{

    @meta.float
    time = 0;

    @meta.string
    value = "";

}


/**
 * Timeline curve whose keys fire audio events, ported from Carbon's
 * AudEventCurve (see @carbonenginejs/runtime-audio). Events post through an
 * AudEmitter attached to the source observer's placement; a key crossed
 * before the emitter has a placement holds the latest event until one
 * arrives, matching Carbon.
 */
@meta.type("AudEventCurve")
@meta.define({
    wgl: "AudEventCurve",
    ccp: true
})
export class AudEventCurve extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.uint
    extrapolation = 0;

    @meta.list("AudEventKey")
    keys = [];

    @meta.struct("TriObserverLocal")
    sourceTriObserver = null;

    length = 0;

    time = 0;

    localTime = 0;

    audioEmitter = null;

    _currentKeyIndex = 0;

    _queuedEvent = "";

    /**
     * Initializes the curve
     */
    Initialize()
    {
        this.Sort();
        this._currentKeyIndex = 0;
        if (this.sourceTriObserver)
        {
            this.CreateAudioEmitter();
        }
    }

    /**
     * Sorts the curve's keys
     */
    Sort()
    {
        Tw2Curve.Sort(this, this.keys);
    }

    /**
     * Gets the curve's length
     * @returns {Number}
     */
    GetLength()
    {
        return this.length;
    }

    /**
     * Rewinds the playback cursor
     */
    Reset()
    {
        this._currentKeyIndex = 0;
        this._queuedEvent = "";
    }

    /**
     * Reuses or attaches an audio emitter as the source observer's placement observer
     * @returns {?AudEmitter}
     */
    CreateAudioEmitter()
    {
        if (!this.sourceTriObserver) return null;

        const existing = this.sourceTriObserver.observer;
        if (existing instanceof AudEmitter)
        {
            this.audioEmitter = existing;
            return existing;
        }

        const emitter = new AudEmitter();
        emitter.Initialize(this.name);
        this.sourceTriObserver.observer = emitter;
        this.audioEmitter = tw2.audMan ? tw2.audMan.AdoptEmitter(emitter) : emitter;
        return this.audioEmitter;
    }

    /**
     * Fires keyed events as time advances
     * @param {Number} time
     */
    UpdateValue(time)
    {
        if (this.length === 0) return;

        const before = this.time;
        this.time = Number(time) || 0;
        if (this.time < before)
        {
            this._currentKeyIndex = 0;
        }

        if (this.extrapolation === AudEventCurve.Extrapolation.CYCLE)
        {
            const localNow = this.time % this.length;
            if (localNow < this.localTime)
            {
                this._currentKeyIndex = 0;
            }
            this.localTime = localNow;
        }
        else
        {
            this.localTime = this.time;
        }

        if (!this.audioEmitter && this.sourceTriObserver)
        {
            this.CreateAudioEmitter();
        }

        const positioned = this.audioEmitter && this.audioEmitter.HasReceivedPosition();
        if (this._queuedEvent && positioned)
        {
            this.audioEmitter.SendEvent(this._queuedEvent);
            this._queuedEvent = "";
        }

        while (this._currentKeyIndex < this.keys.length && this.localTime >= this.keys[this._currentKeyIndex].time)
        {
            const eventName = this.keys[this._currentKeyIndex].value;
            if (eventName)
            {
                if (positioned)
                {
                    this.audioEmitter.SendEvent(eventName);
                }
                else
                {
                    this._queuedEvent = eventName;
                }
            }
            this._currentKeyIndex++;
        }
    }

    /**
     * The curve's key constructor
     * @type {AudEventKey}
     */
    static Key = AudEventKey;

    /**
     * The curve's type
     * @type {Number}
     */
    static curveType = Tw2Curve.Type.CURVE;

    /**
     * Extrapolation types (Carbon TRIEXTRAPOLATION)
     * @type {Object}
     */
    static Extrapolation = {
        NONE: 0,
        CONSTANT: 1,
        GRADIENT: 2,
        CYCLE: 3
    };

}
