// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionAttributeModifiers/IEveDistributionModifier.h
// Promoted to hand-maintained source 2026-07-23 (Carbon-verified property shell; schema eve/distribution/attributeModifiers/InitialPlacement.json.).
import { meta } from "utils";


@meta.type("InitialPlacement")
@meta.ccp.define("InitialPlacement")
export class InitialPlacement extends meta.Model
{

    /** placement (PlacementDataWithIdentifier) */
    @meta.rawObject("PlacementDataWithIdentifier")
    placement = null;

    /** timeOutDuration (float) */
    @meta.float
    timeOutDuration = 0;

}
