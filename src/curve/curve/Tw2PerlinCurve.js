import { meta } from "utils";
import { noise } from "math";
import { Tw2Curve } from "./Tw2Curve";


@meta.type("Tw2PerlinCurve", "TriPerlinCurve")
@meta.define({
    wgl: "Tw2PerlinCurve",
    ccp: "TriPerlinCurve"
})
export class Tw2PerlinCurve extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.float
    alpha = 1.1;

    @meta.float
    beta = 2;

    @meta.uint
    N = 3;

    @meta.float
    offset = 0;

    @meta.float
    scale = 1;

    @meta.float
    speed = 1;

    @meta.float
    @meta.isPrivate
    value = 0;

    /**
     * Per instance noise phase, matching carbonengine's
     * `mStartOffset = TriRandInt((int)10000000000)` in the TriPerlinCurve
     * constructor (trinity/trinity/TriSequencer.cpp). Runtime only; carbonengine
     * does not expose it to Blue, so it is never serialized.
     * @type {number}
     */
    _startOffset = Tw2PerlinCurve.NextStartOffset();

    /**
     * The time the cached value was computed at, matching carbonengine's
     * `mLastUpdated`. Negative means "never".
     * @type {number}
     */
    _lastUpdated = -1;

    /**
     * Sorts the curve
     */
    Sort()
    {
        // No operation
    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return 0;
    }

    /**
     * Updates the current value at the given time
     *
     * Matches carbonengine's `TriPerlinCurve::Update`, which caches on
     * `mLastUpdated` and returns the cached value for a repeated time.
     *
     * @param {number} time
     */
    UpdateValue(time)
    {
        if (this._lastUpdated === time) return;
        this._lastUpdated = time;
        this.value = this.GetValueAt(time);
    }

    /**
     * Scales the curve
     *
     * Matches carbonengine's `TriPerlinCurve::ScaleTime(float s)`, which assigns
     * `mScale` and not `mSpeed` despite its name. Preserved deliberately; changing
     * it would diverge from the client.
     *
     * @param {number} s
     */
    ScaleTime(s)
    {
        this.scale = s;
    }

    /**
     * Gets a value at a specific time
     *
     * Matches carbonengine's `TriPerlinCurve::GetValueAt(double)`
     * (trinity/trinity/TriSequencer.cpp). Note that the phase comes from the per
     * instance `_startOffset`, while `offset` shifts the output only; they are
     * two different fields upstream.
     *
     * @param {number} time
     * @returns {number}
     */
    GetValueAt(time)
    {
        let pos;

        if (Tw2PerlinCurve.expressionCurveFakeRandom)
        {
            pos = time * this.speed + 0.21;
        }
        else
        {
            pos = (time + this._startOffset) * this.speed;
        }

        return ((noise.carbonPerlin1D(pos, this.alpha, this.beta, this.N) + 1) / 2) * this.scale + this.offset;
    }

    /**
     * Draws the next per instance noise phase from carbonengine's shared TriRand
     * linear congruential state, reproducing its 32 bit integer truncation so the
     * offsets follow the same sequence as the client.
     *
     * @returns {number}
     */
    static NextStartOffset()
    {
        let state = Tw2PerlinCurve._triRandState;
        state = ((state << 12) + 150889) >>> 0;
        state %= 714025;
        Tw2PerlinCurve._triRandState = state;

        // carbonengine truncates 10,000,000,000 to its 32 bit `int` parameter
        const carbonIntLimit = 10000000000 >>> 0;
        return Math.floor((Math.imul(carbonIntLimit, state) >>> 0) / 714025);
    }

    /**
     * Shared TriRand state, seeded as carbonengine seeds it
     * @type {number}
     */
    static _triRandState = 1234;

    /**
     * Forces a deterministic phase, matching carbonengine's
     * `g_expressionCurveFakeRandom` debug setting. Test only.
     * @type {boolean}
     */
    static expressionCurveFakeRandom = false;

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 1;

    /**
     * The curve's current value property
     * @type {String}
     */
    static valueProperty = "value";

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE_NO_KEYS;

}
