import { meta } from "utils";
import { vec3 } from "math";
import { tw2 } from "global";
import { wstring } from "core/reader/Tw2BlackPropertyReaders";
import { StretchAudio } from "@carbonenginejs/runtime-audio";
import { AudEmitter } from "../../AudEmitter";


/**
 * Beam/line-segment audio, ported from Carbon's Tr2AudioStretchBase: source
 * and destination emitters sit on the endpoints and the stretch emitter
 * follows the listener's projection onto the segment.
 */
@meta.type("Tr2AudioStretchBase", "Tr2AudioStretchBase")
@meta.ccp.define("Tr2AudioStretchBase")
export class Tr2AudioStretchBase extends meta.Model
{

    @meta.notOwned
    @meta.struct()
    sourceEmitter = null;

    @meta.notOwned
    @meta.struct()
    destinationEmitter = null;

    @meta.struct()
    stretchEmitter = null;

    @meta.string
    outburstEvent = "";

    @meta.string
    impactEvent = "";

    @meta.string
    stretchEvent = "";

    // Carbon event names are std::wstring (persisted on Tr2AudioStretchAuto)
    static blackReaders = {
        outburstEvent: wstring,
        impactEvent: wstring,
        stretchEvent: wstring
    };

    /**
     * Creates the three standard emitters when absent
     */
    Initialize()
    {
        if (!this.sourceEmitter)
        {
            this.sourceEmitter = new AudEmitter();
            this.sourceEmitter.SetName("stretch_source_sfx");
        }
        if (!this.destinationEmitter)
        {
            this.destinationEmitter = new AudEmitter();
            this.destinationEmitter.SetName("stretch_dest_sfx");
        }
        if (!this.stretchEmitter)
        {
            this.stretchEmitter = new AudEmitter();
            this.stretchEmitter.SetName("stretch_mid_sfx");
        }
        return true;
    }

    /**
     * Positions the endpoint emitters and projects the listener onto the beam
     * @param {vec3} sourcePosition
     * @param {vec3} destPosition
     */
    Update(sourcePosition, destPosition)
    {
        const { front, top } = Tr2AudioStretchBase.global;
        StretchAudio.GetStretchOrientation(sourcePosition, destPosition, front, top);
        if (this.sourceEmitter && this.sourceEmitter.SetPosition)
        {
            this.sourceEmitter.SetPosition(front, top, sourcePosition);
        }
        if (this.destinationEmitter && this.destinationEmitter.SetPosition)
        {
            this.destinationEmitter.SetPosition(front, top, destPosition);
        }
        if (this.stretchEmitter && this.stretchEmitter.SetPosition)
        {
            const listener = tw2.audMan && tw2.audMan.listener ? tw2.audMan.listener.GetPosition() : sourcePosition;
            this.stretchEmitter.SetPosition(
                front,
                top,
                Tr2AudioStretchBase.ProjectOntoSegment(listener, sourcePosition, destPosition)
            );
        }
    }

    /**
     * Finds one of the three emitters by name
     * @param {String} name
     * @returns {?*}
     */
    FindEmitterByName(name)
    {
        const emitters = [ this.sourceEmitter, this.destinationEmitter, this.stretchEmitter ];
        for (let i = 0; i < emitters.length; i++)
        {
            const emitter = emitters[i];
            if (emitter && emitter.GetName && emitter.GetName() === name)
            {
                return emitter;
            }
        }
        return null;
    }

    /**
     * Projects a point onto the source->destination segment
     * @param {vec3} point
     * @param {vec3} source
     * @param {vec3} destination
     * @returns {Array<Number>}
     */
    static ProjectOntoSegment(point, source, destination)
    {
        const x = destination[0] - source[0];
        const y = destination[1] - source[1];
        const z = destination[2] - source[2];
        const lengthSquared = x * x + y * y + z * z;
        if (lengthSquared < 1e-6)
        {
            return [ source[0], source[1], source[2] ];
        }
        const offsetX = point[0] - source[0];
        const offsetY = point[1] - source[1];
        const offsetZ = point[2] - source[2];
        const t = Math.max(0, Math.min(1, (offsetX * x + offsetY * y + offsetZ * z) / lengthSquared));
        return [ source[0] + t * x, source[1] + t * y, source[2] + t * z ];
    }

    /**
     * Scratch variables
     * @type {Object}
     */
    static global = {
        front: vec3.fromValues(0, 1, 0),
        top: vec3.fromValues(0, 0, 1)
    };

}
