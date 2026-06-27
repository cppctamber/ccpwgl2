import { meta } from "utils";
import { Tw2ParticleDirectForce } from "particle/force";

/**
 * EveParticleDirectForce
 * Todo: Is this just a copy of Tw2ParticleDirectForce?
 */
@meta.type("EveParticleDirectForce")
@meta.define({
    wgl: "EveParticleDirectForce",
    ccp: true
})
export class EveParticleDirectForce extends Tw2ParticleDirectForce
{

}
