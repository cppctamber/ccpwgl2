import { isString, meta } from "utils";
import { tw2 } from "global";
import { EveLensflare } from "eve/effect";


@meta.define("TnyLensflare")
export class TnyLensflare extends meta.Model
{

    @meta.struct()
    wrapped = null;

    @meta.plain
    custom = {};

    get isLensflare()
    {
        return true;
    }

    get display()
    {
        return this.wrapped && "display" in this.wrapped ? this.wrapped.display : true;
    }

    set display(value)
    {
        if (this.wrapped && "display" in this.wrapped)
        {
            this.wrapped.display = value;
        }
    }

    constructor(wrapped, values)
    {
        super();

        if (wrapped)
        {
            this.SetWrapped(wrapped);
        }

        if (values)
        {
            this.SetValues(values);
        }
    }

    SetWrapped(wrapped)
    {
        if (wrapped && !(wrapped instanceof EveLensflare))
        {
            throw new TypeError("Invalid wrapped lensflare");
        }

        this.wrapped = wrapped || null;
        return this;
    }

    GetBatches(mode, accumulator, perObjectData)
    {
        return this.wrapped && this.wrapped.GetBatches ? this.wrapped.GetBatches(mode, accumulator, perObjectData) : false;
    }

    GetResources(out = [])
    {
        const mesh = this.wrapped && this.wrapped.mesh;
        if (mesh && mesh.GetResources)
        {
            mesh.GetResources(out);
        }
        return out;
    }

    PrepareRender(sunDirection)
    {
        if (this.wrapped && this.wrapped.PrepareRender)
        {
            this.wrapped.PrepareRender(sunDirection);
        }
    }

    UpdateOccluders()
    {
        if (this.wrapped && this.wrapped.UpdateOccluders)
        {
            this.wrapped.UpdateOccluders();
        }
    }

    Update(dt)
    {
        this.EmitEvent("update", this, dt);
        return true;
    }

    /**
     * Fetches a lensflare from a res path.
     *
     * Restored from `WrappedLensflare.fetch`, archived to
     * `_review/wrapped-2026-08-23/WrappedLensflare.js` when `src/wrapped` was
     * retired (`dc1f81d0`). tny took over that tree's role but never picked
     * this up, so `TnyScene.FetchLensflare` was absent and every consumer that
     * guarded on it - skindr's `SunControl` does exactly that - silently loaded
     * no flare at all.
     *
     * @param {String|Object} options - a res path, or values carrying `resPath`
     * @returns {Promise<TnyLensflare>}
     */
    static async fetch(options = {})
    {
        if (isString(options)) options = { resPath: options };

        const { resPath, ...values } = options;
        if (!resPath) throw new ReferenceError("Could not identify resource path");

        // A res path authored as .red names the same asset as the .black
        // container ccpwgl actually reads, as everywhere else in tny.
        const wrapped = await tw2.Fetch(resPath.replace(/\.red$/i, ".black"));

        TnyLensflare.DisableBrokenAreas(wrapped);

        return new this(wrapped, values);
    }

    /**
     * Hides the two additive areas that do not render correctly.
     *
     * Carried over verbatim from the archived `WrappedLensflare.fetch`, whose
     * comment was only "Remove lensflares that don't work for some reason" - so
     * the REASON is not recorded anywhere, and this is preserved as observed
     * behaviour rather than as something understood.
     *
     * What is worth knowing: with the flare's occlusion unavailable on WebGL
     * (`lensflareoccludert` needs `atomic_iadd`, which has no WebGL2 lowering),
     * these two areas draw at full strength over everything. Hiding them looks
     * wrong, and looks considerably less wrong than leaving them in.
     *
     * Matched on NAME, case-insensitively, because that is all the archived
     * code had to go on.
     *
     * @param {EveLensflare} wrapped
     * @returns {Number} how many areas were hidden
     */
    static DisableBrokenAreas(wrapped)
    {
        const areas = wrapped && wrapped.mesh && wrapped.mesh.additiveAreas;
        if (!areas) return 0;

        let hidden = 0;

        for (let i = 0; i < areas.length; i++)
        {
            const name = areas[i] && areas[i].name;
            if (!name) continue;

            if (TnyLensflare.brokenAreaNames.includes(name.toLowerCase()))
            {
                areas[i].display = false;
                hidden++;
            }
        }

        return hidden;
    }

    /**
     * The additive area names hidden by {@link DisableBrokenAreas}.
     * @type {Array<String>}
     */
    static brokenAreaNames = [ "sun0", "dimwhite" ];

    static FromWrapped(wrapped, values)
    {
        return new this(wrapped, values);
    }

    static GetWrapped(item)
    {
        return item ? item.wrapped || null : null;
    }

    static HasWrapped(item)
    {
        return !!this.GetWrapped(item);
    }

    static ClearWrapped(item)
    {
        if (item && item.SetWrapped)
        {
            item.SetWrapped(null);
        }

        return item;
    }

}
