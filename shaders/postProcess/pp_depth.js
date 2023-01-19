import { vs } from "./shared";
import { EveSpaceSceneDepthMap } from "../shared/texture";
import { G_CAMERA } from "../shared/constant";
import { precision } from "../shared/func";
import { toLinearDepth } from "./shared/func";


export const pp_depth = {
    name: "pp_depth",
    techniques: {
        Main: {
            vs: vs.post,
            ps: {
                textures: {
                    EveSpaceSceneDepthMap,
                },
                constants: [
                    G_CAMERA
                ],
                shader: `
                
                    ${precision}
                    ${toLinearDepth}
                   
                    varying vec2 texcoord;
                    
                    uniform sampler2D s0; // Depth
                    uniform vec4 cb7[1];
                    
                    void main()
                    {
                        int mode = int(cb7[0].w);
                        float depth = texture2D(s0, texcoord).x;
                        float result = 0.0;
                        
                        if (mode == 0)
                        {
                            result = -depth;                                                   
                        }
                        else if (mode == 2)
                        {
                            result = depth;
                        }
                        else if (mode == 1)
                        {
                            result = -toLinearDepth(depth, cb7[0].xy);
                        }
                        else if (mode == 3)
                        {
                            result = toLinearDepth(depth, cb7[0].xy);
                        }
  
                        gl_FragData[0].xyz = vec3(result);
                        gl_FragData[0].w = 1.0; 
                    }
                
                `
            }
        }
    }
};