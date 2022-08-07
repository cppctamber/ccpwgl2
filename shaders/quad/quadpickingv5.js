import { vs, ps } from "./shared";
import { constant } from "../shared";


export const quadPickingV5 = {
    name: "quadPickingV5",
    description: "picking shader",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.ObjectID,
                    constant.AreaID
                ],
                shader: `
                
                    ${ps.headerNoShadow}
                    
                    varying vec4 texcoord;
                    uniform vec4 cb4[3];
                    uniform vec4 cb7[2];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        vec4 c2=vec4(1,0.00390625,0.00392156886,1.00392163);
                        v0=texcoord;
                        
                        r0.xyz=(-cb4[1].xyz)+v0.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.x=c2.x;
                        r0.y=r0.x+cb7[0].x;
                        r0.z=r0.y*c2.y;
                        r0.w=fract(r0.z);
                        r0.w=(-r0.w)+r0.z;
                        r0.z=fract(abs(r0.z));
                        r0.y=r0.y>=0.0?r0.z:(-r0.z);
                        gl_FragData[0].xy=r0.wy*c2.zw;
                        r0.x=r0.x+cb7[1].x;
                        r0.y=r0.x*c2.y;
                        r0.z=fract(r0.y);
                        r0.z=(-r0.z)+r0.y;
                        r0.y=fract(abs(r0.y));
                        r0.x=r0.x>=0.0?r0.y:(-r0.y);
                        gl_FragData[0].zw=r0.zx*c2.zw;
                    }
                `
            }
        }
    }
};


export const skinnedQuadPickingV5 = {
    name: "skinned_quadPicking",
    description: `skinned ${quadPickingV5.description}`,
    techniques: {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTex,
            ps: quadPickingV5.techniques.Main.ps
        }
    }
};