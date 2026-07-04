import { meta } from "utils";
import { tw2 } from "global";

/**
 * Controller reference
 * Loads another controller by path and forwards all lifecycle calls to it
 */
@meta.type("Tr2ControllerReference")
@meta.ccp.define("Tr2ControllerReference")
export class Tr2ControllerReference extends meta.Model
{

    @meta.path
    path = "";

    _controller = null;

    _owner = null;

    _isActive = false;

    _requestedPath = null;

    /**
     * Initializes the reference, optionally linking and starting against an owner
     * @param {*} [owner]
     */
    Initialize(owner)
    {
        if (owner !== undefined)
        {
            this.Link(owner);
            this.Start();
        }

        this.FetchController();
    }

    /**
     * Fires when the object is modified, reloading the controller if the path changed
     */
    OnModified()
    {
        if (this.path !== this._requestedPath)
        {
            this.FetchController();
        }
        return true;
    }

    /**
     * Fetches the referenced controller, then links (and starts) it if required
     * @returns {Promise<*>} the fetched controller, or null
     */
    async FetchController()
    {
        const path = this.path;
        this._requestedPath = path;
        this._controller = null;

        if (!path)
        {
            return null;
        }

        try
        {
            const controller = await tw2.Fetch(path);

            // A newer request superseded this one while awaiting
            if (this._requestedPath !== path)
            {
                return null;
            }

            this._controller = controller;

            if (controller && this._owner)
            {
                if (controller.Link) controller.Link(this._owner);
                if (this._isActive && controller.Start) controller.Start();
            }

            return controller;
        }
        catch (err)
        {
            tw2.Debug({
                name: "Tr2ControllerReference",
                message: `Failed to fetch controller: ${path}`
            });
            return null;
        }
    }

    /**
     * Links the reference (and any loaded controller) to an owner
     * @param {*} owner
     */
    Link(owner)
    {
        this._owner = owner || null;
        if (this._controller && this._controller.Link)
        {
            this._controller.Link(this._owner);
        }
    }

    /**
     * Unlinks the reference and any loaded controller
     */
    Unlink()
    {
        if (this._controller && this._controller.Unlink)
        {
            this._controller.Unlink();
        }
        this._owner = null;
    }

    /**
     * Checks if the reference is linked to an owner
     * @returns {Boolean}
     */
    IsLinked()
    {
        return !!this._owner;
    }

    /**
     * Starts the referenced controller
     */
    Start()
    {
        this._isActive = true;
        if (this._controller && this._controller.Start)
        {
            this._controller.Start();
        }
    }

    /**
     * Stops the referenced controller
     */
    Stop()
    {
        this._isActive = false;
        if (this._controller && this._controller.Stop)
        {
            this._controller.Stop();
        }
    }

    /**
     * Per frame update, forwarded to the referenced controller
     * @param {Number} [dt=0]
     */
    Update(dt = 0)
    {
        if (this._controller && this._controller.Update)
        {
            this._controller.Update(dt);
        }
    }

    /**
     * Handles an event by name on the referenced controller
     * @param {String} eventName
     * @returns {Boolean} true if the event was handled
     */
    HandleEvent(eventName)
    {
        if (this._controller && this._controller.HandleEvent)
        {
            return this._controller.HandleEvent(eventName);
        }
        return false;
    }

    /**
     * Sets a variable on the referenced controller
     * @param {String} name
     * @param {*} value
     * @returns {Boolean} true if the variable was set
     */
    SetVariable(name, value)
    {
        return this.SetVariableValue(name, value);
    }

    /**
     * Sets a variable's value on the referenced controller
     * @param {String} name
     * @param {*} value
     * @returns {Boolean} true if the variable was set
     */
    SetVariableValue(name, value)
    {
        if (this._controller)
        {
            if (this._controller.SetVariableValue) return this._controller.SetVariableValue(name, value);
            if (this._controller.SetVariable) return this._controller.SetVariable(name, value);
        }
        return false;
    }

    /**
     * Gets the reference's owner
     * @returns {*}
     */
    GetOwner()
    {
        return this._owner;
    }

    /**
     * Gets the referenced controller, if loaded
     * @returns {*}
     */
    GetController()
    {
        return this._controller;
    }

}
