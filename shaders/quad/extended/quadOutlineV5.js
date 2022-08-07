import * as input from "../../shared/input";
import { precision } from "../../shared/func";
import { Outline } from "./constant";


export const quadOutlineV5 = {
    name: "quadOutlineV5",
    description: "quad outline shader",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: input.PosTexTanTex,
                constants: [
                    Outline
                ],
                shader: `
    
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    
                    uniform vec4 cb0[1];
                    uniform vec4 cb1[24];
                    uniform vec4 cb3[26];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 position;
                        vec4 normal;
                         
                        vec4 c0=vec4(6.28318548,-3.14159274,0.159154937,0.5);
                        vec4 c1=vec4(0,1,0,0);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        v3=attr3;
                
                        r0=v2*c0.xxxx+c0.yyyy;
                        {
                            bvec4 tmp=lessThan(c1.xxxx,r0.ywzw);
                            r2.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;
                        }
                        
                        r0=r0*c0.zzzz+c0.wwww;
                        r0=fract(r0);
                        r0=r0*c0.xxxx+c0.yyyy;
                        r2.x=r2.y*r2.x;
                        r3.xy=vec2(cos(r0.x), sin(r0.x));
                        r4.xy=vec2(cos(r0.y), sin(r0.y));
                        r3.xy=r3.xy*abs(r4.yy);
                        r3.z=r4.x;
                        r4.xy=vec2(cos(r0.z), sin(r0.z));
                        r5.xy=vec2(cos(r0.w), sin(r0.w));
                        r0.xy=r4.xy*abs(r5.yy);
                        r0.z=r5.x;
                        r2.yzw=r0.yzx*r3.zxy;
                        r2.yzw=r3.yzx*r0.zxy+(-r2.yzw);
                        r4.xyz=mix((-r2.yzw),r2.yzw,r2.xxx);
                        normal.x=dot(r4.xyz,cb3[0].xyz);
                        normal.y=dot(r4.xyz,cb3[1].xyz);
                        normal.z=dot(r4.xyz,cb3[2].xyz);
                        
                        position.xyz = v0.xyz + normal.xyz * cb0[0].w;
                        r0=position.xyzx*c1.yyyx+c1.xxxy;
                        r1.x=dot(r0,cb3[0]);
                        r1.y=dot(r0,cb3[1]);
                        r1.z=dot(r0,cb3[2]);
                        r1.w=dot(r0,cb3[3]);
                        gl_Position.x=dot(r1,cb1[4]);
                        gl_Position.y=dot(r1,cb1[5]);
                        gl_Position.z=dot(r1,cb1[6]);
                        gl_Position.w=dot(r1,cb1[7]);
                        
                    }
                `
            },
            ps: {
                constants: [
                    Outline
                ],
                shader: `

                    ${precision}        
        
                    uniform vec4 cb7[1];
                    
                    void main()
                    {
                        // Todo: Add culling
                        gl_FragData[0].xyz = cb7[0].xyz;
                        gl_FragData[0].w = 1.0;                     
                    }
        
                `
            }
        }
    }
};

export const skinnedQuadOutlineV5 = {
    name: "skinned_quadOutlineV5",
    description: "quad outline shader",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: input.PosBwtTexTanTex,
                constants: [
                    Outline
                ],
                shader: `
    
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    attribute vec4 attr4;
                    
                    uniform vec4 cb0[1];
                    uniform vec4 cb1[24];
                    uniform vec4 cb3[200];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v4;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        
                        vec4 position;
                        vec4 normal;
                        
                        ivec4 a0;
                        
                        vec4 c0=vec4(3,0,1,0.5);
                        vec4 c1=vec4(6.28318548,-3.14159274,0.159154937,0.5);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        v3=attr3;
                        v4=attr4;
                        
                        r0.x=c0.x*v1.x;         
                        a0.x=int(r0.x+0.5);      
                        r0=cb3[27+a0.x];
                        r1=r0*cb3[3].yyyy;
                        r2=cb3[26+a0.x];
                        r1=r2*cb3[3].xxxx+r1;
                        r3=cb3[28+a0.x];
                        r1=r3*cb3[3].zzzz+r1;
                        r4.yz=c0.yz;
                        r1=cb3[3].wwww*r4.yyyz+r1;
                        r5=v0.xyzx*c0.zzzy+c0.yyyz;
                        r1.w=dot(r5,r1);
                        r6=r0*cb3[0].yyyy;
                        r6=r2*cb3[0].xxxx+r6;
                        r6=r3*cb3[0].zzzz+r6;
                        r6=cb3[0].wwww*r4.yyyz+r6;
                        r1.x=dot(r5,r6);
                        r7=r0*cb3[1].yyyy;
                        r7=r2*cb3[1].xxxx+r7;
                        r7=r3*cb3[1].zzzz+r7;
                        r7=cb3[1].wwww*r4.yyyz+r7;
                        r1.y=dot(r5,r7);
                        r0=r0*cb3[2].yyyy;
                        r0=r2*cb3[2].xxxx+r0;
                        r0=r3*cb3[2].zzzz+r0;
                        r0=cb3[2].wwww*r4.yyyz+r0;
                        r1.z=dot(r5,r0);
                        
                        position = r1;

                        r2=v3*c1.xxxx+c1.yyyy;
                        {
                            bvec4 tmp=lessThan(c0.yyyy,r2.ywzw);
                            r3.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;
                        }
                        r2=r2*c1.zzzz+c1.wwww;
                        r2=fract(r2);
                        r2=r2*c1.xxxx+c1.yyyy;
                        r0.w=r3.y*r3.x;
                        r3.xy=vec2(cos(r2.x), sin(r2.x));
                        r4.xy=vec2(cos(r2.y), sin(r2.y));
                        r3.xy=r3.xy*abs(r4.yy);
                        r3.z=r4.x;
                        r4.xy=vec2(cos(r2.z), sin(r2.z));
                        r8.xy=vec2(cos(r2.w), sin(r2.w));
                        r2.xy=r4.xy*abs(r8.yy);
                        r2.z=r8.x;
                        r4.xyz=r2.yzx*r3.zxy;
                        r4.xyz=r3.yzx*r2.zxy+(-r4.xyz);
                        r8.xyz=mix((-r4.xyz),r4.xyz,r0.www);
                        normal.x=dot(r8.xyz,r6.xyz);
                        normal.y=dot(r8.xyz,r7.xyz);
                        normal.z=dot(r8.xyz,r0.xyz);

                        position.xyz += normal.xyz * cb0[0].w;
                        gl_Position.x=dot(position,cb1[4]);
                        gl_Position.y=dot(position,cb1[5]);
                        gl_Position.z=dot(position,cb1[6]);
                        gl_Position.w=dot(position,cb1[7]);
                    }
                `
            },
            ps: quadOutlineV5.techniques.Main.ps
        }
    }
};