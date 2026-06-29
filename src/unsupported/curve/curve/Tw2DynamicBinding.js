import { meta } from "utils";


// Pretty sure this just traverses the path, and then returns a normal binding.

@meta.type("Tr2DynamicBinding", "Tr2DynamicBinding")
@meta.ccp.define("Tr2DynamicBinding")
export class Tr2DynamicBinding extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    destinationObjectPath = "";

    @meta.string
    destinationObjectAttribute = "";

    @meta.notOwned
    @meta.struct()
    destination = null;

    @meta.string
    sourceObjectPath = "";

    @meta.string
    sourceObjectAttribute = "";

    @meta.notOwned
    @meta.struct()
    source = null;

    @meta.float
    scale = 1;

    @meta.int32
    bindingDelay = 0;

    @meta.notOwned
    @meta.struct()
    binding = null;

    _bindingTime = 0;
    _owner = null;

    destinationAttribute = "";
    destinationPath = null;
    sourceAttribute = "";
    sourceObject = null;

    /**
     * Initializes the binding
     * @param {*} owner
     */
    Initialize(owner)
    {
        if (owner) this.SetOwner(owner);
        return true;
    }

    OnModified()
    {
        if (this._owner)
        {
            this.Link();
        }
        else
        {
            this.Unlink();
        }
        return true;
    }

    OnSimClockRebase(oldTime, newTime)
    {
        this._bindingTime += newTime - oldTime;
    }

    IsSourceValid()
    {
        return !!this.source;
    }

    IsDestinationValid()
    {
        return !!this.destination;
    }

    Update()
    {
        if (this.binding && typeof this.binding.CopyValue === "function")
        {
            this.binding.CopyValue();
        }
    }

    Link()
    {
        this.source = this.source || this.sourceObject || null;
        this.destination = this.destination || null;
    }

    Unlink()
    {
        this.binding = null;
        this.source = null;
        this.destination = null;
        this._bindingTime = 0;
    }

    SetOwner(owner)
    {
        this._owner = owner || null;
    }

}
