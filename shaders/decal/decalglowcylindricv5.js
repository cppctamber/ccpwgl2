import * as d3d from "constant/d3d";
import { texture, constant, vs, ps } from "./shared";
import { precision } from "../shared/func";


export const decalGlowCylindricV5 = {
    name: "decalGlowCylindricV5",
    replaces: "graphics/effect.gles2/managed/space/decals/v5/decalGlowCylindricV5",
    description: "decal glow cylindric shader",
    techniques: {
        Main: {
            vs: vs.decal_PosTexTan,
            ps: {
                constants: [
                    constant.DecalTextureScaling,
                    constant.DecalTextureOffset,
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
                    varying vec4 texcoord9;
                    
                    uniform sampler2D s0; // DecalAlbedoMapSamplerWrap
                    uniform sampler2D s1; // DecalTransparencySampleWrap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[4];
                    uniform vec4 cb7[4];

                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        
                        vec4 c4=vec4(0.0208350997,-0.0851330012,0.180141002,-0.330299497);
                        vec4 c5=vec4(0.999866009,0,1,3.14159274);
                        vec4 c6=vec4(-2,1.57079637,0.159154937,0.5);
                        vec4 c7=vec4(6.28318548,-3.14159274,1,-1);
                        vec4 c8=vec4(-1.44269507e-005,-0.00313080009,12.9200001,0.416666657);
                        vec4 c9=vec4(1.05499995,-0.0549999997,0,0);
                        
                        v0=texcoord;
                        v1=texcoord4;
                        v2=texcoord5;
                        v3=texcoord9;
                        
                        r0.xyz=(-cb4[2].xyz)+v2.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[2].w;
                        r0=cb4[3].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.xy=(-abs(v0.zw))+abs(v0.wz);
                        {
                            bvec2 tmp=greaterThanEqual(r0.xx,vec2(0.0));
                            r0.xz=vec2(tmp.x?abs(v0.z):abs(v0.w),tmp.y?abs(v0.w):abs(v0.z));
                        }
                        r0.y=r0.y>=0.0?c5.y:c5.z;
                        r0.z=1.0/r0.z;
                        r0.x=r0.z*r0.x;
                        r0.z=r0.x*r0.x;
                        r0.w=r0.z*c4.x+c4.y;
                        r0.w=r0.z*r0.w+c4.z;
                        r0.w=r0.z*r0.w+c4.w;
                        r0.z=r0.z*r0.w+c5.x;
                        r0.x=r0.z*r0.x;
                        r0.z=r0.x*c6.x+c6.y;
                        r0.x=r0.z*r0.y+r0.x;
                        r0.y=v0.z>=0.0?(-c5.y):(-c5.w);
                        r0.x=r0.y+r0.x;
                        r0.y=r0.x+r0.x;
                        r0.z=(-v0.z)+v0.w;
                        {
                            bvec2 tmp=greaterThanEqual(r0.zz,vec2(0.0));
                            r0.zw=vec2(tmp.x?v0.z:v0.w,tmp.y?v0.w:v0.z);
                        }
                        r0.w=r0.w>=0.0?c5.z:c5.y;
                        r0.z=r0.z>=0.0?c5.y:r0.w;
                        r0.x=r0.z*(-r0.y)+r0.x;
                        r0.x=r0.x+c5.w;
                        r0.x=r0.x*cb7[0].w;
                        r0.x=r0.x*c6.z;
                        r1.xyz=cb7[0].xyz;
                        r2.x=cb2[21].x;
                        r0.zw=r2.xx*r1.xy+cb7[1].xy;
                        r0.zw=fract(r0.zw);
                        r0.y=v3.w*c6.w+c6.w;
                        r0.zw=(-r0.xy)+r0.zw;
                        {
                            bvec2 tmp=greaterThanEqual((-r1.xy),vec2(0.0));
                            r2.xy=vec2(tmp.x?c5.y:c5.z,tmp.y?c5.y:c5.z);
                        }
                        {
                            bvec2 tmp=greaterThanEqual(r1.xy,vec2(0.0));
                            r1.xy=vec2(tmp.x?(-c5.y):(-c5.z),tmp.y?(-c5.y):(-c5.z));
                        }
                        r1.xy=r1.xy+r2.xy;
                        r0.zw=r1.xy*r0.zw+r0.xy;
                        
                        // DecalAlbedoMapSamplerWrap
                        r2.xyz=texture2D(s0, r0.xy).xyz;
                       
                        // DecalTransparencyMapSamplerWrap
                        r2.w=texture2D(s1, r0.xy).x;
                        
                        r0.x=r2.w*cb7[2].x;
                        r0.x=r0.x*cb4[1].y;
                        r0.yz=r0.zw+(-c6.ww);
                        r0.w=r1.z*cb2[21].x;
                        r0.w=r0.w*c6.z+c6.w;
                        r0.w=fract(r0.w);
                        r0.w=r0.w*c7.x+c7.y;
                        r1.xy=vec2(cos(r0.w), sin(r0.w));
                        r1.zw=r1.xy*c7.zw;
                        r1.y=dot(r1.yx,r0.yz)+c5.y;
                        r1.x=dot(r1.zw,r0.yz)+c5.y;
                        r0.yz=r1.xy+c6.ww;
                                                
                        // DecalAlbedoMapSamplerWrap
                        r1.xyz=texture2D(s0, r0.yz).xyz;
                       
                        // DecalTransparencyMapSamplerWrap
                        r1.w=texture2D(s1, r0.yz).x;
                        
                        r2.xyz=cb2[15].xyz;
                        r0.yzw=cb7[3].xyz*r1.xyz+(-r2.xyz);
                        r1.x=cb2[15].w*v1.w;
                        r1.x=r1.x*c8.x;
                        r1.x=exp2(r1.x);
                        r0.yzw=r1.xxx*r0.yzw+cb2[15].xyz;
                        r0.yzw=r0.yzw*cb4[1].yyy;
                        r0.xyz=r0.xxx*r0.yzw;
                        r1.xyz=max(r0.xyz,c5.yyy);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c8.www;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c9.xxx+c9.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c8.yyy;
                        r2.xyz=r2.xyz*c8.zzz;
                        {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                        }
                        gl_FragData[0].w=c5.y;
                        
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