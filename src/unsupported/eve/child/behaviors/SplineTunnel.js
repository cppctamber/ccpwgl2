// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/SplineTunnelGroup.h
// Promoted to hand-maintained source 2026-07-23 (Carbon-verified property shell; schema eve/child/behaviors/SplineTunnel.json.).
import { meta } from "utils";

/** SplineTunnel (eve/child/behaviors) - generated from schema shapeHash d53f1701.... */

@meta.define("SplineTunnel", true)
export class SplineTunnel extends meta.Model
{

    /** tunnelID (int) */
    @meta.int32
    tunnelID = -1;

    /** tunnelGroupType (int) */
    @meta.int32
    tunnelGroupType = 0;

    /** splinePoints (std::vector<SplineTunnelPoint>) */
    @meta.list("SplineTunnelPoint")
    splinePoints = [];

    /** cylWidth (float) */
    @meta.float
    cylWidth = 20;

    /** accelerationMultiplier (float) */
    @meta.float
    // Carbon leaves this unused native member uninitialized. The portable
    // record uses the multiplicative identity as a deterministic value.
    accelerationMultiplier = 1;

    /** pullSize (float) */
    @meta.float
    pullSize = 50;

    /** pointOfNoReturnSize (float) */
    @meta.float
    pointOfNoReturnSize = 20;

}
