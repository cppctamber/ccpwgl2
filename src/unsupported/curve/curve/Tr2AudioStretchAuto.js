import { meta } from "utils";
import { Tr2AudioStretchBase } from "./Tr2AudioStretchBase";


/**
 * Self-triggering stretch audio, ported from Carbon's Tr2AudioStretchAuto.
 */
@meta.type("Tr2AudioStretchAuto", "Tr2AudioStretchAuto")
@meta.ccp.define("Tr2AudioStretchAuto")
export class Tr2AudioStretchAuto extends Tr2AudioStretchBase
{

    /**
     * Posts the outburst event on the source emitter
     * @returns {Number} playing id
     */
    TriggerOutburstEvent()
    {
        return this.sourceEmitter && this.sourceEmitter.SendEvent
            ? this.sourceEmitter.SendEvent(this.outburstEvent)
            : 0;
    }

    /**
     * Posts the impact event on the destination emitter
     * @returns {Number} playing id
     */
    TriggerImpactEvent()
    {
        return this.destinationEmitter && this.destinationEmitter.SendEvent
            ? this.destinationEmitter.SendEvent(this.impactEvent)
            : 0;
    }

    /**
     * Posts the stretch event on the stretch emitter
     * @returns {Number} playing id
     */
    TriggerStretchEvent()
    {
        return this.stretchEmitter && this.stretchEmitter.SendEvent
            ? this.stretchEmitter.SendEvent(this.stretchEvent)
            : 0;
    }

}
