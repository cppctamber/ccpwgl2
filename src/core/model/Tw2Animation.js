import { meta, Tw2EventEmitter } from "global";


@meta.ctor("Tw2Animation")
export class Tw2Animation extends Tw2EventEmitter
{

    @meta.struct("Tw2GeometryAnimation")
    @meta.isPrivate
    animationRes = null;

    @meta.float
    @meta.isPrivate
    time = 0;

    @meta.float
    timeScale = 1.0;

    @meta.boolean
    cycle = false;

    @meta.list("Tw2TrackGroup")
    @meta.isPrivate
    trackGroups = [];


    _callback = null;
    _controller = null;
    _state = Tw2Animation.State.FINISHED;


    /**
     * Constructor
     * @param animationController
     */
    constructor(animationController)
    {
        super();
        this._controller = animationController;
    }

    /**
     * Gets the animation's name
     * @returns {null|string}
     */
    get name()
    {
        return this.animationRes ? this.animationRes.name : null;
    }

    /**
     * Gets the animation's duration
     * @returns {number}
     */
    get duration()
    {
        return this.animationRes ? this.animationRes.duration : 0;
    }

    /**
     * Gets current percentage of duration
     * @returns {number}
     */
    get percent()
    {
        return this.animationRes ? Math.min(this.time, this.duration) / this.duration : 0;
    }

    /**
     * Adds a callback
     * - Provided for backwards compatibility
     * - If the callback returns true it will be removed once fired
     * @param {Function} [callback=null]
     */
    AddCallback(callback=null)
    {
        this._callback = callback;
    }

    /**
     * Fires the stored callback
     * - Provided for backwards compatibility
     */
    UpdateCallback()
    {
        if (this._callback)
        {
            // Cache the original callback in case the animation's callback
            // was changed from within the original callback - we don't want to remove a new one.
            const
                callback = this._callback,
                remove = callback(this, this._controller);

            if (remove && this._callback === callback)
            {
                this._callback = null;
            }
        }
    }

    /**
     * Starts playing the animation
     * @param {Object} [options={}]
     * @param {Number} [options.time=0]             - the time to play from
     * @param {Number} [options.percent]            - the percentage of the duration to play from (overrides time)
     * @param {Boolean} [options.cycle=this.cycle]  - identifies if the animation should cycle
     * @param {Number} [options.timeScale]          - the time scale
     * @param {Object} [options.events]             - events to add to the animation
     * @param {Function} [options.callback]         - a callback which is fired when the animation ends
     */
    Play(options = {})
    {
        let wasPaused = this.IsPaused();

        let {
            time = wasPaused ? this.time : 0,
            cycle = this.cycle,
            timeScale = this.timeScale,
            callback,
            events,
            percent
        } = options;

        if (percent !== undefined)
        {
            time = this.duration * percent;
        }

        this.time = Math.max(Math.min(time, this.duration), 0);
        this.timeScale = timeScale;
        this.cycle = cycle;
        this._state = Tw2Animation.State.PLAYING;

        if (events) this.add(events);

        if (callback !== undefined)
        {
            this.AddCallback(callback);
        }

        if (wasPaused)
        {
            /**
             * Fires when the animation plays after being paused
             * @event Tw2Animation#unpause
             * @type {Object}
             * @property {Tw2Animation} animation
             * @property {Tw2AnimationController} controller
             */
            this.emit("unpause", { animation: this, controller: this._controller });
        }
        else
        {
            /**
             * Fires when the animation is playing
             * @event Tw2Animation#play
             * @type {Object}
             * @property {Tw2Animation} animation
             * @property {Tw2AnimationController} controller
             */
            this.emit("play", { animation: this, controller: this._controller });
        }
    }

    /**
     * Pauses the animation at the current time
     */
    Pause()
    {
        if (this.IsPlaying())
        {
            this._state = Tw2Animation.State.PAUSED;

            /** Fires when the animation pauses
             * @event Tw2Animation#pause
             * @type {Object}
             * @property {Tw2Animation} animation
             * @property {Tw2AnimationController} controller
             */
            this.emit("pause", { animation: this, controller: this._controller });
        }
    }

    /**
     * Stops the animation
     */
    Stop()
    {
        if (!this.IsFinished())
        {
            this._state = Tw2Animation.State.FINISHED;
            this.time = this.duration;

            /**
             * Fires when the animation ends
             * @event Tw2Animation#end
             * @type {Object}
             * @property {Tw2Animation} animation
             * @property {Tw2AnimationController} controller
             */
            this.emit("end", { animation: this, controller: this._controller });

            this.UpdateCallback();
        }
    }

    /**
     * Checks if the animation is good
     * @returns {boolean}
     */
    IsGood()
    {
        return !!this.animationRes;
    }

    /**
     * Checks if the animation is playing
     * @returns {boolean}
     */
    IsPlaying()
    {
        return this._state === Tw2Animation.State.PLAYING || this._state === Tw2Animation.State.CYCLING;
    }

    /**
     * Checks if the animation is stopped
     * @returns {boolean}
     */
    IsPaused()
    {
        return this._state === Tw2Animation.State.PAUSED;
    }

    /**
     * Checks to see if the animation has finished playing
     * @return {Boolean}
     */
    IsFinished()
    {
        return this._state === Tw2Animation.State.FINISHED;
    }

    /**
     * Per frame update
     * @param {Number} dt
     * @returns {Boolean} true to keep animating
     */
    Update(dt)
    {
        if (this.IsFinished()) return false;

        // Keep calculating bone positions when paused
        if (this.IsPaused()) return true;

        this.time += dt * this.timeScale;

        if (this.time >= this.duration)
        {
            if (this.cycle)
            {
                this._state = Tw2Animation.State.CYCLING;
                this.time = this.time % this.duration;

                /**
                 * Fires when the animation starts a new animation cycle
                 * @event Tw2Animation#cycle
                 * @type {Object}
                 * @property {Tw2Animation} animation
                 * @property {Tw2AnimationController} controller
                 */
                this.emit("cycle", { animation: this, controller: this._controller });

                this.UpdateCallback();
            }
            else
            {
                this.Stop();
            }
        }

        return true;
    }

    /**
     * Animation state
     * @type {{PAUSED: number, CYCLING: number, FINISHED: number, PLAYING: number}}
     */
    static State = {
        PAUSED: 0,
        PLAYING: 1,
        CYCLING: 2,
        FINISHED: 3
    };

}
