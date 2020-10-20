import { meta } from "utils";
import { Tw2ParticleForce } from "particle/force/Tw2ParticleForce";


@meta.type("Tr2ForceSphereVolume")
@meta.notImplemented
export class Tr2ForceSphereVolume extends Tw2ParticleForce
{

    @meta.list("Tw2ParticleForce")
    forces = [];

    @meta.float
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
