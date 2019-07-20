/**
 * Tw2ParticleElement
 *
 * @property {number} elementType
 * @property {String} customName
 * @property {number} dimension
 * @property {number} usageIndex
 * @property {Boolean} usedByGPU
 * @property buffer
 * @property {number} startOffset
 * @property {number} offset
 * @property {number} instanceStride
 * @property {number} vertexStride
 * @property {Boolean} dirty
 * @class
 */
export class Tw2ParticleElement
{

    elementType = null;
    customName = null;
    dimension = null;
    usageIndex = null;
    usedByGPU = null;
    buffer = null;
    startOffset = 0;
    offset = 0;
    instanceStride = 0;
    vertexStride = 0;
    dirty = false;

    /**
     * Gets the element type as a string
     * @returns {String}
     */
    get string()
    {
        return Tw2ParticleElement.TypeMap[this.elementType] || "UNKNOWN";
    }


    /**
     * Particle element factory
     * @param {*} values
     * @returns {Tw2ParticleElement}
     */
    static from(values)
    {
        const item = new Tw2ParticleElement();
        if (values)
        {
            const type = values.elementType;
            item.elementType = typeof type === "string" ? this.Type[type.toUpperCase()] : type;
            item.customName = values.customName;
            item.dimension = values.dimension;
            item.usageIndex = values.usageIndex;
            item.usedByGPU = values.usedByGPU ? 1 : 0;
        }
        return item;
    }

    /**
     * Particle element types
     * @type {{LIFETIME: number, POSITION: number, VELOCITY: number, MASS: number, CUSTOM: number}}
     */
    static Type = {
        LIFETIME: 0,
        POSITION: 1,
        VELOCITY: 2,
        MASS: 3,
        CUSTOM: 4
    };

    /**
     * Particle element type map
     * @type {string[]}
     */
    static TypeMap = [
        "LIFETIME",
        "POSITION",
        "VELOCITY",
        "MASS",
        "CUSTOM"
    ]

}
