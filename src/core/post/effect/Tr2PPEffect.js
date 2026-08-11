import { meta } from "utils";


/**
 * Base class for a post process effect
 *
 * Carbon holds these as slots on `Tr2PostProcess2`; an absent slot switches a
 * permutation off in the composite rather than skipping a pass. `IsActive` is
 * the second gate: a slot may be present and still contribute nothing, which
 * subclasses express by overriding it.
 *
 * @ccp Tr2PPEffect
 */
@meta.type("Tr2PPEffect")
@meta.ccp.define("Tr2PPEffect")
export class Tr2PPEffect extends meta.Model
{

    @meta.boolean
    display = true;

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display;
    }

}
