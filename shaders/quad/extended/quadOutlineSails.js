import { Outline } from "./constant";
import { PaintMaskMap } from "../shared/texture";
import { headerNoShadow } from "../shared/ps";
import { quadOutlineV5, skinnedQuadOutlineV5 } from "./quadOutlineV5";


export const quadOutlineSailsV5 = {
    name: "quadOutlineSailsV5",
    description: "quad sails outline shader",
    techniques: {
        Main: {
            vs: quadOutlineV5.techniques.Main.vs,
            ps: {
                constants: [
                    Outline
                ],
                textures: [
                    PaintMaskMap
                ],
                shader: `

                    ${headerNoShadow}
                    
                    varying vec4 texcoord;

                    uniform sampler2D s0; // PaintMaskMap

                    uniform vec4 cb4[15];
                    uniform vec4 cb7[1];
            
                    void main(){
                    
                        vec4 v0;
                        v0=texcoord;
                        
                        // Todo: Add culling
                        
                        if(texture2D(s0,v0.xy).x>0.0)discard;
                        gl_FragData[0].xyz = cb7[0].xyz;
                        gl_FragData[0].w = 1.0;
                   }
                `
            }
        }
    }
};


export const skinnedQuadOutlineSailsV5 = {
    name: "skinned_quadOutlineSailsV5",
    description: "quad outline shader",
    techniques: {
        Main: {
            vs: skinnedQuadOutlineV5.techniques.Main.vs,
            ps: quadOutlineSailsV5.techniques.Main.ps
        }
    }
};