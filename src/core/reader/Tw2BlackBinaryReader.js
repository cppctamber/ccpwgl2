import { Tw2Error } from "../class/Tw2Error";


/**
 * Tw2BlackBinaryReader
 * @ccp N/A
 *
 * @author aurora
 * @property {DataView} data
 * @property {Tw2BlackReader} context
 * @property {Number} cursor
 */
export class Tw2BlackBinaryReader
{

    data = null;
    context = null;
    cursor = 0;

    /**
     * Constructor
     * @param {DataView} data
     * @param {Tw2BlackReader} context
     */
    constructor(data, context)
    {
        this.data = data;
        this.context = context;
        this.cursor = 0;
    }

    /**
     * Gets the data length
     * @returns {number}
     */
    get length()
    {
        return this.data.byteLength - this.cursor;
    }

    /**
     * Gets the string table
     */
    get stringTable()
    {
        return this.context._stringTable;
    }

    /**
     * Gets references
     */
    get references()
    {
        return this.context._ids;
    }

    /**
     * Checks if the reader is at the end of the data
     * @returns {boolean}
     */
    AtEnd()
    {
        return this.length === 0;
    }

    /**
     *
     * @param n
     * @returns {Tw2BlackBinaryReader}
     */
    ReadBinaryReader(n)
    {
        return new Tw2BlackBinaryReader(this.ReadDataView(n), this.context);
    }

    /**
     *
     * @returns {*}
     */
    ReadCString()
    {
        const
            data = this.data,
            startOffset = this.cursor;

        while (this.ReadU8() !== 0)
        {
            // NO OPERATION
        }

        const
            arrayOffset = data.byteOffset + startOffset,
            arrayLength = this.cursor - startOffset - 1,
            array = new Uint8Array(data.buffer, arrayOffset, arrayLength);

        return Tw2BlackBinaryReader.stringDecoder.decode(array);
    }

    /**
     *
     * @returns {*}
     */
    ReadCWString()
    {
        const
            data = this.data,
            startOffset = this.cursor;

        while (this.ReadU16() !== 0)
        {
            // NO OPERATION
        }

        const
            arrayOffset = data.byteOffset + startOffset,
            arrayLength = this.cursor - startOffset - 2,
            array = new Uint8Array(data.buffer, arrayOffset, arrayLength);

        return Tw2BlackBinaryReader.wstringDecoder.decode(array);
    }

    /**
     *
     * @param n
     * @returns {DataView}
     */
    ReadDataView(n)
    {
        if (n < 0)
        {
            throw new ErrBinaryReaderReadError({
                readError: `Argument should be positive: got "${n}"`
            });
        }

        if (this.length < n)
        {
            throw new ErrBinaryReaderReadError({
                readError: `Argument is too big: remaining ${this.length}, got "${n}"`
            });
        }

        const
            data = this.data,
            value = new DataView(data.buffer, data.byteOffset + this.cursor, n);

        this.cursor += n;
        return value;
    }

    /**
     *
     * @returns {number}
     */
    ReadF32()
    {
        const value = this.data.getFloat32(this.cursor, true);
        this.cursor += 4;
        return value;
    }

    /**
     *
     * @returns {number}
     */
    ReadF64()
    {
        const value = this.data.getFloat64(this.cursor, true);
        this.cursor += 8;
        return value;
    }

    /**
     *
     * @returns {*}
     */
    ReadStringU16()
    {
        let value = this.ReadU16();
        if (value > this.stringTable.length)
        {
            throw new ErrBinaryReaderReadError({
                readError: `Reading string "${value}" but only ${this.stringTable.length} exist`
            });
        }
        return this.stringTable[value];
    }

    /**
     *
     * @returns {number}
     */
    ReadU8()
    {
        let value = this.data.getUint8(this.cursor);
        this.cursor += 1;
        return value;
    }

    /**
     *
     * @returns {number}
     */
    ReadU16()
    {
        let value = this.data.getUint16(this.cursor, true);
        this.cursor += 2;
        return value;
    }

    /**
     *
     * @param n
     * @returns {Uint16Array}
     */
    ReadU16Array(n)
    {
        if (n < 0)
        {
            throw new ErrBinaryReaderReadError({
                readError: `Argument should be positive but got "${n}"`
            });
        }

        let value = new Uint16Array(n);
        for (let i = 0; i < n; i++)
        {
            value[i] = this.ReadU16();
        }
        return value;
    }

    /**
     *
     * @returns {number}
     */
    ReadU32()
    {
        let value = this.data.getUint32(this.cursor, true);
        this.cursor += 4;
        return value;
    }

    /**
     *
     * @param n
     * @returns {Uint32Array}
     */
    ReadU32Array(n)
    {
        if (n < 0)
        {
            throw new ErrBinaryReaderReadError({
                readError: `Argument should be positive: got ${n}`
            });
        }

        let value = new Uint32Array(n);
        for (let i = 0; i < n; i++)
        {
            value[i] = this.ReadU32();
        }
        return value;
    }

    /**
     *
     * @param message
     */
    ExpectEnd(message)
    {
        if (this.length !== 0)
        {
            throw new ErrBinaryReaderReadError({
                readError: `${message}: expected 0 bytes remaining, got ${this.length}`
            });
        }
    }

    /**
     *
     * @param expected
     * @param message
     */
    ExpectU8(expected, message)
    {
        Tw2BlackBinaryReader.expect(this.ReadU8(), expected, message);
    }

    /**
     *
     * @param expected
     * @param message
     */
    ExpectU16(expected, message)
    {
        Tw2BlackBinaryReader.expect(this.ReadU16(), expected, message);
    }

    /**
     *
     * @param expected
     * @param message
     */
    ExpectU32(expected, message)
    {
        Tw2BlackBinaryReader.expect(this.ReadU32(), expected, message);
    }

    /**
     *
     * @param actual
     * @param expected
     * @param message
     */
    static expect(actual, expected, message)
    {
        if (actual !== expected)
        {
            throw new ErrBinaryReaderReadError({
                readError: `${message}: expected ${expected}, got ${actual}`
            });
        }
    }

    /**
     *
     * @type {TextDecoder}
     */
    static stringDecoder = new TextDecoder("utf-8");

    /**
     *
     * @type {TextDecoder}
     */
    static wstringDecoder = new TextDecoder("utf-16le");
}


/**
 * Throws on binary reader read errors
 */
export class ErrBinaryReaderReadError extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error reading binary (%readError=undefined%)");
    }
}
