import { quadDepthV5 } from "./quaddepthv5";
import { quadPickingV5 } from "./quadpickingv5";
import { vs, ps, constant, texture } from "./shared";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap, DustNoiseMap } from "../shared/texture";
import { RS_ZWRITEENABLE } from "constant";


export const quadSailsV5 = {
    name: "quadSailsV5",
    path: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/",
    description: "sail shader",
    todo: "Add dirt",
    techniques: {
        Depth: quadDepthV5.techniques.Main,
        Picking: quadPickingV5.techniques.Main,
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                textures: [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    texture.AlbedoMap,                  
                    texture.RoughnessMap,               
                    texture.NormalMap,                  
                    texture.AoMap,                      
                    texture.PaintMaskMap,               
                    texture.MaterialMap,                
                    texture.DirtMap,                    
                    texture.GlowMap,
                    DustNoiseMap,
                    texture.SailsDetailMap,
                ],
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
                    constant.SailsDetailData,
                    constant.Mtl1DustDiffuseColor,
                    constant.Mtl2DustDiffuseColor,
                    constant.Mtl3DustDiffuseColor,
                    constant.Mtl4DustDiffuseColor,
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
                    
                    uniform samplerCube s0;
                    uniform sampler2D s1;
                    uniform sampler2D s2;   // AlbedoMap
                    uniform sampler2D s3;   // RoughnessMap
                    uniform sampler2D s4;   // NormalMap
                    uniform sampler2D s5;   // AoMap
                    uniform sampler2D s6;   // PaintMaskMap
                    uniform sampler2D s7;   // MaterialMap
                    uniform sampler2D s8;   // DirtMap
                    uniform sampler2D s9;   // GlowMap
                    uniform sampler2D s10;  // DustNoiseMap
                    uniform sampler2D s11;  // SailsDetailMap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[3];
                    uniform vec4 cb7[23];

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
                        vec4 r9;
                        
                        vec4 c15=vec4(9.99999997e-007,3.14159274,-1e-015,9.99999987e+014);
                        vec4 c16=vec4(0.159154937,0.5,6.28318548,-3.14159274);
                        vec4 c17=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c18=vec4(1,3.19148946,1.03191495,0.498039216);
                        vec4 c19=vec4(1,1.54499996,1.10000002,6);
                        vec4 c20=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c21=vec4(0,-0.015625,0.75,-9.27999973);
                        vec4 c22=vec4(7,0.119999997,0.318309873,-1.44269507e-005);
                        vec4 c23=vec4(-0.00313080009,12.9200001,0.416666657,0);
                        vec4 c24=vec4(1.05499995,-0.0549999997,0,0);
                        vec4 c25=vec4(-1,-0,2,0);
                        vec4 c26=vec4(1,-1,0.5,-0.5);
                        
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
                        
                        // PaintMaskMap
                        r0.x=texture2D(s6,v0.xy).x * ${texture.PaintMaskMap.multiplier};  
                        
                        // MaterialMap
                        r0.y=texture2D(s7,v0.xy).x;    
                        
                        // DirtMap (Not required here) <----------------------------------------------------------------    
                        r0.z=texture2D(s8,v0.xy).x;   
                        
                        // GlowMap     
                        r0.w=texture2D(s9,v0.xy).x;   
                        
                        r0.x=(-r0.x)+c18.x;
                        r0.z=r0.y*c18.y;
                        r0.z=saturate((-abs(r0.z))+c18.z);
                        r1.x=mix(r0.x,c18.x,r0.z);
                        r0.x=(-r1.x)+c18.w;
                        {
                            bvec4 tmp=greaterThanEqual(r0.xxxx,vec4(0.0));
                            r2=vec4(tmp.x?c25.x:c25.y,tmp.y?c25.x:c25.y,tmp.z?c25.x:c25.y,tmp.w?c25.x:c25.y);
                        }
                        if(any(lessThan(r2,vec4(0.0))))discard;
                        r2.xy=c16.xy;
                        r0.x=cb7[14].y*r2.x+r2.y;
                        r0.x=fract(r0.x);
                        r0.x=r0.x*c16.z+c16.w;
                        r3.xy=vec2(cos(r0.x), sin(r0.x));
                        r1.yz=cb7[14].xx*v0.xy;
                        r4.y=dot(r3.yx,r1.yz)+c25.w;
                        r2.xz=r3.xy*c26.xy;
                        r4.x=dot(r2.xz,r1.yz)+c25.w;
                        
                        // SailsDetailMap,
                        r3=texture2D(s11,r4.xy);
                        
                        r1.y=mix(r0.y,r3.x,r0.z);
                        r0.x=r0.w*r0.w;
                        r3=r1.yyyy+c17;
                        r3=r3*c18.yyyy;
                        r3=saturate((-abs(r3))+c18.zzzz);
                        r0.y=r3.y*cb7[11].x;
                        r0.y=r3.x*cb7[10].x+r0.y;
                        r0.y=r3.z*cb7[12].x+r0.y;
                        r0.y=r3.w*cb7[13].x+r0.y;
                        
                        // NormalMap 
                        r4.ywx=texture2D(s4,v0.xy).xyz; 
                        
                        // AoMap
                        r4.z=texture2D(s5,v0.xy).x;    
                        
                        r0.zw=r4.yw*c25.zz+c25.xx;
                        r1.y=saturate(dot(r0.zw,r0.zw)+c25.w);
                        r1.y=(-r1.y)+c18.x;
                        r1.y=sqrt(abs(r1.y));
                        r2.xzw=r0.www*v3.xyz;
                        r2.xzw=r0.zzz*v2.xyz+r2.xzw;
                        r1.yzw=r1.yyy*v1.xyz+r2.xzw;
                        r4.xyz=normalize(r1.yzw);
                        r4.w=c22.x;
                        r5=textureCubeLod(s0,r4.xyz,r4.w);
                        r0.w=cb2[14].w;
                        r0.z=r0.w*c22.y;
                        r1.yzw=r5.xyz*cb2[14].www+r0.zzz;
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xzw=v4.xyz*r0.zzz+cb2[12].xyz;
                        r5.xyz=normalize(r2.xzw);
                        r2.xzw=r0.zzz*v4.xyz;
                        r0.z=clamp(dot(r5.xyz,r2.xzw),0.0, 1.0);
                        r0.w=dot(r2.xzw,r4.xyz);
                        r4.w=r0.w+r0.w;
                        r2.xzw=r4.xyz*(-r4.www)+r2.xzw;
                        r6.z=dot((-r2.xzw),cb2[10].xyz);
                        r0.z=r0.z*r0.z;
                        r0.w=saturate(r0.w);
                        r0.w=r0.w*c21.w;
                        r0.w=exp2(r0.w);
                        r7.xyz=r3.yyy*cb7[3].xyz;
                        r7.xyz=r3.xxx*cb7[2].xyz+r7.xyz;
                        r7.xyz=r3.zzz*cb7[4].xyz+r7.xyz;
                        r7.xyz=r3.www*cb7[5].xyz+r7.xyz;
                        
                        // AlbedoMap 
                        r8.xyz=texture2D(s2,v0.xy).xyz;    
                        
                        // RoughnessMap    
                        r8.w=texture2D(s3,v0.xy).x;   
                        
                        r7.xyz=r7.xyz*r8.xyz;
                        r0.y=saturate(r8.w*(-r0.y)+c18.x);
                        r6.w=r0.y*c19.w;
                        r6.x=dot((-r2.xzw),cb2[8].xyz);
                        r6.y=dot((-r2.xzw),cb2[9].xyz);
                        r6=textureCubeLod(s0,r6.xyz,r6.w);
                        r2.xzw=r6.xyz*cb2[14].www;
                        r6.xy=(-r0.yy)+c19.xy;
                        r8.xyz=c21.xyz;
                        r9=r6.xxxx*c20+r8.xxyz;
                        r4.w=min(r0.w,r9.y);
                        r0.w=r9.x*r4.w+r9.z;
                        r6.xzw=r3.yyy*cb7[7].xyz;
                        r6.xzw=r3.xxx*cb7[6].xyz+r6.xzw;
                        r3.xyz=r3.zzz*cb7[8].xyz+r6.xzw;
                        r3.xyz=r3.www*cb7[9].xyz+r3.xyz;
                        r6.xzw=r3.xyz*r8.www;
                        r8.xyz=saturate(mix(r0.www,r9.www,r6.xzw));
                        r9.xyz=(-r8.xyz)+c18.xxx;
                        r9.xyz=r7.xyz*r9.xyz;
                        r1.yzw=r1.yzw*r9.xyz;
                        r1.yzw=r1.yzw*c22.zzz;
                        r1.yzw=r2.xzw*r8.xyz+r1.yzw;
                        r2.xzw=r8.www*(-r3.xyz)+c18.xxx;
                        r0.w=min(r6.y,c18.x);
                        r0.z=r0.z*r0.w+c19.z;
                        r0.z=(-r0.w)+r0.z;
                        r0.y=r0.y*r0.y;
                        r0.w=r0.y*r0.y+(-c18.x);
                        r3.x=clamp(dot(r4.xyz,r5.xyz),0.0, 1.0);
                        r3.x=r3.x*r3.x;
                        r0.w=r3.x*r0.w+c18.x;
                        r0.yw=r0.yw*r0.yw;
                        r3.x=r0.w*c15.y+c15.z;
                        r0.w=r0.w*(-c16.w);
                        r0.w=1.0/r0.w;
                        r0.w=r3.x>=0.0?r0.w:c15.w;
                        r0.y=r0.w*r0.y;
                        r0.w=clamp(dot(cb2[12].xyz,r5.xyz),0.0, 1.0);
                        r0.w=(-r0.w)+c18.x;
                        r3.x=r0.w*r0.w;
                        r3.x=r3.x*r3.x;
                        r0.w=r0.w*r3.x;
                        r2.xzw=r2.xzw*r0.www+r6.xzw;
                        r0.z=1.0/r0.z;
                        r3.xyz=(-r2.xzw)+c18.xxx;
                        r3.xyz=r3.xyz*r7.xyz;
                        r2.xzw=r0.zzz*r2.xzw;
                        r0.yzw=r2.xzw*r0.yyy+r3.xyz;
                        r2.x=(-cb2[19].x)+cb2[19].y;
                        r2.x=1.0/r2.x;
                        r2.z=(-cb2[19].x)+v6.z;
                        r2.x=r2.x*r2.z;
                        r2.x=sqrt(abs(r2.x));
                        r2.z=1.0/v7.w;
                        r2.zw=r2.zz*v7.xy;
                        r2.zw=r2.zw*c26.zw+c26.zz;
                        r2.yz=cb2[18].xy*r2.yy+r2.zw;
                        r3=texture2D(s1,r2.yz);
                        r2.y=r2.x+(-r3.x);
                        r2.z=r3.x*(-r3.x)+r3.y;
                        r3.y=max(r2.z,c15.x);
                        r2.y=r2.y*r2.y+r3.y;
                        r2.y=1.0/r2.y;
                        r2.y=r2.y*r3.y;
                        r2.z=r3.x+cb2[18].z;
                        r2.x=(-r2.x)+r2.z;
                        r2.x=r2.x>=0.0?(-c25.x):(-c25.y);
                        r3.x=saturate(max(r2.x,r2.y));
                        r2.x=r3.x+(-cb2[18].w);
                        r3.x=c18.x;
                        r2.y=r3.x+(-cb2[18].w);
                        r2.y=1.0/r2.y;
                        r2.x=saturate(r2.y*r2.x);
                        r2.x=(-cb2[19].x)>=0.0?r2.x:r3.x;
                        r3.x=max(cb2[19].z,r2.x);
                        r2.x=r3.x*r3.x;
                        r2.y=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r0.yzw=r0.yzw*r2.yyy;
                        r2.xyz=r2.xxx*cb2[13].xyz;
                        r2.xyz=r2.xyz*(-c17.zzz);
                        r0.yzw=r0.yzw*r2.xyz;
                        r2.xyz=max(r0.yzw,c25.www);
                        r0.yzw=max(r1.yzw,c25.www);
                        r0.yzw=r0.yzw+r2.xyz;
                        r1.y=cb2[15].w*v4.w;
                        r1.y=r1.y*c22.w;
                        r1.y=exp2(r1.y);
                        r1.zw=mix(v0.xy,v0.zw,cb7[0].yy);
                        
                        // NormalMap 
                        r2.ywx=texture2D(s4,r1.zw).xyz;     
                        
                        // AoMap        
                        r2.z=texture2D(s5,r1.zw).x;     
                        
                        r0.yzw=r0.yzw*r2.zzz+(-cb2[15].xyz);
                        r0.yzw=r1.yyy*r0.yzw+cb2[15].xyz;
                        r2.xyz=cb2[15].xyz;
                        r2.xyz=(-r2.xyz)+cb7[1].xyz;
                        r1.yzw=r1.yyy*r2.xyz+cb2[15].xyz;
                        r1.yzw=r1.yzw*cb4[0].yyy;
                        r0.xyz=r1.yzw*r0.xxx+r0.yzw;
                        r1.yzw=max(r0.xyz,c25.www);
                        r0.x=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.y=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.z=r1.w>0.0?log2(r1.w):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.yzw=r0.xyz*c23.zzz;
                        r2.x=exp2(r1.y);
                        r2.y=exp2(r1.z);
                        r2.z=exp2(r1.w);
                        r1.yzw=r2.xyz*c24.xxx+c24.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz*c23.yyy;
                        r2.xyz=r2.xyz+c23.xxx;
                        {
                            bvec3 tmp=greaterThanEqual(r2.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.y:r0.x,tmp.y?r1.z:r0.y,tmp.z?r1.w:r0.z);
                        }
                        gl_FragData[0].w=r1.x;
                        
                        ${ps.shadowFooter}
                    }
                `
            },
            states: {
                [RS_ZWRITEENABLE] : 1
            }
        }
    }
};


export const skinnedQuadSailsV5 = {
    name: "skinned_QuadSailsV5",
    path: quadSailsV5.path,
    description: `skinned ${quadSailsV5.description}`,
    todo: quadSailsV5.todo,
    techniques: {
        Depth: quadDepthV5.techniques.Main,
        Picking: quadPickingV5.techniques.Main,
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadSailsV5.techniques.Main.ps
        }
    }
};