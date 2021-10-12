import { meta } from "utils";
import { device, resMan } from "global";
import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { ErrHTTPRequest } from "../engine/Tw2ResMan";


@meta.type("Tw2VideoRes")
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
     * @param {undefined} response
     */
    Prepare(response)
    {
        const gl = device.gl;

        this.DeleteGL();

        switch (this._extension)
        {
            case "mp4":
            case "webm":
            case "ogg":
                this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
                gl.bindTexture(gl.TEXTURE_2D, null);
                this.width = this.video.width;
                this.height = this.video.height;
                this.video.loop = this.cycle;
                if (this.playOnLoad) this.video.play();
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }

        this.OnPrepared();
    }

    /**
     * Loads the resource from a path
     *
     * @param {String} path
     * @param {String} extension
     * @returns {Boolean} returns true to tell the resMan not to handle http requests
     */
    DoCustomLoad(path, extension)
    {
        switch (extension)
        {
            case "mp4":
            case "webm":
            case "ogg":
                this._extension = extension;
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: extension });
        }

        resMan.AddPendingLoad(path);
        this.video = document.createElement("video");
        this.video.crossOrigin = "anonymous";
        this.video.muted = true;

        /**
         * Fires on errors
         */
        this.video.onerror = () =>
        {
            resMan.RemovePendingLoad(path);
            this.video = null;
            this.OnError(new ErrHTTPRequest({ path }));
        };

        /**
         * Fires when the video is playable
         */
        this.video.oncanplay = () =>
        {
            this._playable = true;
            this.video.oncanplay = null;
            resMan.RemovePendingLoad(path);
            resMan.Queue(this, undefined, extension);
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
     * Deletes the gl texture
     */
    DeleteGL()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture);
            this.texture = null;
        }
    }

    /**
     * Unloads the video and texture from memory
     * @param {*} log
     */
    Unload(log)
    {
        this.DeleteGL();
        this._extension = null;
        this._isPlaying = false;
        this._playable = false;
        this.playOnLoad = true;
        this.video = null;
        this.OnUnloaded(log);
        return true;
    }

    /**
     * Attaches a texture
     * @param {WebGLTexture} texture
     * @param {String} [path=""]
     */
    Attach(texture, path = "")
    {
        this.DeleteGL();
        this.path = path;
        this.texture = texture;
        this._isAttached = true;
        this.OnLoaded({ hide: true, path: "attachment" });
        this.OnPrepared({ hide: true, path: "attachment" });
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
            sampler.Apply(d, false);
            this._currentSampler = sampler.hash;
        }
    }

}
