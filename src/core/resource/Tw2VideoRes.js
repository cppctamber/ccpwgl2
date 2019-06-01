import {device, resMan} from "../../global";
import {Tw2Resource} from "./Tw2Resource";
import {ErrHTTPRequest, ErrResourceExtensionUnregistered} from "../Tw2Error";

/**
 * Tw2VideoRes
 *
 * @property {?WebGLTexture} texture   - The video's webgl texture
 * @property {?HTMLVideoElement} video - The video
 * @property {Number} width            - The texture's width
 * @property {Number} height           - The texture's height
 * @property {Boolean} cycle           - Enables video looping
 * @property {Boolean} playOnLoad      - Plays the video as soon as it is able to
 * @property {Number} _currentSampler  - The current sampler's hash
 * @property {Number} _currentTime     - The video's current time
 * @property {Boolean} _playable       - Identifies if the video is playable
 * @property {Boolean} _isPlaying      - Identifies if the video is playing
 * @property {?Function} _onPlaying    - An optional callback which is fired when the video is playing
 * @property {?Function} _onPause      - An optional callback which is fired when the video is paused
 * @property {?Function} _onEnded      - An optional callback which is fired when the video has ended
 * @class
 */
export class Tw2VideoRes extends Tw2Resource
{

    texture = null;
    video = null;
    width = 0;
    height = 0;
    cycle = true;
    playOnLoad = true;
    _currentSampler = 0;
    _currentTime = -1;
    _playable = false;
    _isPlaying = false;
    _onPlaying = null;
    _onPause = null;
    _onEnded = null;


    /**
     * Checks if the resource is good
     * @returns {Boolean}
     */
    IsGood()
    {
        this.KeepAlive();
        return super.IsGood() && this.video && this._playable;
    }

    /**
     * Keeps the resource alive
     */
    KeepAlive()
    {
        this.activeFrame = resMan.activeFrame;
    }

    /**
     * Plays the animation
     * @param {Boolean} [cycle] Sets playing to loop
     * @param {Function|null} [onFinished=null] Optional callback to fire when the video has finished
     */
    Play(cycle = false, onFinished = null)
    {
        this.cycle = cycle;
        this._onEnded = onFinished;

        if (this.video && this._playable)
        {
            this.video.loop = this.cycle;
            this.video.play();
        }
        else
        {
            this.playOnLoad = true;
        }
    }

    /**
     * Pauses the video
     */
    Pause()
    {
        if (this.video)
        {
            this.video.pause();
        }
        else
        {
            this.playOnLoad = false;
        }
    }

    /**
     * Prepares the resource
     * @param {String} extension
     */
    Prepare(extension)
    {
        const gl = device.gl;

        switch (extension)
        {
            case "mp4":
            case "webm":
            case "ogg":
                this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.bindTexture(gl.TEXTURE_2D, null);
                this.width = this.video.width;
                this.height = this.video.height;
                this.video.loop = this.cycle;
                if (this.playOnLoad) this.video.play();
                break;

            default:
                throw new ErrResourceExtensionUnregistered({path: this.path, extension});
        }

        this.OnPrepared();
    }

    /**
     * Loads the resource from a path
     *
     * @param {String} path
     * @param {String} extension
     * @param {Tw2ResMan} resMan
     * @returns {Boolean} returns true to tell the resMan not to handle http requests
     */
    DoCustomLoad(path, extension, resMan)
    {
        switch (extension)
        {
            case "mp4":
            case "webm":
            case "ogg":
                break;

            default:
                throw new ErrResourceExtensionUnregistered({path, extension});
        }

        this.video = document.createElement("video");
        this.video.crossOrigin = "anonymous";
        this.video.muted = true;

        /**
         * Fires on errors
         */
        this.video.onerror = () =>
        {
            resMan._pendingLoads--;
            this.video = null;
            this.OnError(new ErrHTTPRequest({path}));
        };

        /**
         * Fires when the video is playable
         */
        this.video.oncanplay = () =>
        {
            this._playable = true;
            this.video.oncanplay = null;
            resMan._pendingLoads--;
            resMan.Queue(this, extension);
            this.OnLoaded();
        };

        /**
         * Fires when the video has ended
         */
        this.video.onended = () =>
        {
            this._isPlaying = false;
            if (this._onEnded) this._onEnded(this);
        };

        /**
         * Fires when the video is paused
         */
        this.video.onpause = () =>
        {
            this._isPlaying = false;
            if (this._onPause) this._onPause(this);
        };

        /**
         * Fires when the video is playing
         */
        this.video.onplaying = () =>
        {
            this._isPlaying = true;
            if (this._onPlaying) this._onPlaying(this);
        };

        this.video.src = path;
        return true;
    }

    /**
     * Unloads the video and texture from memory
     */
    Unload()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture);
            this.texture = null;
        }

        this._isPlaying = false;
        this._playable = false;
        this.playOnLoad = true;
        this.video = null;
        this.OnUnloaded();
        return true;
    }

    /**
     * Bind
     * @param {Tw2SamplerState} sampler
     */
    Bind(sampler)
    {
        const
            d = device,
            gl = d.gl;

        this.KeepAlive();
        const targetType = sampler.samplerType;
        if (targetType !== gl.TEXTURE_2D) return;

        if (!this.texture)
        {
            gl.bindTexture(gl.TEXTURE_2D, d.GetFallbackTexture());
            return;
        }

        this._currentTime = this.video.currentTime;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindTexture(targetType, this.texture);
        if (sampler.hash !== this._currentSampler)
        {
            sampler.Apply(false);
            this._currentSampler = sampler.hash;
        }
    }

}
