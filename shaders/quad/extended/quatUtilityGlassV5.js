import { clampToBorder } from "../../shared/func";
import { quadV5_PosTexTanTex, skinnedQuadV5_PosBwtTexTanTex } from "../shared/vs";
import { constant, ps, texture } from "../shared";
import { DustNoiseMap } from "../../shared/texture";
import { getMaterialMask } from "./func";
import { SelectorColor, SelectorMode, Mode } from "./constant";


export const quadUtilityGlassV5 = {
    name: "quadUtilityGlassV5",
    description: "quad heat utility shader",
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
                    texture.HeatGlowNoiseMap,
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
                    uniform sampler2D s8;   // PatternMask1Map
                    uniform sampler2D s9;   // PatternMask2Map
                    uniform sampler2D s10;  // HeatGlowNoiseMap
                    uniform sampler2D s11;  // DustNoiseMap
                    
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[3];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v5;
                        vec4 v6;
                        
                        vec4 r0;
                        vec4 r1;
                        
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v5=texcoord5;
                        v6=texcoord6;
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        int mode = int(cb7[1].x);
                        r0=vec4(0.0,0.0,0.0,1.0);
                        if (mode==${Mode.NORMALS})r0.xyz=v1.xyz;
                        else if(mode==${Mode.BI_TANGENTS})r0.xyz=v2.xyz;                       
                        else if(mode==${Mode.TANGENTS})r0.xyz=v3.xyz;
                        else if(mode==${Mode.ALBEDO_MAP})r0.xyz=texture2D(s0,v0.xy).xyz;                   
                        else if(mode==${Mode.ROUGHNESS_MAP})r0.xyz=texture2D(s1,v0.xy).xxx;
                        else if(mode==${Mode.NORMAL_MAP})r0.xyz=texture2D(s2,v0.xy).xyz;
                        else if(mode==${Mode.NORMAL_MAP_POSITIVE})r0.xyz=texture2D(s2,v0.xy).xxx;
                        else if(mode==${Mode.NORMAL_MAP_NEGATIVE})r0.xyz=texture2D(s2,v0.xy).yyy;
                        else if(mode==${Mode.AMBIENT_OCCLUSION_MAP})r0.xyz=texture2D(s3,mix(v0.xy,v0.zw,cb7[0].yy)).xxx;                            
                        //else if(mode==${Mode.PAINT_MASK})r0.xyz=texture2D(s4,v0.xy).xxx;
                        else if(mode==${Mode.MATERIAL_MAP})r0.xyz=texture2D(s5,v0.xy).xxx;
                        //else if(mode==${Mode.MATERIAL_1_MASK})r0.xyz=getMaterialMask(s5,v0.xy).xxx;
                        //else if(mode==${Mode.MATERIAL_2_MASK})r0.xyz=getMaterialMask(s5,v0.xy).yyy;
                        //else if(mode==${Mode.MATERIAL_3_MASK})r0.xyz=getMaterialMask(s5,v0.xy).zzz;
                        else if(mode==${Mode.GLASS})r0.xyz=getMaterialMask(s5,v0.xy).www;                
                        else if(mode==${Mode.DIRT_MASK})r0.xyz=texture2D(s6,v0.xy).xxx;
                        //else if(mode==${Mode.GLOW_MASK})r0.xyz=texture2D(s7,v0.xy).xxx;
                        else if (mode == ${Mode.DUST_NOISE_MAP}){
                            
                        }
                        
                        gl_FragData[0]=r0*cb7[2]; 
                    }
                `
            }
        }
    }
};

export const skinnedQuadUtilityGlassV5 = {
    name: "skinned_quadUtilityGlassV5",
    description: `skinned ${quadUtilityGlassV5.description}`,
    techniques: {
        Main: {
            vs: skinnedQuadV5_PosBwtTexTanTex,
            ps: quadUtilityGlassV5.techniques.Main.ps
        }
    }
};