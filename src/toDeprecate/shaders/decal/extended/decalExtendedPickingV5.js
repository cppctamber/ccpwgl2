import { vs, ps, texture } from "../shared";
import { clampToBorder } from "../../shared/func";
import { ObjectID } from "../../shared/constant";
import { getVec2FromID } from "../../quad/extended/func";
import { PickingBlueChannel } from "constant";


export const decalExtendedPickingV5 = {
    name: "decalExtendedPickingV5",
    description: "extended picking shader for decalV5",
    techniques: {
        Main: {
            vs: vs.decal_PosTexTan,
            ps: {
                constants: [
                    ObjectID,
                ],
                textures: [
                    texture.DecalTransparencyMap_SamplerBorder,
                ],
                shader: `
                    ${ps.header}
                    ${clampToBorder}
                    ${getVec2FromID}

                    varying vec4 texcoord;
                    varying vec4 texcoord5;

                    uniform sampler2D s0;            // DecalTransparencyMap

                    uniform vec4 cb2[22];
                    uniform vec4 cb4[4];
                    uniform vec4 cb7[1];

                    void main()
                    {
                        vec4 c2=vec4(1,0.5,2,-1);
                        float c0 = 0.00392156886;

                        vec4 v0;
                        vec4 v1;
                        v0=texcoord;  // UVs
                        v1=texcoord5;

                        vec4 r0;

                        // Visibility check
                        r0.xyz=(-cb4[2].xyz)+v1.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[2].w;
                        r0=cb4[3].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;

                        r0.xy=c2.xx+v0.zw;
                        r0.xy=r0.xy*c2.yy;

                        // DecalTransparencyMap
                        r0.w = clampToBorder(s0,r0.xy).x;

                        // Discard if not visible...
                        if(r0.w<0.01) discard;

                        gl_FragData[0].xy=getVec2FromID(cb7[0].x);
                        gl_FragData[0].z=float(${PickingBlueChannel.DECAL})*c0;
                        gl_FragData[0].w=1.0;
                    }
                    `
            }
        }
    }
};