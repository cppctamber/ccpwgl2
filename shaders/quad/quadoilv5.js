import { vs, ps, constant, texture } from "./shared";
import { DustNoiseMap, EveSpaceSceneEnvMap, EveSpaceSceneShadowMap } from "../shared/texture";
import { quadDepthV5, skinnedQuadDepthV5 } from "./quaddepthv5";
import { quadPickingV5, skinnedQuadPickingV5 } from "./quadpickingv5";
import { quadV5, skinnedQuadV5 } from "./quadv5";
import { quadExtendedPickingNoPatternV5, skinnedQuadExtendedPickingNoPatternV5 } from "./extended/quadExtendedPickingNoPatternV5";


export const quadOilV5 = {
    name: "quadOilV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadOilV5",
    description: "oil quad shader",
    todo: "Add dirt",
    techniques: {
        Picking: quadPickingV5.techniques.Main,
        Depth: quadDepthV5.techniques.Main,
        Emissive: quadV5.techniques.Emissive,
        ExtendedPicking: quadExtendedPickingNoPatternV5.techniques.Main,
        Main: {
            vs: vs.quadOilV5_PosTexTanTexL01,
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
                    texture.OilFilmLookupMap,
                    DustNoiseMap
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
                    uniform sampler2D s9;   // OilFilmLookupMap
                    uniform sampler2D s10;  // DustNoiseMap
                    
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
                        vec4 r10;
                        vec4 r11;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        vec4 c14=vec4(9.99999997e-007,0.0383840017,0.0393519998,0.0391650014);
                        vec4 c15=vec4(1,2,-1,0);
                        vec4 c16=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c17=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c18=vec4(0.400000006,3.14159274,-1e-015,9.99999987e+014);
                        vec4 c19=vec4(1,1.54499996,1.10000002,6);
                        vec4 c20=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c21=vec4(0,-0.015625,0.75,-9.27999973);
                        vec4 c22=vec4(7,0.119999997,0.318309873,-1.44269507e-005);
                        vec4 c23=vec4(0.5,0,0.0199999996,16);
                        vec4 c24=vec4(-0.00313080009,12.9200001,0.416666657,0);
                        vec4 c25=vec4(1.05499995,-0.0549999997,0,0);
                        vec4 c26=vec4(-0.00100000005,0.00100000005,0.699999988,3);
                        
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
                        r0.x=texture2D(s5,v0.xy).x;  
                        
                        // MaterialMap
                        r0.y=texture2D(s6,v0.xy).x;    
                        
                        // DirtMap (Not required here)    
                        r0.z=texture2D(s7,v0.xy).x;   
                        
                        // GlowMap     
                        r0.w=texture2D(s8,v0.xy).x;      
                        
                        //gl_FragData[0].w=(-r0.x)+c15.x;
                        gl_FragData[0].w=c15.x;
                        
                        r0.z=(-cb2[19].x)+cb2[19].y;
                        r0.z=1.0/r0.z;
                        r1.x=(-cb2[19].x)+v6.z;
                        r0.z=r0.z*r1.x;
                        r0.z=sqrt(abs(r0.z));
                        r1.x=1.0/v7.w;
                        r1.xy=r1.xx*v7.xy;
                        r1.xy=r1.xy*c17.zw+c17.zz;
                        r1.z=c17.z;
                        r1.xy=cb2[18].xy*r1.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r1.z=r0.z+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.z=(-r0.z)+r1.x;
                        r0.z=r0.z>=0.0?c15.x:c15.w;
                        r2.x=max(r1.y,c14.x);
                        r1.x=r1.z*r1.z+r2.x;
                        r1.x=1.0/r1.x;
                        r1.x=r1.x*r2.x;
                        r2.x=saturate(max(r0.z,r1.x));
                        r0.z=r2.x+(-cb2[18].w);
                        r1.x=c15.x;
                        r1.y=r1.x+(-cb2[18].w);
                        r1.y=1.0/r1.y;
                        r0.z=saturate(r0.z*r1.y);
                        r0.z=(-cb2[19].x)>=0.0?r0.z:r1.x;
                        r1.x=max(cb2[19].z,r0.z);
                        r0.z=r1.x*r1.x;
                        r1.yzw=r0.zzz*cb2[13].xyz;
                        r1.yzw=r1.yzw*(-c16.zzz);
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xyz=v4.xyz*r0.zzz+cb2[12].xyz;
                        r3.xyz=r0.zzz*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.z=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r0.z=r0.z*r0.z;
                        r0.x=r0.x*cb7[0].x;
                        r2=r0.yyyy+c16;
                        r0.y=r0.w*r0.w;
                        r2=r2*c17.xxxx;
                        r2=saturate((-abs(r2))+c17.yyyy);
                        r0.w=r2.y*cb7[11].x;
                        r0.w=r2.x*cb7[10].x+r0.w;
                        r0.w=r2.z*cb7[12].x+r0.w;
                        r0.w=r2.w*cb7[13].x+r0.w;
                        
                        // AlbedoMap 
                        r5.xyz=texture2D(s2,v0.xy).xyz;    
                        
                        // RoughnessMap    
                        r5.w=texture2D(s3,v0.xy).x;  
                        
                        r3.w=r0.w*r5.w;
                        r0.w=r5.w*(-r0.w)+c18.x;
                        r0.w=r0.x*r0.w+r3.w;
                        r0.w=saturate((-r0.w)+c15.x);
                        r6.xy=(-r0.ww)+c19.xy;
                        r3.w=min(r6.y,c15.x);
                        r7.xyz=c21.xyz;
                        r6=r6.xxxx*c20+r7.xxyz;
                        r0.z=r0.z*r3.w+c19.z;
                        r0.z=(-r3.w)+r0.z;
                        r0.z=1.0/r0.z;
                        r3.w=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r3.w=(-r3.w)+c15.x;
                        r4.w=r3.w*r3.w;
                        r4.w=r4.w*r4.w;
                        r3.w=r3.w*r4.w;
                        r7.xyz=r2.yyy*cb7[7].xyz;
                        r7.xyz=r2.xxx*cb7[6].xyz+r7.xyz;
                        r7.xyz=r2.zzz*cb7[8].xyz+r7.xyz;
                        r7.xyz=r2.www*cb7[9].xyz+r7.xyz;
                        r8.xyz=r5.www*r7.xyz;
                        r7.xyz=r5.www*(-r7.xyz)+c14.yzw;
                        r7.xyz=r0.xxx*r7.xyz+r8.xyz;
                        r8.xyz=mix(r7.xyz,c15.xxx,r3.www);
                        r9.xyz=r0.zzz*r8.xyz;
                        r8.xyz=(-r8.xyz)+c15.xxx;
                        r10.xyz=r2.yyy*cb7[3].xyz;
                        r10.xyz=r2.xxx*cb7[2].xyz+r10.xyz;
                        r2.xyz=r2.zzz*cb7[4].xyz+r10.xyz;
                        r2.xyz=r2.www*cb7[5].xyz+r2.xyz;
                        r10.xyz=mix(r2.xyz,c15.xxx,r0.xxx);
                        r2.xyz=r5.xyz*r10.xyz;
                        r5.xyz=r8.xyz*r2.xyz;
                        r0.x=r0.w*r0.w;
                        r8.w=r0.w*c19.w;
                        r0.z=r0.x*r0.x;
                        r0.x=r0.x*r0.x+c15.z;
                        
                        // NormalMap 
                        r10.ywx=texture2D(s4,v0.xy).xyz; 
                        
                        // Ambient Occlusion
                        r10.z=lighting.x;  
                        
                        r10.xy=r10.yw*c15.yy+c15.zz;
                        r0.w=saturate(dot(r10.xy,r10.xy)+c15.w);
                        r0.w=(-r0.w)+c15.x;
                        r0.w=sqrt(abs(r0.w));
                        r11.xyz=r10.yyy*v3.xyz;
                        r11.xyz=r10.xxx*v2.xyz+r11.xyz;
                        r2.w=r10.y+r10.x;
                        r2.w=r2.w*c26.z;
                        r10.xyz=r0.www*v1.xyz+r11.xyz;
                        r11.xyz=normalize(r10.xyz);
                        r0.w=clamp(dot(r11.xyz,r4.xyz),0.0, 1.0);
                        r0.w=r0.w*r0.w;
                        r0.x=r0.w*r0.x+c15.x;
                        r0.x=r0.x*r0.x;
                        r0.w=r0.x*c18.y;
                        r0.x=r0.x*c18.y+c18.z;
                        r0.w=1.0/r0.w;
                        r0.x=r0.x>=0.0?r0.w:c18.w;
                        r0.x=r0.x*r0.z;
                        r0.xzw=r9.xyz*r0.xxx+r5.xyz;
                        r3.w=clamp(dot(cb2[12].xyz,r11.xyz),0.0, 1.0);
                        r0.xzw=r0.xzw*r3.www;
                        r0.xzw=r1.yzw*r0.xzw;
                        r1.yzw=max(r0.xzw,c15.www);
                        r0.x=dot(r3.xyz,r11.xyz);
                        r0.z=saturate(r0.x);
                        r0.x=r0.x+r0.x;
                        r3.xyz=r11.xyz*(-r0.xxx)+r3.xyz;
                        r0.x=r0.z*c21.w;
                        r0.x=exp2(r0.x);
                        r3.w=min(r0.x,r6.y);
                        r0.x=r6.x*r3.w+r6.z;
                        r4.xyz=saturate(mix(r0.xxx,r6.www,r7.xyz));
                        r0.xzw=(-r4.xyz)+c15.xxx;
                        r0.xzw=r0.xzw*r2.xyz;
                        r11.w=c22.x;
                        r6=textureCubeLod(s0,r11.xyz,r11.w);
                        r3.w=cb2[14].w;
                        r2.x=r3.w*c22.y;
                        r2.xyz=r6.xyz*cb2[14].www+r2.xxx;
                        r0.xzw=r0.xzw*r2.xyz;
                        r0.xzw=r0.xzw*c22.zzz;
                        r8.x=dot((-r3.xyz),cb2[8].xyz);
                        r8.y=dot((-r3.xyz),cb2[9].xyz);
                        r8.z=dot((-r3.xyz),cb2[10].xyz);
                        r3=textureCubeLod(s0,r8.xyz,r8.w);
                        r2.xyz=r3.xyz*cb2[14].www;
                        r0.xzw=r2.xyz*r4.xyz+r0.xzw;
                        r2.xyz=max(r0.xzw,c15.www);
                        r0.xzw=r1.yzw+r2.xyz;
                        r1.yz=mix(v0.xy,v0.zw,cb7[0].yy);
                        
                        // NormalMap 
                        r3.ywx=texture2D(s4,r1.yz).xyz; 
                        
                        // Ambient occlusion
                        r3.z=lighting.x;  
                        
                        r0.xzw=r0.xzw*r3.zzz+(-cb2[15].xyz);
                        r1.y=cb2[15].w*v4.w;
                        r1.y=r1.y*c22.w;
                        r1.y=exp2(r1.y);
                        r0.xzw=r1.yyy*r0.xzw+cb2[15].xyz;
                        r1.z=dot(v4.xyz,r11.xyz);
                        r1.w=r1.z+c26.x;
                        r2.x=saturate(r1.z);
                        r1.z=r1.z+r1.z;
                        r3.xyz=r11.xyz*(-r1.zzz)+v4.xyz;
                        r3.xyz=(-r3.xyz);
                        r1.z=r1.w>=0.0?r2.x:c26.y;
                        r4.w=1.0/r1.z;
                        r1.z=sqrt(abs(r1.z));
                        r1.z=(-r1.z)+c15.y;
                        r1.z=r1.z*c23.z;
                        r4.x=r4.w*c26.w+r2.w;
                        r4.yz=c23.xy;
                        r2=texture2DLod(s9,r4.xy,r4.w);
                        r2.xyz=r1.zzz*r2.xyz;
                        r3.w=c15.x;
                        r4.x=dot(r3,cb2[8]);
                        r4.y=dot(r3,cb2[9]);
                        r4.z=dot(r3,cb2[10]);
                        r1.z=dot(cb2[12].xyz,r4.xyz);
                        r1.z=saturate(r1.z*c17.z+c17.z);
                        r2.w=pow(r1.z,c23.w);
                        r2.xyz=r2.www*r2.xyz;
                        r2.xyz=r5.www*r2.xyz;
                        r0.xzw=r2.xyz*r1.xxx+r0.xzw;
                        r2.xyz=cb2[15].xyz;
                        r1.xzw=(-r2.xyz)+cb7[1].xyz;
                        r1.xyz=r1.yyy*r1.xzw+cb2[15].xyz;
                        r1.xyz=r1.xyz*cb4[0].yyy;
                        r0.xyz=r1.xyz*r0.yyy+r0.xzw;
                        r1.xyz=max(r0.xyz,c15.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c24.zzz;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c25.xxx+c25.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c24.xxx;
                        r2.xyz=r2.xyz*c24.yyy;
                        
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


export const skinnedQuadOilV5 = {
    name: "skinned_quadOilV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/skinned_quadOilV5",
    description: `skinned ${quadOilV5.description}`,
    todo: quadOilV5.todo,
    techniques: {
        Picking: skinnedQuadDepthV5.techniques.Main,
        Depth: skinnedQuadPickingV5.techniques.Main,
        Emissive: skinnedQuadV5.techniques.Emissive,
        ExtendedPicking: skinnedQuadExtendedPickingNoPatternV5.techniques.Main,
        Main: {
            vs: vs.skinnedQuadOilV5_PosBwtTexTanTexL01,
            ps: quadOilV5.techniques.Main.ps
        }
    }
};