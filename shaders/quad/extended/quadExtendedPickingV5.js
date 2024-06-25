import * as func from "./func";
import { texture, ps, vs } from "../shared";
import { clampToBorder } from "../../shared/func";
import { ObjectID } from "../../shared/constant";
import { PickingBlueChannel } from "constant";


export const quadExtendedPickingV5 = {
    name: "quadExtendedPickingV5",
    description: "quad picking shader with materials, patterns, glow and paint",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [ // CB7
                    ObjectID
                ],
                textures: [
                    texture.PaintMaskMap,
                    texture.MaterialMap,
                    texture.GlowMap,
                    texture.PatternMask1Map,
                    texture.PatternMask2Map
                ],
                shader: `
    
                    ${ps.headerNoShadow}
                    ${func.getVec2FromID}
                    ${func.isMasked}
                    ${func.getMaterialMask}
                    ${clampToBorder}
                    ${func.getPatternLayer}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord5;
                    varying vec4 texcoord6;
                    
                    uniform sampler2D s0; // PaintMaskMap
                    uniform sampler2D s1; // MaterialMap
                    uniform sampler2D s2; // GlowMap
                    uniform sampler2D s3; // PatternMask1Map
                    uniform sampler2D s4; // PatternMask2Map
                    
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[1]; // ID OF OBJECT
            
                    void main()
                    {
                        vec4 v0;   
                        vec4 v5;
                        vec4 v6;
                        vec4 r0;
                        vec4 r1;
                        
                        int i0=0;
                        float c0 = 0.00392156886;
            
                        v0=texcoord;
                        v5=texcoord5;
                        v6=texcoord6;
                        
                        // Cull
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        if(texture2D(s0,v0.xy).x>0.0)
                        {
                            i0=${PickingBlueChannel.PAINT};
                        }
                        else if(texture2D(s2,v0.xy).x>0.0)
                        {
                            i0=${PickingBlueChannel.GLOW};
                        }
                        else
                        {
                            r0=getMaterialMask(s1,v0.xy);
                            if (r0.x>0.0) {i0=${PickingBlueChannel.MATERIAL_1};}
                            else if (r0.y>0.0) {i0=${PickingBlueChannel.MATERIAL_2};}
                            else if (r0.z>0.0) {i0=${PickingBlueChannel.MATERIAL_3};}
                            else {i0=${PickingBlueChannel.MATERIAL_4};}
                            
                            r1.x=getPatternLayer(s3,v6.xy,cb4[10].yz,cb4[12],r0);
                            if(r1.x>0.5){i0=${PickingBlueChannel.MATERIAL_5};}
                            
                            r1.x=getPatternLayer(s4,v6.zw,cb4[11].yz,cb4[13],r0);
                            if(r1.x>0.5){i0=${PickingBlueChannel.MATERIAL_6};}
                        }
                         
                        if (i0==0) discard;
                        
                        gl_FragData[0].xy=getVec2FromID(cb7[0].x);
                        gl_FragData[0].z=float(i0)*c0;
                        gl_FragData[0].w=1.0;
                    }
                `
            }
        }
    },
};

export const skinnedQuadExtendedPickingV5 = {
    name: "skinned_quadExtendedPickingV5",
    description: `skinned ${quadExtendedPickingV5.description}`,
    techniques : {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadExtendedPickingV5.techniques.Main.ps
        }
    }
};
