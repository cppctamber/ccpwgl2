import { ps, texture, vs } from "../shared";
import { ObjectID } from "../../shared/constant";
import * as func from "./func";
import { PickingBlueChannel } from "constant";


export const quadExtendedPickingNoPatternV5 = {
    name: "quadExtendedPickingNoPatternV5",
    description: "quad picking shader with materials, glow and paint",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [
                    ObjectID
                ],
                textures: [
                    texture.PaintMaskMap,
                    texture.MaterialMap,
                    texture.GlowMap
                ],
                shader: `
    
                    ${ps.headerNoShadow}
                    ${func.getVec2FromID}
                    ${func.isMasked}
                    ${func.getMaterialMask}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord5;
                    
                    uniform sampler2D s0; // PaintMaskMap
                    uniform sampler2D s1; // MaterialMap
                    uniform sampler2D s2; // GlowMap

                    uniform vec4 cb4[14];
                    uniform vec4 cb7[1];
            
                    void main()
                    {
                        vec4 v0;      
                        vec4 v5;
                        vec4 r0;
                        
                        int i0 = 0;            
                        float c0 = 0.00392156886;
            
                        v0=texcoord;
                        v5=texcoord5;
            
                        // Cull
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;

                        if(texture2D(s0,v0.xy).x>0.0)
                        {
                            gl_FragData[0].z=float(${PickingBlueChannel.PAINT})*c0;
                            return;            
                        }
                        
                        if(texture2D(s2,v0.xy).x>0.0)
                        {
                            gl_FragData[0].z=float(${PickingBlueChannel.GLOW})*c0;
                            return;            
                        }
                        
                        r0=getMaterialMask(s1,v0.xy);
                        if (r0.x>0.0) {i0=${PickingBlueChannel.MATERIAL_1};}
                        else if (r0.y>0.0) {i0=${PickingBlueChannel.MATERIAL_2};}
                        else if (r0.z>0.0) {i0=${PickingBlueChannel.MATERIAL_3};}
                        else {i0=${PickingBlueChannel.MATERIAL_4};}
                        
                        if (i0==0) discard;
                       
                        gl_FragData[0].xy=getVec2FromID(cb7[0].x);
                        gl_FragData[0].z=float(i0)*c0;
                        gl_FragData[0].w=1.0;
                    }
                `
            }
        }
    }
};

export const skinnedQuadExtendedPickingNoPatternV5 = {
    name: "skinned_quadExtendedPickingNoPatternV5",
    description: `skinned ${quadExtendedPickingNoPatternV5.description}`,
    techniques : {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadExtendedPickingNoPatternV5.techniques.Main.ps
        }
    }
};