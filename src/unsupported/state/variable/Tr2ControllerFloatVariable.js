import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2ControllerFloatVariable")
@meta.ccp.define("Tr2ControllerFloatVariable")
export class Tr2ControllerFloatVariable
{

    @meta.string
    name = "";

    @meta.float
    defaultValue = 0;

    @meta.string
    enumValues = "";

    @meta.uint
    variableType = 0;

    @meta.float
    value = 0;

    _destination = null;
    _dirtyMaskDestination = null;
    _dirtyMask = 0;

    Initialize()
    {
        this.value = this.defaultValue;
        return true;
    }

    OnModified()
    {
        this.ApplyDestination(this.value);
        return true;
    }

    GetName()
    {
        return this.name;
    }

    GetValue()
    {
        return this.value;
    }

    SetValue(value)
    {
        this.value = value;
        this.ApplyDestination(value);
    }

    SetDestinationBuffer(buffer)
    {
        this._destination = buffer;
        this.ApplyDestination(this.value);
    }

    SetDirtyMask(maskDestination, mask)
    {
        this._dirtyMaskDestination = maskDestination;
        this._dirtyMask = mask;
    }

    ApplyDestination(value)
    {
        if (this._destination)
        {
            if (typeof this._destination === "function")
            {
                this._destination(value);
            }
            else if ("value" in this._destination)
            {
                this._destination.value = value;
            }
            else
            {
                this._destination[0] = value;
            }
        }

        if (this._dirtyMaskDestination)
        {
            if ("value" in this._dirtyMaskDestination)
            {
                this._dirtyMaskDestination.value |= this._dirtyMask;
            }
            else
            {
                this._dirtyMaskDestination[0] |= this._dirtyMask;
            }
        }
    }

    GetEnumsAsString()
    {
        return this.enumValues;
    }

}
