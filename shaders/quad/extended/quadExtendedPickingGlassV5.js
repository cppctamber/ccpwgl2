import * as func from "./func";
import { texture, ps, vs } from "../shared";
import { ObjectID } from "../../shared/constant";
import { PickingBlueChannel } from "constant";


export const quadExtendedPickingGlassV5 = {
    name: "quadExtendedPickingGlassV5",
    description: "quad sails picking shader with materials, patterns, glow and paint",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [
                    ObjectID
                ],
                textures: [
                    texture.MaterialMap
                ],
                shader: `
    
                    ${ps.headerNoShadow}
                    ${func.getVec2FromID}
                    ${func.getMaterialMask}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord5;

                    uniform sampler2D s0; // MaterialMap
                    
                    uniform vec4 cb4[15];
                    uniform vec4 cb7[1];
            
                    void main(){
                    
                        vec4 v0;
                        vec4 v5;        
                        vec4 r0;
                        
                        int i0=0;
                        float c0=0.00392156886;
                        
                        v0=texcoord;
                        v5=texcoord5;
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        r0=getMaterialMask(s0,v0.xy);
                        if(r0.w>0.0)i0=${PickingBlueChannel.GLASS};
                        gl_FragData[0].xy=getVec2FromID(cb7[0].x);
                        gl_FragData[0].z=float(i0)*c0;
                        gl_FragData[0].w=1.0;
                    }
                `
            }
        }
    },
};

export const skinnedQuadExtendedPickingGlassV5 = {
    name: "skinned_quadSailsExtendedPickingV5",
    description: `skinned ${quadExtendedPickingGlassV5.description}`,
    techniques : {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadExtendedPickingGlassV5.techniques.Main.ps
        }
    }
};