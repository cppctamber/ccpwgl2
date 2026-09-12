// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/ProcessLifetime.h
import { meta } from "utils";


/**
  * Per-agent scratch record for the ProcessLifetime behavior: which tunnel the
  * agent is assigned, how far along that tunnel it is, and whether it has spawned
  * or already used its entry and exit tunnels.
  */
@meta.define("ProcessLifetimeData", true)
export class ProcessLifetimeData extends meta.Model
{
    @meta.boolean
    hasUsedEntryTunnel = false;

    @meta.boolean
    hasUsedExitTunnel = false;

    @meta.int32
    assignedLifeTimeTunnel = 0;

    @meta.int32
    tunnelPoint = 0;

    @meta.boolean
    hasSpawned = false;
}
