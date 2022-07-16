import * as d3d from "constant/d3d";
import { texture, constant, vs, ps } from "./shared";
import { clampToBorder } from "../shared/func";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap } from "../shared/texture";
import { NormalMap, AoMap } from "../quad/shared/texture";

export const decalCylindricV5 = {
    name: "decalCylindricV5",
    path: "graphics/effect.gles2/managed/space/decals/v5/",
    description: "decal cylindric shader",
    techniques: {
        Main: {
            vs: vs.decal_PosTexTan,
            ps: {
                constants: [
                    constant.DecalTextureScaling
                ],
                textures: [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    NormalMap,
                    AoMap,
                    texture.DecalAlbedoMap_SamplerBorder,
                    texture.DecalTransparencyMap_SamplerBorder,
                    texture.DecalFresnelMap_SamplerBorder,
                    texture.DecalNormalMap_SamplerBorder,
                    texture.DecalRoughnessMap_SamplerBorder
                ],
                shader: `

                    ${ps.header}
                    ${clampToBorder}

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
                    
                    uniform samplerCube s0; // EveSpaceSceneEnvMap,
                    uniform sampler2D s1;   // EveSpaceSceneShadowMap,
                    uniform sampler2D s2;   // NormalMap,
                    uniform sampler2D s3;   // AoMap,
                    uniform sampler2D s4;   // DecalAlbedoMapSamplerBorder,
                    uniform sampler2D s5;   // DecalTransparencyMapSamplerBorder,
                    uniform sampler2D s6;   // DecalFresnelMapSamplerBorder,
                    uniform sampler2D s7;   // DecalNormalMapSamplerBorder,
                    uniform sampler2D s8;   // DecalRoughnessMapSamplerBorder
                         
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[4];
                    uniform vec4 cb7[1];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v4;
                        vec4 v5;
                        vec4 v6;
                        vec4 v7;
                        vec4 v8;
                        vec4 v9;
                        vec4 r0;
                        vec4 r1;
                        vec4 r10;
                        vec4 r11;
                        vec4 r12;
                        vec4 r13;
                        vec4 r14;
                        vec4 r15;
                        vec4 r16;
                        vec4 r17;
                        vec4 r18;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        vec4 c1=vec4(9.99999997e-007,0.666666687,3.14159274,-1e-015);
                        vec4 c2=vec4(0.0208350997,-0.0851330012,0.180141002,-0.330299497);
                        vec4 c3=vec4(0.999866009,0,1,3.14159274);
                        vec4 c4=vec4(-2,1.57079637,0.159154937,0.5);
                        vec4 c5=vec4(6.28318548,-3.14159274,0.5,-0.5);
                        vec4 c6=vec4(0.5,1,2,-1);
                        vec4 c7=vec4(9.99999987e+014,1,1.54499996,1.10000002);
                        vec4 c8=vec4(6,0,-0.015625,0.75);
                        vec4 c9=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c10=vec4(-9.27999973,7,0.119999997,0.318309873);
                        vec4 c11=vec4(-1.44269507e-005,-0.00313080009,12.9200001,0.416666657);
                        vec4 c12=vec4(1.05499995,-0.0549999997,0,0);
                        
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v4=texcoord4;
                        v5=texcoord5;
                        v6=texcoord7;
                        v7=texcoord8;
                        v8=texcoord9;
                        v9=texcoord10;
                        
                        r0.xyz=(-cb4[2].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[2].w;
                        r0=cb4[3].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.x=(-cb2[19].x)+cb2[19].y;
                        r0.x=1.0/r0.x;
                        r0.y=(-cb2[19].x)+v6.z;
                        r0.x=r0.x*r0.y;
                        r0.x=sqrt(abs(r0.x));
                        r0.y=1.0/v7.w;
                        r0.yz=r0.yy*v7.xy;
                        r0.yz=r0.yz*c5.zw+c5.zz;
                        r0.w=c4.w;
                        r0.yz=cb2[18].xy*r0.ww+r0.yz;
                        r1=texture2D(s1,r0.yz);
                        r0.y=r0.x+(-r1.x);
                        r0.z=r1.x*(-r1.x)+r1.y;
                        r0.w=r1.x+cb2[18].z;
                        r0.x=(-r0.x)+r0.w;
                        r0.x=r0.x>=0.0?c3.z:c3.y;
                        r1.x=max(r0.z,c1.x);
                        r0.y=r0.y*r0.y+r1.x;
                        r0.y=1.0/r0.y;
                        r0.y=r0.y*r1.x;
                        r1.x=saturate(max(r0.x,r0.y));
                        r0.x=r1.x+(-cb2[18].w);
                        r0.z=c3.z;
                        r0.y=r0.z+(-cb2[18].w);
                        r0.y=1.0/r0.y;
                        r0.x=saturate(r0.y*r0.x);
                        r0.x=(-cb2[19].x)>=0.0?r0.x:r0.z;
                        r1.x=max(cb2[19].z,r0.x);
                        r0.x=r1.x*r1.x;
                        r0.xyz=r0.xxx*cb2[13].xyz;
                        r0.xyz=r0.xyz*c1.yyy;
                        r1.xy=(-abs(v0.zw))+abs(v0.wz);
                        {
                            bvec2 tmp=greaterThanEqual(r1.xx,vec2(0.0));
                            r1.xz=vec2(tmp.x?abs(v0.z):abs(v0.w),tmp.y?abs(v0.w):abs(v0.z));
                        }
                        r0.w=r1.y>=0.0?c3.y:c3.z;
                        r1.y=1.0/r1.z;
                        r1.x=r1.y*r1.x;
                        r1.y=r1.x*r1.x;
                        r1.z=r1.y*c2.x+c2.y;
                        r1.z=r1.y*r1.z+c2.z;
                        r1.z=r1.y*r1.z+c2.w;
                        r1.y=r1.y*r1.z+c3.x;
                        r1.x=r1.y*r1.x;
                        r1.y=r1.x*c4.x+c4.y;
                        r0.w=r1.y*r0.w+r1.x;
                        r1.x=v0.z>=0.0?(-c3.y):(-c3.w);
                        r0.w=r0.w+r1.x;
                        r1.x=r0.w+r0.w;
                        r1.y=(-v0.z)+v0.w;
                        {
                            bvec2 tmp=greaterThanEqual(r1.yy,vec2(0.0));
                            r1.yz=vec2(tmp.x?v0.z:v0.w,tmp.y?v0.w:v0.z);
                        }
                        {
                            bvec2 tmp=greaterThanEqual(r1.yz,vec2(0.0));
                            r1.yz=vec2(tmp.x?c3.y:c3.z,tmp.y?c3.z:c3.y);
                        }
                        r1.y=r1.z*r1.y;
                        r0.w=r1.y*(-r1.x)+r0.w;
                        r0.w=r0.w+c3.w;
                        r0.w=r0.w*cb7[0].w;
                        r0.w=r0.w*c4.z;
                        
                        r4.x=fract(r0.w);
                        r4.y=v8.w*c4.w+c4.w;
                        
                        // DecalAlbedoMapSamplerBorder
                        r1.xyz=clampToBorder(s4,r4.xy).xyz;
                       
                        // DecalTransparencyMapSamplerBorder
                        r1.w=clampToBorder(s5,r4.xy).x;
                        
                        // DecalFresnelMapSamplerBorder
                        r2=clampToBorder(s6,r4.xy);
                        
                        // DecalNormalMapSamplerBorder
                        r3.xzw=clampToBorder(s7,r4.xy).xyz;
                        r3.w = 1.0 - r3.w;

                        // DecalRoughnessMapSamplerBorder
                        r3.y=clampToBorder(s8,r4.xy).x;
                        
                        r4.xyz=r3.yyy*(-r2.xyz)+c3.zzz;
                        r2.xyz=r2.xyz*r3.yyy;
                        r3.xyz=(-r3.yxz)+c6.yxx;
                        r0.w=dot(v4.xyz,v4.xyz);
                        r0.w=r0.w==0.0?3.402823466e+38:inversesqrt(abs(r0.w));
                        r5.xyz=v4.xyz*r0.www+cb2[12].xyz;
                        r6.xyz=r0.www*v4.xyz;
                        r7.xyz=normalize(r5.xyz);
                        r0.w=clamp(dot(cb2[12].xyz,r7.xyz),0.0, 1.0);
                        r0.w=(-r0.w)+c3.z;
                        r2.w=r0.w*r0.w;
                        r2.w=r2.w*r2.w;
                        r0.w=r0.w*r2.w;
                        r4.xyz=r4.xyz*r0.www+r2.xyz;
                        r5.xyz=(-r4.xyz)+c3.zzz;
                        r5.xyz=r1.xyz*r5.xyz;
                        r3.x=saturate(r3.x);
                        r3.yz=r3.zy*c4.zz+c4.ww;
                        r3.yz=fract(r3.yz);
                        r3.yz=r3.yz*c5.xx+c5.yy;
                        r8.xy=(-r3.xx)+c7.yz;
                        r0.w=min(r8.y,c3.z);
                        r8.yzw=c8.yzw;
                        r8=r8.xxxx*c9+r8.yyzw;
                        r2.w=clamp(dot(r7.xyz,r6.xyz),0.0, 1.0);
                        r2.w=r2.w*r2.w;
                        r2.w=r2.w*r0.w+c7.w;
                        r0.w=(-r0.w)+r2.w;
                        r0.w=1.0/r0.w;
                        r4.xyz=r0.www*r4.xyz;
                        r0.w=r3.x*r3.x;
                        r9.w=r3.x*c8.x;
                        r2.w=r0.w*r0.w;
                        r0.w=r0.w*r0.w+(-c3.z);
                        r10.xy=vec2(cos(r3.z), sin(r3.z));
                        r11.xy=vec2(cos(r3.y), sin(r3.y));
                        r3.x=(-r10.x)+c3.z;
                        r3.yzw=r3.xxx*v9.xxy;
                        r3.yzw=r3.yzw*v9.zyz;
                        r10.xzw=(-v9.yzx)*r10.yyy+r3.yzw;
                        r3.yzw=v9.zyx*r10.yyy+r3.zyw;
                        r12.y=r10.z;
                        r12.z=r3.z;
                        r13.xyz=v9.xyz*v9.xyz+(-c3.zzz);
                        r13.xyz=r3.xxx*r13.xyz+c3.zzz;
                        r12.x=r13.x;
                        r3.x=(-r11.x)+c3.z;
                        r11.xzw=r3.xxx*v8.xxy;
                        r11.xzw=r11.xzw*v8.zyz;
                        r14.xyz=(-v8.yzx)*r11.yyy+r11.xzw;
                        r11.xyz=v8.zyx*r11.yyy+r11.zxw;
                        r15.y=r14.y;
                        r15.z=r11.y;
                        r16.xyz=v8.xyz*v8.xyz+(-c3.zzz);
                        r16.xyz=r3.xxx*r16.xyz+c3.zzz;
                        r15.x=r16.x;
                        
                        // NormalMap 
                        r17.ywx=texture2D(s2,v0.xy).xyz; 
                        
                        // AoMap
                        r17.z=texture2D(s3,v0.xy).x;  
                        
                        r13.xw=r17.yw*c6.zz+c6.ww;
                        r17.xyz=r13.www*v3.xyz;
                        r17.xyz=r13.xxx*v2.xyz+r17.xyz;
                        r3.x=saturate(dot(r13.xw,r13.xw)+c3.y);
                        r3.x=(-r3.x)+c3.z;
                        r3.x=sqrt(abs(r3.x));
                        r17.xyz=r3.xxx*v1.xyz+r17.xyz;
                        r18.xyz=normalize(r17.xyz);
                        r15.x=dot(r18.xyz,r15.xyz);
                        r14.y=r11.z;
                        r11.z=r14.z;
                        r11.y=r16.y;
                        r14.z=r16.z;
                        r15.z=dot(r18.xyz,r14.xyz);
                        r15.y=dot(r18.xyz,r11.xyz);
                        r11.x=dot(r15.xyz,r12.xyz);
                        r10.z=r3.w;
                        r3.w=r10.w;
                        r3.z=r13.y;
                        r10.w=r13.z;
                        r11.z=dot(r15.xyz,r10.xzw);
                        r11.y=dot(r15.xyz,r3.yzw);
                        r3.x=clamp(dot(r11.xyz,r7.xyz),0.0, 1.0);
                        r3.x=r3.x*r3.x;
                        r0.w=r3.x*r0.w+c3.z;
                        r0.w=r0.w*r0.w;
                        r3.x=r0.w*c3.w;
                        r0.w=r0.w*c1.z+c1.w;
                        r3.x=1.0/r3.x;
                        r0.w=r0.w>=0.0?r3.x:c7.x;
                        r0.w=r0.w*r2.w;
                        r3.xyz=r4.xyz*r0.www+r5.xyz;
                        r0.w=clamp(dot(cb2[12].xyz,r11.xyz),0.0, 1.0);
                        r3.xyz=r0.www*r3.xyz;
                        r0.xyz=r0.xyz*r3.xyz;
                        r3.xyz=max(r0.xyz,c3.yyy);
                        r0.x=dot(r6.xyz,r11.xyz);
                        r0.y=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c10.x;
                        r0.x=exp2(r0.x);
                        r2.w=min(r0.x,r8.y);
                        r0.x=r8.x*r2.w+r8.z;
                        r4.xyz=saturate(mix(r0.xxx,r8.www,r2.xyz));
                        r0.xyz=r11.xyz*(-r0.yyy)+r6.xyz;
                        r9.x=dot((-r0.xyz),cb2[8].xyz);
                        r9.y=dot((-r0.xyz),cb2[9].xyz);
                        r9.z=dot((-r0.xyz),cb2[10].xyz);
                        r0=textureCubeLod(s0,r9.xyz,r9.w);
                        r0.xyz=r0.xyz*cb2[14].www;
                        r11.w=c10.y;
                        r2=textureCubeLod(s0,r11.xyz,r11.w);
                        r0.w=cb2[14].w;
                        r0.w=r0.w*c10.z;
                        r2.xyz=r2.xyz*cb2[14].www+r0.www;
                        r5.xyz=(-r4.xyz)+c3.zzz;
                        r1.xyz=r1.xyz*r5.xyz;
                        gl_FragData[0].w=r1.w;
                        r1.xyz=r2.xyz*r1.xyz;
                        r1.xyz=r1.xyz*c10.www;
                        r0.xyz=r0.xyz*r4.xyz+r1.xyz;
                        r1.xyz=max(r0.xyz,c3.yyy);
                        r0.xyz=r1.xyz+r3.xyz;
                        r0.w=cb2[15].w*v4.w;
                        r0.w=r0.w*c11.x;
                        r0.w=exp2(r0.w);
                        r1.xyz=mix(cb2[15].xyz,r0.xyz,r0.www);
                        r0.xyz=max(r1.xyz,c3.yyy);
                        r1.x=r0.x>0.0?log2(r0.x):-3.402823466e+38;
                        r1.y=r0.y>0.0?log2(r0.y):-3.402823466e+38;
                        r1.z=r0.z>0.0?log2(r0.z):-3.402823466e+38;
                        r0.xyz=r1.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c11.www;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c12.xxx+c12.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c11.yyy;
                        r2.xyz=r2.xyz*c11.zzz;
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
                [d3d.RS_ALPHATESTENABLE]: 0,
                [d3d.RS_SRCBLEND]: d3d.BLEND_SRCALPHA,
                [d3d.RS_DESTBLEND]: d3d.BLEND_INVSRCALPHA,
                [d3d.RS_ALPHABLENDENABLE]: 1,
                [d3d.RS_BLENDOP]: d3d.BLENDOP_ADD
            }
        }
    }
};