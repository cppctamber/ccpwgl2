import { meta } from "utils";
import { Tw2VertexElement } from "./Tw2VertexElement";


@meta.type("Tw2VertexDeclaration")
export class Tw2VertexDeclaration
{

    @meta.list("Tw2VertexElement")
    elements = [];

    @meta.list("Tw2VertexElement")
    @meta.isPrivate
    elementsSorted = [];

    //@meta.uint
    //stride = null;

    /**
     * Gets the vertex count
     * TODO: Replace stride with this when manually defined strides are removed
     * @returns {number}
     */
    get vertexCount()
    {
        let count = 0;
        for (let i = 0; i < this.elements.length; i++)
        {
            count += this.elements[i].elements;
        }
        return count;
    }

    /**
     * Fire on value changes
     */
    UpdateValues()
    {
        this.RebuildHash();
    }

    /**
     * Clears the declaration
     */
    Clear()
    {
        this.elements.splice(0, this.elements.length);
        this.RebuildHash();
    }

    /**
     * Sets the vertex stride
     * @param {Number} val
     * @returns {Tw2VertexDeclaration}
     */
    SetStride(val)
    {
        this.stride = val;
        return this;
    }

    /**
     * Rebuilds the declaration
     */
    RebuildHash()
    {
        this.elementsSorted.splice(0, this.elementsSorted.length);
        for (let i = 0; i < this.elements.length; ++i)
        {
            this.elementsSorted.push(this.elements[i]);
        }

        this.elementsSorted.sort(Tw2VertexDeclaration.CompareDeclarationElements);
    }

    /**
     * Checks an element usage and usage index exists
     * @param {Number} usage
     * @param {Number} usageIndex
     * @returns {boolean}
     */
    HasUsage(usage, usageIndex)
    {
        return this.FindUsage(usage, usageIndex) !== null;
    }

    /**
     * Finds an element by it's usage type and usage index
     * @param {Number} usage
     * @param {Number} usageIndex
     * @returns {?Tw2VertexElement}
     */
    FindUsage(usage, usageIndex)
    {
        for (let i = 0; i < this.elementsSorted.length; ++i)
        {
            const e = this.elementsSorted[i];
            if (e.usage === usage)
            {
                if (e.usageIndex === usageIndex) return e;
                else if (e.usageIndex > usageIndex) return null;
            }

            if (e.usage > usage) return null;
        }
        return null;
    }

    /**
     * Sets declarations
     * TODO: Move to the device?
     * @param {Tw2Device} device
     * @param {Tw2VertexDeclaration} inputDecl
     * @param {Number} stride
     * @returns {Boolean}
     */
    SetDeclaration(device, inputDecl, stride)
    {
        const gl = device.gl;

        let index = 0;
        for (let i = 0; i < inputDecl.elementsSorted.length; ++i)
        {
            const el = inputDecl.elementsSorted[i];
            if (el.location < 0) continue;

            while (true)
            {
                if (index >= this.elementsSorted.length)
                {
                    gl.disableVertexAttribArray(el.location);
                    gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    break;
                }

                const
                    input = this.elementsSorted[index],
                    cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el);

                if (cmp > 0)
                {
                    gl.disableVertexAttribArray(el.location);
                    gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    break;
                }

                if (cmp === 0)
                {
                    if (input.customSetter)
                    {
                        input.customSetter(el);
                    }
                    else
                    {
                        gl.enableVertexAttribArray(el.location);
                        gl.vertexAttribPointer(
                            el.location,
                            input.elements,
                            input.type,
                            false,
                            stride,
                            input.offset);
                    }
                    break;
                }
                index++;
            }
        }
        return true;
    }

    /**
     * Sets a partial declaration
     * @param {Tw2Device} device
     * @param {Tw2VertexDeclaration} inputDecl
     * @param {Number} stride
     * @param {Number} [usageOffset]
     * @param {Number} [divisor]
     * @returns {Array}
     */
    SetPartialDeclaration(device, inputDecl, stride, usageOffset, divisor)
    {
        const
            gl = device.gl,
            resetData = [];

        let index = 0;
        for (let i = 0; i < inputDecl.elementsSorted.length; ++i)
        {
            const el = inputDecl.elementsSorted[i];
            if (el.location < 0) continue;

            while (true)
            {
                const
                    input = this.elementsSorted[index],
                    cmp = Tw2VertexDeclaration.CompareDeclarationElements(input, el, usageOffset);

                if (cmp === 0)
                {
                    if (input.customSetter)
                    {
                        input.customSetter(el);
                    }
                    else
                    {
                        gl.enableVertexAttribArray(el.location);
                        gl.vertexAttribPointer(
                            el.location,
                            input.elements,
                            input.type,
                            false,
                            stride,
                            input.offset);

                        gl.vertexAttribDivisor(el.location, divisor);

                        if (divisor)
                        {
                            resetData.push(el.location);
                        }
                    }
                    break;
                }
                else if (cmp > 0)
                {
                    if (!divisor)
                    {
                        gl.disableVertexAttribArray(el.location);
                        gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    }
                    break;
                }

                index++;
                if (index >= this.elementsSorted.length)
                {
                    if (!divisor)
                    {
                        gl.disableVertexAttribArray(el.location);
                        gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
                    }
                    return resetData;
                }
            }
        }
        return resetData;
    }

    /**
     * Resets instance divisors
     * TODO: Move to the device?
     * @param {Tw2Device} device
     * @param {?Array} [resetData]
     */
    ResetInstanceDivisors(device, resetData)
    {
        if (resetData)
        {
            for (let i = 0; i < resetData.length; ++i)
            {
                device.gl.vertexAttribDivisor(resetData[i], 0);
            }
        }
    }

    /**
     * Gets a usage as an array of arrays
     * @param {Array|TypedArray} bufferData
     * @param {Number} usage
     * @param {Number} usageIndex
     * @returns {undefined|*[]}
     */
    GetUsageAsArrayOfArrays(bufferData, usage, usageIndex)
    {
        const decl = this.FindUsage(usage, usageIndex);
        if (!decl) return;

        const out = [];
        for (let i = 0; i < bufferData.length; i+=this.stride)
        {
            const
                el = [],
                ix = i * this.stride + decl.offset;

            for (let x = 0; x < decl.elements; x++)
            {
                el[x] = bufferData[ix + x];
            }
            out.push(el);
        }

        return out;
    }

    /**
     * CompareDeclarationElements
     * @param {Tw2VertexElement} a
     * @param {Tw2VertexElement} b
     * @param {Number} [usageOffset=0]
     * @returns {Number}
     */
    static CompareDeclarationElements(a, b, usageOffset = 0)
    {
        if (a.usage < b.usage) return -1;
        if (a.usage > b.usage) return 1;
        if (a.usageIndex + usageOffset < b.usageIndex) return -1;
        if (a.usageIndex + usageOffset > b.usageIndex) return 1;
        return 0;
    }

    /**
     * Creates a vertex declaration from a plain object
     * TODO: Allow preset element offsets
     * @param {RawVertexDataArray} values
     * @param {{}} [opt]
     * @param {Boolean} [opt.skipUpdate]
     */
    static from(values, opt)
    {
        const item = new Tw2VertexDeclaration();
        if (values)
        {
            let currentOffset = 0;
            for (let i = 0; i < values.length; i++)
            {
                values[i].offset = currentOffset;
                item.elements.push(Tw2VertexElement.from(values[i]));
                currentOffset += values[i].elements * 4;
            }

            if (!opt || !opt.skipUpdate) item.RebuildHash();
        }

        return item;
    }

}
