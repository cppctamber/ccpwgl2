import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionSpawnParticles")
@meta.ccp.define("Tr2ActionSpawnParticles")
export class Tr2ActionSpawnParticles extends Tw2Action
{

    @meta.struct("Tw2DynamicEmitter")
    emitter = null;

    @meta.float
    rate = 1;

    Start()
    {
        if (!this.emitter || !this.emitter.SpawnParticles)
        {
            return false;
        }

        this.emitter.SpawnParticles(null, null, this.rate);
        return true;
    }

}
