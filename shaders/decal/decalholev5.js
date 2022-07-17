import { ps, texture, constant, vs } from "./shared";
import { clampToBorder, precision } from "../shared/func";
import { PosTexTan } from "../shared/input";
import * as d3d from "constant";


export const decalHoleV5 = {
    name: "decalHoleV5",
    replaces: "graphics/effect.gles2/managed/space/decals/v5/decalHoleV5",
    description: "quad shader",
    todo: "Add dirt",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: PosTexTan,
                shader: `
                
                    ${vs.shadowHeader}
                    
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    varying vec4 texcoord2;
                    varying vec4 texcoord3;
                    varying vec4 texcoord4;
                    varying vec4 texcoord5;
                    varying vec4 texcoord7;
                    varying vec4 texcoord8;
                    varying vec4 texcoord9;
                    varying vec4 texcoord10;
                    uniform vec4 cb1[29];
                    uniform vec4 cb3[20];
                    uniform vec3 ssyf;
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        
                        vec4 c0=vec4(6.28318548,-3.14159274,0.159154937,0.5);
                        vec4 c1=vec4(0,1,0,0);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        
                        r0=cb3[17];
                        r1=r0*cb3[3].yyyy;
                        r2=cb3[16];
                        r1=r2*cb3[3].xxxx+r1;
                        r3=cb3[18];
                        r1=r3*cb3[3].zzzz+r1;
                        r4=cb3[19];
                        r1=r4*cb3[3].wwww+r1;
                        r5=v0.xyzx*c1.yyyx+c1.xxxy;
                        r1.w=dot(r5,r1);
                        r6=r0*cb3[0].yyyy;
                        r6=r2*cb3[0].xxxx+r6;
                        r6=r3*cb3[0].zzzz+r6;
                        r6=r4*cb3[0].wwww+r6;
                        r1.x=dot(r5,r6);
                        r7=r0*cb3[1].yyyy;
                        r7=r2*cb3[1].xxxx+r7;
                        r7=r3*cb3[1].zzzz+r7;
                        r7=r4*cb3[1].wwww+r7;
                        r1.y=dot(r5,r7);
                        r0=r0*cb3[2].yyyy;
                        r0=r2*cb3[2].xxxx+r0;
                        r0=r3*cb3[2].zzzz+r0;
                        r0=r4*cb3[2].wwww+r0;
                        r1.z=dot(r5,r0);
                        gl_Position.x=dot(r1,cb1[4]);
                        gl_Position.y=dot(r1,cb1[5]);
                        gl_Position.z=dot(r1,cb1[6]);
                        gl_Position.w=dot(r1,cb1[7]);
                        r2=v2*c0.xxxx+c0.yyyy;
                        {bvec4 tmp=lessThan(c1.xxxx,r2.ywzw);r3.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;};
                        r2=r2*c0.zzzz+c0.wwww;
                        r2=fract(r2);
                        r2=r2*c0.xxxx+c0.yyyy;
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
                        texcoord1.x=dot(r8.xyz,r6.xyz);
                        texcoord1.y=dot(r8.xyz,r7.xyz);
                        texcoord1.z=dot(r8.xyz,r0.xyz);
                        texcoord2.x=dot(r3.xyz,r6.xyz);
                        texcoord3.x=dot(r2.xyz,r6.xyz);
                        texcoord2.y=dot(r3.xyz,r7.xyz);
                        texcoord3.y=dot(r2.xyz,r7.xyz);
                        texcoord3.z=dot(r2.xyz,r0.xyz);
                        texcoord2.z=dot(r3.xyz,r0.xyz);
                        r0.xyz=(-r1.xyz)+cb1[3].xyz;
                        r0.w=dot(r0.xyz,r0.xyz);
                        r0.w=r0.w==0.0?3.402823466e+38:inversesqrt(abs(r0.w));
                        texcoord4.xyz=r0.www*r0.xyz;
                        r0.x=1.0/r0.w;
                        texcoord7.x=dot(r1,cb1[16]);
                        texcoord7.y=dot(r1,cb1[17]);
                        texcoord7.z=dot(r1,cb1[18]);
                        texcoord7.w=dot(r1,cb1[19]);
                        texcoord8.x=dot(r1,cb1[20]);
                        texcoord8.y=dot(r1,cb1[21]);
                        texcoord8.z=dot(r1,cb1[22]);
                        texcoord8.w=dot(r1,cb1[23]);
                        texcoord9.x=dot(r5,cb3[12]);
                        texcoord9.y=dot(r5,cb3[13]);
                        texcoord9.z=dot(r5,cb3[14]);
                        r1.xy=c1.xy;
                        r1=cb1[3].xyzx*r1.yyyx+r1.xxxy;
                        r2.x=dot(r1,cb3[4]);
                        r2.y=dot(r1,cb3[5]);
                        r2.z=dot(r1,cb3[6]);
                        r2.w=dot(r1,cb3[7]);
                        texcoord10.x=dot(r2,cb3[12]);
                        texcoord10.y=dot(r2,cb3[13]);
                        texcoord10.z=dot(r2,cb3[14]);
                        r1.xyz=cb1[28].xyz;
                        r2.x=dot(r1.xyz,cb3[4].xyz);
                        r2.y=dot(r1.xyz,cb3[5].xyz);
                        r2.z=dot(r1.xyz,cb3[6].xyz);
                        r2.w=dot(r1.xyz,cb3[7].xyz);
                        texcoord9.w=dot(r2,cb3[12]);
                        texcoord10.w=dot(r2,cb3[13]);
                        texcoord.w=dot(r2,cb3[14]);
                        texcoord.xyz=v1.xyy;
                        texcoord4.w=r0.x;
                        texcoord5.w=r0.x;
                        texcoord5.xyz=v0.xyz;
                    
                        ${vs.shadowFooter}
                    }
                `
            },
            ps: {
                constants: [
                    constant.DecalGlowColor
                ],
                textures: [
                    texture.DecalTransparencyMap_SamplerBorder,
                    texture.DecalHoleMap,
                    texture.DecalInsideCubeMap
                ],
                shader: `

                    ${precision}
                    ${clampToBorder}
                    ${ps.shadowHeader}
                    
                    varying vec4 texcoord5;
                    varying vec4 texcoord9;
                    varying vec4 texcoord10;
                    
                    uniform sampler2D s0;
                    uniform sampler2D s1;
                    uniform samplerCube s2;
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[4];
                    uniform vec4 cb7[1];

                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        
                        vec4 c1=vec4(1,0.5,0,-0.00313080009);
                        vec4 c2=vec4(12.9200001,0.416666657,1.05499995,-0.0549999997);
                        
                        v0=texcoord5;
                        v1=texcoord9;
                        v2=texcoord10;
                        
                        r0.xyz=(-cb4[2].xyz)+v0.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[2].w;
                        r0=cb4[3].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.x=dot(v2.xyz,v2.xyz);
                        r1.xyz=v2.xyz;
                        r0.yzw=(-r1.xyz)+v1.xyz;
                        r1.xyz=normalize(r0.yzw);
                        r0.y=dot(r1.xyz,v2.xyz);
                        r0.x=r0.y*r0.y+(-r0.x);
                        r2=r0.xxxx+c1.xxxx;
                        r0.x=sqrt(abs(r2.w));
                        r0.x=r0.x+(-r0.y);
                        r0.xyz=r0.xxx*r1.xyz+v2.xyz;
                        r1.xyz=normalize(r0.xyz);
                        r0=textureCube(s2,r1.xyz);
                        if(any(lessThan(r2,vec4(0.0))))discard;
                        r0.xy=c1.xx+v1.yz;
                        r0.xy=r0.xy*c1.yy;
                        r1=clampToBorder(s1,r0.xy);
                        r2=clampToBorder(s0,r0.xy);
                        gl_FragData[0].w=r2.w;
                        r0.xyz=r1.xxx*cb7[0].xyz;
                        r1.xyz=cb7[0].xyz*r0.www+(-r0.xyz);
                        r0.xyz=r1.www*r1.xyz+r0.xyz;
                        r1.xyz=max(r0.xyz,c1.zzz);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c2.yyy;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c2.zzz+c2.www;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c1.www;
                        r2.xyz=r2.xyz*c2.xxx;
                        {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                        }

                        ${ps.shadowFooter}
                    }
                `
            },
            states: {
                [d3d.RS_ZWRITEENABLE]: 0,
                [d3d.RS_ALPHATESTENABLE] : 0,
                [d3d.RS_SRCBLEND] : d3d.BLEND_SRCALPHA,
                [d3d.RS_DESTBLEND] : d3d.BLEND_INVSRCALPHA,
                [d3d.RS_ALPHABLENDENABLE] : 1,
                [d3d.RS_BLENDOP] : d3d.BLENDOP_ADD
            }
        }
    }
};