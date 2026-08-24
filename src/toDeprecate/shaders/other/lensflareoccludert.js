import { RS_ZENABLE, RS_ZWRITEENABLE, RS_COLORWRITEENABLE } from "constant";
import { Pos } from "../shared/input";


/**
 * A lensflare occluder shader that draws nothing.
 *
 * `lensflareoccludert` writes its result with `atomic_iadd`, an instruction
 * WebGL2 has no lowering for. On the dx11 profile the translation fails, the
 * Carbon target is reported incomplete, and - because the occluder meshes hang
 * off the flare - the WHOLE LENSFLARE fails to load:
 *
 *   Carbon WebGL target is incomplete; 1 shader translation(s) are unsupported
 *   "res:/graphics/effect.dx11/managed/space/specialfx/lensflares/lensflareoccludert.sm_depth"
 *
 * So the flare is lost to a shader whose output cannot be used even when it
 * compiles. Standing in a no-op here removes it from the graph without touching
 * the flare, the occluders, or anything else that already works: the resource
 * resolves, the pass runs, and it rasterises nothing.
 *
 * NOTHING IS GIVEN UP. The occluder pass exists only to produce
 * `occlusionIntensity` - the graduated fade as a hull creeps across the sun's
 * disc - and `EveOccluder.CollectSamples` already bails, because the
 * `collectsamples` effect it needs ships in no profile at all. The value stays
 * 1 either way, which is why `config.js` pins `FlareOcclusionBuffer` to white.
 * Ordinary depth testing still hides a flare behind geometry; that is the part
 * that reads as occlusion, and it is untouched.
 *
 * TEMPORARY. This is a stand-in until the occlusion path is rebuilt on
 * something WebGL2 can express - the shipped gles2 tree carries
 * `lensflareoccludera` and `lensflarescreen`, which are a different mechanism
 * from dx11's `occludermanagement` and have not been looked at yet.
 *
 * The geometry is `res:/model/global/zsprite.gr2`, so POSITION is the only
 * input worth declaring. The vertex program collapses every vertex to the same
 * clip position, which makes each triangle degenerate and gives the rasteriser
 * no fragments; the fragment program discards as well, so nothing reaches the
 * frame buffer even if a driver disagrees about the degenerate case.
 *
 * Depth and colour writes are off for the same belt-and-braces reason: this
 * pass must not disturb the buffers the flare and the scene are using.
 */

const vs = `
attribute vec4 attr0;

void main()
{
    // Degenerate on purpose - see the file header.
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const ps = `
precision highp float;

void main()
{
    discard;
}
`;

const technique = {
    Main: {
        vs: {
            inputDefinitions: Pos,
            shader: vs
        },
        ps: {
            shader: ps
        },
        states: {
            [RS_ZENABLE]: 0,
            [RS_ZWRITEENABLE]: 0,
            [RS_COLORWRITEENABLE]: 0
        }
    }
};

/**
 * One definition per profile.
 *
 * `Tw2ShaderStore.NormalizeShaderName` strips the tier extension, so a single
 * entry covers `.fx`, `.sm_hi`, `.sm_lo` and `.sm_depth` - but it keeps the
 * PROFILE, and rewrites a bare `/effect/` to `/effect.gles2/`. A definition
 * therefore replaces one profile's copy and one profile's only, which is why
 * there are three of these rather than one.
 */
export const lensflareoccludertGles2 = {
    name: "lensflareoccludert.gles2",
    replaces: "graphics/effect.gles2/managed/space/specialfx/lensflares/lensflareoccludert",
    description: "lens flare occluder sampler - no-op stand-in",
    techniques: technique
};

export const lensflareoccludertDx11 = {
    name: "lensflareoccludert.dx11",
    replaces: "graphics/effect.dx11/managed/space/specialfx/lensflares/lensflareoccludert",
    description: "lens flare occluder sampler - no-op stand-in",
    techniques: technique
};

export const lensflareoccludertDx12 = {
    name: "lensflareoccludert.dx12",
    replaces: "graphics/effect.dx12/managed/space/specialfx/lensflares/lensflareoccludert",
    description: "lens flare occluder sampler - no-op stand-in",
    techniques: technique
};
