import { tw2 } from "global";
import { Tw2Effect } from "../../core/mesh/Tw2Effect";
import { Tw2EffectRes } from "../../core/resource/Tw2EffectRes";


/**
 * Runs the emission shader over the slots a batch of requests claims.
 *
 * The division of labour is Carbon's. An emitter produces a REQUEST - a count,
 * the segment it swept this frame, a cone, and ranges - and the GPU expands it.
 * What is NOT Carbon's is who picks the slots: Carbon pops them off a dead-list
 * with an atomic, and WebGL2 has neither atomics nor scatter, so this hands out
 * a ring.
 *
 * ## The ring, and what it costs
 *
 * Slots are handed out in order and wrap. When more particles are asked for
 * than the state can hold, the oldest slots are overwritten - including ones
 * still alive. That is a capacity problem reporting itself, and the alternative
 * needs a readback of which slots are free, which would stall the pipeline
 * every frame to avoid a fault that only appears when the system is already
 * oversubscribed.
 *
 * ## Why a run gets split
 *
 * The state is a rectangle, a run is a range of indices, and a range that
 * crosses a row boundary or wraps the end is not a rectangle. The run is cut
 * into per-row pieces and each is drawn under its own SCISSOR, all sharing one
 * set of constants: the shader derives everything from the particle's own
 * index, so it never learns it was split.
 *
 * ## Where it writes
 *
 * Into the side the next simulation step will READ, after the swap. Emitting
 * before the step would have the step's own output overwrite every new
 * particle, silently and with nothing to show for it.
 */
export class Tw2GpuParticleEmitPass
{

    /**
     * The effect carrying the emission shader.
     * @type {?Tw2Effect}
     */
    effect = null;

    /**
     * The next slot the ring will hand out.
     * @type {Number}
     */
    cursor = 0;

    /**
     * How many particles this pass has emitted since it was created. Kept
     * because "is it emitting at all" is the first question of any failure and
     * the state textures cannot be read cheaply to answer it.
     * @type {Number}
     */
    emitted = 0;

    /**
     * Builds the effect. Safe to call more than once.
     * @returns {Tw2GpuParticleEmitPass}
     */
    Create()
    {
        if (this.effect) return this;

        const name = Tw2GpuParticleEmitPass.SHADER;
        const effectFilePath = `manual:/${name}.sm_json`;

        if (!tw2.resMan.motherLode.Has(effectFilePath)) Tw2EffectRes.fromManual(name);

        this.effect = Tw2Effect.from({
            name: "gpu particle emission",
            effectFilePath,
            autoParameter: true
        });

        return this;
    }

    /**
     * Whether the effect is ready to draw.
     *
     * A false here means "not ready" OR "failed" - they are the same boolean in
     * this engine and opposite facts, so a caller waiting on it needs a
     * deadline of its own rather than a loop that trusts this to change.
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(this.effect && this.effect.IsGood());
    }

    /**
     * Expands every request in a system's queue.
     *
     * @param {Tw2GpuParticleSystem} system
     * @param {Tw2GpuParticleState} state
     * @returns {Number} how many particles were emitted
     */
    EmitRequests(system, state)
    {
        const requests = system.GetEmitRequests();
        if (!requests || !requests.length) return 0;

        let total = 0;
        for (let i = 0; i < requests.length; i++) total += this.Emit(requests[i], state);

        // DRAINED, because a request describes one frame's worth of emission
        // against one frame's slots. Left in place it would be re-expanded
        // every frame and the emitter's rate would mean nothing.
        requests.length = 0;

        return total;
    }

    /**
     * Expands ONE request.
     *
     * @param {Object} request - as `Tw2GpuParticleSystem.Emit` stored it
     * @param {Tw2GpuParticleState} state
     * @returns {Number} how many particles were emitted
     */
    Emit(request, state)
    {
        if (!this.IsGood() || !state || !state.IsGood()) return 0;

        const emitter = request.emitter;
        if (!emitter) return 0;

        // Never more than the state can hold: beyond that a batch would lap
        // itself and later particles in the SAME batch would overwrite earlier
        // ones, which is a different and much more confusing failure than
        // running short.
        const count = Math.min(Math.floor(emitter.count), state.capacity);
        if (count < 1) return 0;

        const
            effect = this.effect,
            params = request.params || {},
            start = this.cursor;

        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitRun", [ start, count, state.width, state.height ]);
        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitSeed", [ emitter.emitterSeed || 0, 0, 0, 0 ]);

        // The segment the emitter swept, so a batch is spread along it rather
        // than piled at one end.
        const previous = emitter.positionPrevious || emitter.position;
        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitPositionStart", [ previous[0], previous[1], previous[2], emitter.radius || 0 ]);
        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitPositionEnd", [ emitter.position[0], emitter.position[1], emitter.position[2], 0 ]);

        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitDirection", [ emitter.direction[0], emitter.direction[1], emitter.direction[2], emitter.angle || 0 ]);
        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitCone", [ emitter.innerAngle || 0, emitter.minSpeed || 0, emitter.maxSpeed || 0, 0 ]);

        const velocity = emitter.velocity;
        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitVelocity", [ velocity[0], velocity[1], velocity[2], 0 ]);

        Tw2GpuParticleEmitPass.SetParameter(effect, "EmitLife", [ params.minLifeTime || 1, params.maxLifeTime || 1, 0, 0 ]);

        const
            device = tw2.device,
            gl = device.gl,
            target = state.GetFrontTarget();

        if (!target) return 0;

        const pieces = Tw2GpuParticleEmitPass.SplitRun(start, count, state.width, state.capacity);

        target.SetCallUnset(() =>
        {
            gl.enable(gl.SCISSOR_TEST);

            for (let i = 0; i < pieces.length; i++)
            {
                const p = pieces[i];
                gl.scissor(p.x, p.y, p.width, 1);
                device.RenderFullScreenQuad(effect);
            }

            gl.disable(gl.SCISSOR_TEST);
        });

        this.cursor = (start + count) % state.capacity;
        this.emitted += count;

        return count;
    }

    /**
     * Releases the effect.
     * @returns {Tw2GpuParticleEmitPass}
     */
    Destroy()
    {
        this.effect = null;
        return this;
    }

    /**
     * Cuts a run of slots into rectangles that can actually be drawn.
     *
     * A run is a range of INDICES; the state is a rectangle. A range crossing a
     * row boundary, or wrapping the end of the texture, is not one rectangle
     * and cannot be scissored as one.
     *
     * Static and pure so a test can check the split without a device - the
     * wrapping cases are exactly where this is worth checking.
     *
     * @param {Number} start
     * @param {Number} count
     * @param {Number} width
     * @param {Number} capacity
     * @returns {Array<{x: Number, y: Number, width: Number}>}
     */
    static SplitRun(start, count, width, capacity)
    {
        const pieces = [];
        let done = 0;

        while (done < count)
        {
            const
                at = (start + done) % capacity,
                x = at % width,
                y = Math.floor(at / width),
                run = Math.min(count - done, width - x);

            pieces.push({ x, y, width: run });
            done += run;
        }

        return pieces;
    }

    /**
     * Sets a parameter by name, if the effect has it.
     *
     * The same helper the picker carries, and for the same reason: a manual
     * shader's parameters are created by `autoParameter`, so a name that is not
     * there is a shader that changed rather than an error worth throwing over.
     *
     * @param {Tw2Effect} effect
     * @param {String} name
     * @param {Array<Number>} value
     * @returns {Boolean} whether it was set
     */
    static SetParameter(effect, name, value)
    {
        const parameter = effect && effect.parameters ? effect.parameters[name] : null;
        if (!parameter || !parameter.SetValue) return false;
        parameter.SetValue(value);
        return true;
    }

    /**
     * The manual shader this pass drives.
     * @type {String}
     */
    static SHADER = "tw2particleemit";

}
