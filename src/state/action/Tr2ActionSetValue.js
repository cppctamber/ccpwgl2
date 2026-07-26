import { meta } from "utils";
import { Tr2BindingPoint } from "../controller";
import { Tr2ExpressionProgram } from "../expression/Tr2ExpressionProgram";
import { Tw2Action } from "./Tw2Action";


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

    _program = null;

    _programSource = null;

    Start(controller, owner)
    {
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        return this.GetBindingPoint().SetValue(this.GetValue(controller, owner), controller, owner);
    }

    GetValue(controller, owner)
    {
        if (!this._program || this._programSource !== this.value)
        {
            this._program = Tr2ExpressionProgram.Compile(this.value, { emptyValue: 0 });
            this._programSource = this.value;
        }

        if (!this._program.IsValid())
        {
            return 0;
        }

        const context = controller && controller.GetExpressionContext
            ? controller.GetExpressionContext(owner, null, { action: this })
            : { controller, owner, action: this };

        return this._program.Evaluate(context);
    }

    IsExpressionValid()
    {
        this.GetValue(null, null);
        return this._program ? this._program.IsValid() : false;
    }

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
