import { meta } from "utils";
import { Tr2ExpressionProgram } from "../expression/Tr2ExpressionProgram";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionSetExternalControllerVariable")
@meta.ccp.define("Tr2ActionSetExternalControllerVariable")
export class Tr2ActionSetExternalControllerVariable extends Tw2Action
{

    @meta.string
    destinationOwner = "";

    @meta.notOwned
    @meta.struct()
    destination = null;

    @meta.string
    sourceVariable = "";

    @meta.string
    variable = "";

    @meta.float
    value = 0;

    @meta.boolean
    startControllers = false;

    _controller = null;

    _program = null;

    _programSource = null;

    /**
     * Links the action to its state machine's controller and resolves the
     * destination owner
     * @param {Tr2Controller} controller
     * @param {*} [owner]
     */
    Link(controller, owner)
    {
        this._controller = controller || null;
        this.LinkToDestinationOwner(controller, owner);
    }

    /**
     * Unlinks the action
     */
    Unlink()
    {
        this._controller = null;
        this.destination = null;
    }

    /**
     * Starts the action, writing the resolved value to the destination
     * owner's controllers
     * @param {Tr2Controller} controller
     * @param {*} [owner]
     * @returns {Boolean} true if the variable was written
     */
    Start(controller, owner)
    {
        controller = controller || this._controller;
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);

        if (!this.IsDestinationValid())
        {
            this.LinkToDestinationOwner(controller, owner);
        }

        if (!this.IsDestinationValid())
        {
            return false;
        }

        if (this.startControllers)
        {
            Tr2ActionSetExternalControllerVariable.StartControllers(this.destination);
        }

        const value = this.GetValue(controller, owner);
        return Tr2ActionSetExternalControllerVariable.SetControllerVariable(this.destination, this.variable, value);
    }

    /**
     * Resolves the value to write
     * - When `sourceVariable` names a variable on the action's own controller,
     *   its current value is used
     * - When `sourceVariable` is an expression, it is evaluated against the
     *   controller's expression context
     * - Otherwise the serialized float `value` is used
     * @param {Tr2Controller} controller
     * @param {*} [owner]
     * @returns {Number}
     */
    GetValue(controller, owner)
    {
        if (!this.sourceVariable)
        {
            return this.value;
        }

        if (controller)
        {
            const variable = controller.GetVariableByName ? controller.GetVariableByName(this.sourceVariable) : null;
            if (variable)
            {
                return controller.GetFloatVariableByName ?
                    controller.GetFloatVariableByName(this.sourceVariable) :
                    variable.value;
            }
        }

        if (!this._program || this._programSource !== this.sourceVariable)
        {
            this._program = Tr2ExpressionProgram.Compile(this.sourceVariable, { emptyValue: this.value });
            this._programSource = this.sourceVariable;
        }

        if (!this._program.IsValid())
        {
            return this.value;
        }

        const context = controller && controller.GetExpressionContext
            ? controller.GetExpressionContext(owner, null, { action: this })
            : { controller, owner, action: this };

        return this._program.Evaluate(context);
    }

    /**
     * Fires when a property has been modified
     * @param {String} propertyName
     * @returns {Boolean}
     */
    OnModified(propertyName)
    {
        if (propertyName === "destinationOwner")
        {
            this.LinkToDestinationOwner(this._controller);
        }
        return true;
    }

    /**
     * Checks if the destination owner has been resolved
     * @returns {Boolean}
     */
    IsDestinationValid()
    {
        return !!this.destination;
    }

    /**
     * Checks if the target variable name is set
     * @returns {Boolean}
     */
    IsVariableValid()
    {
        return !!this.variable;
    }

    /**
     * Resolves the destination owner from `destinationOwner` against the
     * controller owner's binding roots (case-insensitive). When the owner
     * doesn't provide binding roots, the default root map is used, which
     * exposes the owner's root object as "Owner"
     * @param {Tr2Controller} [controller=this._controller]
     * @param {*} [owner]
     * @returns {Boolean} true if the destination was resolved
     */
    LinkToDestinationOwner(controller = this._controller, owner)
    {
        this.destination = null;
        if (!controller)
        {
            return false;
        }

        owner = owner || (controller.GetOwner ? controller.GetOwner() : null);
        if (!owner)
        {
            return false;
        }

        const roots = Tr2ActionSetExternalControllerVariable.GetBindingRoots(owner, controller);
        const destinationOwner = String(this.destinationOwner || "").toLowerCase();

        for (const key of Object.keys(roots))
        {
            if (key.toLowerCase() === destinationOwner && roots[key])
            {
                this.destination = roots[key];
                return true;
            }
        }

        return false;
    }

    /**
     * Gets an owner's binding roots
     * - Owners may provide their own roots (named parameters, sub objects)
     * - The default map matches the engine's controller owner interface,
     *   which exposes the owner's root object under "Owner"
     * @param {*} owner
     * @param {Tr2Controller} [controller]
     * @returns {Object.<String,*>}
     */
    static GetBindingRoots(owner, controller)
    {
        const roots = {};
        roots.Owner = owner.GetRootObject ? owner.GetRootObject() : owner;

        if (owner.GetBindingRoots)
        {
            Object.assign(roots, owner.GetBindingRoots(controller));
        }

        return roots;
    }

    /**
     * Starts a destination owner's controllers
     * @param {*} destination
     * @returns {Boolean} true if any controller was started
     */
    static StartControllers(destination)
    {
        if (!destination)
        {
            return false;
        }

        if (destination.StartControllers)
        {
            destination.StartControllers();
            return true;
        }

        const controllers = Array.isArray(destination.controllers) ? destination.controllers : [];
        let started = false;
        for (let i = 0; i < controllers.length; i++)
        {
            if (controllers[i] && controllers[i].Start)
            {
                controllers[i].Start();
                started = true;
            }
        }
        return started;
    }

    /**
     * Sets a variable on all of a destination owner's controllers
     * @param {*} destination
     * @param {String} name
     * @param {Number} value
     * @returns {Boolean} true if any controller variable was set
     */
    static SetControllerVariable(destination, name, value)
    {
        if (!destination || !name)
        {
            return false;
        }

        if (destination.SetControllerVariable)
        {
            return destination.SetControllerVariable(name, value) !== false;
        }

        const controllers = Array.isArray(destination.controllers) ? destination.controllers : [];
        let changed = false;
        for (let i = 0; i < controllers.length; i++)
        {
            if (controllers[i] && controllers[i].SetVariable)
            {
                changed = !!controllers[i].SetVariable(name, value) || changed;
            }
        }
        return changed;
    }

}
