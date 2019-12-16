import { meta } from "global";
import { Tw2ParticleForce } from "./Tw2ParticleForce";
import { ErrFeatureNotImplemented } from "core";


/**
 * Tr2ForceSphereVolume
 *
 * @property {Array.<Tw2ParticleForce>} forces -
 * @property {Number} radius                -
 */
@meta.ccp("Tr2ForceSphereVolume")
@meta.notImplemented
export class Tr2ForceSphereVolume extends Tw2ParticleForce
{

    @meta.black.list
    forces = [];

    @meta.black.float
    radius = 0;


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
