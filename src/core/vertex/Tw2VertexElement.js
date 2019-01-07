/**
 * Tw2VertexElement
 *
 * @property {Number} usage
 * @property {Number} usageIndex
 * @property {Number} type
 * @property {Number} elements
 * @property {Number} offset
 * @property location
 * @property customSetter
 * @class
 */
export class Tw2VertexElement
{

    usage = null;
    usageIndex = null;
    type = null;
    elements = null;
    offset = 0;
    location = null;
    customSetter = null;


    /**
     * Constructor
     * @param {Number} usage
     * @param {Number} usageIndex
     * @param {Number} type
     * @param {Number} elements
     * @param {Number} [offset=0]
     */
    constructor(usage, usageIndex, type, elements, offset = 0)
    {
        this.usage = usage;
        this.usageIndex = usageIndex;
        this.type = type;
        this.elements = elements;
        this.offset = offset;
    }
}
