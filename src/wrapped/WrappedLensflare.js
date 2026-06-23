import { isString, meta } from "utils";
import { EveLensflare } from "eve/effect/EveLensflare";
import { resMan } from "global";


@meta.type("WrappedLensflare")
export class WrappedLensflare extends meta.Model
{

    get isLensflare()
    {
        return true;
    }

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
     * Per frame update
     * @param {number} dt
     */
    Update(dt)
    {

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
            //console.dir(wrapped);

            // Remove lensflares that don't work for some reason
            const areas = wrapped.mesh.additiveAreas.filter(x => x.name.toLowerCase() === "sun0" || x.name.toLowerCase() === "dimwhite");
            areas.forEach(x => x.display = false);

            return new this(wrapped, values);
        }

        throw new ReferenceError("Could not identify resource path");
    }

}
