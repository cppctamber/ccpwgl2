import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { meta } from "utils";
import { resMan } from "global";
import { ErrHTTPRequest } from "core/engine";


@meta.type("Tw2AudioRes")
export class Tw2AudioRes extends Tw2Resource
{

    audio = null;

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
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }

        this.OnPrepared();
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
            this.emit("on_ended");
        };

        /**
         * Fires when the video is paused
         */
        this.audio.onpause = () =>
        {
            this.emit("on_paused");
        };

        /**
         * Fires when the video is playing
         */
        this.audio.onplaying = () =>
        {
            this.emit("on_playing");
        };

        this.audio.src = path;
        return true;
    }

}