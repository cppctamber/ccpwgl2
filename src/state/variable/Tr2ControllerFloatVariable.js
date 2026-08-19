import { meta } from "utils";


@meta.type("Tr2ControllerFloatVariable")
@meta.ccp.define("Tr2ControllerFloatVariable")
export class Tr2ControllerFloatVariable extends meta.Model
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
    _dirtyOwner = null;

    Initialize()
    {
        this.value = this.defaultValue;
        return true;
    }

    OnModified()
    {
        this.ApplyDestination(this.value);
        this.MarkDirty();
        return true;
    }

    /**
     * Records which controller to notify when this variable changes.
     *
     * Carbon hands each variable a slot in the controller's packed 64-bit dirty
     * mask (`Tr2Controller::Link`, and runtime-trinity mirrors it with
     * `SetDirtyMask(this.#dirtyVariables, 1n << BigInt(i))`). ccpwgl tracks
     * dirtiness by NAME rather than by bit index, so the variable only needs to
     * know its controller - no packed buffer, and no 64-variable ceiling.
     *
     * @param {Tr2Controller|null} controller
     */
    SetDirtyOwner(controller)
    {
        this._dirtyOwner = controller || null;
    }

    /**
     * Marks this variable dirty on its controller. Writing through `SetValue`
     * used to leave the controller none the wiser, so only writes that went via
     * `Tr2Controller.SetVariableValue` were ever seen as changes.
     */
    MarkDirty()
    {
        if (this._dirtyOwner && this._dirtyOwner.MarkVariableDirty)
        {
            this._dirtyOwner.MarkVariableDirty(this.name);
        }
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
        this.MarkDirty();
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
