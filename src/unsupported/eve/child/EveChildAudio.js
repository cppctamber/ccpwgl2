import { meta } from "utils";
import { vec3 } from "math";


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
            const { vec3_0, vec3_1, vec3_2 } = EveChildAudio.global;
            vec3_0[0] = parentTransform[8];
            vec3_0[1] = parentTransform[9];
            vec3_0[2] = parentTransform[10];
            vec3_1[0] = parentTransform[4];
            vec3_1[1] = parentTransform[5];
            vec3_1[2] = parentTransform[6];
            vec3_2[0] = parentTransform[12];
            vec3_2[1] = parentTransform[13];
            vec3_2[2] = parentTransform[14];
            emitter.SetPosition(vec3_0, vec3_1, vec3_2);
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
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create()
    };

    static __isEffectChild = true;
}
