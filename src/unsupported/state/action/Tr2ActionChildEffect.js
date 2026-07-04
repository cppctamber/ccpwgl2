import { meta } from "utils";
import { resMan } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionChildEffect")
@meta.ccp.define("Tr2ActionChildEffect")
export class Tr2ActionChildEffect extends Tw2Action
{

    @meta.string
    childName = "";

    @meta.path
    path = "";

    @meta.string
    targetAnotherOwner = "";

    @meta.boolean
    addOnStart = true;

    @meta.boolean
    removeOnStop = true;

    _child = null;

    _isStarted = false;

    /**
     * Starts the action, adding the child effect to the owner if required
     * @param {Tr2Controller} controller
     * @param {*} [owner]
     * @returns {Boolean} true if the child effect exists or has been requested
     */
    Start(controller, owner)
    {
        owner = this.GetTargetOwner(controller, owner);
        if (!owner)
        {
            return false;
        }

        this._isStarted = true;
        this._child = this.FindChild(owner);
        if (this._child || !this.addOnStart || !this.path)
        {
            return !!this._child;
        }

        resMan.GetObject(this.path, child =>
        {
            // The action may have been stopped, or restarted and resolved,
            // while the object was loading
            if (!this._isStarted || this._child || !child)
            {
                return;
            }

            if (this.childName)
            {
                child.name = this.childName;
            }

            if (Tr2ActionChildEffect.AddChild(owner, child))
            {
                this._child = child;
                if (child.StartControllers) child.StartControllers();
            }
        });

        return true;
    }

    /**
     * Stops the action, removing the child effect from the owner if required
     * @param {Tr2Controller} controller
     * @param {*} [owner]
     * @returns {Boolean} true if a child effect was removed
     */
    Stop(controller, owner)
    {
        this._isStarted = false;

        const child = this._child;
        this._child = null;

        if (!child || !this.removeOnStop)
        {
            return false;
        }

        owner = this.GetTargetOwner(controller, owner);
        return owner ? Tr2ActionChildEffect.RemoveChild(owner, child) : false;
    }

    /**
     * Resolves the owner the child effect should be added to/removed from.
     * When `targetAnotherOwner` is set, the target is a named effect child of
     * the controller's owner (an EveChildContainer for example)
     * @param {Tr2Controller} controller
     * @param {*} [owner]
     * @returns {*} the resolved owner, or null if it couldn't be found
     */
    GetTargetOwner(controller, owner)
    {
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        if (!owner || !this.targetAnotherOwner)
        {
            return owner;
        }

        return Tr2ActionChildEffect.FindChildByName(owner, this.targetAnotherOwner);
    }

    /**
     * Finds this action's child effect on an owner by its child name
     * @param {*} owner
     * @returns {EveChild|null}
     */
    FindChild(owner)
    {
        return this.childName ? Tr2ActionChildEffect.FindChildByName(owner, this.childName) : null;
    }

    /**
     * Gets an owner's effect children list
     * - Space objects (EveShip2, EveEffectRoot etc) store them in `effectChildren`
     * - Child containers (EveChildContainer etc) store them in `objects`
     * @param {*} owner
     * @returns {Array|null}
     */
    static GetEffectChildren(owner)
    {
        if (!owner) return null;
        if (Array.isArray(owner.effectChildren)) return owner.effectChildren;
        if (Array.isArray(owner.objects)) return owner.objects;
        return null;
    }

    /**
     * Finds an effect child on an owner by name, recursing into child containers
     * @param {*} owner
     * @param {String} name
     * @returns {EveChild|null}
     */
    static FindChildByName(owner, name)
    {
        const children = Tr2ActionChildEffect.GetEffectChildren(owner);
        if (!children || !name)
        {
            return null;
        }

        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (!child) continue;

            if (child.name === name)
            {
                return child;
            }

            if (Array.isArray(child.objects))
            {
                const found = Tr2ActionChildEffect.FindChildByName(child, name);
                if (found) return found;
            }
        }

        return null;
    }

    /**
     * Adds an effect child to an owner
     * @param {*} owner
     * @param {EveChild} child
     * @returns {Boolean} true if the child was added
     */
    static AddChild(owner, child)
    {
        const children = Tr2ActionChildEffect.GetEffectChildren(owner);
        if (!children || children.includes(child))
        {
            return false;
        }

        children.push(child);
        if ("_boundsDirty" in owner) owner._boundsDirty = true;
        return true;
    }

    /**
     * Removes an effect child from an owner
     * @param {*} owner
     * @param {EveChild} child
     * @returns {Boolean} true if the child was removed
     */
    static RemoveChild(owner, child)
    {
        const children = Tr2ActionChildEffect.GetEffectChildren(owner);
        const index = children ? children.indexOf(child) : -1;
        if (index === -1)
        {
            return false;
        }

        children.splice(index, 1);
        if ("_boundsDirty" in owner) owner._boundsDirty = true;
        return true;
    }

}
