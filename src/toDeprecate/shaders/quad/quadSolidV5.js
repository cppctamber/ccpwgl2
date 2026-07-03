import { vs, ps } from "./shared";
import { clampToBorder } from "../shared/func";
import { ObjectID } from "../shared/constant";
import * as func from "./extended/func";
import { PickingBlueChannel } from "constant";
import { createLinearColor } from "../shared/util";

const SolidColor = createLinearColor({
    name: "SolidColor",
    ui: {
        group: "General",
        description: "Solid colour"
    }
});

const _quadExtendedPickingV5 = {
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [ ObjectID ],
                textures: [],
                shader: `

                    ${ps.headerNoShadow}
                    ${func.getVec2FromID}
                    ${func.isMasked}
                    ${func.getMaterialMask}
                    ${clampToBorder}
                    ${func.getPatternLayer}

                    varying vec4 texcoord;
                    varying vec4 texcoord5;
                    varying vec4 texcoord6;

                    uniform vec4 cb4[16];
                    uniform vec4 cb7[1]; // ID OF OBJECT

                    void main()
                    {
                        vec4 v0;
                        vec4 v5;
                        vec4 v6;
                        vec4 r0;
                        vec4 r1;

                        int i0=0;
                        float c0 = 0.00392156886;

                        v0=texcoord;
                        v5=texcoord5;
                        v6=texcoord6;

                        // Cull
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;

                        i0=${PickingBlueChannel.MATERIAL_1};

                        gl_FragData[0].xy=getVec2FromID(cb7[0].x);
                        gl_FragData[0].z=float(i0)*c0;
                        gl_FragData[0].w=1.0;
                    }
                `
            }
        }
    },
};

export const quadSolidV5 = {
    name: "quadSolidV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadSolidV5",
    description: "general solid colour shader",
    techniques: {
        ExtendedPicking: _quadExtendedPickingV5.techniques.Main,
        Main: {
            vs: vs.quadV5_PosTexTanTexL01,
            ps: {
                constants: [ SolidColor ],
                textures: [],
                shader: `

                    ${ps.header}
                    varying vec4 texcoord5;
                    uniform vec4 cb4[16];
                    uniform vec4 cb7[1];

                    void main()
                    {
                        vec4 r0;
                        vec4 v5;

                        v5=texcoord5;

                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;

                        gl_FragData[0].xyz=cb7[0].xyz;
                        gl_FragData[0].w=0.0;
                    }
                `
            }
        }
    }
};
