import { isString, meta } from "utils";
import { EveLensflare } from "eve/effect/EveLensflare";
import { resMan } from "global";


@meta.type("WrappedLensflare")
export class WrappedLensflare extends meta.Model
{

    /**
     * Constructor
     * @param {WrappedLensflare} wrapped
     * @param {Object} [values]
     */
    constructor(wrapped, values)
    {
        if (!(wrapped instanceof EveLensflare))
        {
            throw new ReferenceError("Invalid wrapped object");
        }

        super();
        this.wrapped = wrapped;
        if (values) this.SetValues(values);
    }

    /**
     * Fetches a planet async
     * @param {Object} options
     * @return {Promise<WrappedLensflare>}
     */
    static async fetch(options = {})
    {
        if (isString(options)) options = { resPath: options };

        const { resPath, ...values } = options;

        if (resPath)
        {
            const wrapped = await resMan.FetchObject(resPath);
            return new this(wrapped, values);
        }

        throw new ReferenceError("Could not identify resource path");
    }

}
