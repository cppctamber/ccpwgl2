import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { meta } from "utils";
import { resMan } from "global";
import { ErrHTTPRequest } from "core/engine";
import { AudioFormatWem } from "./formats/AudioFormatWem";


/**
 * Audio resource
 *
 * mp3/ogg/wav load as an HTMLAudioElement. wem and bnk load as raw bytes:
 * wem decodes to a WebAudio buffer on demand through the runtime-resource
 * wem format, and bnk bytes are sliced by consumers (the audio manager)
 * using library embedded-media offsets.
 *
 * @property {?HTMLAudioElement} audio - element-backed audio (mp3/ogg/wav)
 * @property {?Uint8Array} data        - raw bytes (wem/bnk)
 */
@meta.type("Tw2AudioRes")
@meta.wgl.define("Tw2AudioRes")
export class Tw2AudioRes extends Tw2Resource
{

    audio = null;

    data = null;

    _audioBuffer = null;

    /**
     * Prepares the resource
     * @param response
     */
    Prepare(response)
    {
        switch (this._extension)
        {
            case "mp3":
            case "ogg":
            case "wav":
            case "wem":
            case "bnk":
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }

        this.OnPrepared();
    }

    /**
     * Decodes wem bytes into a WebAudio buffer, cached per resource
     * @param {AudioContext} context
     * @return {Promise<AudioBuffer>}
     */
    async GetAudioBuffer(context)
    {
        if (this._extension !== "wem")
        {
            throw new ErrResourceFormatUnsupported({ format: this._extension });
        }
        if (!this._audioBuffer)
        {
            this._audioBuffer = await AudioFormatWem.DecodeAudioBuffer(this.data, context);
        }
        return this._audioBuffer;
    }

    DoCustomLoad(path, extension)
    {
        switch (extension)
        {
            case "mp3":
            case "ogg":
            case "wav":
                this._extension = extension;
                break;

            case "wem":
            case "bnk":
                this._extension = extension;
                resMan.AddPendingLoad(path);
                resMan.FetchRaw(path, "arraybuffer")
                    .then(buffer =>
                    {
                        this.data = new Uint8Array(buffer);
                        resMan.RemovePendingLoad(path);
                        resMan.Queue(this, undefined, extension);
                        this.OnLoaded();
                    })
                    .catch(() =>
                    {
                        resMan.RemovePendingLoad(path);
                        this.OnError(new ErrHTTPRequest({ path }));
                    });
                return true;

            default:
                throw new ErrResourceFormatUnsupported({ format: extension });
        }

        resMan.AddPendingLoad(path);
        this.audio = document.createElement("audio");

        this.audio.onerror = () =>
        {
            resMan.RemovePendingLoad(path);
            this.audio = null;
            this.OnError(new ErrHTTPRequest({ path }));
        };

        this.audio.oncanplay = () =>
        {
            this._playable = true;
            this.audio.oncanplay = null;
            resMan.RemovePendingLoad(path);
            resMan.Queue(this, undefined, extension);
            this.OnLoaded();
        };

        this.audio.onended = () =>
        {
            this.EmitEvent("on_ended");
        };

        /**
         * Fires when the video is paused
         */
        this.audio.onpause = () =>
        {
            this.EmitEvent("on_paused");
        };

        /**
         * Fires when the video is playing
         */
        this.audio.onplaying = () =>
        {
            this.EmitEvent("on_playing");
        };

        this.audio.src = path;
        return true;
    }

}