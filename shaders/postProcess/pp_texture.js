import { TextureMap } from "../shared/texture";
import { vs } from "./shared";
import { precision } from "../shared/func";
//import { G_TEXEL_SIZE } from "../shared/constant";

export const pp_texture = {
    name: "pp_texture",
    description: "Draws a texture full screen",
    techniques: {
        Main: {
            vs: vs.post,
            ps: {
                textures: [
                    TextureMap
                ],
                constants: [
                    //G_TEXEL_SIZE
                ],
                shader: `
                
                    ${precision}
                    
                    varying vec2 texcoord;
                    
                    uniform sampler2D s0; 
                    //uniform vec4 cb7[1];
                    
                    void main()
                    {
                        vec3 tex = texture2D(s0, texcoord.xy).xyz;
                        
                        gl_FragData[0].xyz = vec3(1.0);
                        gl_FragData[0].w = 1.0;
                    }
                `
            }
        }
    }
};