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
            yield { poll: () =>
            {
                if (device.gl !== gl || gl.isContextLost()) throw new Error("Shader compilation context lost");
                return this.programs.every(program => gl.getProgramParameter(program.program, extension.COMPLETION_STATUS_KHR));
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
            this.callbacks.shift()();
            yield;
        }
    }

    OnPrepared()
    {
        this.complete = true;
        this.programs.length = 0;
        this.stages.clear();
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
        if (error)
        {
            for (const callback of this.callbacks) callback.onError?.(error);
        }
        this.callbacks.length = 0;
        for (const program of this.programs) this.gl.deleteProgram(program.program);
        for (const shader of this.stages) this.gl.deleteShader(shader);
        this.programs.length = 0;
        this.stages.clear();
    }

    Queue(shader)
    {
        this.shader = shader;
        shader._isReady = false;
        shader._compilation = this;
        resMan.processing.Queue(this);
    }
}
