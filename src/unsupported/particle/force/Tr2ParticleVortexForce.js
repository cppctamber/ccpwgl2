import { meta, vec3 } from "global";
import { Tw2ParticleForce } from "particle/force/Tw2ParticleForce";


@meta.ccp("Tr2ParticleVortexForce")
@meta.notImplemented
export class Tr2ParticleVortexForce extends Tw2ParticleForce
{

    @meta.black.vector3
    axis = vec3.create();

    @meta.black.float
    magnitude = 0;

    @meta.black.vector3
    position = vec3.create();

}
