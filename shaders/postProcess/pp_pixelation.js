import { vs } from "./shared";
import { BlitCurrent, EveSpaceSceneDepthMap, EveSpaceSceneNormalMap } from "../shared/texture";
import { G_TEXEL_SIZE } from "../shared/constant";
import { WidgetType } from "../shared/util";
import { precision } from "../shared/func";


const EdgeStrength = {
    name: "EdgeStrength",
    value: [ 1, 1, 0, 0 ],
    ui: {
        description: "Edge strength parameters",
        components: [
            "normal edge strength",
            "depth edge strength",
        ],
        widget: WidgetType.MIXED
    }
};

const NormalEdgeBias = {
    name: "NormalEdgeBias",
    value: [ .1, .1, .1, 0 ],
    ui: {
        description: "Normal edge bias",
        components: [
            "normal edge bias x",
            "normal edge bias y",
            "normal edge bias z"
        ],
        widget: WidgetType.MIXED
    }
};


export const pp_pixelation = {

    name: "pp_pixelation",
    author: "ThreeJS",
    techniques: {
        Main: {
            vs: vs.post,
            ps: {
                textures: [
                    BlitCurrent,
                    EveSpaceSceneDepthMap,
                    EveSpaceSceneNormalMap
                ],
                constants: [
                    G_TEXEL_SIZE,
                    EdgeStrength,
                    NormalEdgeBias
                ],
                shader: `
                
                    ${precision}
                    
                    varying vec2 texcoord;
                    
                    uniform sampler2D s0; // Blit current
                    uniform sampler2D s1; // Depth
                    uniform sampler2D s2; // Normal
                    
                    uniform vec4 cb7[3];
                   
                    float getDepth(int x, int y) {
                        return texture2D( s1, texcoord.xy + vec2(x, y) * cb7[0].xy ).x;
                    }
                
                    vec3 getNormal(int x, int y) {
                        return texture2D( s2, texcoord.xy + vec2(x, y) * cb7[0].xy ).xyz * 2.0 - 1.0;
                    }
                
                    float depthEdgeIndicator(float depth, vec3 normal) {
                        float diff = 0.0;
                        diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
                        diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
                        diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
                        diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
                        return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;
                    }
                
                    float neighborNormalEdgeIndicator(int x, int y, float depth, vec3 normal) {
                        float depthDiff = getDepth(x, y) - depth;
                        vec3 neighborNormal = getNormal(x, y);
                        // Edge pixels should yield to faces who's normals are closer to the bias normal.
                        vec3 normalEdgeBias = cb7[2].xyz; 
                        float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
                        float normalIndicator = clamp(smoothstep(-.01, .01, normalDiff), 0.0, 1.0);
                        // Only the shallower pixel should detect the normal edge.
                        float depthIndicator = clamp(sign(depthDiff * .25 + .0025), 0.0, 1.0);
                        return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;
                    }
                    
                    float normalEdgeIndicator(float depth, vec3 normal) {
                        float indicator = 0.0;
                        indicator += neighborNormalEdgeIndicator(0, -1, depth, normal);
                        indicator += neighborNormalEdgeIndicator(0, 1, depth, normal);
                        indicator += neighborNormalEdgeIndicator(-1, 0, depth, normal);
                        indicator += neighborNormalEdgeIndicator(1, 0, depth, normal);
                        return step(0.1, indicator);
                    }
    
                    void main() 
                    {
                        vec4 texel = texture2D( s0, texcoord.xy );
                        float depth = 0.0;
                        vec3 normal = vec3(0.0);
                        
                        float depthEdgeStrength = cb7[1].x;
                        float normalEdgeStrength = cb7[1].y;
                        
                        if (depthEdgeStrength > 0.0 || normalEdgeStrength > 0.0) 
                        {
                            depth = getDepth(0, 0);
                            normal = getNormal(0, 0);
                        }
                        
                        float dei = 0.0;
                        if (depthEdgeStrength > 0.0) dei = depthEdgeIndicator(depth, normal);
                        
                        float nei = 0.0;
                        if (normalEdgeStrength > 0.0) nei = normalEdgeIndicator(depth, normal);
                        
                        float strength = dei > 0.0 ? (1.0 - depthEdgeStrength * dei) : (1.0 + normalEdgeStrength * nei);
                        
                        gl_FragColor = texel * strength;
                    }
                `
            }
        }
    }

};