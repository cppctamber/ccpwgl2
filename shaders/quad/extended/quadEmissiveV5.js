import { constant, ps, vs, texture } from "../shared";


export const quadEmissiveV5 = {
    name: "quadEmissiveV5",
    description: "quad emissive only shader",
    techniques: {
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.GeneralData,
                    constant.GeneralGlowColor
                ],
                textures: [
                    texture.GlowMap
                ],
                shader: `
                
                    ${ps.headerNoShadow} // reduce this to only what is required
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord5;
                    
                    uniform sampler2D s0; // GlowMap
                    
                    uniform vec4 cb4[3];
                    uniform vec4 cb7[2];
        
                    void main()
                    {
                        vec2 uv=texcoord.xy;
                        vec4 v1=texcoord5;                 
                        vec4 r0;
                        
                        r0.xyz=(-cb4[1].xyz)+v1.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        gl_FragData[0].w=(-r0.x)+1.0;
                        
                        // GlowMap     
                        r0.w=texture2D(s0,uv).x; 
                        if (r0.w==0.0)discard;    
                        
                        gl_FragData[0].xyz=cb7[1].xyz * r0.w;
                    }
               `
            }
        }
    }
};


export const skinnedQuadEmissiveV5 = {
    name: "skinned_quadEmissiveV5",
    description : `skinned ${quadEmissiveV5.description}`,
    techniques: {
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadEmissiveV5.techniques.Main.ps
        }
    }
};

