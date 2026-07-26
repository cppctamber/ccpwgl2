import { meta } from "utils";
import { resMan } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionOverlay")
@meta.ccp.define("Tr2ActionOverlay")
export class Tr2ActionOverlay extends Tw2Action
{

    @meta.path
    path = "";

    @meta.string
    overlayName = "";

    @meta.string
    targetAnotherOwner = "";

    @meta.boolean
    addOnStart = true;

    @meta.boolean
    removeOnStop = true;

    _overlay = null;

    _isStarted = false;

    Start(controller, owner)
    {
        owner = this.GetTargetOwner(controller, owner);
        if (!owner)
        {
            return false;
        }

        this._isStarted = true;
        this._overlay = this.FindOverlay(owner);
        if (this._overlay || !this.addOnStart || !this.path)
        {
            return !!this._overlay;
        }

        resMan.GetObject(this.GetOverlayPath(owner), overlay =>
        {
            if (!this._isStarted)
            {
                return;
            }

            if (!overlay) return;

            this._overlay = overlay;
            if (this.overlayName)
            {
                overlay.name = this.overlayName;
            }

            this.AddOverlay(owner, overlay);
            if (overlay.StartControllers) overlay.StartControllers();
        });

        return true;
    }

    Stop(controller, owner)
    {
        this._isStarted = false;
        if (!this._overlay || !this.removeOnStop)
        {
            this._overlay = null;
            return false;
        }

        owner = this.GetTargetOwner(controller, owner);
        if (owner)
        {
            this.RemoveOverlay(owner, this._overlay);
        }

        this._overlay = null;
        return !!owner;
    }

    GetTargetOwner(controller, owner)
    {
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        if (!owner || !this.targetAnotherOwner)
        {
            return owner;
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

    GetOverlayPath(owner)
    {
        let path = this.path;
        const isAnimated = owner && owner.IsAnimated ? owner.IsAnimated() : owner && owner.isAnimated;

        if (isAnimated && path && !path.includes("_skinned"))
        {
            path = path.replace(/\.red$/i, "_skinned.red");
        }
        else if (!isAnimated && path)
        {
            path = path.replace("_skinned", "");
        }

        return path;
    }

    FindOverlay(owner)
    {
        if (!this.overlayName || !owner)
        {
            return null;
        }

        if (owner.GetOverlayEffectByName)
        {
            return owner.GetOverlayEffectByName(this.overlayName);
        }

        const overlayEffects = owner.overlayEffects || owner.overlays;
        if (!overlayEffects)
        {
            return null;
        }

        for (let i = 0; i < overlayEffects.length; i++)
        {
            if (overlayEffects[i] && overlayEffects[i].name === this.overlayName)
            {
                return overlayEffects[i];
            }
        }

        return null;
    }

    AddOverlay(owner, overlay)
    {
        if (owner.AddOverlayEffect)
        {
            owner.AddOverlayEffect(overlay);
            return true;
        }

        if (owner.overlayEffects && !owner.overlayEffects.includes(overlay))
        {
            owner.overlayEffects.push(overlay);
            return true;
        }

        return false;
    }

    RemoveOverlay(owner, overlay)
    {
        if (owner.RemoveOverlayEffect)
        {
            owner.RemoveOverlayEffect(overlay);
            return true;
        }

        if (owner.overlayEffects)
        {
            const index = owner.overlayEffects.indexOf(overlay);
            if (index !== -1)
            {
                owner.overlayEffects.splice(index, 1);
                return true;
            }
        }

        return false;
    }

}
