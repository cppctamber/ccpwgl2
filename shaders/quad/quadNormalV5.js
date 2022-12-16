import { vs, ps } from "./shared";

export const quadNormalV5 = {
    name: "quadNormalV5",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                shader: `
                
                    ${ps.header}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    uniform vec4 cb4[3];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        v0=texcoord;
                        r0.xyz=(-cb4[1].xyz)+v0.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        gl_FragData[0].xyz = texcoord1.xyz;
                        gl_FragData[0].w = 1.0;
                    }
                
                `
            }
        }
    }
};

export const skinnedQuadNormalV5 = {
    name: "skinned_quadNormalV5",
    techniques: {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadNormalV5.techniques.Main.ps
        }
    }
};