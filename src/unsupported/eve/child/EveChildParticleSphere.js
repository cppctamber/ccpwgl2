import { meta } from "global";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildParticleSphere", true)
export class EveChildParticleSphere extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.listOf("Tw2ParticleAttributeGenerator")
    generators = [];

    @meta.black.float
    maxSpeed = 0;

    @meta.black.objectOf("Tw2InstancedMesh")
    mesh = null;

    @meta.black.float
    movementScale = 0;

    @meta.black.objectOf("Tw2ParticleSystem")
    particleSystem = null;

    @meta.black.float
    positionShiftDecreaseSpeed = 0;

    @meta.black.float
    positionShiftIncreaseSpeed = 0;

    @meta.black.float
    positionShiftMax = 0;

    @meta.black.float
    positionShiftMin = 0;

    @meta.black.float
    radius = 0;

    @meta.black.boolean
    useSpaceObjectData = false;


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);
        if (this.particleSystem && this.particleSystem.GetResources)
        {
            this.particleSystem.GetResources(out);
        }
        return out;
    }

}
