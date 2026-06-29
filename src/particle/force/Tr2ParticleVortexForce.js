import { meta } from "utils";
import { vec3 } from "math";
import { Tw2ParticleForce } from "./Tw2ParticleForce";


@meta.ccp.define("Tr2ParticleVortexForce")
export class Tr2ParticleVortexForce extends Tw2ParticleForce
{
    @meta.float
    magnitude = 1;

    @meta.vector3
    position = vec3.create();

    @meta.vector3
    axis = vec3.fromValues(0, 1, 0);

    ApplyForce(position, velocity, force, dt, mass)
    {
        const direction = Tw2ParticleForce.global.vec3_0;

        direction[0] = this.position[0] - position.buffer[position.offset];
        direction[1] = this.position[1] - position.buffer[position.offset + 1];
        direction[2] = this.position[2] - position.buffer[position.offset + 2];

        vec3.cross(direction, direction, this.axis);
        if (vec3.length(direction))
        {
            vec3.normalize(direction, direction);
            vec3.scale(direction, direction, this.magnitude);
            vec3.add(force, force, direction);
        }
    }
}
