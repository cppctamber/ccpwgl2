import { vs, ps } from "./shared";


export const quadDepthV5 = {
    name: "quadDepthV5",
    description: "depth quad shader",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTex,
            ps: {
                shader: `

                    ${ps.headerNoShadow}
                    
                    varying vec4 texcoord;
                    uniform vec4 cb4[3];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        vec4 c0=vec4(0,1,0,0);
                        v0=texcoord;
                        r0.xyz=(-cb4[1].xyz)+v0.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        gl_FragData[0]=c0.xxxy;
                    }
                    
                `
            }
        }
    }
};


export const skinnedQuadDepthV5 = {
    name: "skinned_quadDepthV5",
    description: `skinned ${quadDepthV5.description}`,
    techniques: {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTex,
            ps: quadDepthV5.techniques.Main.ps
        }
    }
};