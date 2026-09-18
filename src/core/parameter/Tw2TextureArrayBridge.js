import { device, tw2 } from "global";


/**
 * Private bridge from named member texture parameters to one shared merged
 * texture - a 2D array, or a channel-packed 2D texture.
 *
 * Both kinds share every word of the reasoning below; they differ only in what
 * the aggregate IS, which `viewDimension` carries. An array keeps its members
 * as layers of a stack; a pack puts each member's scalar in one channel of one
 * texel. See Tw2TexturePackRes for why that distinction is about the data
 * rather than about saving a binding.
 *
 * The Carbon WebGL emitter merges a recognised detail-map family
 * (Detail1Map/Detail2Map/Detail3Map) into a single `sampler2DArray` binding,
 * but the named parameters must survive as the public surface - SOF and
 * everything else sets `Detail1Map` by name, and replacing those entries with
 * an aggregate would break every author of them
 * (/docs/contracts/texture-array-realization.md, "Public parameter
 * invariant"). So the effect keeps its ordinary Tw2TextureParameter entries,
 * and this bridge - which is never persisted and never appears in
 * `effect.parameters` - performs the one physical bind.
 *
 * The aggregate resolves through the resource manager as
 * `dynamic:/texturearray/<layer paths in layer order>`, so two effects naming
 * the same maps share one GPU array; that sharing is what buys the texture
 * units back on shaders sitting at the 16-unit limit. While the aggregate is
 * missing, still loading, or rejected, the 1x1 fallback array binds instead:
 * a `sampler2DArray` uniform must always see an array texture or WebGL2
 * silently rejects the whole draw.
 */
export class Tw2TextureArrayBridge
{

    /**
     * The merged binding's name (e.g. "DetailArrayMap")
     * @type {String}
     */
    name = "";

    /**
     * Ordered layer parameters, layer 0 first
     * @type {Array<Tw2TextureParameter>}
     */
    layers = [];

    /**
     * The aggregate array resource
     * @type {Tw2TextureArrayRes|null}
     */
    textureRes = null;

    /**
     * The layer-path key the aggregate was resolved from
     * @type {String|null}
     */
    _lastKey = null;

    /**
     * "2d-array" for a layered aggregate, "2d" for a channel-packed one
     * @type {String}
     */
    viewDimension = "2d-array";

    /**
     * Constructor
     * @param {String} name
     */
    constructor(name, viewDimension)
    {
        if (name) this.name = name;
        if (viewDimension) this.viewDimension = viewDimension;
    }

    /**
     * Whether this bridge carries a channel pack rather than an array
     * @returns {Boolean}
     */
    get isPacked()
    {
        return this.viewDimension === "2d";
    }

    /**
     * Sets the ordered layer parameters
     * @param {Array<Tw2TextureParameter>} layers
     */
    SetLayers(layers)
    {
        this.layers = layers;
    }

    /**
     * Binds the aggregate array, or the fallback array while it is unbuildable.
     *
     * The layer paths are re-read on every apply: they are the public,
     * mutable surface, and comparing a handful of strings per draw is cheaper
     * than keeping notification wiring in step with parameter replacement.
     * @param {Number} stage - texture unit
     * @param {Tw2SamplerState} sampler
     * @param {Number} slices
     */
    Apply(stage, sampler, slices)
    {
        const { gl } = device;

        let key = "";
        for (let i = 0; i < this.layers.length; i++)
        {
            const layer = this.layers[i];
            // An attached layer has bytes only on the GPU, so it cannot be a
            // source for the CPU-side assembly; treat it as missing.
            const path = layer && !layer.isAttached ? layer.resourcePath : "";
            if (!path)
            {
                key = null;
                break;
            }
            key += i ? ";" + path : path;
        }

        if (key !== this._lastKey)
        {
            this._lastKey = key;
            this.textureRes = key
                ? tw2.GetResource((this.isPacked ? "dynamic:/texturepack/" : "dynamic:/texturearray/") + key)
                : null;
        }

        if (this.textureRes)
        {
            gl.activeTexture(gl.TEXTURE0 + stage);
            // Tw2TextureRes.Bind already degrades a not-yet-built or errored
            // array to the fallback array texture, so a missing layer costs
            // the detail layers, never the draw.
            this.textureRes.Bind(sampler, slices);
        }
        else if (this.isPacked)
        {
            // A sampler2D may bind the ordinary fallback; only the array
            // sampler is fussy about seeing a texture of its own dimension.
            gl.activeTexture(gl.TEXTURE0 + stage);
            gl.bindTexture(gl.TEXTURE_2D, device.GetFallbackTexture());
        }
        else
        {
            gl.activeTexture(gl.TEXTURE0 + stage);
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, device.GetFallbackArrayTexture());
        }
    }

    /**
     * Gets the aggregate's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>}
     */
    GetResources(out = [])
    {
        if (this.textureRes && !out.includes(this.textureRes))
        {
            out.push(this.textureRes);
        }
        return out;
    }

}
