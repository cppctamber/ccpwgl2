import { meta } from "utils";
import { vec3 } from "math";
import { Tw2ParticleForce } from "./Tw2ParticleForce";


@meta.ccp.define("Tr2ForceSphereVolume")
export class Tr2ForceSphereVolume extends Tw2ParticleForce
{
    @meta.list("Tw2ParticleForce")
    forces = [];

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 1;

    @meta.float
    exponent = 1;

    Update(dt)
    {
        for (let i = 0; i < this.forces.length; i++)
        {
            if (this.forces[i] && this.forces[i].Update)
            {
                this.forces[i].Update(dt);
            }
        }
    }

    ApplyForce(position, velocity, force, dt, mass)
    {
        const
            nestedForce = Tw2ParticleForce.global.vec3_0,
            delta = Tw2ParticleForce.global.vec3_1;

        delta[0] = position.buffer[position.offset] - this.position[0];
        delta[1] = position.buffer[position.offset + 1] - this.position[1];
        delta[2] = position.buffer[position.offset + 2] - this.position[2];

        const distance = vec3.length(delta);
        if (!this.radius || distance >= this.radius)
        {
            return;
        }

        vec3.set(nestedForce, 0, 0, 0);
        for (let i = 0; i < this.forces.length; i++)
        {
            if (this.forces[i] && this.forces[i].ApplyForce)
            {
                this.forces[i].ApplyForce(position, velocity, nestedForce, dt, mass);
            }
        }

        vec3.scale(nestedForce, nestedForce, Math.pow(1 - distance / this.radius, this.exponent));
        vec3.add(force, force, nestedForce);
    }
}
