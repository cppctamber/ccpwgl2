import { tw2 } from "global";
import { Tw2TextureRes } from "../../core/resource/Tw2TextureRes";


/**
 * The per-emitter parameters, as a texture the shaders can index.
 *
 * One simulation pass covers every particle in the system, and particles from
 * different emitters sit side by side in the state textures. So the pass cannot
 * take drag, gravity or colour as constants - each particle has to look up its
 * OWN emitter's values. A texture indexed by a row number is the only lookup
 * WebGL2 offers that is big enough to matter.
 *
 * ## The hash is the identity
 *
 * `Tr2GpuSharedEmitter.GetHash` already exists and already means exactly this:
 * two shared emitters that hash alike are interchangeable. So a row is keyed by
 * the hash, and every emitter agreeing on one shares it - which is what makes a
 * shared emitter cheap and is the entire reason the hash was ported.
 *
 * A UNIQUE emitter is keyed by its id instead, and its row is rewritten every
 * frame. Unique emitters are allowed to animate their parameters; that is what
 * makes them unique, and it is why they cannot share.
 *
 * ## The layout
 *
 * Eight texels per emitter, one emitter per row:
 *
 * ```
 *   0  color0                    4  sizes.xyz          colorMidpoint
 *   1  color1                    5  sizeVariance drag  gravity  textureIndex
 *   2  color2                    6  turbulence amp/freq  attractor strength
 *   3  color3                       velocityStretchRotation
 *                                7  attractorPosition.xyz
 * ```
 *
 * `Pack` is static and pure, so the layout can be checked against the shader's
 * reads without a device. The shader is the other half of this table and the
 * two have to be edited together.
 */
export class Tw2GpuParticleParams
{

    /**
     * The parameter texture.
     * @type {?Tw2TextureRes}
     */
    texture = null;

    /**
     * How many emitters the texture can hold.
     * @type {Number}
     */
    capacity = 0;

    /**
     * key -> row.
     * @type {Map<String, Number>}
     * @private
     */
    _rows = new Map();

    /**
     * The next unused row.
     * @type {Number}
     * @private
     */
    _next = 0;

    /**
     * Scratch for one row, reused - packing allocates nothing per frame.
     * @type {Float32Array}
     * @private
     */
    _scratch = new Float32Array(Tw2GpuParticleParams.TEXELS_PER_EMITTER * 4);

    /**
     * Allocates the texture.
     *
     * @param {Number} [capacity=64] - how many distinct emitters to allow
     * @returns {Boolean} whether it allocated
     */
    Create(capacity = 64)
    {
        this.Destroy();

        const
            device = tw2.device,
            gl = device.gl;

        if (device.glVersion < 2 || !device.canRenderToFloat) return false;

        this.capacity = Math.max(1, capacity);

        const
            width = Tw2GpuParticleParams.TEXELS_PER_EMITTER,
            height = this.capacity;

        const res = new Tw2TextureRes();
        res.suppressLogging = true;
        res.Attach(gl.createTexture());

        res._target = gl.TEXTURE_2D;
        res._internalFormat = gl.RGBA32F;
        res._format = gl.RGBA;
        res._type = gl.FLOAT;
        res._hasMipMaps = false;
        res._forceMipMaps = false;
        res._width = width;
        res._height = height;

        gl.bindTexture(gl.TEXTURE_2D, res.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);

        // NEAREST on both, and CLAMP_TO_EDGE. This is a table, not a picture:
        // an interpolated row is two emitters averaged together, which would be
        // a plausible looking value belonging to no emitter at all.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Tw2TextureRes re-applies an effect's sampler when it binds, which
        // would put LINEAR back.
        res._forceNearest = true;

        gl.bindTexture(gl.TEXTURE_2D, null);

        this.texture = res;
        return true;
    }

    /**
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(this.texture && this.texture.texture);
    }

    /**
     * The row a request's parameters live in, uploading them if they are not
     * there yet.
     *
     * @param {Object} request - as `Tw2GpuParticleSystem.Emit` stored it
     * @returns {Number} the row, or -1 if there is no room
     */
    GetRow(request)
    {
        if (!this.IsGood() || !request) return -1;

        const
            unique = Tw2GpuParticleParams.IsUnique(request.id),
            key = unique ? `u${request.id}` : `h${request.hash}`;

        let row = this._rows.get(key);

        if (row === undefined)
        {
            // FULL is not an error to throw over - it is a budget being reached
            // mid-frame, and dropping the emission is better than dropping the
            // frame. It says so once rather than every frame.
            if (this._next >= this.capacity)
            {
                if (!this._warned)
                {
                    this._warned = true;
                    tw2.Warning({
                        name: "GPU particles",
                        description: `More than ${this.capacity} distinct emitters - the rest will not emit`
                    });
                }
                return -1;
            }

            row = this._next++;
            this._rows.set(key, row);
        }
        else if (!unique)
        {
            // A shared row never changes: the hash IS the parameters. Rewriting
            // it every frame would upload the same bytes forever.
            return row;
        }

        this.Write(row, request.params);
        return row;
    }

    /**
     * Uploads one row.
     *
     * @param {Number} row
     * @param {Object} params
     * @returns {Tw2GpuParticleParams}
     */
    Write(row, params)
    {
        if (!this.IsGood() || row < 0 || row >= this.capacity) return this;

        Tw2GpuParticleParams.Pack(params, this._scratch);

        const gl = tw2.device.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texSubImage2D(
            gl.TEXTURE_2D, 0,
            0, row,
            Tw2GpuParticleParams.TEXELS_PER_EMITTER, 1,
            gl.RGBA, gl.FLOAT,
            this._scratch
        );
        gl.bindTexture(gl.TEXTURE_2D, null);

        return this;
    }

    /**
     * Forgets every row.
     *
     * Rows are handed out and never reclaimed while they are in use, because a
     * particle already alive still refers to its emitter's row. So this is for
     * tearing a system down, not for tidying up between frames.
     * @returns {Tw2GpuParticleParams}
     */
    Reset()
    {
        this._rows.clear();
        this._next = 0;
        this._warned = false;
        return this;
    }

    /**
     * Releases the texture.
     * @returns {Tw2GpuParticleParams}
     */
    Destroy()
    {
        if (this.texture)
        {
            this.texture.DeleteGL();
            this.texture = null;
        }

        this.Reset();
        this.capacity = 0;
        return this;
    }

    /**
     * @type {Boolean}
     * @private
     */
    _warned = false;

    /**
     * Packs one emitter's parameters into the texel layout.
     *
     * Static and pure: this is the CPU half of a contract whose other half is
     * in the shaders, and it is worth being able to check the two agree without
     * a device.
     *
     * @param {Object} params - as `Tr2GpuSharedEmitter.GetParamsData` fills it
     * @param {Float32Array} [out]
     * @returns {Float32Array}
     */
    static Pack(params, out = new Float32Array(Tw2GpuParticleParams.TEXELS_PER_EMITTER * 4))
    {
        const
            p = params || {},
            colors = p.colors || [],
            sizes = p.sizes || [ 1, 1, 1 ],
            attractor = p.attractorPosition || [ 0, 0, 0 ];

        for (let i = 0; i < 4; i++)
        {
            const c = colors[i] || [ 1, 1, 1, 1 ];
            out[i * 4 + 0] = c[0];
            out[i * 4 + 1] = c[1];
            out[i * 4 + 2] = c[2];
            out[i * 4 + 3] = c[3];
        }

        out[16] = sizes[0];
        out[17] = sizes[1];
        out[18] = sizes[2];
        out[19] = p.colorMidpoint === undefined ? 0.5 : p.colorMidpoint;

        out[20] = p.sizeVariance || 0;
        out[21] = p.drag || 0;
        out[22] = p.gravity || 0;
        out[23] = p.textureIndex || 0;

        out[24] = p.turbulenceAmplitude || 0;
        out[25] = p.turbulenceFrequency || 0;
        out[26] = p.attractorStrength || 0;
        out[27] = p.velocityStretchRotation || 0;

        out[28] = attractor[0];
        out[29] = attractor[1];
        out[30] = attractor[2];
        out[31] = 0;

        return out;
    }

    /**
     * Whether an emitter id belongs to a unique emitter.
     *
     * Carbon sets the top bit of the pointer-sized id. The JS side keeps the
     * same convention at a width JS can actually hold - see
     * `Tr2GpuUniqueEmitter.NextID`.
     *
     * @param {Number} id
     * @returns {Boolean}
     */
    static IsUnique(id)
    {
        return (id & Tw2GpuParticleParams.UNIQUE_BIT) !== 0;
    }

    /**
     * Texels of parameters per emitter. The shaders read this same number.
     * @type {Number}
     */
    static TEXELS_PER_EMITTER = 8;

    /**
     * The bit that says an id belongs to a unique emitter.
     * @type {Number}
     */
    static UNIQUE_BIT = 1 << 7;

}
