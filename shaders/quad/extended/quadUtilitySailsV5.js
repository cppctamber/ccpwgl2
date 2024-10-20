import { clampToBorder } from "../../shared/func";
import { quadV5_PosTexTanTex, skinnedQuadV5_PosBwtTexTanTex } from "../shared/vs";
import { constant, ps, texture } from "../shared";
import { DustNoiseMap } from "../../shared/texture";
import { getMaterialMask } from "./func";
import { SelectorColor, SelectorMode, Mode } from "./constant";
import { SailsDetailData } from "../shared/constant";


export const quadUtilitySailsV5 = {
    name: "quadUtilitySailsV5",
    description: "quad sails utility shader",
    techniques: {
        Main: {
            vs: quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.GeneralData,
                    SelectorMode,
                    SelectorColor,
                    SailsDetailData
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
                    texture.SailsDetailMap,
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
                    
                    uniform sampler2D s0;   // AlbedoMap
                    uniform sampler2D s1;   // RoughnessMap
                    uniform sampler2D s2;   // NormalMap
                    uniform sampler2D s3;   // AoMap
                    uniform sampler2D s4;   // PaintMaskMap
                    uniform sampler2D s5;   // MaterialMap
                    uniform sampler2D s6;   // DirtMap
                    uniform sampler2D s7;   // GlowMap
                    uniform sampler2D s8;   // SailsDetailMap;
                    uniform sampler2D s9;   // DustNoiseMap
                    
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[4];
                    
                    void main()
                    {
                    
                        if (int(cb7[1].x)==1) discard;
                    
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v5;
                        
                        vec4 r0;
                        
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v5=texcoord5;
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        int mode=int(cb7[1].x);
                        float paint=texture2D(s4,v0.xy).x;
                        if (mode!=${Mode.PAINT_MASK}&&paint>0.0)discard;
                        
                        r0=vec4(0.0,0.0,0.0,1.0);
                        if(mode==${Mode.PAINT_MASK})r0.xyz=vec3(paint);
                        else if(mode==${Mode.NORMALS})r0.xyz=v1.xyz;
                        else if(mode==${Mode.BI_TANGENTS})r0.xyz=v2.xyz;
                        else if(mode==${Mode.TANGENTS})r0.xyz=v3.xyz;
                        else if(mode==${Mode.ALBEDO_MAP})r0.xyz=texture2D(s0,v0.xy).xyz;                
                        else if(mode==${Mode.ROUGHNESS_MAP})r0.xyz=texture2D(s1,v0.xy).xxx; 
                        else if(mode==${Mode.NORMAL_MAP})r0.xyz=texture2D(s2,v0.xy).xyz;
                        else if(mode==${Mode.NORMAL_MAP_POSITIVE})r0.xyz=texture2D(s2,v0.xy).xxx;
                        else if(mode==${Mode.NORMAL_MAP_NEGATIVE})r0.xyz=texture2D(s2,v0.xy).yyy;
                        else if(mode==${Mode.AMBIENT_OCCLUSION_MAP})r0.xyz=texture2D(s3,mix(v0.xy,v0.zw,cb7[0].yy)).xxx;
                        else if(mode==${Mode.MATERIAL_MAP})r0.xyz=texture2D(s5,v0.xy).xxx;
                        else if(mode==${Mode.DIRT_MASK})r0.xyz=texture2D(s6,v0.xy).xxx;
                        else if(mode==${Mode.GLOW_MASK})r0.xyz=texture2D(s7, v0.xy).xxx;
                        else if(mode==${Mode.MATERIAL_2_MASK})r0.xyz==getMaterialMask(s5,v0.xy).yyy;
                        else if(mode==${Mode.SAILS_MAP}||mode==${Mode.SAILS_MAP_PATTERN}||mode==${Mode.SAILS_MAP_BACKGROUND}){
                            float sails=getMaterialMask(s5,v0.xy).x;
                            if (sails!=0.0){
                                vec4 c16=vec4(0.159154937,0.5,6.28318548,-3.14159274);
                                vec4 c25=vec4(-1,-0,2,0);
                                vec4 c26=vec4(1,-1,0.5,-0.5);
                                vec4 r1;
                                vec4 r2;
                                vec4 r3;
                                vec4 r4;
                                r1.yz=cb7[3].xx*v0.xy;
                                r2.xy=c16.xy;
                                sails=cb7[3].y*r2.x+r2.y;            
                                sails=fract(sails);
                                sails=sails*c16.z+c16.w;
                                r3.xy=vec2(cos(sails),sin(sails));            
                                r4.y=dot(r3.yx,r1.yz)+c25.w;
                                r2.xz=r3.xy*c26.xy;
                                r4.x=dot(r2.xz,r1.yz)+c25.w;
                                r3.x=texture2D(s8,r4.xy).x;
                                if (mode==${Mode.SAILS_MAP}) r0.xyz=c26.xxx; 
                                else if(mode==${Mode.SAILS_MAP_BACKGROUND}&&r3.x>0.9)r0.xyz=c26.xxx; 
                                else r0.xyz=c26.xxx;
                            }
                        }
                        else if (mode==${Mode.DUST_NOISE_MAP}){
                            
                        }
                        
                        gl_FragData[0]=r0*cb7[2];
                    }
                `
            }
        }
    }
};

export const skinnedQuadUtilitySailsV5 = {
    name: "skinned_quadUtilityV5",
    description: `skinned ${quadUtilitySailsV5.description}`,
    techniques: {
        Main: {
            vs: skinnedQuadV5_PosBwtTexTanTex,
            ps: quadUtilitySailsV5.techniques.Main.ps
        }
    }
};