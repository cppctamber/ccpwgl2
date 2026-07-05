import { meta, isString, getKeyFromValue, isNoU } from "utils";
import * as consts from "constant";


@meta.type("Tw2VertexElement")
@meta.wgl.define("Tw2VertexElement")
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

    @meta.int32
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
     *
     * Values follow Carbon/Trinity's Tr2VertexDefinition::UsageCode
     * (carbonengine trinityal/Tr2VertexDefinition.h:17): BLENDINDICES=6,
     * BLENDWEIGHTS=7. The legacy GLES-v8 shader binaries and .wbg
     * geometry were authored with 6/7 swapped — their readers translate
     * through UsageFromCcpLegacy so the runtime speaks Trinity only.
     * @type {*}
     */
    static Type = {
        POSITION: 0,
        COLOR: 1,
        NORMAL: 2,
        TANGENT: 3,
        BITANGENT: 4,
        TEXCOORD: 5,
        BLENDINDICES: 6,
        BLENDWEIGHTS: 7,
        // ALIASES
        BINORMAL: 4,
        BLENDWEIGHT: 7,
        BLENDINDICE: 6,
    };

    /**
     * Translates a legacy (GLES-v8 era) usage code into the Trinity
     * usage codes the runtime uses: the old convention had
     * BLENDWEIGHT=6/BLENDINDICES=7, Trinity has them swapped.
     * @param {Number} usage
     * @returns {Number}
     */
    static UsageFromCcpLegacy(usage)
    {
        if (usage === 6) return 7;
        if (usage === 7) return 6;
        return usage;
    }

}
