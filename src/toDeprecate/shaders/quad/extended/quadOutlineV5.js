import * as input from "../../shared/input";
import { precision } from "../../shared/func";
import { Outline } from "./constant";

import {
    RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE,
    CMP_ALWAYS,
    CULL_NONE,
    RS_ALPHATESTENABLE
} from "constant";

/**
 * Outline shader (V5)
 *
 * This version does NOT use viewport size at all.
 * Outline thickness (Outline.w / cb0[0].w) is interpreted as an NDC thickness:
 *  - Larger values = thicker outline
 *  - Thickness will scale with resolution (higher res => visually thinner)
 *
 * If you later want pixel-constant thickness, you'll need resolution/viewport data again.
 */

export const quadOutlineV5 = {
    name: "quadOutlineV5",
    description: "quad outline shader (no viewport)",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: input.PosTexTanTex,
                constants: [
                    Outline
                ],
                shader: `

                    varying vec4 texcoord;

                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;

                    uniform vec4 cb0[1];     // Outline (xyz color, w thickness)
                    uniform vec4 cb1[24];    // PerFrameVS (ViewProjection, ViewMat rows, etc)
                    uniform vec4 cb3[26];    // PerObjectVS (WorldMat etc)

                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;

                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;

                        vec4 c0 = vec4(6.28318548, -3.14159274, 0.159154937, 0.5);
                        vec4 c1 = vec4(0, 1, 0, 0);

                        v0 = attr0;
                        v1 = attr1;
                        v2 = attr2;
                        v3 = attr3;

                        texcoord.xy = v2.xy;
                        texcoord.zw = v3.xy;

                        // ------------------------------------------------------------
                        // Decode axis from packed tangent (attr2/attr3 packing style)
                        // This is the same decode you already had working.
                        // r4.xyz becomes the "axis" in object space.
                        // ------------------------------------------------------------
                        r0 = v2 * c0.xxxx + c0.yyyy;
                        {
                            bvec4 tmp = lessThan(c1.xxxx, r0.ywzw);
                            r2.xy = (vec4(tmp.x ? 1.0 : 0.0, tmp.y ? 1.0 : 0.0, tmp.z ? 1.0 : 0.0, tmp.w ? 1.0 : 0.0)).xy;
                        }

                        r0 = r0 * c0.zzzz + c0.wwww;
                        r0 = fract(r0);
                        r0 = r0 * c0.xxxx + c0.yyyy;

                        r2.x = r2.y * r2.x;

                        r3.xy = vec2(cos(r0.x), sin(r0.x));
                        r4.xy = vec2(cos(r0.y), sin(r0.y));
                        r3.xy = r3.xy * abs(r4.yy);
                        r3.z = r4.x;

                        r4.xy = vec2(cos(r0.z), sin(r0.z));
                        r5.xy = vec2(cos(r0.w), sin(r0.w));
                        r0.xy = r4.xy * abs(r5.yy);
                        r0.z = r5.x;

                        r2.yzw = r0.yzx * r3.zxy;
                        r2.yzw = r3.yzx * r0.zxy + (-r2.yzw);
                        r4.xyz = mix((-r2.yzw), r2.yzw, r2.xxx);

                        // Normalize decoded axis (helps if packing/precision introduces drift)
                        r4.xyz = normalize(r4.xyz);

                        // ------------------------------------------------------------
                        // Compute clip position for ORIGINAL vertex (no extrusion yet)
                        // ------------------------------------------------------------
                        r0 = v0.xyzx * c1.yyyx + c1.xxxy;   // vec4(pos,1)

                        r1.x = dot(r0, cb3[0]);
                        r1.y = dot(r0, cb3[1]);
                        r1.z = dot(r0, cb3[2]);
                        r1.w = dot(r0, cb3[3]);

                        vec4 clip;
                        clip.x = dot(r1, cb1[4]);
                        clip.y = dot(r1, cb1[5]);
                        clip.z = dot(r1, cb1[6]);
                        clip.w = dot(r1, cb1[7]);

                        // ------------------------------------------------------------
                        // Build a view-space direction for screen-space offset
                        //
                        // Assumption:
                        // - cb3 is object->world (3x3 in cb3[0..2].xyz)
                        // - cb1[8..10].xyz are view matrix rows (world->view 3x3)
                        //
                        // If cb3 is already object->view, you can skip the ViewMat multiply.
                        // ------------------------------------------------------------
                        vec3 nWorld;
                        nWorld.x = dot(r4.xyz, cb3[0].xyz);
                        nWorld.y = dot(r4.xyz, cb3[1].xyz);
                        nWorld.z = dot(r4.xyz, cb3[2].xyz);

                        vec3 nView;
                        nView.x = dot(nWorld, cb1[8].xyz);
                        nView.y = dot(nWorld, cb1[9].xyz);
                        nView.z = dot(nWorld, cb1[10].xyz);
                        nView = normalize(nView);

                        // ------------------------------------------------------------
                        // NO VIEWPORT:
                        // Outline thickness is interpreted as an NDC offset.
                        // clip.xy is in clip-space, so we multiply by clip.w.
                        //
                        // cb0[0].w === Outline thickness (NDC units)
                        // ------------------------------------------------------------
                        vec2 dir = normalize(nView.xy);
                        vec2 ndcOffset = dir * cb0[0].w;
                        clip.xy += ndcOffset * clip.w;

                        gl_Position = clip;
                    }
                `
            },

            ps: {
                constants: [
                    Outline
                ],
                shader: `

                    ${precision}

                    uniform vec4 cb7[1]; // Outline color (xyz)

                    void main()
                    {
                        // Solid outline color
                        gl_FragData[0].xyz = cb7[0].xyz;
                        gl_FragData[0].w = 1.0;
                    }

                `
            },

            states: {
                [RS_ZENABLE]: 0,
                [RS_ZWRITEENABLE]: 0,
                [RS_ZFUNC]: CMP_ALWAYS,
                [RS_CULLMODE]: CULL_NONE,
                [RS_ALPHATESTENABLE]: 1
            }
        }
    }
};


export const skinnedQuadOutlineV5 = {
    name: "skinned_quadOutlineV5",
    description: "skinned quad outline shader (no viewport)",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: input.PosBwtTexTanTex,
                constants: [
                    Outline
                ],
                shader: `

                    varying vec4 texcoord;

                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    attribute vec4 attr4;

                    uniform vec4 cb0[1];     // Outline (xyz color, w thickness)
                    uniform vec4 cb1[24];    // PerFrameVS
                    uniform vec4 cb3[200];   // Bone palette + skinning constants

                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v4;

                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;

                        ivec4 a0;

                        vec4 c0 = vec4(3, 0, 1, 0.5);
                        vec4 c1 = vec4(6.28318548, -3.14159274, 0.159154937, 0.5);

                        v0 = attr0;
                        v1 = attr1;
                        v2 = attr2;
                        v3 = attr3;
                        v4 = attr4;

                        texcoord.xy = v2.xy;
                        texcoord.zw = v4.xy;

                        // ------------------------------------------------------------
                        // Select bone index and build skinned basis (r6,r7,r9) + translation (r1)
                        // This matches your working skinning setup.
                        // ------------------------------------------------------------
                        r0.x = c0.x * v1.x;
                        a0.x = int(r0.x + 0.5);
                        r0 = cb3[27 + a0.x];

                        r5 = v0.xyzx * c0.zzzy + c0.yyyz;

                        r1 = r0 * cb3[3].yyyy;
                        r2 = cb3[26 + a0.x];
                        r1 = r2 * cb3[3].xxxx + r1;
                        r3 = cb3[28 + a0.x];
                        r1 = r3 * cb3[3].zzzz + r1;
                        r4.yz = c0.yz;
                        r1 = cb3[3].wwww * r4.yyyz + r1;

                        r6 = r0 * cb3[0].yyyy;
                        r6 = r2 * cb3[0].xxxx + r6;
                        r6 = r3 * cb3[0].zzzz + r6;
                        r6 = cb3[0].wwww * r4.yyyz + r6;

                        r7 = r0 * cb3[1].yyyy;
                        r7 = r2 * cb3[1].xxxx + r7;
                        r7 = r3 * cb3[1].zzzz + r7;
                        r7 = cb3[1].wwww * r4.yyyz + r7;

                        r9 = r0 * cb3[2].yyyy;
                        r9 = r2 * cb3[2].xxxx + r9;
                        r9 = r3 * cb3[2].zzzz + r9;
                        r9 = cb3[2].wwww * r4.yyyz + r9;

                        // ------------------------------------------------------------
                        // Decode axis from packed tangent (attr3)
                        // r8.xyz becomes the decoded axis in OBJECT space.
                        // ------------------------------------------------------------
                        r2 = v3 * c1.xxxx + c1.yyyy;
                        {
                            bvec4 tmp = lessThan(c0.yyyy, r2.ywzw);
                            r3.xy = (vec4(tmp.x ? 1.0 : 0.0, tmp.y ? 1.0 : 0.0, tmp.z ? 1.0 : 0.0, tmp.w ? 1.0 : 0.0)).xy;
                        }
                        r2 = r2 * c1.zzzz + c1.wwww;
                        r2 = fract(r2);
                        r2 = r2 * c1.xxxx + c1.yyyy;

                        r0.w = r3.y * r3.x;

                        r3.xy = vec2(cos(r2.x), sin(r2.x));
                        r4.xy = vec2(cos(r2.y), sin(r2.y));
                        r3.xy = r3.xy * abs(r4.yy);
                        r3.z = r4.x;

                        r4.xy = vec2(cos(r2.z), sin(r2.z));
                        r8.xy = vec2(cos(r2.w), sin(r2.w));
                        r2.xy = r4.xy * abs(r8.yy);
                        r2.z = r8.x;

                        r4.xyz = r2.yzx * r3.zxy;
                        r4.xyz = r3.yzx * r2.zxy + (-r4.xyz);
                        r8.xyz = mix((-r4.xyz), r4.xyz, r0.www);

                        r8.xyz = normalize(r8.xyz);

                        // ------------------------------------------------------------
                        // Transform axis by the same skinned 3x3 as the position
                        // Produces a direction in the same space as the skinned position.
                        // ------------------------------------------------------------
                        r2.x = dot(r8.xyz, r6.xyz);
                        r2.y = dot(r8.xyz, r7.xyz);
                        r2.z = dot(r8.xyz, r9.xyz);
                        r2.xyz = normalize(r2.xyz);

                        // ------------------------------------------------------------
                        // Compute CLIP for the ORIGINAL skinned vertex (no extrusion).
                        // Note: r5 is the skinned position in "skinned space" used below.
                        // ------------------------------------------------------------
                        vec4 clip;

                        r0 = r5; // keep r5 intact if you later want true extrusion variants

                        // Build clip from skinned position:
                        // dot with basis rows/cols + translation (r1)
                        r4.x = dot(r0, r6);
                        r4.y = dot(r0, r7);
                        r4.z = dot(r0, r9);
                        r4.w = dot(r0, r1);

                        clip.x = dot(r4, cb1[4]);
                        clip.y = dot(r4, cb1[5]);
                        clip.z = dot(r4, cb1[6]);
                        clip.w = dot(r4, cb1[7]);

                        // ------------------------------------------------------------
                        // Build view-space direction for screen-space offset.
                        //
                        // Assumption:
                        // - r2.xyz is currently a WORLD-space-ish direction (depending on your skinning basis).
                        // - cb1[8..10].xyz are view matrix rows (world->view 3x3).
                        //
                        // If your r2 is already view-space, skip the ViewMat multiply.
                        // ------------------------------------------------------------
                        vec3 nWorld = normalize(r2.xyz);

                        vec3 nView;
                        nView.x = dot(nWorld, cb1[8].xyz);
                        nView.y = dot(nWorld, cb1[9].xyz);
                        nView.z = dot(nWorld, cb1[10].xyz);
                        nView = normalize(nView);

                        // ------------------------------------------------------------
                        // NO VIEWPORT:
                        // Outline thickness is interpreted as an NDC offset.
                        // ------------------------------------------------------------
                        vec2 dir = normalize(nView.xy);
                        vec2 ndcOffset = dir * cb0[0].w;
                        clip.xy += ndcOffset * clip.w;

                        gl_Position = clip;
                    }
                `
            },

            ps: quadOutlineV5.techniques.Main.ps,
            states: quadOutlineV5.techniques.Main.states
        }
    }
};