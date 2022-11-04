import { vs, ps, texture } from "./shared";
import { clampToBorder } from "../shared/func";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap } from "../shared/texture";
import { NormalMap, AoMap } from "../quad/shared/texture";
import * as d3d from "constant/d3d";


export const decalV5 = {
    name: "decalV5",
    replaces: "graphics/effect.gles2/managed/space/decals/v5/decalV5",
    description: "decal shader",
    techniques: {
        Main: {
            vs: vs.decal_PosTexTan,
            ps: {
                textures: [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    NormalMap,
                    AoMap,
                    texture.DecalAlbedoMap_SamplerBorder,
                    texture.DecalTransparencyMap_SamplerBorder,
                    texture.DecalFresnelMap_SamplerBorder,
                    texture.DecalNormalMap_SamplerBorder,
                    texture.DecalRoughnessMap_SamplerBorder,
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
                    
                    uniform samplerCube s0;          // EveSpaceSceneEnvMap
                    uniform sampler2D s1;            // EveSpaceSceneShadowMap
                    uniform sampler2D s2;            // Normal map
                    uniform sampler2D s3;            // Ambient Occlusion map
                    uniform sampler2D s4;            // DecalAlbedoMap
                    uniform sampler2D s5;            // DecalTransparencyMap
                    uniform sampler2D s6;            // DecalFresnelMap
                    uniform sampler2D s7;            // DecalNormalMap
                    uniform sampler2D s8;            // DecalRoughnessMap
                   
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[4];
                   
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
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        
                        vec4 c0=vec4(9.99999997e-007,0.666666687,3.14159274,-1e-015);
                        vec4 c1=vec4(6.28318548,-3.14159274,1,0);
                        vec4 c2=vec4(1,0.5,2,-1);
                        vec4 c3=vec4(0,0.159154937,0.5,-0.5);
                        vec4 c4=vec4(9.99999987e+014,1,1.54499996,1.10000002);
                        vec4 c5=vec4(6,0,-0.015625,0.75);
                        vec4 c6=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c7=vec4(-9.27999973,7,0.119999997,0.318309873);
                        vec4 c8=vec4(-1.44269507e-005,-0.00313080009,12.9200001,0.416666657);
                        vec4 c9=vec4(1.05499995,-0.0549999997,0,0);
                        
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
                        r0.yz=r0.yz*c3.zw+c3.zz;
                        r1.xy=c2.xy;
                        r0.yz=cb2[18].xy*r1.yy+r0.yz;
                        r2=texture2D(s1,r0.yz);
                        r0.y=r0.x+(-r2.x);
                        r0.z=r2.x*(-r2.x)+r2.y;
                        r0.w=r2.x+cb2[18].z;
                        r0.x=(-r0.x)+r0.w;
                        r0.x=r0.x>=0.0?c1.z:c1.w;
                        r1.y=max(r0.z,c0.x);
                        r0.y=r0.y*r0.y+r1.y;
                        r0.y=1.0/r0.y;
                        r0.y=r0.y*r1.y;
                        r1.y=saturate(max(r0.x,r0.y));
                        r0.x=r1.y+(-cb2[18].w);
                        r0.y=r1.x+(-cb2[18].w);
                        r0.y=1.0/r0.y;
                        r0.x=saturate(r0.y*r0.x);
                        r0.x=(-cb2[19].x)>=0.0?r0.x:r1.x;
                        r1.x=max(cb2[19].z,r0.x);
                        r0.x=r1.x*r1.x;
                        r0.xyz=r0.xxx*cb2[13].xyz;
                        r0.xyz=r0.xyz*c0.yyy;
                        
                        // NormalMap
                        r1.ywx=texture2D(s2,v0.xy).xyz;
                         
                        // AoMap
                        r1.z=texture2D(s3,v0.xy).x;
                        
                        r1.xy=r1.yw*c2.zz+c2.ww;
                        r2.xyz=r1.yyy*v3.xyz;
                        r2.xyz=r1.xxx*v2.xyz+r2.xyz;
                        r0.w=saturate(dot(r1.xy,r1.xy)+c3.x);
                        r0.w=(-r0.w)+c2.x;
                        r0.w=sqrt(abs(r0.w));
                        r1.xyz=r0.www*v1.xyz+r2.xyz;
                        r2.xyz=normalize(r1.xyz);
                        r1.xy=c2.xx+v0.zw;
                        r1.xy=r1.xy*c2.yy;
                        
                        // DecalNormalMap
                        r3.xzw=clampToBorder(s7,r1.xy).xyz;
                        r3.w = 1.0 - r3.w;
                        
                        // DecalRoughnessMap
                        r3.y=clampToBorder(s8, r1.xy).x;
                        
                        r3.xzw=(-r3.yxz)+c2.xyy;
                        r1.zw=r3.wz*c3.yy+c3.zz;
                        r3.x=saturate(r3.x);
                        r1.zw=fract(r1.zw);
                        r1.zw=r1.zw*c1.xx+c1.yy;
                        r4.xy=vec2(cos(r1.z), sin(r1.z));
                        r5.xy=vec2(cos(r1.w), sin(r1.w));
                        r0.w=(-r4.x)+c2.x;
                        r4.xzw=r0.www*v8.xxy;
                        r4.xzw=r4.xzw*v8.zyz;
                        r6.xyz=(-v8.yzx)*r4.yyy+r4.xzw;
                        r4.xyz=v8.zyx*r4.yyy+r4.zxw;
                        r7.y=r6.y;
                        r7.z=r4.y;
                        r8.xyz=v8.xyz*v8.xyz+c2.www;
                        r8.xyz=r0.www*r8.xyz+c2.xxx;
                        r7.x=r8.x;
                        r7.x=dot(r2.xyz,r7.xyz);
                        r6.y=r4.z;
                        r4.z=r6.z;
                        r4.y=r8.y;
                        r6.z=r8.z;
                        r7.z=dot(r2.xyz,r6.xyz);
                        r7.y=dot(r2.xyz,r4.xyz);
                        r0.w=(-r5.x)+c2.x;
                        r2.xyz=r0.www*v9.xxy;
                        r2.xyz=r2.xyz*v9.zyz;
                        r4.xyz=(-v9.yzx)*r5.yyy+r2.xyz;
                        r2.xyz=v9.zyx*r5.yyy+r2.yxz;
                        r5.y=r4.y;
                        r5.z=r2.y;
                        r6.xyz=v9.xyz*v9.xyz+c2.www;
                        r6.xyz=r0.www*r6.xyz+c2.xxx;
                        r5.x=r6.x;
                        r5.x=dot(r7.xyz,r5.xyz);
                        r4.y=r2.z;
                        r2.z=r4.z;
                        r2.y=r6.y;
                        r4.z=r6.z;
                        r5.z=dot(r7.xyz,r4.xyz);
                        r5.y=dot(r7.xyz,r2.xyz);
                        r0.w=dot(v4.xyz,v4.xyz);
                        r0.w=r0.w==0.0?3.402823466e+38:inversesqrt(abs(r0.w));
                        r2.xyz=v4.xyz*r0.www+cb2[12].xyz;
                        r4.xyz=r0.www*v4.xyz;
                        r6.xyz=normalize(r2.xyz);
                        r0.w=clamp(dot(r5.xyz,r6.xyz),0.0, 1.0);
                        r0.w=r0.w*r0.w;
                        r1.z=r3.x*r3.x;
                        r1.w=r1.z*r1.z+c2.w;
                        r1.z=r1.z*r1.z;
                        r0.w=r0.w*r1.w+c2.x;
                        r0.w=r0.w*r0.w;
                        r1.w=r0.w*(-c1.y);
                        r0.w=r0.w*c0.z+c0.w;
                        r1.w=1.0/r1.w;
                        r0.w=r0.w>=0.0?r1.w:c4.x;
                        r0.w=r0.w*r1.z;
                        r1.z=clamp(dot(cb2[12].xyz,r6.xyz),0.0, 1.0);
                        r1.w=clamp(dot(r6.xyz,r4.xyz),0.0, 1.0);
                        r1.w=r1.w*r1.w;
                        r1.z=(-r1.z)+c2.x;
                        r2.x=r1.z*r1.z;
                        r2.x=r2.x*r2.x;
                        r1.z=r1.z*r2.x;
                        
                        // DecalTransparencyMap
                        r6.w = clampToBorder(s5,r1.xy).x;
                        // Discard if not visible... 
                        if(r6.w<0.01)discard;
                        
                        // DecalFresnelMap
                        r2=clampToBorder(s6,r1.xy);
                        
                        // DecalAlbedoMap
                        r6.xyz=clampToBorder(s4,r1.xy).xyz;
                        
                        r7.xyz=r3.yyy*(-r2.xyz)+c2.xxx;
                        r2.xyz=r2.xyz*r3.yyy;
                        r1.xyz=r7.xyz*r1.zzz+r2.xyz;
                        r3.yz=(-r3.xx)+c4.yz;
                        r7.w=r3.x*c5.x;
                        r2.w=min(r3.z,c2.x);
                        r8.yzw=c5.yzw;
                        r3=r3.yyyy*c6+r8.yyzw;
                        r1.w=r1.w*r2.w+c4.w;
                        r1.w=(-r2.w)+r1.w;
                        r1.w=1.0/r1.w;
                        r8.xyz=r1.www*r1.xyz;
                        r1.xyz=(-r1.xyz)+c2.xxx;
                        r1.xyz=r1.xyz*r6.xyz;
                        r1.xyz=r8.xyz*r0.www+r1.xyz;
                        r0.w=clamp(dot(cb2[12].xyz,r5.xyz),0.0, 1.0);
                        r1.xyz=r0.www*r1.xyz;
                        r0.xyz=r0.xyz*r1.xyz;
                        r1.xyz=max(r0.xyz,c3.xxx);
                        r0.x=dot(r4.xyz,r5.xyz);
                        r0.y=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c7.x;
                        r0.x=exp2(r0.x);
                        r1.w=min(r0.x,r3.y);
                        r0.x=r3.x*r1.w+r3.z;
                        r8.xyz=saturate(mix(r0.xxx,r3.www,r2.xyz));
                        r0.xyz=r5.xyz*(-r0.yyy)+r4.xyz;
                        r7.x=dot((-r0.xyz),cb2[8].xyz);
                        r7.y=dot((-r0.xyz),cb2[9].xyz);
                        r7.z=dot((-r0.xyz),cb2[10].xyz);
                        r0=textureCubeLod(s0,r7.xyz,r7.w);
                        r0.xyz=r0.xyz*cb2[14].www;
                        r5.w=c7.y;
                        r2=textureCubeLod(s0,r5.xyz,r5.w);
                        r0.w=cb2[14].w;
                        r0.w=r0.w*c7.z;
                        r2.xyz=r2.xyz*cb2[14].www+r0.www;
                        r3.xyz=(-r8.xyz)+c2.xxx;
                        r3.xyz=r3.xyz*r6.xyz;
                        gl_FragData[0].w=r6.w;
                        r2.xyz=r2.xyz*r3.xyz;
                        r2.xyz=r2.xyz*c7.www;
                        r0.xyz=r0.xyz*r8.xyz+r2.xyz;
                        r2.xyz=max(r0.xyz,c3.xxx);
                        r0.xyz=r1.xyz+r2.xyz;
                        r0.w=cb2[15].w*v4.w;
                        r0.w=r0.w*c8.x;
                        r0.w=exp2(r0.w);
                        r1.xyz=mix(cb2[15].xyz,r0.xyz,r0.www);
                        r0.xyz=max(r1.xyz,c3.xxx);
                        r1.x=r0.x>0.0?log2(r0.x):-3.402823466e+38;
                        r1.y=r0.y>0.0?log2(r0.y):-3.402823466e+38;
                        r1.z=r0.z>0.0?log2(r0.z):-3.402823466e+38;
                        r0.xyz=r1.xyz*cb2[21].www;
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
                        
                        ${ps.shadowFooter}
                    }
                    `
            },
            states: {
                [d3d.RS_ZWRITEENABLE] : 0,
                [d3d.RS_ALPHABLENDENABLE] : 0,
                [d3d.RS_SRCBLEND] : d3d.BLEND_SRCALPHA,
                [d3d.RS_DESTBLEND] : d3d.BLEND_INVSRCALPHA,
                [d3d.RS_ALPHABLENDENABLE] : 1,
                [d3d.RS_BLENDOP] : d3d.BLENDOP_ADD
            }
        }
    }
};
