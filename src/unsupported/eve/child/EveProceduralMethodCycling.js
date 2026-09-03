// Carbon sources: trinity/Eve/SpaceObject/Children/ProceduralContainer/SelectionMethods/
// EveProceduralMethodCycling.cpp and EveProceduralMethodCyclingParameter.cpp
import { meta } from "utils";
import { EveChildRef } from "../../../eve/child/EveChildRef";


@meta.define("EveProceduralMethodCycling", true)
export class EveProceduralMethodCycling extends meta.Model
{

    @meta.float
    startTimeOffset = 0;

    @meta.boolean
    randomizeOrder = false;

    @meta.list("EveProceduralMethodCyclingParameter")
    parameters = [];

    @meta.list()
    debugVolumes = [];

    @meta.int32
    selectedChild = -1;

    _selectedChildModified = false;
    _elapsedTime = 0;

    /** Selects the next parameter. Carbon EveProceduralMethodCycling::SelectParameter. */
    SelectParameter()
    {
        const count = this.parameters.length;
        if (!count) return false;

        if (this.randomizeOrder && count > 2)
        {
            const previous = this.selectedChild;
            this.selectedChild = Math.floor(Math.random() * (count - 1));
            if (this.selectedChild >= previous) this.selectedChild++;
        }
        else
        {
            this.selectedChild = (this.selectedChild + 1) % count;
        }

        this._elapsedTime = this.startTimeOffset;
        this._selectedChildModified = true;
        return true;
    }

    /** Blue-exposed Carbon alias. */
    restart()
    {
        return this.SelectParameter();
    }

    IsSelectedChildModified()
    {
        return this._selectedChildModified;
    }

    GetSelectedChild()
    {
        if (this.selectedChild < 0 || this.selectedChild >= this.parameters.length)
        {
            return null;
        }

        this._selectedChildModified = false;
        const parameter = this.parameters[this.selectedChild];
        const child = parameter.GetChild();

        if (!child || !child.resPath) return null;

        parameter.Load();
        return child;
    }

    /** Advances Carbon's frame-time duration using ccpwgl's delta time. */
    Update(dt)
    {
        if (this.selectedChild < 0 || this.selectedChild >= this.parameters.length)
        {
            this.SelectParameter();
            return;
        }

        this._elapsedTime += dt;
        if (this._elapsedTime >= this.parameters[this.selectedChild].GetDuration())
        {
            this.SelectParameter();
        }
    }

    GetDebugVolumes()
    {
        return this.debugVolumes;
    }

    SetProceduralMethodVariable(name, value)
    {

    }

    GetProceduralMethodVariable()
    {
        return "not Implemented";
    }

}


@meta.define("EveProceduralMethodCyclingParameter", true)
export class EveProceduralMethodCyclingParameter extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct()
    child = null;

    @meta.float
    playDuration = 1;

    @meta.boolean
    restartRequired = true;

    @meta.boolean
    reloadRequired = false;

    _modified = false;
    _hasLoaded = false;

    Initialize()
    {
        if (!this.child) this.child = new EveChildRef();
        this.child.SetAutoLoadBlocker(true);
        return true;
    }

    OnModified(value)
    {
        if ((value === "child" || value === this.child) && this.child)
        {
            this.child.SetAutoLoadBlocker(true);
        }
        return true;
    }

    SetModified(isModified)
    {
        this._modified = isModified;
    }

    IsModified()
    {
        return this._modified;
    }

    GetName()
    {
        return this.name;
    }

    GetChild()
    {
        return this.child;
    }

    GetDuration()
    {
        return this.playDuration;
    }

    /**
     * Forces the selected ref to load despite loadChildAutomatically=false;
     * later visits optionally restart its controllers and curve sets.
     */
    Load()
    {
        if (this._hasLoaded && !this.reloadRequired)
        {
            if (this.restartRequired)
            {
                this.child.StartControllers();
                this.child.PlayAllCurveSets();
            }
            return;
        }

        if (this.child)
        {
            this.child.Reload(true);
            this._hasLoaded = true;
        }
    }

}
