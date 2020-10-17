import { meta } from "utils";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.ctor("EveChildParticleSphere")
export class EveChildParticleSphere extends EveChild
{

    @meta.string
    name = "";

    @meta.list("Tw2ParticleAttributeGenerator")
    generators = [];

    @meta.float
    maxSpeed = 0;

    @meta.struct("Tw2InstancedMesh")
    mesh = null;

    @meta.float
    movementScale = 0;

    @meta.struct("Tw2ParticleSystem")
    particleSystem = null;

    @meta.float
    positionShiftDecreaseSpeed = 0;

    @meta.float
    positionShiftIncreaseSpeed = 0;

    @meta.float
    positionShiftMax = 0;

    @meta.float
    positionShiftMin = 0;

    @meta.float
    radius = 0;

    @meta.boolean
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
