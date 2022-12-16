import { vs, ps, constant, texture } from "./shared";
import { quadPickingV5, skinnedQuadPickingV5 } from "./quadpickingv5";
import { quadDepthV5, skinnedQuadDepthV5 } from "./quaddepthv5";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap } from "../shared/texture";
import { quadOutlineV5, skinnedQuadOutlineV5 } from "./extended/quadOutlineV5";
import { quadEmissiveV5, skinnedQuadEmissiveV5 } from "./extended/quadEmissiveV5";
import { quadNormalV5, skinnedQuadNormalV5 } from "./quadNormalV5";


export const quadEnvironmentV5 = {
    name: "quadEnvironmentV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadEnvironmentV5",
    description: "asteroid quad shader",
    techniques: {
        Picking: quadPickingV5.techniques.Main,
        Depth: quadDepthV5.techniques.Main,
        Normal: quadNormalV5.techniques.Main,
        Emissive: quadEmissiveV5.techniques.Main,
        Outline: quadOutlineV5.techniques.Main,
        Main: {
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
                    constant.DetailData,
                    constant.GeneralTiling,
                    constant.Detail1AlbedoColor,
                    constant.Detail1FresnelColor,
                    constant.Detail2AlbedoColor,
                    constant.Detail2FresnelColor,
                    constant.Detail1Material,
                    constant.Detail2Material
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
                    texture.Detail1Map,
                    texture.Detail2Map
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
                    
                    uniform samplerCube s0;
                    uniform sampler2D s1;
                    uniform sampler2D s2;  // AlbedoMap,  
                    uniform sampler2D s3;  // RoughnessMap,   
                    uniform sampler2D s4;  // NormalMap,
                    uniform sampler2D s5;  // PaintMaskMap,
                    uniform sampler2D s6;  // MaterialMap,
                    uniform sampler2D s7;  // DirtMap,
                    uniform sampler2D s8;  // GlowMap,
                    uniform sampler2D s9;  // Detail1Map
                    uniform sampler2D s10; // Detail2Map
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[3];
                    uniform vec4 cb7[22];

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
                        vec4 r10;
                        vec4 r11;
                        vec4 r12;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        vec4 c22=vec4(9.99999997e-007,3.14159274,-1e-015,9.99999987e+014);
                        vec4 c23=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c24=vec4(1,2,-1,0);
                        vec4 c25=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c26=vec4(1,1.54499996,1.10000002,6);
                        vec4 c27=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c28=vec4(0,-0.015625,0.75,-9.27999973);
                        vec4 c29=vec4(7,0.119999997,0.318309873,-1.44269507e-005);
                        vec4 c30=vec4(-0.00313080009,12.9200001,0.416666657,0);
                        vec4 c31=vec4(1.05499995,-0.0549999997,0,0);
                        
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v4=texcoord4;
                        v5=texcoord5;
                        v6=texcoord7;
                        v7=texcoord8;
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0=cb7[14].xxyy*v0.xyxy;
                        
                         // PaintMaskMap
                        r1.x=texture2D(s5,r0.zw).x;
                        
                        // MaterialMap
                        r1.y=texture2D(s6,r0.zw).x;    
                        
                        // DirtMap (Not required here)
                        r1.z=texture2D(s7,r0.zw).x;   
                        
                        // GlowMap     
                        r1.w=texture2D(s8,r0.zw).x;    
                        
                        gl_FragData[0].w=(-r1.x)+c24.x;
                        r1.y=(-cb2[19].x)+cb2[19].y;
                        r1.y=1.0/r1.y;
                        r1.z=(-cb2[19].x)+v6.z;
                        r1.xy=r1.wy*r1.wz;
                        r1.y=sqrt(abs(r1.y));
                        r1.z=1.0/v7.w;
                        r1.zw=r1.zz*v7.xy;
                        r1.zw=r1.zw*c25.zw+c25.zz;
                        r2.z=c25.z;
                        r1.zw=cb2[18].xy*r2.zz+r1.zw;
                        r2=texture2D(s1,r1.zw);
                        r1.z=r1.y+(-r2.x);
                        r1.w=r2.x*(-r2.x)+r2.y;
                        r2.x=r2.x+cb2[18].z;
                        r1.y=(-r1.y)+r2.x;
                        r1.y=r1.y>=0.0?c24.x:c24.w;
                        r2.x=max(r1.w,c22.x);
                        r1.z=r1.z*r1.z+r2.x;
                        r1.z=1.0/r1.z;
                        r1.z=r1.z*r2.x;
                        r2.x=saturate(max(r1.y,r1.z));
                        r1.y=r2.x+(-cb2[18].w);
                        r2.x=c24.x;
                        r1.z=r2.x+(-cb2[18].w);
                        r1.z=1.0/r1.z;
                        r1.y=saturate(r1.z*r1.y);
                        r1.y=(-cb2[19].x)>=0.0?r1.y:r2.x;
                        r2.x=max(cb2[19].z,r1.y);
                        r1.y=r2.x*r2.x;
                        r1.yzw=r1.yyy*cb2[13].xyz;
                        r1.yzw=r1.yzw*(-c23.zzz);
                        r2.x=dot(v4.xyz,v4.xyz);
                        r2.x=r2.x==0.0?3.402823466e+38:inversesqrt(abs(r2.x));
                        r2.yzw=v4.xyz*r2.xxx+cb2[12].xyz;
                        r3.xyz=r2.xxx*v4.xyz;
                        r4.xyz=normalize(r2.yzw);
                        r2.x=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r2.x=(-r2.x)+c24.x;
                        r2.y=r2.x*r2.x;
                        r2.y=r2.y*r2.y;
                        r2.x=r2.y*r2.x;
                        r5=cb7[15].xxyy*v0.xyxy;
                        
                        // Detail1Map
                        r6=texture2D(s9,r5.xy);
                        
                        // Detail2Map
                        r5=texture2D(s10,r5.zw);
                        
                        // PaintMaskMap
                        r7.x=texture2D(s5,r0.xy).x * ${texture.PaintMaskMap.multiplier};
                        
                        // MaterialMap
                        r7.y=texture2D(s6,r0.xy).x;    
                        
                        // DirtMap (Not required here) <----------------------------------------------------------------
                        r7.z=texture2D(s7,r0.xy).x;   
                        
                        // GlowMap     
                        r7.w=texture2D(s8,r0.xy).x;   
                        
                        r7=r7.yyyy+c23;
                        r7=r7*c25.xxxx;
                        r7=saturate((-abs(r7))+c25.yyyy);
                        r8.xz=r7.xy*cb7[20].xy;
                        r8.yw=r7.xy*cb7[21].xy;
                        r0.xy=r8.zw+r8.xy;
                        r8.xz=r7.zw*cb7[20].zw;
                        r8.yw=r7.zw*cb7[21].zw;
                        r0.xy=r0.xy+r8.xy;
                        r0.xy=r8.zw+r0.xy;
                        r2.yz=saturate(r0.xy);
                        r2.y=r6.w*r2.y;
                        r6.xyz=r6.xyz*c24.yyy+c24.zzz;
                        r2.z=r5.w*r2.z;
                        r5.xyz=r5.xyz*c24.yyy+c24.zzz;
                        r5.xyz=r0.yyy*r5.xyz;
                        r5.xyz=r0.xxx*r6.xyz+r5.xyz;
                        r6.xyz=r7.yyy*cb7[7].xyz;
                        r6.xyz=r7.xxx*cb7[6].xyz+r6.xyz;
                        r6.xyz=r7.zzz*cb7[8].xyz+r6.xyz;
                        r6.xyz=r7.www*cb7[9].xyz+r6.xyz;
                        r8.xyz=mix(r6.xyz,cb7[17].xyz,r2.yyy);
                        r6.xyz=mix(r8.xyz,cb7[19].xyz,r2.zzz);
                       
                        // AlbedoMap
                        r8.xyz=texture2D(s2,r0.zw).xyz;
                        
                        // RoughnessMap
                        r8.w=texture2D(s3,r0.zw).x;
                        
                        // NormalMap
                        r0.ywx=texture2D(s4,r0.zw).xyz;
                        
                        // Ambient occlusion
                        r0.z=lighting.x;
                        
                        r0.xy=r0.yw*c24.yy+c24.zz;
                        r9.xyz=r8.www*(-r6.xyz)+c24.xxx;
                        r6.xyz=r6.xyz*r8.www;
                        r9.xyz=r9.xyz*r2.xxx+r6.xyz;
                        r10.xyz=(-r9.xyz)+c24.xxx;
                        r11.xyz=r7.yyy*cb7[3].xyz;
                        r11.xyz=r7.xxx*cb7[2].xyz+r11.xyz;
                        r11.xyz=r7.zzz*cb7[4].xyz+r11.xyz;
                        r11.xyz=r7.www*cb7[5].xyz+r11.xyz;
                        r12.xyz=mix(r11.xyz,cb7[16].xyz,r2.yyy);
                        r11.xyz=mix(r12.xyz,cb7[18].xyz,r2.zzz);
                        r2.xyz=r8.xyz*r11.xyz;
                        r8.xyz=r10.xyz*r2.xyz;
                        r0.w=r7.y*cb7[11].x;
                        r0.w=r7.x*cb7[10].x+r0.w;
                        r0.w=r7.z*cb7[12].x+r0.w;
                        r0.w=r7.w*cb7[13].x+r0.w;
                        r0.w=saturate(r8.w*(-r0.w)+c24.x);
                        r7.xy=(-r0.ww)+c26.xy;
                        r2.w=min(r7.y,c24.x);
                        r10.xyz=c28.xyz;
                        r7=r7.xxxx*c27+r10.xxyz;
                        r3.w=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r3.w=r3.w*r3.w;
                        r3.w=r3.w*r2.w+c26.z;
                        r2.w=(-r2.w)+r3.w;
                        r2.w=1.0/r2.w;
                        r9.xyz=r2.www*r9.xyz;
                        r2.w=saturate(dot(r0.xy,r0.xy)+c24.w);
                        r2.w=(-r2.w)+c24.x;
                        r2.w=r2.w==0.0?3.402823466e+38:inversesqrt(abs(r2.w));
                        r0.z=1.0/r2.w;
                        r0.xyz=r5.xyz+r0.xyz;
                        r5.xyz=normalize(r0.xyz);
                        r0.xyz=r5.yyy*v3.xyz;
                        r0.xyz=r5.xxx*v2.xyz+r0.xyz;
                        r0.xyz=r5.zzz*v1.xyz+r0.xyz;
                        r5.xyz=normalize(r0.xyz);
                        r0.x=clamp(dot(r5.xyz,r4.xyz),0.0, 1.0);
                        r0.xy=r0.xw*r0.xw;
                        r4.w=r0.w*c26.w;
                        r0.z=r0.y*r0.y+c24.z;
                        r0.x=r0.x*r0.z+c24.x;
                        r0.xy=r0.xy*r0.xy;
                        r0.z=r0.x*c22.y;
                        r0.x=r0.x*c22.y+c22.z;
                        r0.z=1.0/r0.z;
                        r0.x=r0.x>=0.0?r0.z:c22.w;
                        r0.x=r0.x*r0.y;
                        r0.xyz=r9.xyz*r0.xxx+r8.xyz;
                        r0.w=clamp(dot(cb2[12].xyz,r5.xyz),0.0, 1.0);
                        r0.xyz=r0.www*r0.xyz;
                        r0.xyz=r1.yzw*r0.xyz;
                        r1.yzw=max(r0.xyz,c24.www);
                        r0.x=dot(r3.xyz,r5.xyz);
                        r0.y=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c28.w;
                        r0.x=exp2(r0.x);
                        r2.w=min(r0.x,r7.y);
                        r0.x=r7.x*r2.w+r7.z;
                        r8.xyz=saturate(mix(r0.xxx,r7.www,r6.xyz));
                        r0.xyz=r5.xyz*(-r0.yyy)+r3.xyz;
                        r4.x=dot((-r0.xyz),cb2[8].xyz);
                        r4.y=dot((-r0.xyz),cb2[9].xyz);
                        r4.z=dot((-r0.xyz),cb2[10].xyz);
                        r0=textureCubeLod(s0,r4.xyz,r4.w);
                        r0.xyz=r0.xyz*cb2[14].www;
                        r5.w=c29.x;
                        r3=textureCubeLod(s0,r5.xyz,r5.w);
                        r0.w=cb2[14].w;
                        r0.w=r0.w*c29.y;
                        r3.xyz=r3.xyz*cb2[14].www+r0.www;
                        r4.xyz=(-r8.xyz)+c24.xxx;
                        r2.xyz=r2.xyz*r4.xyz;
                        r2.xyz=r3.xyz*r2.xyz;
                        r2.xyz=r2.xyz*c29.zzz;
                        r0.xyz=r0.xyz*r8.xyz+r2.xyz;
                        r2.xyz=max(r0.xyz,c24.www);
                        r0.xyz=r1.yzw+r2.xyz;
                        r1.yz=mix(v0.xy,v0.zw,cb7[0].yy);
                        
                        // NormalMap
                        r2.ywx=texture2D(s4,r1.yz).xyz;
                        
                        // Ambient Occlusion
                        r2.z=lighting.x;
                        
                        r0.xyz=r0.xyz*r2.zzz+(-cb2[15].xyz);
                        r0.w=cb2[15].w*v4.w;
                        r0.w=r0.w*c29.w;
                        r0.w=exp2(r0.w);
                        r0.xyz=r0.www*r0.xyz+cb2[15].xyz;
                        r2.xyz=cb2[15].xyz;
                        r1.yzw=(-r2.xyz)+cb7[1].xyz;
                        r1.yzw=r0.www*r1.yzw+cb2[15].xyz;
                        r1.yzw=r1.yzw*cb4[0].yyy;
                        r0.xyz=r1.yzw*r1.xxx+r0.xyz;
                        r1.xyz=max(r0.xyz,c24.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c30.zzz;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c31.xxx+c31.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c30.xxx;
                        r2.xyz=r2.xyz*c30.yyy;
                        {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                        }
                        
                        ${ps.shadowFooter}
                    }
                `
            }
        }
    }
};


export const skinnedQuadEnvironmentV5 = {
    name: "skinnedQuadEnvironmentV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/skinnedQuadEnvironmentV5",
    description: `skinned ${quadEnvironmentV5.description}`,
    techniques: {
        Picking: skinnedQuadPickingV5.techniques.Main,
        Depth: skinnedQuadDepthV5.techniques.Main,
        Normal: skinnedQuadNormalV5.techniques.Main,
        Emissive: skinnedQuadEmissiveV5.techniques.Main,
        Outline: skinnedQuadOutlineV5.techniques.Main,
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTexL01,
            ps: quadEnvironmentV5.techniques.Main.ps
        }
    }
};