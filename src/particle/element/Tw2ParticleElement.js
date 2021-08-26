import { getKeyFromValue, meta } from "utils";


const ParticleType = {
    LIFETIME: 0,
    POSITION: 1,
    VELOCITY: 2,
    MASS: 3,
    CUSTOM: 4
};


@meta.type("Tw2ParticleElement")
export class Tw2ParticleElement
{

    @meta.enums(ParticleType)
    elementType = null;

    @meta.string
    customName = null;

    @meta.uint
    dimension = null;

    @meta.uint
    usageIndex = null;

    @meta.boolean
    usedByGPU = null;

    buffer = null;

    @meta.uint
    startOffset = 0;

    @meta.uint
    offset = 0;

    @meta.uint
    instanceStride = 0;

    @meta.uint
    vertexStride = 0;

    @meta.boolean
    @meta.isPrivate
    dirty = false;

    /**
     * Gets the element type as a string
     * @returns {String}
     */
    get string()
    {
        return getKeyFromValue(this.constructor.Type, this.elementType, "UNKNOWN");
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
    static Type = ParticleType

}
