// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawners/EveDistributionSpawnerControllerTrigger.h
import { meta } from "utils";


@meta.type("EveDistributionSpawnerControllerTrigger")
@meta.ccp.define("EveDistributionSpawnerControllerTrigger")
export class EveDistributionSpawnerControllerTrigger extends meta.Model
{

    /** m_variableName (std::string) [READWRITE, PERSIST] */
    @meta.string
    variableName = "";

    /** m_value (float) [READWRITE, PERSIST] */
    @meta.float
    value = 0;

    /** m_invertReceivedValue (bool) [READWRITE, PERSIST] */
    @meta.boolean
    invertTrigger = false;

    /** m_isActive (bool) [READ] */
    @meta.boolean
    isActive = false;

    /** m_distributionSpawners (PIEveDistributionSpawnerVector) [READ, PERSIST] */
    @meta.list("IEveDistributionSpawner")
    spawners = [];

    /** m_restartOnReceivingValue (bool) [READWRITE, PERSIST] */
    @meta.boolean
    restartOnReceivingValue = false;

    /**
     * Restarts the wrapped spawners; the placement pool is not used by this
     * trigger.
     */
    Reset(_placements)
    {
        this.Restart();
    }

    /** Restarts every wrapped spawner, leaving the active state untouched. */
    Restart()
    {
        for (const spawner of this.spawners)
        {
            spawner.Restart();
        }
    }

    /**
     * Re-evaluates the active state when the `value` property is written directly
     * rather than through a controller.
     */
    OnModified(name)
    {
        if (name === "value")
        {
            this._applyValue();
        }
        return true;
    }

    /** Ticks the wrapped spawners only while the trigger is active. */
    UpdateSyncronous(updateContext, params, owner)
    {
        if (!this.isActive)
        {
            return;
        }

        for (const spawner of this.spawners)
        {
            spawner.UpdateSyncronous(updateContext, params, owner);
        }
    }

    /**
     * Adopts the value when the name matches this trigger's variable and
     * re-evaluates the active state; other names are ignored.
     */
    SetControllerVariable(name, value)
    {
        if (this.variableName !== name)
        {
            return;
        }

        this.value = value;
        this._applyValue();
    }

    /**
     * Recomputes the active flag from the current value, inverted when
     * invertTrigger is set, after optionally restarting the wrapped spawners.
     */
    _applyValue()
    {
        if (this.restartOnReceivingValue)
        {
            this.Restart();
        }
        this.isActive = this.invertTrigger ? 1 - this.value > 0 : this.value > 0;
    }

}
