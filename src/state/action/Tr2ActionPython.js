import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


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
@meta.type("Tr2ActionPython")
@meta.ccp.define("Tr2ActionPython")
export class Tr2ActionPython extends Tw2Action
{

    @meta.string
    module = "";

    @meta.string
    className = "";

    @meta.plain
    state = null;

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
