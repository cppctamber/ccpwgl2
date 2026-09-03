// Carbon source: trinity/Eve/SpaceObject/Children/ProceduralContainer/EveChildProceduralContainer.cpp
import { meta } from "utils";
import { EveChildContainer } from "../../../eve/child/EveChildContainer";


@meta.define("EveChildProceduralContainer", true)
export class EveChildProceduralContainer extends EveChildContainer
{

    @meta.struct()
    selectionMethod = null;

    /** The currently selected EveChildRef. Runtime-only Carbon state. */
    selectedObject = null;

    /** Values that must be replayed when the selection changes. */
    _proceduralContainerVariables = new Map();

    /**
     * Selects and attaches the current child reference.
     * Carbon EveChildProceduralContainer::ConfigureSelectedObject.
     */
    ConfigureSelectedObject()
    {
        const child = this.selectionMethod.GetSelectedChild();

        this.objects.length = 0;
        this.selectedObject = child;

        if (!child) return;

        for (const [ name, value ] of this._proceduralContainerVariables)
        {
            child.SetProceduralContainerVariable(name, value);
        }

        this.objects.push(child);
        this.controllerVariables.forEach((value, name) => child.SetControllerVariable(name, value));
    }

    /**
     * Stores a procedural variable and forwards it to the selector and current
     * child. Carbon EveChildProceduralContainer::SetProceduralContainerVariable.
     * @param {String} name
     * @param {Number} value
     */
    SetProceduralContainerVariable(name, value)
    {
        this._proceduralContainerVariables.set(name, value);
        this.selectionMethod.SetProceduralMethodVariable(name, value);
        if (this.selectedObject) this.selectedObject.SetProceduralContainerVariable(name, value);
    }

    /** @returns {String} the selector's variable name */
    GetMethodVariableName()
    {
        return this.selectionMethod ? this.selectionMethod.GetProceduralMethodVariable() : "methodUnassigned";
    }

    /**
     * ccpwgl combines Carbon's asynchronous and synchronous child phases in
     * one Update. Tick the selector first so its initial choice can load and
     * render through the inherited EveChildContainer traversal this frame.
     */
    Update(dt, parentTransform, perObjectData, parentSpaceObject)
    {
        if (this.selectionMethod)
        {
            this.selectionMethod.Update(dt);

            if (this.selectionMethod.IsSelectedChildModified())
            {
                this.ConfigureSelectedObject();
            }
        }

        super.Update(dt, parentTransform, perObjectData, parentSpaceObject);
    }

}
