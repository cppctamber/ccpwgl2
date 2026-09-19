import { meta } from "utils";


@meta.define("EveMultiEffectParameter", true)
export class EveMultiEffectParameter extends meta.Model
{

    @meta.string
    name = "";

    @meta.notOwned
    @meta.struct()
    object = null;

    @meta.uint
    type = 0;

    _owner = null;

    SetOwner(owner)
    {
        this._owner = owner || null;
    }

    SetParameterObject(object)
    {
        this.object = object || null;
        if (this._owner && this._owner.Rebind) this._owner.Rebind();
    }

    GetParameterObject()
    {
        return this.object;
    }

    GetName()
    {
        return this.name;
    }

    IsValid()
    {
        return !!this.object;
    }

}
