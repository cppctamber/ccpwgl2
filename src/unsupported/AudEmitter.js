import { meta } from "utils";
import { tw2 } from "global";
import { AudEmitter as CjsAudEmitter } from "@carbonenginejs/runtime-audio";


/**
 * Deserialization adapter for Carbon sound emitters: keeps ccpwgl's binary
 * layout while forwarding the emitter contract (SendEvent/SetRTPC/SetSwitch/
 * SetPrefix/placement) to a lazily created @carbonenginejs/runtime-audio
 * AudEmitter adopted by tw2.audMan.
 */
@meta.type("AudEmitter", true)
@meta.define({
    wgl: "AudEmitter",
    ccp: true
})
export class AudEmitter extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    normalizeAttenuationScaling = true;

    @meta.float
    maxNormalizedScalingFactor=1;

    @meta.float
    minNormalizedScalingFactor

    _backing = null;

    /**
     * Gets (and creates on first use) the backing runtime-audio emitter
     * @returns {*}
     */
    GetBackingEmitter()
    {
        if (!this._backing)
        {
            const backing = new CjsAudEmitter();
            backing.Initialize(this.name);
            backing.normalizeAttenuationScaling = !!this.normalizeAttenuationScaling;
            if (this.maxNormalizedScalingFactor !== undefined)
            {
                backing.maxNormalizedScalingFactor = this.maxNormalizedScalingFactor;
            }
            if (this.minNormalizedScalingFactor !== undefined)
            {
                backing.minNormalizedScalingFactor = this.minNormalizedScalingFactor;
            }
            this._backing = tw2.audMan ? tw2.audMan.AdoptEmitter(backing) : backing;
        }
        return this._backing;
    }

    /**
     * Posts an audio event
     * @param {String} eventName
     * @param {Boolean} [bypassPrefix]
     * @returns {Number} playing id
     */
    SendEvent(eventName, bypassPrefix)
    {
        return this.GetBackingEmitter().SendEvent(eventName, bypassPrefix);
    }

    /**
     * Stops a playing event by name
     * @param {String} eventName
     */
    StopEvent(eventName)
    {
        return this.GetBackingEmitter().StopEvent(eventName);
    }

    /**
     * Sets an RTPC value
     * @param {String} rtpcName
     * @param {Number} value
     */
    SetRTPC(rtpcName, value)
    {
        return this.GetBackingEmitter().SetRTPC(rtpcName, value);
    }

    /**
     * Sets a switch value
     * @param {String} groupName
     * @param {String} value
     */
    SetSwitch(groupName, value)
    {
        return this.GetBackingEmitter().SetSwitch(groupName, value);
    }

    /**
     * Sets the emitter's event prefix
     * @param {String} prefix
     */
    SetPrefix(prefix)
    {
        return this.GetBackingEmitter().SetPrefix(prefix);
    }

    /**
     * Sets the attenuation scaling factor
     * @param {Number} scalingFactor
     */
    SetAttenuationScalingFactor(scalingFactor)
    {
        return this.GetBackingEmitter().SetAttenuationScalingFactor(scalingFactor);
    }

    /**
     * Sets the emitter's placement
     * @param {vec3} front
     * @param {vec3} top
     * @param {vec3} position
     */
    SetPosition(front, top, position)
    {
        return this.GetBackingEmitter().SetPosition(front, top, position);
    }

    /**
     * Gets the emitter's name
     * @returns {String}
     */
    GetName()
    {
        return this.name;
    }

    /**
     * Sets the emitter's name
     * @param {String} name
     */
    SetName(name)
    {
        this.name = String(name || "");
        if (this._backing) this._backing.SetName(this.name);
    }

    /**
     * Wakes the emitter, replaying queued events
     */
    Wake()
    {
        return this.GetBackingEmitter().Wake();
    }

    /**
     * Mutes the emitter
     */
    Mute()
    {
        return this.GetBackingEmitter().Mute();
    }

    /**
     * Unmutes the emitter
     */
    Unmute()
    {
        return this.GetBackingEmitter().Unmute();
    }

}
