import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


/**
 * Carbon's custom binary block, which the type system has no word for.
 *
 * `Tr2ActionPython` maps `state` with `MAP_ATTRIBUTE_AS_CUSTOM_BINARY_BLOCK`
 * and reads it through `ICustomPersist`: an int32 length followed by that many
 * raw bytes, with no element size and no object graph. Declared as a plain
 * object - which it was - the reader parses a graph out of the blob and runs
 * off the end of the file.
 *
 * A reader on the class rather than a new property type, because that is what
 * the black reader looks for first and what `Tw2Effect` already does for the
 * shapes its own properties do not share with anything else.
 *
 * Seen only on Frontier: Tranquility ships no controller carrying one.
 */
class Tw2PythonStateBlock
{

    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     * @returns {Uint8Array}
     */
    static blackStruct(r)
    {
        const byteLength = r.ReadI32();

        // COPIED out of the view. The reader's buffer is the whole black, so a
        // window onto it would hold the entire resource alive for as long as
        // anything kept the property.
        const view = r.ReadDataView(byteLength);

        return new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
    }

}


function CopyStateBytes(value)
{
    if (!value) return null;
    if (value instanceof Uint8Array) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
    if (Array.isArray(value)) return new Uint8Array(value);
    return value;
}


@meta.notImplemented
@meta.define("Tr2ActionPython", true)
export class Tr2ActionPython extends Tw2Action
{

    @meta.string
    module = "";

    @meta.string
    className = "";

    @meta.plain
    state = null;

    /**
     * `state` is a custom binary block, not a value the type system can name.
     * See {@link Tw2PythonStateBlock}.
     */
    static blackReaders = {
        state: Tw2PythonStateBlock
    };

    _controller = null;

    _instance = null;

    _isPlaying = false;

    Initialize()
    {
        // Carbon instantiates a Python class here. ccpwgl only preserves black state.
        this._instance = null;
        return true;
    }

    OnModified()
    {
        this._instance = null;
        return true;
    }

    Link(controller)
    {
        this._controller = controller || null;
        return true;
    }

    Unlink()
    {
        this._controller = null;
        this._isPlaying = false;
        return true;
    }

    Start(controller)
    {
        this._controller = controller || this._controller;
        this._isPlaying = true;
        return false;
    }

    Stop(controller)
    {
        controller = controller || this._controller;
        if (controller && controller.UnRegisterUpdateable)
        {
            controller.UnRegisterUpdateable(this);
        }

        this._isPlaying = false;
        return false;
    }

    Update()
    {
        return false;
    }

    GetInstance()
    {
        return this._instance;
    }

    GetState()
    {
        return CopyStateBytes(this.state);
    }

    SetState(value)
    {
        this.state = CopyStateBytes(value);
        return true;
    }

    AllocateReadBuffer(memberName, bufferSize)
    {
        return new Uint8Array(bufferSize || 0);
    }

    SetBufferAndSize(memberName, buffer, bufferSize)
    {
        if (memberName && memberName !== "state")
        {
            return false;
        }

        const bytes = CopyStateBytes(buffer);
        this.state = bufferSize === undefined ? bytes : bytes.slice(0, bufferSize);
        return true;
    }

    GetWriteBufferAndSize(memberName)
    {
        if (memberName && memberName !== "state")
        {
            return { buffer: null, bufferSize: 0 };
        }

        const buffer = this.GetState();
        return { buffer, bufferSize: buffer ? buffer.length || 0 : 0 };
    }

    ReleaseWriteBuffer()
    {
        return true;
    }

    IsPlaying()
    {
        return this._isPlaying;
    }
}
