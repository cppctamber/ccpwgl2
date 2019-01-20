import {util, Tw2BaseClass} from "../../global";

/**
 * Curve set
 * TODO: Implement useSimTimeRebase
 * TODO: Implement ranges - Are these read only or do they need to relate back to an AnimationRes some how?
 * @ccp TriCurveSet
 *
 * @property {Array.<Tw2ValueBinding>} bindings                    -
 * @property {Array.<Curve|CurveExpression|CurveSequencer>} curves -
 * @property {Boolean} playOnLoad                                  -
 * @property {Array.<Tw2CurveSetRange>} ranges                     -
 * @property {Number} scale                                        -
 * @property {Boolean} useSimTimeRebase                            -
 * @property {Boolean} _isPlaying                                  -
 * @property {Number} scaledTime                                  -
 */
export class Tw2CurveSet extends Tw2BaseClass
{
    // ccp
    bindings = [];
    curves = [];
    playOnLoad = false;
    ranges = [];
    scale = 0;
    useSimTimeRebase = false;
    scaledTime = 0;

    // ccpwgl
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

Tw2BaseClass.define(Tw2CurveSet, Type =>
{
    return {
        isStaging: true,
        type: "Tw2CurveSet",
        props: {
            bindings: [["Tw2ValueBinding"]],
            curves: Type.ARRAY,
            playOnLoad: Type.BOOLEAN,
            ranges: [["Tw2CurveSetRange"]],
            scale: Type.NUMBER,
            scaledTime: Type.NUMBER,
            useSimTimeRebase: Type.BOOLEAN
        },
        notImplemented: [
            "simTimeRebase"
        ]
    };
});

