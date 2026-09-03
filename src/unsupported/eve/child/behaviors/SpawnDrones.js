// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/SpawnDrones.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/SpawnDrones.cpp
import { meta } from "utils";
import { vec3, vec4 } from "math";


/** Hydration shape for Carbon's timed and grid-based drone spawner. */
@meta.notImplemented
@meta.define("SpawnDrones", true)
export class SpawnDrones extends meta.Model
{

    @meta.boolean
    enabled = true;

    @meta.boolean
    addByCount = false;

    @meta.vector3
    spawnPosition = vec3.create();

    @meta.float
    seconds = -1;

    @meta.int32
    count = 1;

    @meta.float
    time = 0;

    @meta.boolean
    addOnGrid = false;

    @meta.boolean
    regenerateDrones = true;

    @meta.vector4
    gridInfo = vec4.fromValues(1, 1, 1, 10);

    @meta.vector3
    gridSpacing = vec3.create();

    @meta.float
    gridFullnessFactor = 1;
}
