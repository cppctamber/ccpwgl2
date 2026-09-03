// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/ProcessLifetime.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/ProcessLifetime.cpp
import { meta } from "utils";


/** Hydration shape for Carbon's drone lifetime and tunnel behavior. */
@meta.notImplemented
@meta.define("ProcessLifetime", true)
export class ProcessLifetime extends meta.Model
{

    @meta.int32
    behaviorPriority = 0;

    @meta.boolean
    exit = false;

    @meta.float
    firstAgentLifetime = 0;

    @meta.float
    behaviorWeight = 900;

    @meta.float
    returningAge = -1;

    @meta.float
    wanderAmount = 0.3;

    @meta.boolean
    respawnAgentsOnDeath = true;

    @meta.list("SplineTunnelGroup")
    splineTunnels = [];

    @meta.boolean
    firstSpawnAtRandomPlaces = true;
}
