import { getKeyFromValue, meta } from "utils";


const ParticleType = {
    LIFETIME: 0,
    POSITION: 1,
    VELOCITY: 2,
    MASS: 3,
    CUSTOM: 4
};


@meta.type("Tw2ParticleElement")
@meta.wgl.define("Tw2ParticleElement")
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
     * Which of the particle system's two buffers this element lives in.
     *
     * `Tw2ParticleSystem` keeps `[ gpuBuffer, cpuBuffer ]` and derives the index
     * as `usedByGPU ? 0 : 1` everywhere it touches them. Constraints receive
     * those buffers by argument and need the same mapping, so it is named once
     * here rather than repeated at every call site - Carbon carries it on the
     * element as `m_bufferType`.
     *
     * @returns {Number} 0 for the GPU buffer, 1 for the CPU-only buffer
     */
    get bufferIndex()
    {
        return this.usedByGPU ? 0 : 1;
    }

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
