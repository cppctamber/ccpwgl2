import {EveChild} from "./EveChild";

/**
 * EveChildParticleSphere
 * TODO: Implement
 *
 * @property {String} name                                      -
 * @property {Array.<Tw2ParticleAttributeGenerator>} generators -
 * @property {Number} maxSpeed                                  -
 * @property {Tw2InstancedMesh} mesh                            -
 * @property {Number} movementScale                             -
 * @property {Tw2ParticleSystem} particleSystem                 -
 * @property {Number} positionShiftDecreaseSpeed                -
 * @property {Number} positionShiftIncreaseSpeed                -
 * @property {Number} positionShiftMax                          -
 * @property {Number} positionShiftMin                          -
 * @property {Number} radius                                    -
 * @property {Boolean} useSpaceObjectData                       -
 */
export class EveChildParticleSphere extends EveChild
{

    name = "";
    generators = [];
    maxSpeed = 0;
    mesh = null;
    movementScale = 0;
    particleSystem = null;
    positionShiftDecreaseSpeed = 0;
    positionShiftIncreaseSpeed = 0;
    positionShiftMax = 0;
    positionShiftMin = 0;
    radius = 0;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["generators", r.array],
            ["maxSpeed", r.float],
            ["mesh", r.object],
            ["movementScale", r.float],
            ["name", r.string],
            ["particleSystem", r.object],
            ["positionShiftDecreaseSpeed", r.float],
            ["positionShiftIncreaseSpeed", r.float],
            ["positionShiftMax", r.float],
            ["positionShiftMin", r.float],
            ["radius", r.float],
            ["useSpaceObjectData", r.boolean]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}