import { meta } from "utils";


/**
 * Effect child carrying a sound emitter: follows its parent's world
 * transform and forwards mute state, matching Carbon's EveChildAudio.
 */
@meta.type("EveChildAudio")
@meta.define({
    wgl: "EveChildAudio",
    ccp: true
})
export class EveChildAudio
{
    @meta.string
    name = "";

    @meta.boolean
    mute = false;

    @meta.struct()
    audioEmitter = null;

    _muted = null;

    get isEffectChild()
    {
        return true;
    }

    UpdateLod()
    {

    }

    ResetLod()
    {

    }

    /**
     * Per frame update
     * @param {Number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        const emitter = this.audioEmitter;
        if (!emitter) return;

        if (this.mute !== this._muted)
        {
            if (this.mute && emitter.Mute) emitter.Mute();
            else if (!this.mute && emitter.Unmute) emitter.Unmute();
            this._muted = this.mute;
        }

        if (parentTransform && emitter.SetPosition)
        {
            const { front, top, pos } = EveChildAudio.global;
            front[0] = parentTransform[8];
            front[1] = parentTransform[9];
            front[2] = parentTransform[10];
            top[0] = parentTransform[4];
            top[1] = parentTransform[5];
            top[2] = parentTransform[6];
            pos[0] = parentTransform[12];
            pos[1] = parentTransform[13];
            pos[2] = parentTransform[14];
            emitter.SetPosition(front, top, pos);
        }
    }

    GetResources(out = [])
    {
        return out;
    }

    GetBatches()
    {
        return false;
    }

    SetEmitterName(name)
    {
        this.name = name;
        if (this.audioEmitter && this.audioEmitter.SetName)
        {
            this.audioEmitter.SetName(name);
        }
    }

    /**
     * Scratch variables
     * @type {Object}
     */
    static global = {
        front: new Float32Array(3),
        top: new Float32Array(3),
        pos: new Float32Array(3)
    };

    static __isEffectChild = true;
}
