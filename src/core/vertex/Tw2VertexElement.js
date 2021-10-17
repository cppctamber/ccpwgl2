import { meta, isString, getKeyFromValue, isNoU } from "utils";
import * as consts from "constant";


@meta.type("Tw2VertexElement")
export class Tw2VertexElement
{

    customSetter = null;

    @meta.uint
    elements = null;

    @meta.uint
    location = null;

    @meta.uint
    offset = 0;

    @meta.uint
    type = null;

    @meta.uint
    usage = -1;

    @meta.uint
    usageIndex = null;


    _registerIndex = null;
    _usedMask = null;
    _attr = null;


    /**
     * Gets the vertex's type as a string
     * @returns {string|string}
     */
    get string()
    {
        return getKeyFromValue(this.constructor.Type, this.usage, "UNKNOWN");
    }


    /**
     * Creates a vertex element from values
     * @param {RawVertexData} [values]
     * @returns {Tw2VertexElement}
     */
    static from(values)
    {
        const item = new Tw2VertexElement();
        if (values)
        {
            // Compulsory
            let { usage, usageIndex } = values;
            item.usage = isString(usage) ? this.Type[usage.toUpperCase()] : usage;
            item.usageIndex = usageIndex;

            if (isNoU(item.usage))
            {
                throw new Error(`Invalid vertex usage: ${usage}`);
            }

            // Optional
            const { elements = null, offset = 0, location = null, customSetter = null } = values;
            item.offset = offset;
            item.elements = elements;
            item.location = location;
            item.customSetter = customSetter;

            // Optional
            let { type = consts.GL_FLOAT } = values;
            if (isString(type))
            {
                if (type.substring(0, 3) !== "GL_") type = "GL_" + type;
                type = consts[type];
                if (type === undefined) throw new ReferenceError(`Invalid gl type: ${type}`);
            }
            item.type = type;

            // Unused/ Debugging
            const { registerIndex = null, usedMask = null, attr = null } = values;
            item._registerIndex = registerIndex;
            item._usedMask = usedMask;
            item._attr = attr;

        }
        return item;
    }

    /**
     * Vertex element types
     * @type {*}
     */
    static Type = {
        POSITION: 0,
        COLOR: 1,
        NORMAL: 2,
        TANGENT: 3,
        BINORMAL: 4,
        TEXCOORD: 5,
        BLENDWEIGHT: 6,
        BLENDINDICES: 7,
        // ALIASES
        BITANGENT: 4,
        BLENDWEIGHTS: 6,
        BLENDINDICE: 7,
    };

}
