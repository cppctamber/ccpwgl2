import { Tw2ParticleDragForce } from "particle/force";
import { meta } from "utils";

/**
 * EveParticleDragForce
 * Todo: Is this just a copy of Tw2ParticleDragForce?
 */
@meta.type("EveParticleDragForce")
@meta.define({
    wgl: "EveParticleDragForce",
    ccp: true
})
export class EveParticleDragForce extends Tw2ParticleDragForce
{


}
