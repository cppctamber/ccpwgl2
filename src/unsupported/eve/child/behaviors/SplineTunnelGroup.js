// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/SplineTunnelGroup.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/SplineTunnelGroup.cpp
import { meta } from "utils";


/** Hydration shape for an authored group of drone spline tunnels. */
@meta.notImplemented
@meta.define("SplineTunnelGroup", true)
export class SplineTunnelGroup extends meta.Model
{

    @meta.list("Tw2CurveVector3")
    curveSets = [];

    @meta.int32
    tunnelGroupType = 2;

    @meta.int32
    breakPoints = 2;

    @meta.float
    tunnelWidth = 15;

    @meta.float
    entrancePullSize = 50;

    @meta.float
    entrySize = 20;
}
