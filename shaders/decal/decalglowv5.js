import * as d3d from "constant/d3d";
import { texture, constant, vs, ps } from "./shared";
import { clampToBorder, precision } from "../shared/func";


export const decalGlowV5 = {
    name: "decalGlowV5",
    path: "graphics/effect.gles2/managed/space/decals/v5/",
    description: "decal glow shader",
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
                    texture.DecalGlowMap_SamplerBorder,
                    texture.DecalTransparencyMap_SamplerBorder,
                    texture.DecalGlowMap_SamplerWrap,
                    texture.DecalTransparencyMap_SamplerWrap
                ],
                shader: `
                
                    ${precision}
                    ${clampToBorder}
                    ${ps.shadowHeader}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord4;
                    varying vec4 texcoord5;
                    
                    uniform sampler2D s0; // DecalGlowMapSamplerBorder
                    uniform sampler2D s1; // TransparencyMapSamplerBorder
                    uniform sampler2D s2; // DecalGlowMapSamplerWrap
                    uniform sampler2D s3; // TransparencyMapSamplerWrap
                   
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[4];
                    uniform vec4 cb7[4];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        
                        vec4 c4=vec4(6.28318548,-3.14159274,1,-1);
                        vec4 c5=vec4(1,0.5,0,0.159154937);
                        vec4 c6=vec4(-1.44269507e-005,-0.00313080009,12.9200001,0.416666657);
                        vec4 c7=vec4(1.05499995,-0.0549999997,0,0);
                        
                        v0=texcoord;
                        v1=texcoord4;
                        v2=texcoord5;
                        
                        r0.xyz=(-cb4[2].xyz)+v2.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[2].w;
                        r0=cb4[3].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.xz=c5.xz;
                        {
                            bvec2 tmp=greaterThanEqual((-cb7[0].xy),vec2(0.0));
                            r0.yw=vec2(tmp.x?r0.z:r0.x,tmp.y?r0.z:r0.x);
                        }
                        {
                            bvec2 tmp=greaterThanEqual(cb7[0].xy,vec2(0.0));
                            r0.xz=vec2(tmp.x?(-r0.z):(-r0.x),tmp.y?(-r0.z):(-r0.x));
                        }
                        r0.xy=r0.xz+r0.yw;
                        r1.xyz=cb7[0].xyz;
                        r2.x=cb2[21].x;
                        r0.zw=r2.xx*r1.xy+cb7[1].xy;
                        r0.zw=fract(r0.zw);
                        r1.xy=c5.xx+v0.zw;
                        r0.zw=r1.xy*(-c5.yy)+r0.zw;
                        r1.xy=r1.xy*c5.yy;
                        r0.xy=r0.xy*r0.zw+r1.xy;
                        
                        // DecalGlowMapSamplerBorder
                        r2.xyz=clampToBorder(s0,r1.xy).xxx;
                        
                        // TransparencyMapSamplerBorder
                        r2.w=clampToBorder(s1,r1.xy).x;
                        
                        r0.z=r2.w*cb7[2].x;
                        r0.z=r0.z*cb4[1].y;
                        r0.z=r0.z*r0.z;
                        r0.xy=r0.xy+(-c5.yy);
                        
                        // DecalTextureScaling.z * Current time
                        r0.w=r1.z*cb2[21].x;        
                        
                        r0.w=r0.w*c5.w+c5.y;
                        r0.w=fract(r0.w);
                        r0.w=r0.w*c4.x+c4.y;
                        r1.xy=vec2(cos(r0.w), sin(r0.w));
                        r1.zw=r1.xy*c4.zw;
                        r1.y=dot(r1.yx,r0.xy)+c5.z;
                        r1.x=dot(r1.zw,r0.xy)+c5.z;
                        r0.xy=r1.xy+c5.yy;
                         
                        // DecalGlowMapSamplerBorder
                        r1.xyz=texture2D(s2,r0.xy).xxx;
                        
                        // TransparencyMapSamplerWrap
                        r1.w=texture2D(s3,r0.xy).x;
                        
                        r2.xyz=cb2[15].xyz;
                        r0.xyw=cb7[3].xyz*r1.xyz+(-r2.xyz);
                        r1.x=cb2[15].w*v1.w;
                        r1.x=r1.x*c6.x;
                        r1.x=exp2(r1.x);
                        r0.xyw=r1.xxx*r0.xyw+cb2[15].xyz;
                        r0.xyw=r0.xyw*cb4[1].yyy;
                        r0.xyz=r0.zzz*r0.xyw;
                        r1.xyz=max(r0.xyz,c5.zzz);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c6.www;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c7.xxx+c7.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c6.yyy;
                        r2.xyz=r2.xyz*c6.zzz;
                        {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                        }
                        gl_FragData[0].w=c5.z;
                        
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