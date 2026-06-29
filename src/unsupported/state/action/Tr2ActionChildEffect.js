import { meta } from "utils";
import { resMan } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
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
            if (!this._isStarted)
            {
                return;
            }

            if (!child) return;

            this._child = child;
            if (this.childName)
            {
                if (child.SetName) child.SetName(this.childName);
                else child.name = this.childName;
            }

            this.AddChild(owner, child);
            if (child.StartControllers) child.StartControllers();
        });

        return true;
    }

    Stop(controller, owner)
    {
        this._isStarted = false;
        if (!this._child || !this.removeOnStop)
        {
            this._child = null;
            return false;
        }

        owner = this.GetTargetOwner(controller, owner);
        if (owner)
        {
            this.RemoveChild(owner, this._child);
        }

        this._child = null;
        return !!owner;
    }

    GetTargetOwner(controller, owner)
    {
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        if (!owner || !this.targetAnotherOwner)
        {
            return owner;
        }

        if (owner.GetEffectChildByName)
        {
            const child = owner.GetEffectChildByName(this.targetAnotherOwner);
            if (child) return child;
        }

        const effectChildren = owner.effectChildren || owner.children;
        if (effectChildren)
        {
            for (let i = 0; i < effectChildren.length; i++)
            {
                if (effectChildren[i] && effectChildren[i].name === this.targetAnotherOwner)
                {
                    return effectChildren[i];
                }
            }
        }

        if (owner.GetParameterByName)
        {
            const parameter = owner.GetParameterByName(this.targetAnotherOwner);
            if (parameter)
            {
                if (parameter.GetParameterObject) return parameter.GetParameterObject();
                if (parameter.object) return parameter.object;
                if (parameter.value) return parameter.value;
            }
        }

        if (this.targetAnotherOwner === "SourceSpaceObject")
        {
            if (owner.GetSourceSpaceObject) return owner.GetSourceSpaceObject();
            return owner.sourceSpaceObject || owner.sourceObject || owner.source || null;
        }

        if (this.targetAnotherOwner === "DestSpaceObject")
        {
            if (owner.GetDestSpaceObject) return owner.GetDestSpaceObject();
            return owner.destSpaceObject || owner.destinationObject || owner.destination || owner.dest || null;
        }

        return null;
    }

    FindChild(owner)
    {
        if (!this.childName || !owner)
        {
            return null;
        }

        if (owner.GetEffectChildByName)
        {
            return owner.GetEffectChildByName(this.childName);
        }

        const effectChildren = owner.effectChildren || owner.children;
        if (!effectChildren)
        {
            return null;
        }

        for (let i = 0; i < effectChildren.length; i++)
        {
            if (effectChildren[i] && effectChildren[i].name === this.childName)
            {
                return effectChildren[i];
            }
        }

        return null;
    }

    AddChild(owner, child)
    {
        if (owner.AddToEffectChildrenList)
        {
            owner.AddToEffectChildrenList(child);
            return true;
        }

        if (owner.effectChildren && !owner.effectChildren.includes(child))
        {
            owner.effectChildren.push(child);
            return true;
        }

        return false;
    }

    RemoveChild(owner, child)
    {
        if (owner.RemoveFromEffectChildrenList)
        {
            owner.RemoveFromEffectChildrenList(child);
            return true;
        }

        if (owner.effectChildren)
        {
            const index = owner.effectChildren.indexOf(child);
            if (index !== -1)
            {
                owner.effectChildren.splice(index, 1);
                return true;
            }
        }

        return false;
    }

}
