import { meta } from "utils";
import { Tr2BindingPoint } from "../controller";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionSetValue")
@meta.ccp.define("Tr2ActionSetValue")
export class Tr2ActionSetValue extends Tw2Action
{

    @meta.string
    attribute = "";

    @meta.boolean
    delayBinding = false;

    @meta.notOwned
    @meta.struct()
    destination = null;

    @meta.string
    path = "";

    @meta.string
    value = "";

    _bindingPoint = null;

    GetBindingPoint()
    {
        if (!this._bindingPoint)
        {
            this._bindingPoint = new Tr2BindingPoint();
        }

        this._bindingPoint.path = this.path;
        this._bindingPoint.object = this.destination;
        this._bindingPoint.attribute = this.attribute;
        return this._bindingPoint;
    }

    LinkDestination(controllerOrRoots, owner)
    {
        return this.GetBindingPoint().Link(controllerOrRoots, owner);
    }

    Unlink()
    {
        if (this._bindingPoint)
        {
            this._bindingPoint.Unlink();
        }
    }

    IsBindingValid()
    {
        return !!(this._bindingPoint && this._bindingPoint.IsValid());
    }

    GetDestination(controllerOrRoots, owner)
    {
        return this.GetBindingPoint().GetBoundObject(controllerOrRoots, owner);
    }
}
