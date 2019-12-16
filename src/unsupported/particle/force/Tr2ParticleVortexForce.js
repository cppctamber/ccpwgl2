import { meta, vec3 } from "global";
import { Tw2ParticleForce } from "./Tw2ParticleForce";


/**
 * Tr2ParticleVortexForce
 *
 * @property {vec3} axis        -
 * @property {Number} magnitude -
 * @property {vec3} position    -
 */
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
