// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/DroneAgent.h
// Promoted to hand-maintained source 2026-07-23 (Carbon-verified property shell; schema eve/child/behaviors/DroneAgent.json.).
import { meta } from "utils";
import { mat4 } from "math";
import { quat } from "math";
import { vec3 } from "math";

/** DroneAgent (eve/child/behaviors) - generated from schema shapeHash c50899e8.... */

@meta.define("DroneAgent", true)
export class DroneAgent extends meta.Model
{

    /** closestAgentInGroup (DroneAgent*) */
    @meta.struct("DroneAgent")
    closestAgentInGroup = null;

    /** rotation (Quaternion) */
    @meta.quaternion
    rotation = quat.create();

    /** position (Vector3) */
    @meta.vector3
    position = vec3.create();

    /** acceleration (Vector3) */
    @meta.vector3
    acceleration = vec3.create();

    /** velocity (Vector3) */
    @meta.vector3
    velocity = vec3.create();

    /** accelerationLength (float) */
    @meta.float
    accelerationLength = 0;

    /** velocityLength (float) */
    @meta.float
    velocityLength = 0;

    /** target (Vector3) */
    @meta.vector3
    target = vec3.create();

    /** targetDirection (Vector3) */
    @meta.vector3
    targetDirection = vec3.create();

    /** id (int) */
    @meta.int32
    id = 0;

    /** lifetime (float) */
    @meta.float
    lifetime = 0;

    /** playFX (bool) */
    @meta.boolean
    playFX = false;

    /** fxStartTime (Be::Time) */
    @meta.float
    fxStartTime = -1;

    /** lastTransform (Matrix) */
    @meta.matrix4
    lastTransform = mat4.create();
    _renderPreviousTransform = mat4.create();

    /** xfade (float) */
    @meta.float
    xfade = 0;

    /** isVisible (bool) */
    @meta.boolean
    isVisible = false;

    /** screenSize (float) */
    @meta.float
    screenSize = 0;

}
