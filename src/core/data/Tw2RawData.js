/**
 * Stores raw data for {@link Tw2PerObjectData}
 *
 * @property {Float32Array} data
 * @property {*} elements
 * @property {Number} nextOffset
 * @class
 */
import { ErrIndexBounds } from "../Tw2Error";

export class Tw2RawData
{

    data = null;
    elements = {};
    _nextOffset = 0;

    /**
     * Checks if an element exists
     * @param {String} name
     * @returns {boolean}
     */
    Has(name)
    {
        return name in this.elements;
    }

    /**
     * Sets an element value
     * @param {String} name
     * @param {Float32Array|Array|vec3|vec4|mat4} value
     */
    Set(name, value)
    {
        const el = this.elements[name];
        for (let i = 0; i < el.size; i++)
        {
            this.data[i + el.offset] = value[i];
        }
    }

    /**
     * Sets an element index value
     * @param {String} name
     * @param {Number} index
     * @param {Number} value
     */
    SetIndex(name, index, value)
    {
        const el = this.elements[name];

        if (index < 0 || index >= el.size)
        {
            throw new ErrIndexBounds();
        }

        this.data[index + el.offset] = value;
    }

    /**
     * Gets an element's array value
     * @param {String} name
     * @return {Float32Array}
     */
    Get(name)
    {
        return this.elements[name].array;
    }

    /**
     * Finds an element by an index
     * @param {Number} index
     * @returns {*|null}
     */
    FindElementFromIndex(index)
    {
        if (index >= 0 && index < this._nextOffset)
        {
            for (const key in this.elements)
            {
                if (this.elements.hasOwnProperty(key))
                {
                    const { offset, size } = this.elements[key];
                    if (index < offset || index > offset + size - 1) continue;
                    return this.elements[key];
                }
            }
        }
        return null;
    }

    /**
     * Declares a raw data element
     * @param {String} name
     * @param {Number|Array|Float32Array} data - Size or the default value in an array
     */
    Declare(name, data)
    {
        let
            isValue = typeof data !== "number",
            size = isValue ? data.length : data,
            value = isValue ? data : null;

        this.elements[name] = { name, offset: this._nextOffset, array: null, size, value };
        this._nextOffset += size;
    }

    /**
     * Creates the raw data element array
     */
    Create()
    {
        this.data = new Float32Array(this._nextOffset);
        for (let name in this.elements)
        {
            if (this.elements.hasOwnProperty(name))
            {
                const el = this.elements[name];
                el.array = this.data.subarray(el.offset, el.offset + el.size);
                if (el.value)
                {
                    for (let i = 0; i < el.size; i++)
                    {
                        el.array[i] = el.value[i];
                    }
                    Reflect.deleteProperty(el, "value");
                }
            }
        }
    }

    /**
     * Creates raw data from values
     * @param {RawElementArray} [values]
     * @param {{}} [opt]
     * @param {boolean} [opt.skipUpdate]
     * @returns {Tw2RawData}
     */
    static from(values, opt)
    {
        const item = new Tw2RawData();
        if (values)
        {
            for (let i = 0; i < values.length; i++)
            {
                item.Declare(values[i][0], values[i][1]);
            }

            if (!opt || !opt.skipUpdate) item.Create();
        }
        return item;
    }
}
