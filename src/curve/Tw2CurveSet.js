import { meta, Tw2BaseClass } from "global";


@meta.ctor("Tw2CurveSet", "TriCurveSet")
export class Tw2CurveSet extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.list("Tw2ValueBinding")
    bindings = [];

    @meta.list("Tw2Curve")
    curves = [];

    @meta.boolean
    playOnLoad = true;

    @meta.notImplemented
    @meta.list("TriCurveSetRange")
    ranges = [];

    @meta.float
    scale = 1;

    @meta.notImplemented
    useSimTimeRebase = false;

    @meta.float
    scaledTime = 0;         // Used in old models


    _isPlaying = false;


    /**
     * Initializes the Tw2CurveSet
     */
    Initialize()
    {
        if (this.playOnLoad)
        {
            this.Play();
        }
    }

    /**
     * Plays the Tw2CurveSet
     */
    Play()
    {
        this._isPlaying = true;
        this.scaledTime = 0;
    }

    /**
     * Plays the Tw2CurveSet from a specific time
     * @param {Number} [time=0]
     */
    PlayFrom(time = 0)
    {
        this._isPlaying = true;
        this.scaledTime = time * this.scale;
    }

    /**
     * Stops the Tw2CurveSet from playing
     */
    Stop()
    {
        this._isPlaying = false;
    }

    /**
     * Internal render/update function which is called every frame
     * @param {Number} dt - Delta Time
     */
    Update(dt)
    {
        if (this._isPlaying)
        {
            this.scaledTime += dt * this.scale;

            for (let i = 0; i < this.curves.length; ++i)
            {
                this.curves[i].UpdateValue(this.scaledTime);
            }

            for (let i = 0; i < this.bindings.length; ++i)
            {
                this.bindings[i].CopyValue();
            }
        }
    }

    /**
     * Gets a range by name
     * @param {String}name
     * @returns {?Tw2CurveSetRange}
     */
    GetRangeByName(name)
    {
        for (let i = 0; i < this.ranges.length; i++)
        {
            if (this.ranges[i].name === name)
            {
                return this.ranges[i];
            }
        }
        return null;
    }

    /**
     * Gets the maximum curve duration
     *
     * @returns {Number}
     */
    GetMaxCurveDuration()
    {
        let length = 0;
        for (let i = 0; i < this.curves.length; ++i)
        {
            if ("GetLength" in this.curves[i])
            {
                length = Math.max(length, this.curves[i].GetLength());
            }
        }
        return length;
    }

}
