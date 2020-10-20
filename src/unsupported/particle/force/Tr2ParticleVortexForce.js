import { meta } from "utils";
import { vec3 } from "math";
import { Tw2ParticleForce } from "particle/force/Tw2ParticleForce";


@meta.type("Tr2ParticleVortexForce")
@meta.notImplemented
export class Tr2ParticleVortexForce extends Tw2ParticleForce
{

    @meta.vector3
    axis = vec3.create();

    @meta.float
    magnitude = 0;

    @meta.vector3
    position = vec3.create();

}
