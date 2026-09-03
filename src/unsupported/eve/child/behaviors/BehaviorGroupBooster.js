// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/BehaviorGroupBooster.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/BehaviorGroupBooster.cpp
import { meta } from "utils";
import { vec3, vec4 } from "math";


/** Hydration shape for the effects, flares, and light attached to a behavior group. */
@meta.notImplemented
@meta.define("BehaviorGroupBooster", true)
export class BehaviorGroupBooster extends meta.Model
{

    @meta.boolean
    display = true;

    @meta.uint
    flareCount = 0;

    @meta.vector3
    boosterOffset = vec3.create();

    @meta.uint
    atlasIndex0 = 0;

    @meta.uint
    atlasIndex1 = 0;

    @meta.struct("Tw2Effect")
    boosterEffect = null;

    @meta.struct("Tw2Effect")
    haloFlareEffect = null;

    @meta.vector3
    haloFlareOffset = vec3.create();

    @meta.vector3
    haloFlareScale = vec3.fromValues(1, 1, 1);

    @meta.float
    haloFlareBrightness = 0;

    @meta.color
    haloFlareColor = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    haloFlareNoiseSpeed = 1;

    @meta.float
    haloFlareNoiseAmplitude = 0.2;

    @meta.uint
    haloFlareNoiseOctaves = 1;

    @meta.struct("Tw2Effect")
    ambientFlareEffect = null;

    @meta.vector3
    ambientFlareOffset = vec3.create();

    @meta.vector3
    ambientFlareScale = vec3.fromValues(1, 1, 1);

    @meta.float
    ambientFlareBrightness = 0;

    @meta.color
    ambientFlareColor = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    ambientFlareNoiseSpeed = 1;

    @meta.float
    ambientFlareNoiseAmplitude = 0.2;

    @meta.uint
    ambientFlareNoiseOctaves = 1;

    @meta.float
    lightRadius = 3.5;

    @meta.color
    lightColor = vec4.fromValues(1, 1, 1, 1);

    @meta.boolean
    displayBoosters = true;

    @meta.boolean
    displayHazeFlare = true;

    @meta.boolean
    displayAmbientFlare = true;
}
