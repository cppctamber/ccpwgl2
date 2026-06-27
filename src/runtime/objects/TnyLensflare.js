import { meta } from "utils";
import { EveLensflare } from "eve/effect";


@meta.tny.type("TnyLensflare")
@meta.tny.define("TnyLensflare")
export class TnyLensflare extends meta.Model
{

    @meta.struct()
    wrapped = null;

    @meta.plain
    custom = {};

    get isLensflare()
    {
        return true;
    }

    get display()
    {
        return this.wrapped && "display" in this.wrapped ? this.wrapped.display : true;
    }

    set display(value)
    {
        if (this.wrapped && "display" in this.wrapped)
        {
            this.wrapped.display = value;
        }
    }

    constructor(wrapped, values)
    {
        super();

        if (wrapped)
        {
            this.SetWrapped(wrapped);
        }

        if (values)
        {
            this.SetValues(values);
        }
    }

    SetWrapped(wrapped)
    {
        if (wrapped && !(wrapped instanceof EveLensflare))
        {
            throw new TypeError("Invalid wrapped lensflare");
        }

        this.wrapped = wrapped || null;
        return this;
    }

    GetBatches(mode, accumulator, perObjectData)
    {
        return this.wrapped && this.wrapped.GetBatches ? this.wrapped.GetBatches(mode, accumulator, perObjectData) : false;
    }

    GetResources(out = [])
    {
        const mesh = this.wrapped && this.wrapped.mesh;
        if (mesh && mesh.GetResources)
        {
            mesh.GetResources(out);
        }
        return out;
    }

    PrepareRender(sunDirection)
    {
        if (this.wrapped && this.wrapped.PrepareRender)
        {
            this.wrapped.PrepareRender(sunDirection);
        }
    }

    UpdateOccluders()
    {
        if (this.wrapped && this.wrapped.UpdateOccluders)
        {
            this.wrapped.UpdateOccluders();
        }
    }

    Update(dt)
    {
        this.EmitEvent("update", this, dt);
        return true;
    }

    static FromWrapped(wrapped, values)
    {
        return new this(wrapped, values);
    }

    static GetWrapped(item)
    {
        return item ? item.wrapped || null : null;
    }

    static HasWrapped(item)
    {
        return !!this.GetWrapped(item);
    }

    static ClearWrapped(item)
    {
        if (item && item.SetWrapped)
        {
            item.SetWrapped(null);
        }

        return item;
    }

}
