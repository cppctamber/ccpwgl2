import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Signal loss, a separate pass run after the composite
 *
 * NOT IMPLEMENTED. Two shipped assets populate it.
 *
 * @ccp Tr2PPSignalLossEffect
 */
@meta.type("Tr2PPSignalLossEffect")
@meta.ccp.define("Tr2PPSignalLossEffect")
export class Tr2PPSignalLossEffect extends Tr2PPEffect
{

    @meta.float
    strength = 0;

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display && this.strength > 0;
    }

}
