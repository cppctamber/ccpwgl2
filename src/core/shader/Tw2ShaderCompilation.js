import { device, resMan } from "global";
import { Tw2Resource } from "../resource/Tw2Resource";

/** One permutation's pending driver work and effect bindings. */
export class Tw2ShaderCompilation extends Tw2Resource
{
    static requiresProcessing = true;
    // Scoped to synchronous shader construction, never held across a yield.
    static current = null;
    programs = [];
    stages = new Set();
    callbacks = [];
    complete = false;
    error = null;

    constructor(resource)
    {
        super();
        this.resource = resource;
        this.gl = device.gl;
        this.extension = device.GetExtension("KHR_parallel_shader_compile");
    }

    HasCompleted() { return this.complete || !!this.error; }
    KeepAlive() { this.resource.KeepAlive(); }

    *Process()
    {
        const { gl, extension } = this;
        if (extension)
        {
            let index = 0;
            yield { poll: (now, deadline) =>
            {
                if (device.gl !== gl || gl.isContextLost()) throw new Error("Shader compilation context lost");
                if (!this.programs.length) return true;
                do
                {
                    if (!gl.getProgramParameter(this.programs[index].program, extension.COMPLETION_STATUS_KHR)) return false;
                    index++;
                    if (index === this.programs.length) return true;
                }
                while (now() < deadline);
                return false;
            } };
        }
        for (const program of this.programs)
        {
            if (device.gl !== gl || gl.isContextLost()) throw new Error("Shader compilation context lost");
            program.FinishCompilation();
            yield;
        }
        this.shader._isReady = true;
        // Parameter binding is processing work too, not a promise microtask.
        while (this.callbacks.length)
        {
            this.callbacks[0]();
            this.callbacks.shift();
            yield;
        }
    }

    OnPrepared()
    {
        this.complete = true;
        this.programs.length = 0;
        this.stages.clear();
        // Nothing waits on a finished compilation, and `Tw2Effect.GetResources`
        // would otherwise keep handing it out as a pathless resource forever.
        if (this.shader && this.shader._compilation === this) this.shader._compilation = null;
        super.OnPrepared({ hide: true });
    }

    OnError(error)
    {
        this.error = error;
        super.OnError(error);
        this.resource.OnError(error);
    }

    OnProcessingCancelled(error)
    {
        if (this.complete) return;
        this.error = error || this.error || new Error("Shader compilation cancelled");
        if (this.shader) this.shader._isReady = false;
        const callbacks = this.callbacks.splice(0);
        // Only the programs still awaiting their link result. A program whose
        // FinishCompilation has already run is installed on its pass, and deleting
        // it here would leave that pass holding a deleted GL program.
        for (const program of this.programs)
        {
            if (program.FinishCompilation) this.gl.deleteProgram(program.program);
        }
        for (const shader of this.stages) this.gl.deleteShader(shader);
        this.programs.length = 0;
        this.stages.clear();
        // ALWAYS notify. Every cancel the engine actually performs - reload, unload,
        // purge, error - comes through `CancelProcessing` with no error argument, so
        // gating this on the caller's `error` dropped the waiting binds silently and
        // left their effects pending forever, never good and never failed. The error
        // synthesised above is the one to report.
        let notificationError;
        for (const callback of callbacks)
        {
            try { callback.onError?.(this.error); }
            catch (err) { notificationError = notificationError || err; }
        }
        if (notificationError) throw notificationError;
    }

    Queue(shader)
    {
        this.shader = shader;
        shader._isReady = false;
        shader._compilation = this;
        resMan.processing.Queue(this);
    }
}
