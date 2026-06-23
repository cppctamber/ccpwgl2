import { Tw2EventEmitter } from "core/Tw2EventEmitter";
import { vec3 } from "math";
import { meta } from "utils";
import { isPrivate } from "global/meta";

/**
 * Wrapper for audio context
 *
 * @property {AudioContext} ctx
 * @property {vec3} forward
 * @property {vec3} up
 * @property {vec3} position
 * @property {AudioContext} _ctx
 * @property {Boolean} _dirty
 */
@meta.type("Tw2AudMan")
export class Tw2AudMan extends Tw2EventEmitter
{

    @meta.vector3
    up = vec3.fromValues(0, 1, 0);

    @meta.vector3
    forward = vec3.create();

    @meta.vector3
    position = vec3.create();

    @isPrivate
    ctx = null;

    _dirty = true;

    /**
     * Gets the context base latency
     * @return {*}
     */
    get baseLatency()
    {
        return this.ctx ? this.ctx["baseLatency"] : -1;
    }

    /**
     * Gets the context output latency
     * @return {*}
     */
    get outputLatency()
    {
        return this.ctx ? this.ctx["outputLatency"] : -1;
    }

    /**
     * Gets the audio context's current time
     * @return {Number}
     */
    get time()
    {
        return this.ctx ? this.ctx.currentTime : 0;
    }

    /**
     * Gets the current state
     * @return {number}
     */
    get state()
    {
        return this.ctx ? this.ctx.state : Tw2AudMan.State.NO_CONTEXT;
    }

    /**
     * Creates an audio context
     */
    Create()
    {
        if (!this.ctx)
        {
            this.ctx = Tw2AudMan.CreateAudioContext();
            this.ctx.onstatechange = e =>
            {
                console.debug(e);
                this.EmitEvent(e, this);
            };
            this.EmitEvent("created", this);
            this._dirty = true;
        }
        return this.ctx;
    }

    /**
     * Closes the audio context
     */
    Destroy()
    {
        if (this.ctx)
        {
            this.ctx["close"]();
            this.EmitEvent("destroyed", this);
            this.ctx = null;
        }
    }

    /**
     * Suspends the audio context
     */
    Suspend()
    {
        if (this.ctx && this.state === Tw2AudMan.State.PLAYING) this.ctx["suspend"]();
    }

    /**
     * Resumes the audio context
     */
    Resume()
    {
        if (this.ctx && this.state === Tw2AudMan.State.SUSPENDED) this.ctx["resume"]();
    }

    /**
     * Per frame update
     */
    Tick()
    {
        if (this.ctx && this._dirty)
        {
            const l = this.ctx.listener;
            l.forwardX.value = this.forward[0];
            l.forwardY.value = this.forward[1];
            l.forwardZ.value = this.forward[2];
            l.upX.value = this.up[0];
            l.upY.value = this.up[1];
            l.upZ.value = this.up[2];
            l.positionX.value = this.position[0];
            l.positionY.value = this.position[1];
            l.positionZ.value = this.position[2];
            this._dirty = false;
            this.EmitEvent("updated", this);
        }
    }

    /**
     * Sets the audio location
     * @param {vec3} forward
     * @param {vec3} up
     * @param {vec3} position
     */
    SetAudioLocation(forward, up, position)
    {
        vec3.copy(this.forward, forward);
        vec3.copy(this.up, up);
        vec3.copy(this.position, position);
        this._dirty = true;
    }

    /**
     * Sets the audio location from a pose matrix
     * @param {mat4} m
     */
    SetAudioLocationFromPoseMatrix(m)
    {
        this.forward[0] = -m[8];
        this.forward[1] = -m[9];
        this.forward[2] = -m[10];
        this.up[0] = m[4];
        this.up[1] = m[5];
        this.up[2] = m[6];
        this.position[0] = m[12];
        this.position[1] = m[13];
        this.position[2] = m[14];
        this._dirty = true;
    }

    /**
     * Creates an audio context
     * @return {AudioContext | *}
     */
    static CreateAudioContext()
    {
        return new window.AudioContext || window.webkitAudioContext;
    }

    /**
     * Context states
     * @type {{CLOSED: string, RUNNING: string, SUSPENDED: string, PLAYING: string}}
     */
    static State = {
        NO_CONTEXT: "no_context",
        SUSPENDED: "suspended",
        PLAYING: "running",
        RUNNING: "running",
        CLOSED: "closed"
    }

}
