import * as func from "./func";
import { texture, ps, vs } from "../shared";
import { clampToBorder } from "../../shared/func";
import { ObjectID } from "../../shared/constant";
import { PickingBlueChannel } from "constant";
import { SailsDetailData } from "../shared/constant";


export const quadExtendedPickingSailsV5 = {
    name: "quadExtendedPickingSailsV5",
    description: "quad sails picking shader with materials, patterns, glow and paint",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [
                    ObjectID,
                    SailsDetailData
                ],
                textures: [
                    texture.PaintMaskMap,
                    texture.MaterialMap,
                    texture.GlowMap,
                    texture.SailsDetailMap
                ],
                shader: `
    
                    ${ps.headerNoShadow}
                    ${clampToBorder}
                    ${func.getVec2FromID}
                    ${func.isMasked}
                    ${func.getMaterialMask}
                    ${func.getPatternLayer}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord5;

                    uniform sampler2D s0; // PaintMaskMap
                    uniform sampler2D s1; // MaterialMap
                    uniform sampler2D s2; // GlowMap
                    uniform sampler2D s3; // SailsDetailMap 
                    
                    uniform vec4 cb4[15];
                    uniform vec4 cb7[3];
            
                    void main()
                    {
                        vec4 v0;
                        vec4 v5;        
                        vec4 r0;
                        
                        int i0=0;
                        float c0=0.00392156886;

                        v0=texcoord;
                        v5=texcoord5;
                        
                        // Cull
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        if(texture2D(s0,v0.xy).x>0.0)discard;
                        
                        if(texture2D(s2,v0.xy).x>0.0)i0=${PickingBlueChannel.GLOW};
                        else
                        {
                            r0=getMaterialMask(s1,v0.xy);
                            if (r0.x>0.0) {
                            
                                // Sails UV, todo: Clean up
                                vec4 c16=vec4(0.159154937,0.5,6.28318548,-3.14159274);
                                vec4 c25=vec4(-1,-0,2,0);
                                vec4 c26=vec4(1,-1,0.5,-0.5);
                                vec4 r1;
                                vec4 r2;
                                vec4 r3;
                                vec4 r4;
                                r1.yz=cb7[1].xx*v0.xy;  
                                r2.xy=c16.xy;
                                r0.x=cb7[1].y*r2.x+r2.y;            
                                r0.x=fract(r0.x);
                                r0.x=r0.x*c16.z+c16.w;
                                r3.xy=vec2(cos(r0.x),sin(r0.x));            
                                r4.y=dot(r3.yx,r1.yz)+c25.w;
                                r2.xz=r3.xy*c26.xy;
                                r4.x=dot(r2.xz,r1.yz)+c25.w;
                                
                                // SailsDetailMap
                                r3.x=texture2D(s3,r4.xy).x;
                                
                                if (r3.x>0.9)i0=${PickingBlueChannel.MATERIAL_4};
                                else i0=${PickingBlueChannel.MATERIAL_3};
                            }
                            else if(r0.y>0.0)i0=${PickingBlueChannel.MATERIAL_2};
                        }
                        
                        gl_FragData[0].xy=getVec2FromID(cb7[0].x);
                        gl_FragData[0].z=float(i0)*c0;
                        gl_FragData[0].w=1.0;
                    }
                `
            }
        }
    },
};

export const skinnedQuadExtendedPickingSailsV5 = {
    name: "skinned_quadSailsExtendedPickingV5",
    description: `skinned ${quadExtendedPickingSailsV5.description}`,
    techniques : {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadExtendedPickingSailsV5.techniques.Main.ps
        }
    }
};