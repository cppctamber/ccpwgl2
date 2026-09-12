// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/SplineTunnelGroup.h
// Promoted to hand-maintained source 2026-07-23 (Carbon-verified property shell; schema eve/child/behaviors/SplineTunnelPoint.json.).
import { meta } from "utils";
import { vec3 } from "math";

/** SplineTunnelPoint (eve/child/behaviors) - generated from schema shapeHash da3b5246.... */

@meta.define("SplineTunnelPoint", true)
export class SplineTunnelPoint extends meta.Model
{

    /** accelerationMultiplier (float) */
    @meta.float
    accelerationMultiplier = 1;

    /** pos (Vector3) */
    @meta.vector3
    pos = vec3.create();

    /** rot (Vector3) */
    @meta.vector3
    rot = vec3.create();

}
