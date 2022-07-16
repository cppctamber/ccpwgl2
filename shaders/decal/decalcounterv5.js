import { texture, constant, vs, ps } from "./shared";
import { precision } from "../shared/func";
import * as d3d from "constant/d3d";


export const decalcounterv5 = {
    name: "decalcounterv5",
    path: "graphics/effect.gles2/managed/space/decals/v5/",
    description: "killmark decal shader",
    techniques: {
        Main: {
            vs: vs.decal_PosTexTan,
            ps: {
                constants: [
                    constant.DecalTextureScaling,
                    constant.DecalIntensityData,
                    constant.DecalGlowColor
                ],
                textures: [
                    texture.DecalAlbedoMap_SamplerWrap,
                    texture.DecalTransparencyMap_SamplerWrap
                ],
                shader: `

                    ${precision}
                    ${ps.shadowHeader}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord4;
                    varying vec4 texcoord5;
                    
                    uniform sampler2D s0;       // DecalAlbedoMap;
                    uniform sampler2D s1;       // DecalTransparencyMap;
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[4];
                    uniform vec4 cb7[3];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        
                        vec4 c3=vec4(0.5,1,3,9);
                        vec4 c4=vec4(3.32192802,2,4.5,0.5);
                        vec4 c5=vec4(-1.44269507e-005,-0.00313080009,12.9200001,0.416666657);
                        vec4 c6=vec4(1.05499995,-0.0549999997,0,0);
                        vec4 c7=vec4(1,4.5,1.5,0);
                        
                        v0=texcoord;
                        v1=texcoord4;
                        v2=texcoord5;
                        
                        r0.xyz=(-cb4[2].xyz)+v2.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[2].w;
                        r0=cb4[3].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.xy=c7.xx+v0.zw;
                        r0.zw=r0.yx*(-c3.xx)+c3.yy;
                        r1.xy=r0.zw*c3.zw;
                        r1.zw=fract(r1.xy);
                        {
                            bvec2 tmp=greaterThanEqual((-r1.zw),vec2(0.0));
                            r2.xy=vec2(tmp.x?c7.w:c7.x,tmp.y?c7.w:c7.x);
                        }
                        {
                            bvec2 tmp=greaterThanEqual(r0.zw,vec2(0.0));
                            r0.zw=vec2(tmp.x?c7.w:r2.x,tmp.y?c7.w:r2.y);
                        }
                        r1.xy=r1.xy+(-r1.zw);
                        r0.zw=r0.zw+r1.xy;
                        r1.xy=r0.xy*c7.yz;
                        r1.zw=fract(r1.yx);
                        r1.xy=r1.yx+(-r1.zw);
                        {
                            bvec2 tmp=greaterThanEqual((-r1.zw),vec2(0.0));
                            r1.zw=vec2(tmp.x?c7.w:c7.x,tmp.y?c7.w:c7.x);
                        }
                        {
                            bvec2 tmp=greaterThanEqual(r0.yx,vec2(0.0));
                            r1.zw=vec2(tmp.x?c7.w:r1.z,tmp.y?c7.w:r1.w);
                        }
                        r1.xy=r1.zw+r1.xy;
                        r2.xy=mix(r1.xy,r0.zw,cb7[0].yx);
                        r0.zw=r2.xy+c3.yx;
                        r0.z=r0.z*c4.x;
                        r0.z=exp2(r0.z);
                        r1.x=1.0/r0.z;
                        r1.x=r1.x*cb4[0].x;
                        r1.y=fract(abs(r1.x));
                        r1.x=r1.x>=0.0?r1.y:(-r1.y);
                        r0.z=r1.x*r0.z+c3.x;
                        r1.x=r2.x*c4.x;
                        r1.x=exp2(r1.x);
                        r1.x=1.0/r1.x;
                        r0.z=r0.z*r1.x;
                        r1.x=fract(r0.z);
                        r1.y=(-r1.x)>=0.0?c7.w:c7.x;
                        r1.y=r0.z>=0.0?c7.w:r1.y;
                        r0.z=r0.z+(-r1.x);
                        r0.z=r1.y+r0.z;
                        r0.z=(-r0.w)+r0.z;
                        {
                            bvec4 tmp=greaterThanEqual(r0.zzzz,vec4(0.0));
                            r1=vec4(tmp.x?(-c7.w):(-c7.x),tmp.y?(-c7.w):(-c7.x),tmp.z?(-c7.w):(-c7.x),tmp.w?(-c7.w):(-c7.x));
                        }
                        if(any(lessThan(r1,vec4(0.0))))discard;
                        r0.zw=r0.xy*c4.zw;
                        
                        // DecalAlbedoMap
                        r1.xyz=texture2D(s0,r0.zw).xyz;
                        
                        // DecalTransparencyMap
                        r1.w=texture2D(s1,r0.zw).x;
                        
                        r0.z=r1.w*cb7[1].x;
                        r0.z=r0.z*cb4[1].y;
                        {
                            bvec2 tmp=greaterThanEqual(r0.xy,vec2(0.0));
                            r1.xy=vec2(tmp.x?c7.x:c7.w,tmp.y?c7.x:c7.w);
                        }
                        r0.w=r1.y*r1.x;
                        r0.xy=(-r0.xy)+c4.yy;
                        {
                            bvec2 tmp=greaterThanEqual(r0.xy,vec2(0.0));
                            r0.xy=vec2(tmp.x?c7.x:c7.w,tmp.y?c7.x:c7.w);
                        }
                        r0.xz=r0.xz*r0.wz;
                        r0.x=r0.y*r0.x;
                        r0.x=r0.x*r0.z;
                        r0.y=cb2[15].w*v1.w;
                        r0.y=r0.y*c5.x;
                        r0.y=exp2(r0.y);
                        r1.xyz=cb2[15].xyz;
                        r1.xyz=(-r1.xyz)+cb7[2].xyz;
                        r0.yzw=r0.yyy*r1.xyz+cb2[15].xyz;
                        r0.yzw=r0.yzw*cb4[1].yyy;
                        r0.xyz=r0.xxx*r0.yzw;
                        r1.xyz=max(r0.xyz,c7.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c5.www;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c6.xxx+c6.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz*c5.zzz;
                        r2.xyz=r2.xyz+c5.yyy;
                        {
                            bvec3 tmp=greaterThanEqual(r2.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r0.x,tmp.y?r1.y:r0.y,tmp.z?r1.z:r0.z);
                        }
                        gl_FragData[0].w=c7.w;
                            
                        ${ps.shadowFooter}
                    }

                `
            },
            states: {
                [d3d.RS_ZWRITEENABLE]: 0,
                [d3d.RS_ALPHATESTENABLE]: 0,
                [d3d.RS_SRCBLEND]: d3d.BLEND_ONE,
                [d3d.RS_DESTBLEND]: d3d.BLEND_ONE,
                [d3d.RS_ALPHABLENDENABLE]: 1,
                [d3d.RS_BLENDOP]: d3d.BLENDOP_ADD
            }
        }
    }
};
