import { vs } from "./shared";
import { precision } from "../shared/func";
import { blendOverlay, random } from "./shared/func";
import { createLinearColor, WidgetType } from "../shared/util";


const ScaleOffset = {
    name: "ScaleOffset",
    value: [ 0, 0, 0, 0 ],
    description: {
        components: [
            "scaleX",
            "scaleY",
            "offsetX",
            "offsetY"
        ],
        widget: WidgetType.MIXED
    }
};

const Smoothing = {
    name: "Smoothing",
    value: [ 0, 0, 0, 0 ],
    description: {
        components: [
            "smoothingX",
            "smoothingY"
        ]
    }
};

const MiscSettings = {
    name: "MiscSettings",
    value: [ 0,0,0,0 ],
    description: {
        components: [
            "aspect",
            "enableColoredNoise",
            "enableNoiseAlpha",
        ]
    }
};

const Color1 = createLinearColor({ name: "Color1" });

const Color2 = createLinearColor({ name: "Color2" });

export const pp_background_vignette = {
    name: "pp_background_vignette",
    techniques: {
        Main: {
            vs: vs.post,
            ps: {
                constants: [
                    MiscSettings,
                    ScaleOffset,
                    Smoothing,
                    Color1,
                    Color2
                ],
                shader: `
                
                    ${precision}
                    ${blendOverlay}
                    ${random}
                    
                    varying texcoord;
                    
                    uniform sampler s0;
                    uniform vec4 cb7[5];
                    
                    void main 
                    {
                        float aspect = cb7[0].x;
                        bool coloredNoise = bool(cb7[0].y);
                        bool noiseAlpha = bool(cb7[0].z);
                        
                        vec2 scale = cb7[1].xy;
                        vec2 offset = cb7[1].zw;
                        vec2 smoothing = cb7[2].xy;
                        
                        vec3 color1 = cb7[3].xyz;
                        vec3 color2 = cb7[4].xyz;
                        
                        vec2 pos = texcoord.xy;
                        pos -= 0.5;

                        pos.x *= aspect;
                        pos /= scale;
                        pos -= offset;

                        float dist = length(pos);
                        dist = smoothstep(smoothing.x, smoothing.y, 1.-dist);

                        vec4 color = vec4(1.0);
                        color.rgb = mix(color2, color1, dist);

                        if (noiseAlpha > 0.0) 
                        {
                           vec3 noise = coloredNoise ? vec3(random(vUv * 1.5), random(vUv * 2.5), random(vUv)) : vec3(random(vUv));
                           color.rgb = mix(color.rgb, blend(color.rgb, noise), noiseAlpha);
                        }
                        
                        gl_FragData[0] = color;
                    }
                `
            }
        }
    }
};