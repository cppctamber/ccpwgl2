import { vs } from "./shared";
import { BlitCurrent, BlitOriginal, TextureMap } from "../shared/texture";
import { precision } from "../shared/func";
import { WidgetType } from "../shared/util";



export const postMix = {
    name: "postMix",
    description: "Combines original blit with a textures using basic maths",
    techniques: {
        Main: {

            vs: vs.post,
            ps: {
                textures: [
                    BlitCurrent,
                    BlitOriginal,
                    TextureMap
                ],
                constants: [
                    {
                        name: "Amount",
                        value: [ 1, 1, 1, 1 ],
                        ui: {
                            components: [
                                "red multiplier",
                                "green multiplier",
                                "blue multiplier",
                                "alpha multiplier"
                            ],
                            widget: WidgetType.MIXED
                        }
                    },
                    {
                        name: "MiscSettings",
                        value: [ 0, 1, 0, 0 ],
                        ui: {
                            components: [
                                "mode",
                                "general multiplier"
                            ],
                            description: "Mode: 0=add, 1=minus, 2=multiply, 3=divide",
                            widget: WidgetType.MIXED
                        }
                    }
                ],
                shader: `
                
                    ${precision}
                    
                    varying vec2 uv;
                    
                    uniform sampler2D s0; // BlitCurrent
                    uniform sampler2D s1; // TextureMap
                    uniform vec4 cb7[2];
                    
                    void main()
                    {
                        vec4 blitCurrent = texture2D(s0, uv);
                        vec4 texture = texture2D(s1, uv);
                        
                        gl_FragColor = texture;
                        return;
                        
                        texture = texture * cb7[0] * cb7[1].y;
                      
                        int mode = int(cb7[1].x);
                        
                        if (mode == 1)
                        {
                            gl_FragColor = blitCurrent - texture;
                            return;
                        }
                        
                        if (mode == 2)
                        {
                            gl_FragColor = blitCurrent * texture;
                            return;
                        }
                        
                        if (mode == 3)
                        {
                            gl_FragColor = blitCurrent / texture;
                            return;
                        }
                        
                        gl_FragColor = blitCurrent + texture;         
                    }
                `
            }
        }
    }
};