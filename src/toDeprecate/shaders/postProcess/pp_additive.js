import { vs } from "./shared";
import { BlitCurrent, BlitOriginal, EveSpaceSceneDepthMap, EveSpaceSceneNormalMap } from "../shared/texture";
import { G_TEXEL_SIZE } from "../shared/constant";
import { WidgetType } from "../shared/util";
import { precision } from "../shared/func";

const AdditiveStrength = {
    name: "AdditiveStrength",
    value: [ 1, 0, 0, 0 ],
    ui: {
        description: "Additive parameters",
        components: [
            "additive strength"
        ],
        widget: WidgetType.MIXED
    }
};


export const pp_additive = {

    name: "pp_additive",
    author: "T'amber",
    techniques: {
        Main: {
            vs: vs.post,
            ps: {
                textures: [
                    BlitCurrent,
                    BlitOriginal
                ],
                constants: [
                    AdditiveStrength
                ],
                shader: `

                    ${precision}

                    varying vec2 texcoord;

                    uniform sampler2D s0; // Blit current
                    uniform sampler2D s1; // Blit Original

                    uniform vec4 cb7[1];

                    void main()
                    {
                        vec3 blitOriginal=texture2D( s1, texcoord.xy ).xyz;
                        vec3 blitCurrent=texture2D( s0, texcoord.xy ).xyz;

                        gl_FragData[0].xyz = vec3(blitOriginal + blitCurrent * cb7[0].x);
                        gl_FragData[0].w = 1.0;
                    }
                `
            }
        }
    }

};