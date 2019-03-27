import {store} from "../../global";
import {Tw2BlackBinaryReader} from "./Tw2BlackBinaryReader";
import {ErrBinaryFormat, ErrBinaryObjectTypeNotFound,} from "../Tw2Error";
import {object} from "./Tw2BlackPropertyReaders";

/**
 * Tw2BlackReader
 * @ccp N/A
 *
 * @author aurora
 * @parameter {DataView} data
 * @parameter {Map} _ids
 * @parameter {String[]} _comments
 * @parameter {Tw2BlackBinaryReader} _reader
 * @parameter {Number} _start
 * @parameter {String[]} _stringTable
 */
export class Tw2BlackReader
{
    data = null;

    _ids = null;
    _comments = null;
    _reader = null;
    _start = 0;
    _stringTable = null;

    /**
     * Constructor
     * @param {DataView|ArrayBuffer} buffer
     */
    constructor(buffer)
    {
        if (buffer)
        {
            this.data = buffer instanceof ArrayBuffer ? new DataView(buffer) : buffer;
            this.Initialize();
        }
    }

    /**
     * Initializes the reader
     */
    Initialize()
    {
        // Validate binary

        if (!this.data || !(this.data instanceof DataView))
        {
            throw new ErrBinaryFormat({formatError: "expected DataView"});
        }

        const reader = new Tw2BlackBinaryReader(this.data, this);
        if (reader.ReadU32() !== 0xB1ACF11E) throw new ErrBinaryFormat({formatError: "wrong FOURCC"});
        if (reader.ReadU32() !== 1) throw new ErrBinaryFormat({formatError: "wrong version"});

        // String table
        const
            stringsReader = reader.ReadBinaryReader(reader.ReadU32()),
            stringsCount = stringsReader.ReadU16();

        this._stringTable = [];
        for (let i = 0; i < stringsCount; i++)
        {
            this._stringTable[i] = stringsReader.ReadCString();
        }
        stringsReader.ExpectEnd();

        // Comments
        const
            commentReader = reader.ReadBinaryReader(reader.ReadU32()),
            commentCount = commentReader.ReadU16();

        this._comments = [];
        for (let i = 0; i < commentCount; i++)
        {
            this._comments[i] = commentReader.ReadCWString();
        }
        commentReader.ExpectEnd();

        this._ids = new Map();
        this._reader = reader;
        this._start = reader.cursor;
    }

    /**
     * Constructs a new object
     * @returns {*}
     */
    Construct()
    {
        this._reader.cursor = this._start;
        return object(this._reader);
    }

    /**
     * Constructs a type
     * @param type
     * @returns {{_type: *}}
     * @constructor
     */
    ConstructType(type)
    {
        const Constructor = store.GetClass(type);
        if (Constructor)
        {
            return new Constructor();
        }
        else if (Tw2BlackReader.DEBUG_ENABLED)
        {
            return {_type: type};
        }
        else
        {
            throw new ErrBinaryObjectTypeNotFound({type});
        }
    }

    /**
     * Enables debug mode
     * @type {boolean}
     */
    static DEBUG_ENABLED = true;

}