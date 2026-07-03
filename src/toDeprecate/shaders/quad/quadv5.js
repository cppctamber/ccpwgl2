import { constant, texture, vs, ps } from "./shared";
import { clampToBorder, customMaskBlendModes } from "../shared/func";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap, DustNoiseMap } from "../shared/texture";
import { quadDepthV5, skinnedQuadDepthV5 } from "./quaddepthv5";
import { quadPickingV5, skinnedQuadPickingV5 } from "./quadpickingv5";
import { quadOutlineV5, skinnedQuadOutlineV5 } from "./extended/quadOutlineV5";
import { quadEmissiveV5, skinnedQuadEmissiveV5 } from "./extended/quadEmissiveV5";
import { quadExtendedPickingV5, skinnedQuadExtendedPickingV5 } from "./extended/quadExtendedPickingV5";
import { quadUtilityV5, skinnedQuadUtilityV5 } from "./extended/quadUtilityV5";
import { quadnormalv5, skinnedQuadNormalV5 } from "./quadnormalv5";
import { PatternBlendMode, PMtl1PatternBlur, PMtl1PatternMode } from "./shared/constant";
import { dirtFunctions } from "./extended/func";

export const quadV5 = {
    name: "quadV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadV5",
    todo: "Add invert/ blend modes back",
    techniques: {
        Depth: quadDepthV5.techniques.Main,
        Normal: quadnormalv5.techniques.Main,
        Picking: quadPickingV5.techniques.Main,
        Outline: quadOutlineV5.techniques.Main,
        Emissive: quadEmissiveV5.techniques.Main,
        ExtendedPicking: quadExtendedPickingV5.techniques.Main,
        Utility: quadUtilityV5.techniques.Main,
        Main: {
            vs: vs.quadV5_PosTexTanTexL01,
            ps: {
                constants: [
                    constant.GeneralData,           //cb7[0].xyz
                    constant.GeneralGlowColor,      //cb7[1].xyz
                    constant.Mtl1DiffuseColor,      //cb7[2].xyz
                    constant.Mtl2DiffuseColor,      //cb7[3].xyz
                    constant.Mtl3DiffuseColor,      //cb7[4].xyz
                    constant.Mtl4DiffuseColor,      //cb7[5].xyz
                    constant.Mtl1FresnelColor,      //cb7[6].xyz
                    constant.Mtl2FresnelColor,      //cb7[7].xyz
                    constant.Mtl3FresnelColor,      //cb7[8].xyz
                    constant.Mtl4FresnelColor,      //cb7[9].xyz
                    constant.Mtl1Gloss,             //cb7[10].x
                    constant.Mtl2Gloss,             //cb7[11].x
                    constant.Mtl3Gloss,             //cb7[12].x
                    constant.Mtl4Gloss,             //cb7[13].x
                    constant.Mtl1DustDiffuseColor,  //20
                    constant.Mtl2DustDiffuseColor,  //21
                    constant.Mtl3DustDiffuseColor,  //22
                    constant.Mtl4DustDiffuseColor ,  //23
                    constant.PMtl1DiffuseColor,     //cb7[14].xyz
                    constant.PMtl1FresnelColor,     //cb7[15].xyz
                    constant.PMtl1Gloss,            //cb7[16].xyz
                    constant.PMtl2DiffuseColor,     //cb7[17].xyz
                    constant.PMtl2FresnelColor,     //cb7[18
                    constant.PMtl2Gloss,            //19
                    // New p3 material
                    //constant.P3MaterialData,        //20
                    //constant.P3DiffuseColor,        //21
                    //constant.P3FresnelColor,        //22
                    //constant.P3Gloss,               //33
                ],
                textures: [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    texture.AlbedoMap,                  // a
                    texture.RoughnessMap,               // r
                    texture.NormalMap,                  // n
                    texture.PaintMaskMap,               // p3
                    texture.MaterialMap,                // m
                    texture.DirtMap,                    // d
                    texture.GlowMap,                    // g
                    texture.PatternMask1Map,
                    texture.PatternMask2Map,
                    DustNoiseMap,
                ],
                shader: `


                        //quadv5.sm_depth
                        ${ps.header}
                        ${clampToBorder}

                        varying vec4 texcoord;
                        varying vec4 texcoord1;
                        varying vec4 texcoord2;
                        varying vec4 texcoord3;
                        varying vec4 texcoord4;
                        varying vec4 texcoord5;
                        varying vec4 texcoord6;
                        varying vec4 texcoord7;
                        varying vec4 texcoord8;

                        // Pretend Ambient Occlusion
                        varying vec4 lighting;

                        uniform samplerCube s0; // EveSpaceSceneEnvMap
                        uniform sampler2D s1;   // EveSpaceSceneShadowMapSampler
                        uniform sampler2D s2;   // AlbedoMap
                        uniform sampler2D s3;   // RoughnessMap
                        uniform sampler2D s4;   // NormalMap
                        uniform sampler2D s5;   // PaintMaskMap
                        uniform sampler2D s6;   // MaterialMap
                        uniform sampler2D s7;   // DirtMap
                        uniform sampler2D s8;   // GlowMap
                        uniform sampler2D s9;   // PatternMask1Map;
                        uniform sampler2D s10;  // PatternMask2Map;
                        uniform sampler2D s11;  // DustNoiseMap

                        uniform vec4 cb2[22];
                        uniform vec4 cb4[16];
                        uniform vec4 cb7[24];

                        ${customMaskBlendModes}

                        vec3 stripColor(vec3 rgb, float amount)
                        {
                            float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
                            return mix(rgb, vec3(luma), clamp(amount, 0.0, 1.0));
                        }

                        vec3 desaturateLinear(vec3 rgb, float amount)
                        {
                            float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722)); // linear luma
                            return mix(rgb, vec3(luma), clamp(amount, 0.0, 1.0));
                        }

                        void main()
                        {
                            vec4 v0;
                            vec4 v1;
                            vec4 v2;
                            vec4 v3;
                            vec4 v4;
                            vec4 v5;
                            vec4 v6;
                            vec4 v7;
                            vec4 v8;
                            vec4 r0;
                            vec4 r1;
                            vec4 r10;
                            vec4 r11;
                            vec4 r12;
                            vec4 r13;
                            vec4 r14;
                            vec4 r15;
                            vec4 r16;
                            vec4 r17;
                            vec4 r2;
                            vec4 r3;
                            vec4 r4;
                            vec4 r5;
                            vec4 r6;
                            vec4 r7;
                            vec4 r8;
                            vec4 r9;

                            vec4 c24=vec4(9.99999997e-007,-5,0.400000006,20);
                            vec4 c34=vec4(1,2,-1,0);
                            vec4 c25=vec4(-0,-0.333333343,-0.666666687,-1);
                            vec4 c26=vec4(3.19148946,1.03191495,0.5,-0.5);

                            // Paint Mask Fresnel Color
                            vec4 c27=vec4(0.0383840017,0.0393519998,0.0391650014,3.14159274);

                            // missing old 25
                            vec4 c29=vec4(1.04166663,0.474999994,0.018229166,0.25);
                            vec4 c30=vec4(0,-0.015625,0.75,-9.27999973);
                            vec4 c32=vec4(0.318309873,-1.44269507e-005,-0.00313080009,12.9200001);
                            vec4 c33=vec4(0.416666657,1.05499995,-0.0549999997,0);
                            vec4 c35=vec4(-1,-2,-3,-4);
                            vec4 c28=vec4(1,1.54499996,1.10000002,6);
                            // New
                            vec4 c31=vec4(4,5,7,0.119999997);
                            //New
                            vec4 c36=vec4(0.400000006,1,3.14159274,-1e-015);

                            // Dirt Fresnel Colour
                            vec4 c37=vec4(0.0189999994,0.0170000009,0.0140000004,9.99999987e+014);
                            vec4 c38=vec4(0.0189999994,0.0170000009,0.0140000004,1);

                            v0=texcoord;
                            v1=texcoord1;
                            v2=texcoord2;
                            v3=texcoord3;
                            v4=texcoord4;
                            v5=texcoord5;
                            v6=texcoord6;
                            v7=texcoord7;
                            v8=texcoord8;


                            r0.xyz=(-cb4[1].xyz)+v5.xyz;
                            r0.x=dot(r0.xyz,r0.xyz);
                            r0.w=cb4[1].w;
                            r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                            if(any(lessThan(r0,vec4(0.0))))discard;

                            //r0=texture2D(PMDGSampler,v0.xy);
                            r0.x=texture2D(s5,v0.xy).x;
                            r0.y=texture2D(s6,v0.xy).x;
                            r0.z=texture2D(s7,v0.xy).x;
                            r0.w=texture2D(s8,v0.xy).x;

                            gl_FragData[0].w=(-r0.x)+c34.x; // negate paint mask + 1.0

                            //r1=texture2D(NoMapSampler,v0.xy);
                            r1.ywx=texture2D(s4,v0.xy).xyz;
                            r1.z=lighting.x;

                            r1.xy=r1.yw*c34.yy+c34.zz;
                            r2.xyz=r1.yyy*v3.xyz;
                            r2.xyz=r1.xxx*v2.xyz+r2.xyz;
                            r1.x=saturate(dot(r1.xy,r1.xy)+c34.w);
                            r1.x=(-r1.x)+c34.x;
                            r1.x=sqrt(abs(r1.x));
                            r1.xyz=r1.xxx*v1.xyz+r2.xyz;
                            r2.xyz=normalize(r1.xyz);
                            r1=r2.xyzx*c34.xxxw+c34.wwwx;
                            r3.x=dot(cb4[3],r1);
                            r3.y=dot(cb4[4],r1);
                            r3.z=dot(cb4[5],r1);
                            r1=r2.yzzx*r2.xyzz;
                            r4.x=dot(cb4[6],r1);
                            r4.y=dot(cb4[7],r1);
                            r4.z=dot(cb4[8],r1);
                            r1.xyz=r3.xyz+r4.xyz;
                            r1.w=r2.y*r2.y;
                            r1.w=r2.x*r2.x+(-r1.w);
                            r1.xyz=cb4[9].xyz*r1.www+r1.xyz;
                            r3.xyz=max(r1.xyz,c34.www);
                            r2.w=c31.z;

                            r1=textureCubeLod(s0,r2.xyz,r2.w);

                            r1.w=cb2[14].w;
                            r1.w=r1.w*c31.w;
                            r1.xyz=r1.xyz*cb2[14].www+r1.www;
                            r1.xyz=r3.xyz+r1.xyz;
                            r1.w=dot(v4.xyz,v4.xyz);
                            r1.w=r1.w==0.0?3.402823466e+38:inversesqrt(abs(r1.w));
                            r3.xyz=r1.www*v4.xyz;
                            r4.xyz=v4.xyz*r1.www+cb2[12].xyz;
                            r5.xyz=normalize(r4.xyz);
                            r1.w=dot(r3.xyz,r2.xyz);
                            r2.w=saturate(r1.w);
                            r1.w=r1.w+r1.w;
                            r4.xyz=r2.xyz*(-r1.www)+r3.xyz;
                            r1.w=clamp(dot(r5.xyz,r3.xyz),0.0, 1.0);
                            r1.w=r1.w*r1.w;
                            r2.w=r2.w*c30.w;
                            r2.w=exp2(r2.w);
                            r3.y=c24.y;
                            r3.x=r3.y+cb4[11].x;
                            r6.x=cb7[23].x;
                            r3.z=r3.x>=0.0?r6.x:cb7[20].x;
                            r7=c35;
                            r8=r7+cb4[11].xxxx;
                            r3.z=r8.w>=0.0?r3.z:cb7[13].x;
                            r3.z=r8.z>=0.0?r3.z:cb7[12].x;
                            r3.z=r8.y>=0.0?r3.z:cb7[11].x;
                            r3.z=r8.x>=0.0?r3.z:cb7[10].x;
                            r3.y=r3.y+cb4[10].x;
                            r3.w=r3.y>=0.0?r6.x:cb7[20].x;
                            r6=r7+cb4[10].xxxx;
                            r3.w=r6.w>=0.0?r3.w:cb7[13].x;
                            r3.w=r6.z>=0.0?r3.w:cb7[12].x;
                            r3.w=r6.y>=0.0?r3.w:cb7[11].x;
                            r3.w=r6.x>=0.0?r3.w:cb7[10].x;

                            // PatternMask1
                            r7=clampToBorder(s9,v6.xy,cb4[10].yz,c34.wwww);

                            r7=r7.xxxx*cb4[12];

                            // PatternMask2
                            r9=clampToBorder(s10,v6.zw,cb4[11].yz,c34.wwww);

                            r9=r9.xxxx*cb4[13];
                            applyCustomMaskBlendMode(r7, r9);
                            r4.w=mix(cb7[10].x,r3.w,r7.x);
                            r5.w=mix(r4.w,r3.z,r9.x);
                            r4.w=mix(cb7[11].x,r3.w,r7.y);
                            r10.x=mix(r4.w,r3.z,r9.y);
                            r11=r0.yyyy+c25;
                            r11=r11*c26.xxxx;
                            r11=saturate((-abs(r11))+c26.yyyy);
                            r0.y=r10.x*r11.y;
                            r0.y=r11.x*r5.w+r0.y;
                            r4.w=mix(cb7[12].x,r3.w,r7.z);
                            r5.w=mix(cb7[13].x,r3.w,r7.w);
                            r10.x=mix(r5.w,r3.z,r9.w);
                            r5.w=mix(r4.w,r3.z,r9.z);
                            r0.y=r11.z*r5.w+r0.y;
                            r0.y=r11.w*r10.x+r0.y;

                            //r10=texture2D(ArMapSampler,v0.xy);

                            //AlbedoMap
                            r10.xyz=texture2D(s2,v0.xy).xyz;

                            // RoughnessMap
                            r10.w=texture2D(s3,v0.xy).x;

                            r3.z=r0.y*r10.w;
                            r0.y=r10.w*(-r0.y)+c24.z;
                            r0.x=r0.x*cb7[0].x;
                            r0.y=r0.x*r0.y+r3.z;
                            r0.y=saturate((-r0.y)+c34.x);
                            r3.zw=(-r0.yy)+c28.xy;
                            r12.xyz=c30.xyz;
                            r13=r3.zzzz*c29+r12.xxyz;
                            r4.w=min(r3.w,c34.x);
                            r3.z=min(r2.w,r13.y);
                            r3.z=r13.x*r3.z+r13.z;
                            r13.xyz=cb7[22].xyz;
                            {bvec3 tmp=greaterThanEqual(r3.xxx,vec3(0.0));r14.xyz=vec3(tmp.x?r13.x:cb7[19].x,tmp.y?r13.y:cb7[19].y,tmp.z?r13.z:cb7[19].z);};
                            r15.xyz=cb7[21].xyz;
                            {bvec3 tmp=greaterThanEqual(r3.xxx,vec3(0.0));r16.xyz=vec3(tmp.x?r15.x:cb7[18].x,tmp.y?r15.y:cb7[18].y,tmp.z?r15.z:cb7[18].z);};
                            {bvec3 tmp=greaterThanEqual(r8.www,vec3(0.0));r16.xyz=vec3(tmp.x?r16.x:cb7[5].x,tmp.y?r16.y:cb7[5].y,tmp.z?r16.z:cb7[5].z);};
                            {bvec3 tmp=greaterThanEqual(r8.zzz,vec3(0.0));r16.xyz=vec3(tmp.x?r16.x:cb7[4].x,tmp.y?r16.y:cb7[4].y,tmp.z?r16.z:cb7[4].z);};
                            {bvec3 tmp=greaterThanEqual(r8.yyy,vec3(0.0));r16.xyz=vec3(tmp.x?r16.x:cb7[3].x,tmp.y?r16.y:cb7[3].y,tmp.z?r16.z:cb7[3].z);};
                            {bvec3 tmp=greaterThanEqual(r8.xxx,vec3(0.0));r16.xyz=vec3(tmp.x?r16.x:cb7[2].x,tmp.y?r16.y:cb7[2].y,tmp.z?r16.z:cb7[2].z);};
                            {bvec3 tmp=greaterThanEqual(r8.www,vec3(0.0));r14.xyz=vec3(tmp.x?r14.x:cb7[9].x,tmp.y?r14.y:cb7[9].y,tmp.z?r14.z:cb7[9].z);};
                            {bvec3 tmp=greaterThanEqual(r8.zzz,vec3(0.0));r14.xyz=vec3(tmp.x?r14.x:cb7[8].x,tmp.y?r14.y:cb7[8].y,tmp.z?r14.z:cb7[8].z);};
                            {bvec3 tmp=greaterThanEqual(r8.yyy,vec3(0.0));r8.yzw=vec3(tmp.x?r14.x:cb7[7].x,tmp.y?r14.y:cb7[7].y,tmp.z?r14.z:cb7[7].z);};
                            {bvec3 tmp=greaterThanEqual(r8.xxx,vec3(0.0));r8.xyz=vec3(tmp.x?r8.y:cb7[6].x,tmp.y?r8.z:cb7[6].y,tmp.z?r8.w:cb7[6].z);};
                            {bvec3 tmp=greaterThanEqual(r3.yyy,vec3(0.0));r13.xyz=vec3(tmp.x?r13.x:cb7[19].x,tmp.y?r13.y:cb7[19].y,tmp.z?r13.z:cb7[19].z);};
                            {bvec3 tmp=greaterThanEqual(r3.yyy,vec3(0.0));r3.xyw=vec3(tmp.x?r15.x:cb7[18].x,tmp.y?r15.y:cb7[18].y,tmp.z?r15.z:cb7[18].z);};
                            {bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));r3.xyw=vec3(tmp.x?r3.x:cb7[5].x,tmp.y?r3.y:cb7[5].y,tmp.z?r3.w:cb7[5].z);};
                            {bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));r3.xyw=vec3(tmp.x?r3.x:cb7[4].x,tmp.y?r3.y:cb7[4].y,tmp.z?r3.w:cb7[4].z);};
                            {bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));r3.xyw=vec3(tmp.x?r3.x:cb7[3].x,tmp.y?r3.y:cb7[3].y,tmp.z?r3.w:cb7[3].z);};
                            {bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));r3.xyw=vec3(tmp.x?r3.x:cb7[2].x,tmp.y?r3.y:cb7[2].y,tmp.z?r3.w:cb7[2].z);};
                            {bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));r13.xyz=vec3(tmp.x?r13.x:cb7[9].x,tmp.y?r13.y:cb7[9].y,tmp.z?r13.z:cb7[9].z);};
                            {bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));r13.xyz=vec3(tmp.x?r13.x:cb7[8].x,tmp.y?r13.y:cb7[8].y,tmp.z?r13.z:cb7[8].z);};
                            {bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));r6.yzw=vec3(tmp.x?r13.x:cb7[7].x,tmp.y?r13.y:cb7[7].y,tmp.z?r13.z:cb7[7].z);};
                            {bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));r6.xyz=vec3(tmp.x?r6.y:cb7[6].x,tmp.y?r6.z:cb7[6].y,tmp.z?r6.w:cb7[6].z);};
                            r13.xyz=mix(cb7[6].xyz,r6.xyz,r7.xxx);
                            r14.xyz=mix(r13.xyz,r8.xyz,r9.xxx);
                            r13.xyz=mix(cb7[7].xyz,r6.xyz,r7.yyy);
                            r15.xyz=mix(r13.xyz,r8.xyz,r9.yyy);
                            r13.xyz=r11.yyy*r15.xyz;
                            r13.xyz=r11.xxx*r14.xyz+r13.xyz;
                            r14.xyz=mix(cb7[8].xyz,r6.xyz,r7.zzz);
                            r15.xyz=mix(cb7[9].xyz,r6.xyz,r7.www);
                            r6.xyz=mix(r15.xyz,r8.xyz,r9.www);
                            r15.xyz=mix(r14.xyz,r8.xyz,r9.zzz);
                            r8.xyz=r11.zzz*r15.xyz+r13.xyz;
                            r6.xyz=r11.www*r6.xyz+r8.xyz;
                            r8.xyz=r6.xyz*r10.www;
                            r6.xyz=r10.www*(-r6.xyz)+c27.xyz;
                            r6.xyz=r0.xxx*r6.xyz+r8.xyz;
                            r8.xyz=saturate(mix(r3.zzz,r13.www,r6.xyz));
                            r13.xyz=(-r8.xyz)+c34.xxx;
                            r14.xyz=mix(cb7[2].xyz,r3.xyw,r7.xxx);
                            r15.xyz=mix(r14.xyz,r16.xyz,r9.xxx);
                            r14.xyz=mix(cb7[3].xyz,r3.xyw,r7.yyy);
                            r17.xyz=mix(r14.xyz,r16.xyz,r9.yyy);
                            r14.xyz=r11.yyy*r17.xyz;
                            r14.xyz=r11.xxx*r15.xyz+r14.xyz;
                            r15.xyz=mix(cb7[4].xyz,r3.xyw,r7.zzz);
                            r17.xyz=mix(cb7[5].xyz,r3.xyw,r7.www);
                            r3.xyz=mix(r17.xyz,r16.xyz,r9.www);
                            r7.xyz=mix(r15.xyz,r16.xyz,r9.zzz);
                            r7.xyz=r11.zzz*r7.xyz+r14.xyz;
                            r3.xyz=r11.www*r3.xyz+r7.xyz;
                            r7.xyz=mix(r3.xyz,c34.xxx,r0.xxx);
                            r3.xyz=r7.xyz*r10.xyz;
                            r7.xyz=r13.xyz*r3.xyz;
                            r7.xyz=r1.xyz*r7.xyz;
                            r7.xyz=r7.xyz*c32.xxx;
                            r9.z=dot((-r4.xyz),cb2[10].xyz);
                            r9.x=dot((-r4.xyz),cb2[8].xyz);
                            r9.y=dot((-r4.xyz),cb2[9].xyz);
                            r4.x=dot(cb4[3].xyz,r9.xyz);
                            r4.y=dot(cb4[4].xyz,r9.xyz);
                            r4.z=dot(cb4[5].xyz,r9.xyz);
                            r13=r9.yzzx*r9.xyzz;
                            r14.x=dot(cb4[6],r13);
                            r14.y=dot(cb4[7],r13);
                            r14.z=dot(cb4[8],r13);
                            r4.xyz=r4.xyz+r14.xyz;
                            r0.x=r9.y*r9.y;
                            r0.x=r9.x*r9.x+(-r0.x);
                            r4.xyz=cb4[9].xyz*r0.xxx+r4.xyz;
                            r13.xyz=max(r4.xyz,c34.www);
                            r0.x=r0.y*(-c31.x)+c31.y;
                            r0.x=1.0/r0.x;
                            r4.xyz=r0.xxx*r13.xyz;
                            r4.xyz=r0.yyy*r4.xyz;
                            r9.w=r0.y*c28.w;
                            r0.x=r0.y*r0.y;

                            r14=textureCubeLod(s0,r9.xyz,r9.w);

                            r4.xyz=r14.xyz*cb2[14].www+r4.xyz;
                            r4.xyz=r4.xyz*r8.xyz+r7.xyz;
                            r7.xyz=max(r4.xyz,c34.www);
                            r0.y=r1.w*r4.w+c28.z;
                            r0.y=(-r4.w)+r0.y;
                            r0.y=1.0/r0.y;
                            r3.w=clamp(dot(cb2[12].xyz,r5.xyz),0.0, 1.0);
                            r4.x=clamp(dot(r2.xyz,r5.xyz),0.0, 1.0);
                            r2.x=clamp(dot(cb2[12].xyz,r2.xyz),0.0, 1.0);
                            r2.y=r4.x*r4.x;
                            r2.z=(-r3.w)+c34.x;
                            r3.w=r2.z*r2.z;
                            r3.w=r3.w*r3.w;
                            r2.z=r2.z*r3.w;
                            r4.xyz=mix(r6.xyz,c34.xxx,r2.zzz);
                            r5.xyz=r0.yyy*r4.xyz;
                            r4.xyz=(-r4.xyz)+c34.xxx;
                            r3.xyz=r3.xyz*r4.xyz;
                            r0.y=r0.x*r0.x+c34.z;
                            r0.y=r2.y*r0.y+c34.x;
                            r0.xyw=r0.xyw*r0.xyw;
                            r3.w=r0.y*c27.w;
                            r0.y=r0.y*c36.z+c36.w;
                            r3.w=1.0/r3.w;
                            r0.y=r0.y>=0.0?r3.w:c37.w;
                            r0.x=r0.y*r0.x;
                            r3.xyz=r5.xyz*r0.xxx+r3.xyz;
                            r3.xyz=r2.xxx*r3.xyz;
                            r0.x=(-cb2[19].x)+cb2[19].y;
                            r0.x=1.0/r0.x;
                            r0.y=(-cb2[19].x)+v7.z;
                            r0.x=r0.x*r0.y;
                            r0.x=sqrt(abs(r0.x));
                            r0.y=1.0/v8.w;
                            r4.xy=r0.yy*v8.xy;
                            r4.xy=r4.xy*c26.zw+c26.zz;
                            r4.z=c26.z;
                            r4.xy=cb2[18].xy*r4.zz+r4.xy;

                            r4=texture2D(s1,r4.xy);

                            r0.y=r0.x+(-r4.x);
                            r3.w=r4.x*(-r4.x)+r4.y;
                            r4.x=r4.x+cb2[18].z;
                            r0.x=(-r0.x)+r4.x;
                            r0.x=r0.x>=0.0?c34.x:c34.w;
                            r4.x=max(r3.w,c24.x);
                            r0.y=r0.y*r0.y+r4.x;
                            r0.y=1.0/r0.y;
                            r0.y=r0.y*r4.x;
                            r3.w=saturate(max(r0.x,r0.y));
                            r0.x=r3.w+(-cb2[18].w);
                            r4.x=c34.x;
                            r0.y=r4.x+(-cb2[18].w);
                            r0.y=1.0/r0.y;
                            r0.x=saturate(r0.y*r0.x);
                            r0.x=(-cb2[19].x)>=0.0?r0.x:r4.x;
                            r3.w=max(cb2[19].z,r0.x);
                            r0.x=r3.w*r3.w;
                            r4.yzw=r0.xxx*cb2[13].xyz;
                            r4.yzw=r4.yzw*(-c25.zzz);
                            r3.xyz=r3.xyz*r4.yzw;
                            r5.xyz=max(r3.xyz,c34.www);
                            r3.xyz=r7.xyz+r5.xyz;
                            r5.xyz=r11.yyy*cb7[15].xyz;
                            r5.xyz=r11.xxx*cb7[14].xyz+r5.xyz;
                            r5.xyz=r11.zzz*cb7[16].xyz+r5.xyz;
                            r5.xyz=r11.www*cb7[17].xyz+r5.xyz;
                            r5.xyz=r10.xyz*r5.xyz;
                            r0.xy=c24.ww*v0.xy;

                            r6=texture2D(s11,r0.xy);

                            r6=r6+c26.zzzz;
                            r5.xyz=r5.xyz*r6.xxx;
                            r0.x=r10.w*r6.z;
                            r0.x=saturate(r0.x*(-c36.x)+c36.y);
                            r6.xz=(-r0.xx)+c28.xy;
                            r7=r6.xxxx*c29+r12.xxyz;
                            r0.y=min(r6.z,c34.x);
                            r3.w=min(r2.w,r7.y);
                            r2.w=r7.x*r3.w+r7.z;
                            r7.xyz=r6.yyy*c37.xyz;
                            r8.xyz=saturate(mix(r2.www,r7.www,r7.xyz));
                            r10.xyz=(-r8.xyz)+c34.xxx;
                            r10.xyz=r5.xyz*r10.xyz;
                            r1.xyz=r1.xyz*r10.xyz;
                            r1.xyz=r1.xyz*c32.xxx;
                            r2.w=r0.x*(-c31.x)+c31.y;
                            r2.w=1.0/r2.w;
                            r10.xyz=r2.www*r13.xyz;
                            r10.xyz=r0.xxx*r10.xyz;
                            r9.w=r0.x*c28.w;
                            r0.x=r0.x*r0.x;

                            // EveSpaceSceneMap
                            r9=textureCubeLod(s0,r9.xyz,r9.w);

                            r9.xyz=r9.xyz*cb2[14].www+r10.xyz;
                            r1.xyz=r9.xyz*r8.xyz+r1.xyz;
                            r8.xyz=max(r1.xyz,c34.www);
                            r1.xyz=r6.yyy*(-c38.xyz)+c38.www;
                            r0.z=r0.z*r6.w;
                            r1.xyz=r1.xyz*r2.zzz+r7.xyz;
                            r1.w=r1.w*r0.y+c28.z;
                            r0.y=(-r0.y)+r1.w;
                            r0.y=1.0/r0.y;
                            r6.xyz=r0.yyy*r1.xyz;
                            r1.xyz=(-r1.xyz)+c34.xxx;
                            r1.xyz=r1.xyz*r5.xyz;
                            r0.y=r0.x*r0.x+c34.z;
                            r0.y=r2.y*r0.y+c34.x;
                            r0.xy=r0.xy*r0.xy;
                            r1.w=r0.y*c27.w;
                            r0.y=r0.y*c36.z+c36.w;
                            r1.w=1.0/r1.w;
                            r0.y=r0.y>=0.0?r1.w:c37.w;
                            r0.x=r0.y*r0.x;
                            r1.xyz=r6.xyz*r0.xxx+r1.xyz;
                            r1.xyz=r2.xxx*r1.xyz;
                            r1.xyz=r4.yzw*r1.xyz;
                            r2.xyz=max(r1.xyz,c34.www);
                            r1.xyz=r8.xyz+r2.xyz;
                            r0.x=r4.x+(-cb4[0].z);
                            r0.x=1.0/r0.x;
                            r0.x=saturate(r0.x*r0.z);
                            r1.xyz=r1.xyz*r0.xxx;
                            r0.x=(-r0.x)+c34.x;
                            r0.y=r0.x*r0.x;
                            r0.x=r0.y*r0.x;
                            r0.xyz=r0.xxx*r3.xyz+r1.xyz;
                            r1.xy=mix(v0.xy,v0.zw,cb7[0].yy);

                            // Normal Map
                            //r1=texture2D(NoMapSampler,r1.xy);

                            r1.ywx=texture2D(s4,r1.xy).xyz;
                            r1.z=lighting.x;

                            r0.xyz=r0.xyz*r1.zzz+(-cb2[15].xyz);
                            r1.x=cb2[15].w*v4.w;
                            r1.x=r1.x*c32.y;
                            r1.x=exp2(r1.x);
                            r0.xyz=r1.xxx*r0.xyz+cb2[15].xyz;
                            r2.xyz=cb2[15].xyz;
                            r1.yzw=(-r2.xyz)+cb7[1].xyz;
                            r1.xyz=r1.xxx*r1.yzw+cb2[15].xyz;
                            r1.xyz=r1.xyz*cb4[0].yyy;
                            r0.xyz=r1.xyz*r0.www+r0.xyz;
                            r1.xyz=max(r0.xyz,c34.www);
                            r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                            r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                            r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                            r0.xyz=r0.xyz*cb2[21].www;
                            r1.xyz=r0.xyz*c33.xxx;
                            r2.x=exp2(r1.x);
                            r2.y=exp2(r1.y);
                            r2.z=exp2(r1.z);
                            r1.xyz=r2.xyz*c33.yyy+c33.zzz;
                            r2.x=exp2(r0.x);
                            r2.y=exp2(r0.y);
                            r2.z=exp2(r0.z);
                            r0.xyz=r2.xyz+c32.zzz;
                            r2.xyz=r2.xyz*c32.www;
                            {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                            };

                            ${ps.shadowFooter}

                        }
                `
            }
        }
    }
};


export const skinnedQuadV5 = {
    name: "skinned_quadV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/skinned_quadV5",
    description: `skinned ${quadV5.description}`,
    todo: quadV5.todo,
    techniques: {
        Depth: skinnedQuadDepthV5.techniques.Main,
        Normal: skinnedQuadNormalV5.techniques.Main,
        Picking: skinnedQuadPickingV5.techniques.Main,
        Outline: skinnedQuadOutlineV5.techniques.Main,
        Emissive: skinnedQuadEmissiveV5.techniques.Main,
        ExtendedPicking: skinnedQuadExtendedPickingV5.techniques.Main,
        Utility: skinnedQuadUtilityV5.techniques.Main,
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTexL01,
            ps: quadV5.techniques.Main.ps
        }
    }
};
