import { Tw2ParticleForce } from "./Tw2ParticleForce";
import { ErrFeatureNotImplemented } from "core";
import * as r from "core/reader/Tw2BlackPropertyReaders";

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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "forces", r.array ],
            [ "radius", r.float ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
