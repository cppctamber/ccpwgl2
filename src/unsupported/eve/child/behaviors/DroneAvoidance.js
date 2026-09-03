// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/DroneAvoidance.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/DroneAvoidance.cpp
import { meta } from "utils";


/** Hydration shape for Carbon's inter-agent avoidance behavior. */
@meta.notImplemented
@meta.define("DroneAvoidance", true)
export class DroneAvoidance extends meta.Model
{

    @meta.int32
    behaviorPriority = 0;

    @meta.boolean
    enabled = true;

    @meta.float
    behaviorWeight = 300;

    @meta.float
    visionRange = 5;

    @meta.int32
    framesBetweenUpdates = 3;
}
