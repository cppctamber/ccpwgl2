import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { meta } from "utils";
import { resMan } from "global";
import { ErrHTTPRequest } from "core/engine";


/**
 * JSON resource
 *
 * Loads and parses a json document through the resource manager (e.g. the
 * aud:/library.json audio library or other generated artifacts).
 *
 * @property {?Object} data - the parsed json document
 */
@meta.type("Tw2JsonRes")
@meta.wgl.define("Tw2JsonRes")
export class Tw2JsonRes extends Tw2Resource
{

    data = null;

    /**
     * Prepares the resource
     * @param response
     */
    Prepare(response)
    {
        if (this._extension !== "json")
        {
            throw new ErrResourceFormatUnsupported({ format: this._extension });
        }

        this.OnPrepared();
    }

    DoCustomLoad(path, extension)
    {
        if (extension !== "json")
        {
            throw new ErrResourceFormatUnsupported({ format: extension });
        }

        this._extension = extension;
        resMan.AddPendingLoad(path);
        resMan.FetchRaw(path, "json")
            .then(data =>
            {
                this.data = data;
                resMan.RemovePendingLoad(path);
                // No gpu/prepare work: complete immediately rather than
                // queueing, so json resolves before the frame loop runs
                // (e.g. bootstrap-time library fetches).
                this.OnLoaded();
                this.OnPrepared();
            })
            .catch(() =>
            {
                resMan.RemovePendingLoad(path);
                this.OnError(new ErrHTTPRequest({ path }));
            });

        return true;
    }

}
