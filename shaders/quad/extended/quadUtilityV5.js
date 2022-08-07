import { clampToBorder } from "../../shared/func";
import { quadV5_PosTexTanTex, skinnedQuadV5_PosBwtTexTanTex } from "../shared/vs";
import { constant, ps, texture } from "../shared";
import { DustNoiseMap } from "../../shared/texture";
import { getMaterialMask } from "./func";
import { SelectorColor, SelectorMode, Selected } from "./constant";
import { Time } from "../../shared/constant";



export const quadUtilityV5 = {
    name: "quadUtilityV5",
    description: "quad utility shader",
    techniques: {
        Main: {
            vs: quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.GeneralData,
                    Time,
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
                    uniform vec4 cb7[4];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v5;
                        vec4 v6;
                        vec4 v7;
                        vec4 r0;

                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v5=texcoord5;
                        v6=texcoord6;
                        v7=texcoord7;
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        int mode = int(cb7[2].x);
                        vec3 color;
                        if (mode==${Selected.NORMALS})color=v1.xyz;
                        else if(mode==${Selected.BI_TANGENTS})color=v2.xyz;                       
                        else if(mode==${Selected.TANGENTS})color=v3.xyz;
                        else if(mode==${Selected.ALBEDO_MAP})color=texture2D(s0,v0.xy).xyz;                   
                        else if(mode==${Selected.ROUGHNESS_MAP})color=texture2D(s1,v0.xy).xxx;
                        else if(mode==${Selected.NORMAL_MAP})color=texture2D(s2,v0.xy).xyz;
                        else if(mode==${Selected.NORMAL_MAP_POSITIVE})color.xyz = texture2D(s2,v0.xy).xxx;
                        else if(mode==${Selected.NORMAL_MAP_NEGATIVE})color.xyz=texture2D(s2,v0.xy).yyy;
                        else if(mode==${Selected.AMBIENT_OCCLUSION_MAP})color=texture2D(s3,mix(v0.xy,v0.zw,cb7[0].yy)).xxx;                            
                        else if(mode==${Selected.PAINT_MASK})color=texture2D(s4,v0.xy).xxx;
                        else if(mode==${Selected.MATERIAL_MAP})color=texture2D(s5,v0.xy).xxx;
                        else if(mode==${Selected.MATERIAL_1_MASK})color=getMaterialMask(s5,v0.xy).xxx;
                        else if(mode==${Selected.MATERIAL_2_MASK})color=getMaterialMask(s5,v0.xy).yyy;
                        else if(mode==${Selected.MATERIAL_3_MASK})color=getMaterialMask(s5,v0.xy).zzz;
                        else if(mode==${Selected.MATERIAL_4_MASK})color=getMaterialMask(s5,v0.xy).www;                
                        else if(mode==${Selected.DIRT_MASK})color=texture2D(s6,v0.xy).xxx;
                        else if(mode==${Selected.GLOW_MASK})color=texture2D(s7, v0.xy).xxx;
                        else if(mode==${Selected.PATTERN_1_MASK})
                        {
                            r0=getMaterialMask(s5,v0.xy);
                            r0=cb4[12]*r0;
                            if(any(greaterThan(r0,vec4(0.0))))
                            {
                                color=clampToBorder(s8,v6.xy,cb4[10].yz).xxx;                          
                            }
                        }
                        else if (mode == ${Selected.PATTERN_2_MASK})
                        {
                            r0=getMaterialMask(s5,v0.xy);
                            r0=cb4[13]*r0;   
                            if(any(greaterThan(r0,vec4(0.0))))
                            {
                               color=clampToBorder(s9,v6.zw,cb4[11].yz).xxx;                          
                            }
                        }
                        else if (mode == ${Selected.DUST_NOISE_MAP})
                        {
                            
                        }

                        // Replace with a pulse                        
                        r0.x=cb7[3].w;
                        r0.y=cb7[2].z;
                        if (r0.y>0.0)
                        {
                            r0.y=fract(cb7[1].y);
                            if (r0.y>.5)r0.y = 1.0-r0.y;
                            r0.y=min(1.0, r0.y*cb7[2].z);
                        }
                        else
                        {
                            r0.y=1.0;   
                        }
    
                        gl_FragData[0].xyz = color * cb7[3].xyz * r0.y;
                        gl_FragData[0].w = cb7[3].w;
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