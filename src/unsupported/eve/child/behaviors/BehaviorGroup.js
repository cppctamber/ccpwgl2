// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/BehaviorGroup.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/BehaviorGroup.cpp
import { meta } from "utils";
import { vec3 } from "math";
import { EveEntity } from "eve/EveEntity";


/**
 * Hydration shape for Carbon behavior groups.
 *
 * Agent simulation and instanced rendering remain unsupported in ccpwgl; this
 * class exists so authored Black graphs can retain the complete group data.
 */
@meta.notImplemented
@meta.define("BehaviorGroup", true)
export class BehaviorGroup extends EveEntity
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    update = true;

    @meta.int32
    count = 0;

    @meta.int32
    actualCount = 0;

    @meta.vector3
    spawnPosition = vec3.create();

    @meta.float
    maxVelocity = 100;

    @meta.list("IBehavior")
    behaviors = [];

    @meta.struct("Tw2Mesh")
    mesh = null;

    @meta.struct("BehaviorGroupBooster")
    boosters = null;

    @meta.float
    scale = 1;

    @meta.float
    currentScreenSize = 0;

    @meta.float
    renderThreshold = 1;

    @meta.float
    blendScreenSizeMin = 5;

    @meta.float
    blendScreenSizeMax = 15;

    @meta.float
    boundingSphereRadius = 5;

    @meta.boolean
    debugMode = false;

    @meta.float
    debugLodLevel = 0;

    @meta.float
    debugIntensity = 0;
}
