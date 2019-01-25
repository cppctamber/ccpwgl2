import {Tw2ParticleForce} from "./Tw2ParticleForce";
import {ErrFeatureNotImplemented} from "../../core";

/**
 * Tr2ForceSphereVolume
 * TODO: Implement
 * @ccp Tr2ForceSphereVolume
 *
 * @property {Array.<Tw2ParticleForce>} forces -
 * @property {Number} radius                -
 */
export class Tr2ForceSphereVolume extends Tw2ParticleForce
{

    forces = [];
    radius = 0;


    /**
     * Applies force
     * @param {Tw2ParticleElement} position - Position
     * @param {Tw2ParticleElement} velocity - Velocity
     * @param {Tw2ParticleElement} force    - force
     * @param {Number} [dt]                 - unused
     * @param {Number} [mass]               - unused
     */
    ApplyForce(position, velocity, force, dt, mass)
    {
        // Todo: Implement ApplyForce
        throw new ErrFeatureNotImplemented();
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        // Todo: Implement Update

        for (let i = 0; i < this.forces.length; i++)
        {
            this.forces[i].Update(dt);
        }
    }

}

Tw2ParticleForce.define(Tr2ForceSphereVolume, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ForceSphereVolume",
        props: {
            forces: [["ParticleForce"]],
            radius: Type.NUMBER
        }
    };
});

