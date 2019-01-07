import {util} from "../../global";

/**
 * Tw2CurveSet
 *
 * @property {String|Number} _id
 * @property {String} name
 * @property {Array.<Tw2Curve|Tw2CurveSequencer>} curves
 * @property {Array} bindings
 * @property {Number} scale
 * @property {Boolean} playOnLoad
 * @property {Boolean} isPlaying
 * @property {Number} scaledTime
 */
export class Tw2CurveSet
{

    _id = util.generateID();
    name = "";
    curves = [];
    bindings = [];
    scale = 1;
    playOnLoad = true;
    isPlaying = false;
    scaledTime = 0;


    /**
     * Initializes the Tw2CurveSet
     */
    Initialize()
    {
        if (this.playOnLoad) this.Play();
    }

    /**
     * Plays the Tw2CurveSet
     */
    Play()
    {
        this.isPlaying = true;
        this.scaledTime = 0;
    }

    /**
     * Plays the Tw2CurveSet from a specific time
     * @param {Number} [time=0]
     */
    PlayFrom(time = 0)
    {
        this.isPlaying = true;
        this.scaledTime = time;
    }

    /**
     * Stops the Tw2CurveSet from playing
     */
    Stop()
    {
        this.isPlaying = false;
    }

    /**
     * Internal render/update function which is called every frame
     * @param {Number} dt - Delta Time
     */
    Update(dt)
    {
        if (this.isPlaying)
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
