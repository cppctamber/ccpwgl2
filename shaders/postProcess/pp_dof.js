import { vs } from "./shared";
import { BlitCurrent, EveSpaceSceneDepthMap, EveSpaceSceneNormalMap } from "../shared/texture";
import { G_CAMERA, G_TEXEL_SIZE } from "../shared/constant";
import { WidgetType } from "../shared/util";
import { precision } from "../shared/func";
import { toLinearDepth, texFetch } from "./shared/func";

const MiscOptions = {
    name: "MiscOptions",
    value: [ 0, 0, 0, 0 ],
    ui: {
        description: "Misc options",
        components: [
            "focus distance",
            "blur coefficient",
            "pixels per meter",
            "is vertical"
        ],
        widget: WidgetType.MIXED
    }
};

export const pp_dof = {
    name: "pp_dof",
    author: "tsherif",
    techniques: {
        Main: {
            vs: vs.post,
            ps: {
                textures: {
                    BlitCurrent,
                    EveSpaceSceneDepthMap
                },
                constants: [
                    G_TEXEL_SIZE,
                    G_CAMERA,
                    MiscOptions,
                ],
                shader: `
                    
                    ${precision}
                    ${toLinearDepth}
                    ${texFetch}
                    
                    varying vec2 texcoord;
                    
                    uniform sampler2D s0; // Blit Current
                    uniform sampler2D s1; // Depth Map
                    
                    uniform vec4 cb7[3];
                    

                    void main()
                    {
                        const float MAX_BLUR = 20.0;
                    
                        vec2 fragCoord= vec2(gl_FragCoord.xy);
                        vec2 resolution = vec2(cb7[0].zw);
                        float uFocusDistance = cb7[2].x;
                        float uBlurCoefficient = cb7[2].y;
                        float uPPM = cb7[2].z;
                        
                        vec2 uTexelOffset = vec2(0.0);
                        // Vertical
                        if (cb7[2].w > 0.0)
                        {
                            uTexelOffset.y = 1.0;                        
                        }
                        // Horizontal
                        else
                        {
                            uTexelOffset.x = 1.0;
                        }
                        
                        vec2 uDepthRange = cb7[1].xy;
                        
                        // Convert to linear depth
                        float depth = toLinearDepth(texFetch(s1, fragCoord, cb7[1].zw).x, uDepthRange);
                        float deltaDepth = abs(uFocusDistance - depth);
                        
                        // Blur more quickly in the foreground.
                        float xdd = depth < uFocusDistance ? abs(uFocusDistance - deltaDepth) : abs(uFocusDistance + deltaDepth);
                        float blurRadius = min(floor(uBlurCoefficient * (deltaDepth / xdd) * uPPM), MAX_BLUR);
                        
                        vec4 color = vec4(0.0);
                        if (blurRadius > 1.0) 
                        {
                            float halfBlur = blurRadius * 0.5;
                            float count = 0.0;
                            for (float i = 0.0; i <= MAX_BLUR; ++i) 
                            {
                                if (i > blurRadius) 
                                {
                                    break;
                                }
                                // texelFetch outside texture gives vec4(0.0) (undefined in ES 3)
                                vec2 sampleCoord = clamp(fragCoord + vec2(((i - halfBlur) * uTexelOffset)), vec2(0), resolution);
                                color += texFetch(s0, sampleCoord, cb7[1].zw);
                                ++count;
                            }
                            color /= count;
                        } 
                        else 
                        {
                            color = texFetch(s0, fragCoord, cb7[1].zw);
                        }
            
                        gl_FragData[0] = color;
                    }
                
                `
            }
        }
    }
};