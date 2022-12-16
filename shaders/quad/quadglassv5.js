import { vs, ps, constant, texture } from "./shared";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap, DustNoiseMap } from "../shared/texture";
import { quadDepthV5, skinnedQuadDepthV5 } from "./quaddepthv5";
import { quadPickingV5, skinnedQuadPickingV5 } from "./quadpickingv5";
import { RS_CULLMODE } from "constant";
import { quadOutlineV5, skinnedQuadOutlineV5 } from "./extended/quadOutlineV5";
import { quadEmissiveV5, skinnedQuadEmissiveV5 } from "./extended/quadEmissiveV5";
import { quadUtilityGlassV5, skinnedQuadUtilityGlassV5 } from "./extended/quatUtilityGlassV5";
import { quadExtendedPickingGlassV5, skinnedQuadExtendedPickingGlassV5 } from "./extended/quadExtendedPickingGlassV5";
import { quadNormalV5, skinnedQuadNormalV5 } from "./quadNormalV5";


const shared = {
    vs: vs.quadV5_PosTexTanTexL01,
    ps: {
        constants: [
            constant.GeneralData,
            constant.GeneralGlowColor,
            constant.Mtl1DiffuseColor,
            constant.Mtl2DiffuseColor,
            constant.Mtl3DiffuseColor,
            constant.Mtl4DiffuseColor,
            constant.Mtl1FresnelColor,
            constant.Mtl2FresnelColor,
            constant.Mtl3FresnelColor,
            constant.Mtl4FresnelColor,
            constant.Mtl1Gloss,
            constant.Mtl2Gloss,
            constant.Mtl3Gloss,
            constant.Mtl4Gloss,
            constant.Mtl1DustDiffuseColor,
            constant.Mtl2DustDiffuseColor,
            constant.Mtl3DustDiffuseColor,
            constant.Mtl4DustDiffuseColor,
        ],
        textures: [
            EveSpaceSceneEnvMap,
            EveSpaceSceneShadowMap,
            texture.AlbedoMap,
            texture.RoughnessMap,
            texture.NormalMap,
            texture.PaintMaskMap,
            texture.MaterialMap,
            texture.DirtMap,
            texture.GlowMap,
            DustNoiseMap,
        ],
        shader: `

            ${ps.header}
            
            varying vec4 texcoord;
            varying vec4 texcoord1;
            varying vec4 texcoord2;
            varying vec4 texcoord3;
            varying vec4 texcoord4;
            varying vec4 texcoord5;
            varying vec4 texcoord7;
            varying vec4 texcoord8;
            
            varying vec4 lighting;
            
            uniform samplerCube s0; // EveSpaceSceneEnvMap
            uniform sampler2D s1;   // EveSpaceSceneShadowMap
            uniform sampler2D s2;   // AlbedoMap
            uniform sampler2D s3;   // RoughnessMap
            uniform sampler2D s4;   // NormalMap
            uniform sampler2D s5;   // PaintMaskMap
            uniform sampler2D s6;   // MaterialMap
            uniform sampler2D s7;   // DirtMap
            uniform sampler2D s8;   // GlowMap
            uniform sampler2D s9;   // DustNoiseMap
            
            uniform vec4 cb2[22];
            uniform vec4 cb4[3];
            uniform vec4 cb7[18];
            
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
                vec4 r0;
                vec4 r1;
                vec4 r2;
                vec4 r3;
                vec4 r4;
                vec4 r5;
                vec4 r6;
                vec4 r7;
                vec4 r8;
                
                vec4 c14=vec4(9.99999997e-007,3.14159274,-1e-015,9.99999987e+014);
                vec4 c15=vec4(-0,-0.333333343,-0.666666687,-1);
                vec4 c16=vec4(3.19148946,1.03191495,0.5,-0.5);
                vec4 c17=vec4(1,-1,0,-0);
                vec4 c18=vec4(1,1.54499996,1.10000002,6);
                vec4 c19=vec4(1.04166663,0.474999994,0.018229166,0.25);
                vec4 c20=vec4(0,-0.015625,0.75,-9.27999973);
                vec4 c21=vec4(12.9200001,0.416666657,1.05499995,-0.0549999997);
                vec4 c22=vec4(0.75,1,-1.44269507e-005,-0.00313080009);
                vec4 c23=vec4(1,1.00999999,2,-1);
                
                v0=texcoord;
                v1=texcoord1;
                v2=texcoord2;
                v3=texcoord3;
                v4=texcoord4;
                v5=texcoord5;
                v6=texcoord7;
                v7=texcoord8;
                
                vec4 vFace = gl_FrontFacing ? vec4(1.0) : vec4(-1.0);
                
                r0.xyz=(-cb4[1].xyz)+v5.xyz;
                r0.x=dot(r0.xyz,r0.xyz);
                r0.w=cb4[1].w;
                r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                if(any(lessThan(r0,vec4(0.0))))discard;
                r0.x=(-cb2[19].x)+cb2[19].y;
                r0.x=1.0/r0.x;
                r0.y=(-cb2[19].x)+v6.z;
                r0.x=r0.x*r0.y;
                r0.x=sqrt(abs(r0.x));
                r0.y=1.0/v7.w;
                r0.yz=r0.yy*v7.xy;
                r0.yz=r0.yz*c16.zw+c16.zz;
                r1.z=c16.z;
                r0.yz=cb2[18].xy*r1.zz+r0.yz;
                r1=texture2D(s1,r0.yz);
                r0.y=r0.x+(-r1.x);
                r0.z=r1.x*(-r1.x)+r1.y;
                r0.w=r1.x+cb2[18].z;
                r0.x=(-r0.x)+r0.w;
                r0.x=r0.x>=0.0?c17.x:c17.z;
                r1.x=max(r0.z,c14.x);
                r0.y=r0.y*r0.y+r1.x;
                r0.y=1.0/r0.y;
                r0.y=r0.y*r1.x;
                r1.x=saturate(max(r0.x,r0.y));
                r0.x=r1.x+(-cb2[18].w);
                r1.x=c17.x;
                r0.y=r1.x+(-cb2[18].w);
                r0.y=1.0/r0.y;
                r0.x=saturate(r0.y*r0.x);
                r0.x=(-cb2[19].x)>=0.0?r0.x:r1.x;
                r1.x=max(cb2[19].z,r0.x);
                r0.x=r1.x*r1.x;
                r0.xyz=r0.xxx*cb2[13].xyz;
                r0.xyz=r0.xyz*(-c15.zzz);
                r0.w=vFace.w>=0.0?c17.x:c17.y;
                r0.w=(-r0.w)>=0.0?c17.z:c17.x;
                r1.x=vFace.x>=0.0?c17.w:c17.y;
                r0.w=r0.w+r1.x;
                r1.xyz=(-r0.www)*v1.xyz;
                
                // NormalMap
                r2.ywx=texture2D(s4,v0.xy).xyz;
                
                // Ambient occlusion
                r2.z=lighting.x;
                
                r2.xy=r2.yw*c23.zz+c23.ww;
                r3.xyz=r2.yyy*v3.xyz;
                r3.xyz=r2.xxx*v2.xyz+r3.xyz;
                r0.w=saturate(dot(r2.xy,r2.xy)+c17.z);
                r0.w=(-r0.w)+c17.x;
                r0.w=sqrt(abs(r0.w));
                r1.xyz=r0.www*r1.xyz+r3.xyz;
                r2.xyz=normalize(r1.xyz);
                r0.w=clamp(dot(cb2[12].xyz,r2.xyz),0.0, 1.0);
                r1.x=dot(v4.xyz,v4.xyz);
                r1.x=r1.x==0.0?3.402823466e+38:inversesqrt(abs(r1.x));
                r1.yzw=v4.xyz*r1.xxx+cb2[12].xyz;
                r3.xyz=r1.xxx*v4.xyz;
                r4.xyz=normalize(r1.yzw);
                r1.x=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                r1.x=(-r1.x)+c17.x;
                r1.y=r1.x*r1.x;
                r1.y=r1.y*r1.y;
                r1.x=r1.y*r1.x;
                
                // PaintMaskMap
                r5.x=texture2D(s5,v0.xy).x;
                
                // MaterialMap
                r5.y=texture2D(s6,v0.xy).x;    
                
                // DirtMap (Not required here)
                r5.z=texture2D(s7,v0.xy).x;   
                
                // GlowMap     
                r5.w=texture2D(s8,v0.xy).x;    
                
                r6=r5.yyyy+c15;
                r6=r6*c16.xxxx;
                r6=saturate((-abs(r6))+c16.yyyy);
                r1.yzw=r6.yyy*cb7[7].xyz;
                r1.yzw=r6.xxx*cb7[6].xyz+r1.yzw;
                r1.yzw=r6.zzz*cb7[8].xyz+r1.yzw;
                r1.yzw=r6.www*cb7[9].xyz+r1.yzw;
                
                // AlbedoMap
                r7.xyz=texture2D(s2,v0.xy).xyz;
                
                // RoughnessMap
                r7.w=texture2D(s3,v0.xy).x;
                
                r7.xyz=r7.www*(-r1.yzw)+c17.xxx;
                r1.yzw=r1.yzw*r7.www;
                r7.xyz=r7.xyz*r1.xxx+r1.yzw;
                r1.x=clamp(dot(r4.xyz,r3.xyz),0.0,1.0);
                r2.w=clamp(dot(r2.xyz,r4.xyz),0.0,1.0);
                r2.w=r2.w*r2.w;
                r1.x=r1.x*r1.x;
                r3.w=r6.y*cb7[11].x;
                r3.w=r6.x*cb7[10].x+r3.w;
                r3.w=r6.z*cb7[12].x+r3.w;
                r3.w=r6.w*cb7[13].x+r3.w;
                r3.w=saturate(r7.w*(-r3.w)+c17.x);
                r4.xy=(-r3.ww)+c18.xy;
                r5.y=min(r4.y,c17.x);
                r8.xyz=c20.xyz;
                r4=r4.xxxx*c19+r8.xxyz;
                r1.x=r1.x*r5.y+c18.z;
                r1.x=(-r5.y)+r1.x;
                r1.x=1.0/r1.x;
                r7.xyz=r1.xxx*r7.xyz;
                r1.x=r3.w*r3.w;
                r8.w=r3.w*c18.w;
                r3.w=r1.x*r1.x+c17.y;
                r1.x=r1.x*r1.x;
                r2.w=r2.w*r3.w+c17.x;
                r2.w=r2.w*r2.w;
                r3.w=r2.w*c14.y;
                r2.w=r2.w*c14.y+c14.z;
                r3.w=1.0/r3.w;
                r2.w=r2.w>=0.0?r3.w:c14.w;
                r1.x=r1.x*r2.w;
                r7.xyz=r1.xxx*r7.xyz;
                r7.xyz=r0.www*r7.xyz;
                r0.xyz=r0.xyz*r7.xyz;
                r7.xyz=max(r0.xyz,c17.zzz);
                r0.x=dot(r3.xyz,r2.xyz);
                r0.y=r0.x+r0.x;
                r0.yzw=r2.xyz*(-r0.yyy)+r3.xyz;
                r8.x=dot((-r0.yzw),cb2[8].xyz);
                r8.y=dot((-r0.yzw),cb2[9].xyz);
                r8.z=dot((-r0.yzw),cb2[10].xyz);
                r2=textureCubeLod(s0,r8.xyz,r8.w);
                r0.yzw=r2.xyz*cb2[14].www;
                r1.x=saturate(r0.x);
                r0.x=abs(r0.x)*(-c22.x)+c22.y;
                r1.x=r1.x*c20.w;
                r1.x=exp2(r1.x);
                r2.x=min(r1.x,r4.y);
                r1.x=r4.x*r2.x+r4.z;
                r2.xyz=saturate(mix(r1.xxx,r4.www,r1.yzw));
                r0.yzw=r0.yzw*r2.xyz;
                r1.xyz=max(r0.yzw,c17.zzz);
                r0.yzw=r1.xyz+r7.xyz;
                r1.xyz=r6.yyy*cb7[3].xyz;
                r1.xyz=r6.xxx*cb7[2].xyz+r1.xyz;
                r1.xyz=r6.zzz*cb7[4].xyz+r1.xyz;
                r1.xyz=r6.www*cb7[5].xyz+r1.xyz;
                r2.xy=(-r5.xx)+c23.xy;
                r1.w=r5.w*r5.w;
                r2.z=(-r2.x)+c17.x;
                r1.xyz=r1.xyz*r2.zzz;
                r0.xyz=r1.xyz*r0.xxx+r0.yzw;
                r1.xy=mix(v0.xy,v0.zw,cb7[0].yy);
                
                // NormalMap
                r3.ywx=texture2D(s4,r1.xy).xyz;
                
                // Ambient occlusion
                r3.z=lighting.x;
                
                r0.xyz=r0.xyz*r3.zzz+(-cb2[15].xyz);
                r0.w=cb2[15].w*v4.w;
                r0.w=r0.w*c22.z;
                r0.w=exp2(r0.w);
                r0.xyz=r0.www*r0.xyz+cb2[15].xyz;
                r1.xyz=cb2[15].xyz;
                r1.xyz=(-r1.xyz)+cb7[1].xyz;
                r1.xyz=r0.www*r1.xyz+cb2[15].xyz;
                r1.xyz=r1.xyz*cb4[0].yyy;
                r0.xyz=r1.xyz*r1.www+r0.xyz;
                r1.xyz=max(r0.xyz,c17.zzz);
                r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                r0.xyz=r0.xyz*cb2[21].www;
                r1.xyz=r0.xyz*c21.yyy;
                r3.x=exp2(r1.x);
                r3.y=exp2(r1.y);
                r3.z=exp2(r1.z);
                r1.xyz=r3.xyz*c21.zzz+c21.www;
                r3.x=exp2(r0.x);
                r3.y=exp2(r0.y);
                r3.z=exp2(r0.z);
                r0.xyz=r3.xyz+c22.www;
                r3.xyz=r3.xyz*c21.xxx;
                {
                    bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                    r0.xyz=vec3(tmp.x?r1.x:r3.x,tmp.y?r1.y:r3.y,tmp.z?r1.z:r3.z);
                };
                r0.w=1.0/r2.y;
                gl_FragData[0].w=r2.x;
                r1.xyz=r0.www*r0.xyz;
                r0.xyz=r0.xyz*(-r0.www)+r0.xyz;
                gl_FragData[0].xyz=r6.xxx*r0.xyz+r1.xyz;

                ${ps.shadowFooter}                        
            }
        `
    }
};

export const quadGlassV5 = {
    name: "quadGlassV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadGlassV5",
    description: "glass quad shader",
    todo: "Add dirt",
    techniques: {
        Depth: quadDepthV5.techniques.Main,
        Normal: quadNormalV5.techniques.Main,
        Picking: quadPickingV5.techniques.Main,
        Emissive: quadEmissiveV5.techniques.Main,
        ExtendedPicking: quadExtendedPickingGlassV5.techniques.Main,
        Outline: quadOutlineV5.techniques.Main,
        Utility: quadUtilityGlassV5.techniques.Main,
        Main: [
            {
                vs: shared.vs,
                ps: shared.ps,
                states: {
                    [RS_CULLMODE]: 3
                }
            },
            {
                vs: shared.vs,
                ps: shared.ps,
                states: {
                    [RS_CULLMODE]: 2
                }
            }
        ]
    }
};


export const skinnedQuadGlassV5 = {
    name: "skinned_quadGlassV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/skinned_quadGlassV5",
    description: `skinned ${quadGlassV5.description}`,
    todo: quadGlassV5.todo,
    techniques: {
        Depth: skinnedQuadDepthV5.techniques.Main,
        Normal: skinnedQuadNormalV5.techniques.Main,
        Picking: skinnedQuadPickingV5.techniques.Main,
        Emissive: skinnedQuadEmissiveV5.techniques.Main,
        ExtendedPicking: skinnedQuadExtendedPickingGlassV5.techniques.Main,
        Outline: skinnedQuadOutlineV5.techniques.Main,
        Utility: skinnedQuadUtilityGlassV5.techniques.Main,
        Main: [
            {
                vs: vs.skinnedQuadV5_PosBwtTexTanTexL01,
                ps: shared.ps,
                states: {
                    [RS_CULLMODE]: 3
                }
            },
            {
                vs: vs.skinnedQuadV5_PosBwtTexTanTexL01,
                ps: shared.ps,
                states: {
                    [RS_CULLMODE]: 2
                }
            }
        ]
    }
};