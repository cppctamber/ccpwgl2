import { clampToBorder } from "../../shared/func";
import { quadV5_PosTexTanTex, skinnedQuadV5_PosBwtTexTanTex } from "../shared/vs";
import { constant, ps, texture } from "../shared";
import { DustNoiseMap } from "../../shared/texture";
import { getMaterialMask } from "./func";
import { SelectorColor, SelectorMode, Selected } from "./constant";
import { Time } from "../../shared/constant";



export const quadUtilityHeatV5 = {
    name: "quadUtilityHeatV5",
    description: "quad heat utility shader",
    techniques: {
        Main: {
            vs: quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.GeneralData,
                    Time,
                    SelectorMode,
                    SelectorColor,
                    constant.Mtl1HeatGlowData,
                    constant.Mtl2HeatGlowData,
                    constant.Mtl3HeatGlowData,
                    constant.Mtl4HeatGlowData,
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
                    uniform vec4 cb7[8];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v5;
                        vec4 v6;
                        vec4 r0;
                       
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
                        else if (mode == ${Selected.HEAT})
                        {
                            vec4 r1;
                            vec4 r2;
                            vec4 r3;
                            vec4 c26=vec4(3.19148946,1.03191495,0.5,-0.5);
                            vec4 c31=vec4(0.318309873,-1.44269507e-005,-0.00499999989,66.6666641);
                            vec4 c34=vec4(1,2,-1,0);
                            r2=getMaterialMask(s5,v0.xy);
                            r1=r2.yyyy*cb7[4];
                            r1=r2.xxxx*cb7[5]+r1;
                            r1=r2.zzzz*cb7[6]+r1;
                            r1=r2.wwww*cb7[7]+r1;
                            r2.xy=r1.yy*cb7[1].xx+v0.xy;
                            r2.xy=r1.zz*r2.xy;
                            r2=texture2D(s10,r2.xy);
                            r2.zw=r1.yy*(-cb7[1].xx)+v0.xy;
                            r1.yz=r1.zz*r2.zw;
                            r3=texture2D(s10,r1.yz);
                            r1.yz=r2.xy*r3.xy+c26.ww;
                            r2.z=c31.z;
                            r0.w=r2.z+cb4[0].x;
                            r0.w=saturate(r0.w*c31.w);
                            r0.w=r0.w+c34.z;
                            r0.w=saturate(r1.x*r0.w+c34.x);
                            r1.x=r1.w*r0.w;
                            r1.xy=r1.xx*r1.yz+v0.xy;
                            color=texture2D(s7,r1.xy).xxx*c34.y;
                        }
                        else if (mode == ${Selected.HEAT_MATERIAL_1})
                        {
                        
                        }
                        else if (mode == ${Selected.HEAT_MATERIAL_2})
                        {
                        
                        }
                        else if (mode == ${Selected.HEAT_MATERIAL_3})
                        {
                        
                        }
                        else if (mode == ${Selected.HEAT_MATERIAL_4})
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

export const skinnedQuadUtilityHeatV5 = {
    name: "skinned_QuadUtilityHeatV5",
    description: `skinned ${quadUtilityHeatV5.description}`,
    techniques: {
        Main: {
            vs: skinnedQuadV5_PosBwtTexTanTex,
            ps: quadUtilityHeatV5.techniques.Main.ps
        }
    }
};