import { meta } from "utils";
import { tw2, device } from "global";
import { Tw2MultiRenderTarget } from "core/Tw2MultiRenderTarget";


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
 * ## Two sides, two attachments each
 *
 * A shader cannot read and write the same texture in one pass, so the state
 * needs a front and a back, and {@link Swap} exchanges them once the frame's
 * passes are done. That is the ping-pong, and ccpwgl already does it inside a
 * frame for post-processing; what is new here is that the state has to survive
 * ACROSS frames, so these targets are owned and never recycled.
 *
 * Each side is a {@link Tw2MultiRenderTarget} with TWO attachments, so one pass
 * writes both position and velocity - which is what the shipped shaders do, and
 * half the passes of writing them separately. Attachment 0 is position,
 * attachment 1 is velocity, and a shader writing this must declare both
 * outputs.
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

    _sides = [ null, null ];
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
     * Allocates the two sides for a capacity.
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

        for (let i = 0; i < 2; i++) this._sides[i] = this._CreateSide(i);

        this._failed = !this.IsGood();

        if (this._failed)
        {
            tw2.Warning({
                name: "GPU particles",
                description: `Could not allocate ${this.width}x${this.height} particle state - GPU particles are disabled`
            });

            this.Destroy();
            return false;
        }

        this.Kill();
        return true;
    }

    /**
     * Marks every slot DEAD, on both sides.
     *
     * A freshly allocated float texture holds whatever the driver left there.
     * Read as particle state that is a field of particles at undefined
     * positions with undefined lifetimes, which the simulation will happily
     * integrate. Age is the only field that decides anything, so setting it
     * negative everywhere is enough to make the state empty rather than
     * arbitrary.
     *
     * @returns {Tw2GpuParticleState}
     */
    Kill()
    {
        if (!this.IsGood()) return this;

        const gl = tw2.device.gl;

        for (let i = 0; i < 2; i++)
        {
            this._sides[i].SetCallUnset(() =>
            {
                // Per attachment, because the two carry different meanings and
                // a single clear colour would have to lie about one of them.
                gl.clearBufferfv(gl.COLOR, 0, [ 0, 0, 0, -1 ]);
                gl.clearBufferfv(gl.COLOR, 1, [ 0, 0, 0, 0 ]);
            });
        }

        return this;
    }

    /**
     * @returns {Boolean}
     */
    IsGood()
    {
        for (let i = 0; i < 2; i++)
        {
            if (!this._sides[i] || !this._sides[i].IsGood()) return false;
        }

        return true;
    }

    /**
     * What the simulation READS this frame.
     *
     * The two textures rather than the target, because a reader binds textures
     * and only a writer binds a framebuffer.
     * @returns {{position: ?Tw2TextureRes, velocity: ?Tw2TextureRes}}
     */
    GetFront()
    {
        const side = this._sides[this._front];
        if (!side) return { position: null, velocity: null };
        return { position: side.GetTexture(0), velocity: side.GetTexture(1) };
    }

    /**
     * The TARGET the simulation writes this frame.
     *
     * One target with both attachments, so a single pass produces the new
     * position and the new velocity together.
     * @returns {?Tw2MultiRenderTarget}
     */
    GetBack()
    {
        return this._sides[this._front ^ 1];
    }

    /**
     * The front side as a TARGET, for a pass that writes what the next step
     * will read.
     *
     * Emission is the case: it writes the side the simulation reads NEXT, so
     * new particles survive the step instead of being overwritten by it.
     * @returns {?Tw2MultiRenderTarget}
     */
    GetFrontTarget()
    {
        return this._sides[this._front];
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
            if (this._sides[i]) this._sides[i].Destroy();
            this._sides[i] = null;
        }

        this._front = 0;
        this.capacity = 0;
        this.height = 0;
        return this;
    }

    /**
     * One side: position on attachment 0, velocity on attachment 1.
     * @param {Number} index
     * @returns {Tw2MultiRenderTarget}
     * @private
     */
    _CreateSide(index)
    {
        // NEAREST is the target's default and is asked for explicitly anyway.
        // A filtered read averages two unrelated particles, which looks like a
        // physics bug rather than a sampler one - and a float texture with
        // LINEAR filtering can be rejected outright on a device without
        // OES_texture_float_linear.
        return new Tw2MultiRenderTarget(
            `particleState${index}`,
            this.width,
            this.height,
            2,
            "rgba32f",
            "nearest"
        );
    }

}
