import { clampToBorder } from "../../shared/func";
import { quadV5_PosTexTanTex, skinnedQuadV5_PosBwtTexTanTex } from "../shared/vs";
import { constant, ps, texture } from "../shared";
import { DustNoiseMap } from "../../shared/texture";
import { getMaterialMask } from "./func";
import { SelectorColor, SelectorMode, Mode } from "./constant";


export const quadUtilityV5 = {
    name: "quadUtilityV5",
    description: "quad utility shader",
    techniques: {
        Main: {
            vs: quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.GeneralData,
                    SelectorMode,
                    SelectorColor
                ],
                textures: [
                    texture.AlbedoMap,
                    texture.RoughnessMap,
                    texture.NormalMap,
                    texture.AoMap,
                    texture.PaintMaskMap,
                    texture.MaterialMap,
                    texture.DirtMap,
                    texture.GlowMap,
                    texture.PatternMask1Map,
                    texture.PatternMask2Map,
                    DustNoiseMap,
                ],
                shader: `

                    ${ps.headerNoShadow}
                    ${clampToBorder}
                    ${getMaterialMask}

                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    varying vec4 texcoord2;
                    varying vec4 texcoord3;
                    varying vec4 texcoord5;
                    varying vec4 texcoord6;
                    varying vec4 texcoord7;
                    
                    uniform sampler2D s0;   // AlbedoMap
                    uniform sampler2D s1;   // RoughnessMap
                    uniform sampler2D s2;   // NormalMap
                    uniform sampler2D s3;   // AoMap
                    uniform sampler2D s4;   // PaintMaskMap
                    uniform sampler2D s5;   // MaterialMap
                    uniform sampler2D s6;   // DirtMap
                    uniform sampler2D s7;   // GlowMap
                    uniform sampler2D s8;   // PatternMask1Map;
                    uniform sampler2D s9;   // PatternMask2Map;
                    uniform sampler2D s10;  // DustNoiseMap
                    
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[3];
                    
                    void main()
                    {
                    
                        if (int(cb7[1].x)==1) discard;
                    
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v5;
                        vec4 v6;
                        vec4 v7;
                        vec4 r0;
                        vec4 r1;

                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v5=texcoord5;
                        v6=texcoord6;
                        v7=texcoord7;
                        
                        vec4 c0 = vec4(0.0,1.0,10.0,20.0);
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        r0=c0.xxxy;
                        int mode = int(cb7[1].x);
                        
                        if (mode==${Mode.NORMALS})r0.xyz=v1.xyz;
                        else if(mode==${Mode.BI_TANGENTS})r0.xyz=v2.xyz;                       
                        else if(mode==${Mode.TANGENTS})r0.xyz=v3.xyz;
                        else if(mode==${Mode.ALBEDO_MAP})r0.xyz=texture2D(s0,v0.xy).xyz;                   
                        else if(mode==${Mode.ROUGHNESS_MAP})r0.xyz=texture2D(s1,v0.xy).xxx;
                        else if(mode==${Mode.NORMAL_MAP})r0.xyz=texture2D(s2,v0.xy).xyz;
                        else if(mode==${Mode.NORMAL_MAP_POSITIVE})r0.xyz=texture2D(s2,v0.xy).xxx;
                        else if(mode==${Mode.NORMAL_MAP_NEGATIVE})r0.xyz=texture2D(s2,v0.xy).yyy;
                        else if(mode==${Mode.AMBIENT_OCCLUSION_MAP})r0.xyz=texture2D(s3,mix(v0.xy,v0.zw,cb7[0].yy)).xxx;                            
                        else if(mode==${Mode.MATERIAL_MAP})r0.xyz=texture2D(s5,v0.xy).xxx;
                        else if(mode==${Mode.PAINT_MASK})r0.xyz=texture2D(s4,v0.xy).xxx;
                        else if(mode==${Mode.DIRT_MASK})r0.xyz=texture2D(s6,v0.xy).xxx;
                        else if(mode==${Mode.GLOW_MASK})r0.xyz=texture2D(s7,v0.xy).xxx*c0.z;
                        else if(mode==${Mode.DUST_NOISE_MAP})r0.xyz=texture2D(s10,v0.xy*c0.w).xyz;
                        else
                        {

                            vec4 materialMask=getMaterialMask(s5,v0.xy);
                            vec3 patternMask;
                            
                            patternMask.z=texture2D(s7,v0.xy).x*c0.z;
                            patternMask.z=patternMask.z+texture2D(s4,v0.xy).x;
                            materialMask=max(materialMask-patternMask.zzzz,c0.xxxx);     
                                 
                            r1=cb4[13]*materialMask;
                            if(any(greaterThan(materialMask,c0.xxxx))){
                                patternMask.z=max(r1.w,max(r1.z,max(r1.x,r1.y)));
                                patternMask.y=patternMask.z*clampToBorder(s9,v6.zw,cb4[11].yz).x;
                                materialMask=max(materialMask-patternMask.yyyy,c0.xxxx);
                            }
                            
                            r1=cb4[12]*materialMask;
                            if(any(greaterThan(materialMask,c0.xxxx))){
                                patternMask.z=max(r1.w,max(r1.z,max(r1.x,r1.y)));
                                patternMask.x=patternMask.z*clampToBorder(s8,v6.xy,cb4[10].yz).x;
                                materialMask=max(materialMask-patternMask.xxxx,c0.xxxx);
                            }
                            
                            if   (mode==${Mode.PATTERN_1_MASK })r0.xyz=vec3(patternMask.x);
                            else if(mode==${Mode.PATTERN_2_MASK })r0.xyz=vec3(patternMask.y);
                            else if(mode==${Mode.MATERIAL_1_MASK})r0.xyz=materialMask.xxx;
                            else if(mode==${Mode.MATERIAL_2_MASK})r0.xyz=materialMask.yyy;
                            else if(mode==${Mode.MATERIAL_3_MASK})r0.xyz=materialMask.zzz;
                            else if(mode==${Mode.MATERIAL_4_MASK})r0.xyz=materialMask.www;                   
                        }
                       
                        
                        r1=c0.yyyy;
                        if(any(greaterThan(r0.xyz,c0.xxx)))
                        {
                            r1.xyz=texture2D(s3,mix(v0.xy,v0.zw,cb7[0].yy)).xxx*2.5;
                        }
                        else
                        {
                            if (cb7[1].y>0.0) discard;
                        }
                        
                        gl_FragData[0].xyz=r0.xyz*cb7[2].xyz*r1.xyz;
                        gl_FragData[0].w=c0.y;
                    }
                `
            }
        }
    }
};

export const skinnedQuadUtilityV5 = {
    name: "skinned_quadUtilityV5",
    description: `skinned ${quadUtilityV5.description}`,
    techniques: {
        Main: {
            vs: skinnedQuadV5_PosBwtTexTanTex,
            ps: quadUtilityV5.techniques.Main.ps
        }
    }
};