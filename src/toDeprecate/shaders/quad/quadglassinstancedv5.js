import { RS_CULLMODE } from "constant";
import { vs } from "./shared";
import { quadGlassV5Shared } from "./quadglassv5";
import { quadInstancedV5 } from "./quadinstancedv5";


/**
 * GLES2 glass shader for SOF layout instance streams.
 *
 * The shipped GLES2 effect tree has ordinary quad glass and opaque instanced
 * quad shaders, but no glass-instanced variant. Layout glass therefore needs
 * the proven SOIA vertex program combined with the existing glass fragment
 * program and its two-sided render states.
 */
export const quadGlassInstancedV5 = {
    name: "quadGlassInstancedV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadGlassInstancedV5",
    description: "instanced glass quad shader",
    techniques: {
        Depth: { ...quadInstancedV5.techniques.Depth },
        Picking: { ...quadInstancedV5.techniques.Picking },
        Normal: { ...quadInstancedV5.techniques.Normal },
        Main: [
            {
                vs: vs.quadInstancedV5_PosTexTanTexTexTexTexL01,
                ps: quadGlassV5Shared.ps,
                states: {
                    [RS_CULLMODE]: 3
                }
            },
            {
                vs: vs.quadInstancedV5_PosTexTanTexTexTexTexL01,
                ps: quadGlassV5Shared.ps,
                states: {
                    [RS_CULLMODE]: 2
                }
            }
        ]
    }
};
