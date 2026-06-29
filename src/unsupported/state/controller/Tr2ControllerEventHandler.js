import { meta } from "utils";


@meta.type("Tr2ControllerEventHandler")
@meta.ccp.define("Tr2ControllerEventHandler")
export class Tr2ControllerEventHandler extends meta.Model
{
    @meta.string
    name = "";

    @meta.list("Tw2Action")
    actions = [];

    _controller = null;

    Link(controller)
    {
        this.Unlink();
        this._controller = controller || null;

        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Link)
            {
                action.Link(controller);
            }
        }
    }

    Unlink()
    {
        if (this._controller)
        {
            for (let i = 0; i < this.actions.length; i++)
            {
                const action = this.actions[i];
                if (action && action.Unlink)
                {
                    action.Unlink();
                }
            }
        }

        this._controller = null;
    }

    OnListModified(event, key, key2, value, list)
    {
        if (list && list !== this.actions)
        {
            return;
        }

        const action = value;
        if (!action)
        {
            return;
        }

        const eventName = String(event || "").toLowerCase();
        if (eventName.includes("remove"))
        {
            if (action.Unlink) action.Unlink();
        }
        else if (this._controller && action.Link)
        {
            action.Link(this._controller);
        }
    }

    GetName()
    {
        return this.name;
    }

    Execute(controller = this._controller)
    {
        if (!controller)
        {
            return false;
        }

        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Start && !action.isDisabled)
            {
                action.Start(controller);
            }
        }

        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Stop && !action.isDisabled)
            {
                action.Stop(controller);
            }
        }

        return true;
    }
}
