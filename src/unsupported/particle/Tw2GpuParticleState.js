import { meta } from "utils";
import { tw2, device } from "global";
import { Tw2RenderTarget } from "core/Tw2RenderTarget";


/**
 * Where GPU particles live between frames.
 *
 * A particle's state is its position, its age, its velocity and which emitter
 * owns it. On the D3D path that lives in structured buffers a compute shader
 * scatters into. WebGL2 has neither, so it lives in TEXTURES, one texel per
 * particle, and the simulation is an ordinary draw that reads one set and
 * writes another.
 *
 * ```
 *   position texture   xyz = position   w = age
 *   velocity texture   xyz = velocity   w = packed lifetime + emitter index
 * ```
 *
 * ## Why four textures and not two
 *
 * A shader cannot read and write the same texture in one pass, so each quantity
 * needs a front and a back, and {@link Swap} exchanges them once the frame's
 * passes are done. That is the ping-pong, and ccpwgl already does it inside a
 * frame for post-processing; what is new here is that the state has to survive
 * ACROSS frames, so these targets are owned and never recycled.
 *
 * ## Why two passes and not one
 *
 * The shipped shaders write both textures in one pass with two outputs -
 * multiple render targets. `Tw2RenderTarget` attaches a single colour
 * attachment, so this writes position and velocity in separate passes instead.
 * That is twice the passes and the same total work per texel, and it costs no
 * engine change. If MRT is added later, the two passes collapse into one
 * without anything else here changing.
 *
 * ## Float, and NEAREST
 *
 * State is not colour: it must survive a round trip unquantised, so the format
 * is `rgba32f` and rendering into it needs `EXT_color_buffer_float`. Sampling
 * must be NEAREST - a filtered read would silently average two particles that
 * have nothing to do with each other, which looks like a physics bug rather
 * than a sampler one.
 */
@meta.define("Tw2GpuParticleState")
export class Tw2GpuParticleState
{

    /**
     * Particles per texture row. Rows are added to reach the capacity, so this
     * only decides the shape, not the count.
     * @type {Number}
     */
    @meta.uint
    width = 512;

    @meta.uint
    height = 0;

    /**
     * How many particles the textures can hold - `width * height`, which is at
     * least the requested capacity and usually a little more.
     * @type {Number}
     */
    @meta.uint
    capacity = 0;

    _position = [ null, null ];
    _velocity = [ null, null ];
    _front = 0;
    _failed = false;


    /**
     * @param {Number} [capacity]
     */
    constructor(capacity)
    {
        if (capacity) this.Create(capacity);
    }

    /**
     * Allocates the four targets for a capacity.
     *
     * Rounded UP to a whole number of rows: a partly used last row costs a few
     * texels and keeps the addressing a plain divide, where a ragged one would
     * need a bounds test in every shader that reads it.
     *
     * @param {Number} capacity - particles wanted
     * @param {Number} [width=this.width]
     * @returns {Boolean} true if the state is usable
     */
    Create(capacity, width = this.width)
    {
        this.Destroy();

        if (!device.canRenderToFloat)
        {
            // Not a soft failure worth papering over: without float targets the
            // state cannot round trip, and a particle that loses precision every
            // frame does not look like a lower quality particle, it looks like a
            // broken one. GPU particles are simply off.
            tw2.Warning({
                name: "GPU particles",
                description: "EXT_color_buffer_float is unavailable, so particle state cannot be stored - GPU particles are disabled"
            });

            this._failed = true;
            return false;
        }

        this.width = Math.max(1, width);
        this.height = Math.max(1, Math.ceil(capacity / this.width));
        this.capacity = this.width * this.height;

        for (let i = 0; i < 2; i++)
        {
            this._position[i] = this._CreateTarget(`particlePosition${i}`);
            this._velocity[i] = this._CreateTarget(`particleVelocity${i}`);
        }

        this._failed = !this.IsGood();

        if (this._failed)
        {
            tw2.Warning({
                name: "GPU particles",
                description: `Could not allocate ${this.width}x${this.height} particle state - GPU particles are disabled`
            });

            this.Destroy();
        }

        return !this._failed;
    }

    /**
     * @returns {Boolean}
     */
    IsGood()
    {
        for (let i = 0; i < 2; i++)
        {
            if (!this._position[i] || !this._position[i].IsGood()) return false;
            if (!this._velocity[i] || !this._velocity[i].IsGood()) return false;
        }

        return true;
    }

    /**
     * The textures the simulation READS this frame.
     * @returns {{position: Tw2RenderTarget, velocity: Tw2RenderTarget}}
     */
    GetFront()
    {
        return { position: this._position[this._front], velocity: this._velocity[this._front] };
    }

    /**
     * The targets the simulation WRITES this frame.
     * @returns {{position: Tw2RenderTarget, velocity: Tw2RenderTarget}}
     */
    GetBack()
    {
        const back = this._front ^ 1;
        return { position: this._position[back], velocity: this._velocity[back] };
    }

    /**
     * Makes what was just written the state everything else reads.
     *
     * Called ONCE per frame, after every pass that writes the back targets. Two
     * swaps in a frame put the simulation a frame behind itself and read as a
     * stutter rather than as an error.
     * @returns {Tw2GpuParticleState}
     */
    Swap()
    {
        this._front ^= 1;
        return this;
    }

    /**
     * Where a particle index sits in the textures.
     *
     * The same arithmetic the shaders do, exposed so a test can check a texel
     * without duplicating the rule.
     *
     * @param {Number} index
     * @returns {{x: Number, y: Number}}
     */
    GetTexel(index)
    {
        return { x: index % this.width, y: Math.floor(index / this.width) };
    }

    /**
     * Releases the targets.
     * @returns {Tw2GpuParticleState}
     */
    Destroy()
    {
        for (let i = 0; i < 2; i++)
        {
            if (this._position[i]) this._position[i].Destroy();
            if (this._velocity[i]) this._velocity[i].Destroy();
            this._position[i] = null;
            this._velocity[i] = null;
        }

        this._front = 0;
        this.capacity = 0;
        this.height = 0;
        return this;
    }

    /**
     * @param {String} name
     * @returns {Tw2RenderTarget}
     * @private
     */
    _CreateTarget(name)
    {
        const target = new Tw2RenderTarget(name, this.width, this.height, false, "rgba32f");

        // NEAREST, always. A filtered read averages two unrelated particles.
        if (target.texture) target.texture._forceNearest = true;

        return target;
    }

}
