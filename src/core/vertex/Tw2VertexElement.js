import {GL_FLOAT} from "../../global";

/**
 * Tw2VertexElement
 *
 * @property {Function} customSetter
 * @property {Number} elements
 * @property {?Number} location
 * @property {Number} offset
 * @property {Number} type
 * @property {Number} usage
 * @property {Number} usageIndex
 */
export class Tw2VertexElement
{

    customSetter = null;
    elements = null;
    location = null;
    offset = 0;
    type = null;
    usage = null;
    usageIndex = null;


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
            let {usage, usageIndex} = values;
            item.usage = typeof usage === "string" ? this.Type[usage.toUpperCase()] : usage;
            item.usageIndex = usageIndex;

            // Optional
            const {elements = null, type = GL_FLOAT, offset = 0, location = null, customSetter = null} = values;
            item.offset = offset;
            item.elements = elements;
            item.type = type;
            item.location = location;
            item.customSetter = customSetter;

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
        BLENDINDICES: 7
    };

}
