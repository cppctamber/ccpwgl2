import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


const Quality = Object.freeze({
    TAA_LOW: 1,
    TAA_MEDIUM: 2,
    TAA_HIGH: 3
});

const Debug = Object.freeze({
    TAA_DEBUG_OFF: 0,
    TAA_DEBUG_MOTION_VECTORS: 1,
    TAA_DEBUG_EARLY_OUT_MASK: 2
});


/**
 * Temporal anti-aliasing settings
 *
 * NOT IMPLEMENTED, and not portable in this form - Carbon's TAA needs history
 * buffers and motion vectors it produces around the upscaling path.
 *
 * Carbon exposes this slot READWRITE without PERSIST, so it never appears in a
 * shipped black file. The class exists for completeness rather than for loading.
 *
 * @ccp Tr2PPTaaEffect
 */
@meta.type("Tr2PPTaaEffect")
@meta.ccp.define("Tr2PPTaaEffect")
export class Tr2PPTaaEffect extends Tr2PPEffect
{

    @meta.enums(Quality)
    quality = Quality.TAA_HIGH;

    @meta.enums(Debug)
    debug = Debug.TAA_DEBUG_OFF;

    @meta.float
    earlyOutThreshold = 0.001;

    static Quality = Quality;
    static Debug = Debug;

}
