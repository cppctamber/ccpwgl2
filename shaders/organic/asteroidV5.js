import { vs, ps, texture, constant } from "../quad/shared";
import {
    quadPickingV5,
    quadDepthV5,
    skinnedQuadDepthV5,
    skinnedQuadPickingV5,
    quadNormalV5,
    skinnedQuadNormalV5
} from "../quad";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap } from "../shared/texture";
import { overrideConstant } from "../shared/util";


export const asteroidV5 = {
    name: "asteroidV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/organic/asteroidV5",
    description: "asteroid shader",
    techniques: {
        Depth: quadDepthV5.techniques.Main,
        Picking: quadPickingV5.techniques.Main,
        Normal: quadNormalV5.techniques.Main,
        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.GeneralData,
                    constant.GeneralGlowColor,
                    constant.Mtl1DiffuseColor,
                    constant.Mtl2DiffuseColor,
                    constant.Mtl3DiffuseColor,
                    constant.Mtl4DiffuseColor,
                    constant.Mtl1FresnelColor,
                    constant.Mtl2FresnelColor,
                    constant.Mtl3FresnelColor,
                    constant.Mtl4FresnelColor,
                    constant.Mtl1Gloss,
                    constant.Mtl2Gloss,
                    constant.Mtl3Gloss,
                    constant.Mtl4Gloss,
                    overrideConstant(constant.Detail1Data, {
                        value: [ 1, 1, 0, 0 ],
                        ui: { group: "Detail 1" }
                    }),
                    overrideConstant(constant.DetailAlbedoColor, {
                        value: [ 0, 0, 0, 0 ],
                        ui: { group: "Detail 1" }
                    }),
                    overrideConstant(constant.DetailFresnelColor, {
                        value: [ 0, 0, 0, 0 ],
                        ui: { group: "Detail 1" }
                    }),
                    overrideConstant(constant.DetailSelector, {
                        value: [ 1, 1, 1, 1 ]
                    })
                ],
                textures: [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    texture.AlbedoMap,
                    texture.RoughnessMap,
                    texture.NormalMap,
                    texture.AoMap,
                    texture.PaintMaskMap,
                    texture.MaterialMap,
                    texture.DirtMap,
                    texture.GlowMap,
                    texture.Detail1Map
                ],
                shader: `
                
                    ${ps.header}
                
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    varying vec4 texcoord2;
                    varying vec4 texcoord3;
                    varying vec4 texcoord4;
                    varying vec4 texcoord5;
                    varying vec4 texcoord7;
                    varying vec4 texcoord8;
                    
                    uniform samplerCube s0; 
                    uniform sampler2D s1;
                    uniform sampler2D s2;  // AlbedoMap,
                    uniform sampler2D s3;  // RoughnessMap,
                    uniform sampler2D s4;  // NormalMap,
                    uniform sampler2D s5;  // AoMap,
                    uniform sampler2D s6;  // PaintMaskMap,
                    uniform sampler2D s7;  // MaterialMap,
                    uniform sampler2D s8;  // DirtMap,
                    uniform sampler2D s9;  // GlowMap,
                    uniform sampler2D s10; // Detail1Map
                   
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[3];
                    uniform vec4 cb7[18];

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
                        vec4 r0;
                        vec4 r1;
                        vec4 r10;
                        vec4 r11;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        vec4 c18=vec4(9.99999997e-007,0.0383840017,0.0393519998,0.0391650014);
                        vec4 c19=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c20=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c21=vec4(1,2,-1,0);
                        vec4 c22=vec4(0.400000006,3.14159274,-1e-015,9.99999987e+014);
                        vec4 c23=vec4(1,1.54499996,1.10000002,6);
                        vec4 c24=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c25=vec4(0,-0.015625,0.75,-9.27999973);
                        vec4 c26=vec4(7,0.119999997,0.318309873,-1.44269507e-005);
                        vec4 c27=vec4(-0.00313080009,12.9200001,0.416666657,0);
                        vec4 c28=vec4(1.05499995,-0.0549999997,0,0);
                        
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v4=texcoord4;
                        v5=texcoord5;
                        v6=texcoord7;
                        v7=texcoord8;
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        // PaintMaskMap
                        r0.x=texture2D(s6,v0.xy).x * ${texture.PaintMaskMap.multiplier};
                        
                        // MaterialMap
                        r0.y=texture2D(s7,v0.xy).x;    
                        
                        // DirtMap (Not required here) <----------------------------------------------------------------
                        r0.z=texture2D(s8,v0.xy).x;   
                        
                        // GlowMap     
                        r0.w=texture2D(s9,v0.xy).x;    
                        
                        gl_FragData[0].w=(-r0.x)+c21.x;
                        r0.z=(-cb2[19].x)+cb2[19].y;
                        r0.z=1.0/r0.z;
                        r1.x=(-cb2[19].x)+v6.z;
                        r0.z=r0.z*r1.x;
                        r0.z=sqrt(abs(r0.z));
                        r1.x=1.0/v7.w;
                        r1.xy=r1.xx*v7.xy;
                        r1.xy=r1.xy*c20.zw+c20.zz;
                        r1.z=c20.z;
                        r1.xy=cb2[18].xy*r1.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r1.z=r0.z+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.z=(-r0.z)+r1.x;
                        r0.z=r0.z>=0.0?c21.x:c21.w;
                        r2.x=max(r1.y,c18.x);
                        r1.x=r1.z*r1.z+r2.x;
                        r1.x=1.0/r1.x;
                        r1.x=r1.x*r2.x;
                        r2.x=saturate(max(r0.z,r1.x));
                        r0.z=r2.x+(-cb2[18].w);
                        r1.x=c21.x;
                        r1.y=r1.x+(-cb2[18].w);
                        r1.y=1.0/r1.y;
                        r0.z=saturate(r0.z*r1.y);
                        r0.z=(-cb2[19].x)>=0.0?r0.z:r1.x;
                        r1.x=max(cb2[19].z,r0.z);
                        r0.z=r1.x*r1.x;
                        r1.xyz=r0.zzz*cb2[13].xyz;
                        r1.xyz=r1.xyz*(-c19.zzz);
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xyz=v4.xyz*r0.zzz+cb2[12].xyz;
                        r3.xyz=r0.zzz*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.z=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r0.z=(-r0.z)+c21.x;
                        r1.w=r0.z*r0.z;
                        r1.w=r1.w*r1.w;
                        r0.z=r0.z*r1.w;
                        r2=r0.yyyy+c19;
                        r2=r2*c20.xxxx;
                        r2=saturate((-abs(r2))+c20.yyyy);
                        r5.xyz=r2.yyy*cb7[7].xyz;
                        r5.xyz=r2.xxx*cb7[6].xyz+r5.xyz;
                        r5.xyz=r2.zzz*cb7[8].xyz+r5.xyz;
                        r5.xyz=r2.www*cb7[9].xyz+r5.xyz;
                        r6.xy=cb7[14].xx*v0.xy;
                        r6=texture2D(s10,r6.xy);
                        r0.y=dot(cb7[17],r2);
                        r1.w=r0.y*r6.w;
                        r6.xyz=r6.xyz*c21.yyy+c21.zzz;
                        r6.xyz=r6.xyz*cb7[14].yyy;
                        r7.xyz=mix(r5.xyz,cb7[16].xyz,r1.www);
                        
                        // AlbedoMap
                        r5.xyz=texture2D(s2,v0.xy).xyz;
                        
                        // RoughnessMap
                        r5.w=texture2D(s3,v0.xy).x;
                        
                        r8.xyz=r7.xyz*r5.www;
                        r7.xyz=r5.www*(-r7.xyz)+c18.yzw;
                        r0.x=r0.x*cb7[0].x;
                        r7.xyz=r0.xxx*r7.xyz+r8.xyz;
                        r8.xyz=mix(r7.xyz,c21.xxx,r0.zzz);
                        r0.z=r2.y*cb7[11].x;
                        r0.z=r2.x*cb7[10].x+r0.z;
                        r0.z=r2.z*cb7[12].x+r0.z;
                        r0.z=r2.w*cb7[13].x+r0.z;
                        r3.w=r0.z*r5.w;
                        r0.z=r5.w*(-r0.z)+c22.x;
                        r0.z=r0.x*r0.z+r3.w;
                        r0.z=saturate((-r0.z)+c21.x);
                        r9.xy=(-r0.zz)+c23.xy;
                        r3.w=min(r9.y,c21.x);
                        r10.xyz=c25.xyz;
                        r9=r9.xxxx*c24+r10.xxyz;
                        r4.w=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r4.w=r4.w*r4.w;
                        r4.w=r4.w*r3.w+c23.z;
                        r3.w=(-r3.w)+r4.w;
                        r3.w=1.0/r3.w;
                        r10.xyz=r3.www*r8.xyz;
                        r8.xyz=(-r8.xyz)+c21.xxx;
                        r11.xyz=r2.yyy*cb7[3].xyz;
                        r11.xyz=r2.xxx*cb7[2].xyz+r11.xyz;
                        r2.xyz=r2.zzz*cb7[4].xyz+r11.xyz;
                        r2.xyz=r2.www*cb7[5].xyz+r2.xyz;
                        r11.xyz=mix(r2.xyz,cb7[15].xyz,r1.www);
                        r2.xyz=mix(r11.xyz,c21.xxx,r0.xxx);
                        r2.xyz=r2.xyz*r5.xyz;
                        r5.xyz=r8.xyz*r2.xyz;
                        
                        // NormalMap
                        r8.ywx=texture2D(s4,v0.xy).xyz;
                        
                        // AoMap
                        r8.z=texture2D(s5,v0.xy).x;
                        
                        r8.xy=r8.yw*c21.yy+c21.zz;
                        r0.x=saturate(dot(r8.xy,r8.xy)+c21.w);
                        r0.x=(-r0.x)+c21.x;
                        r0.x=r0.x==0.0?3.402823466e+38:inversesqrt(abs(r0.x));
                        r8.z=1.0/r0.x;
                        r6.xyz=r6.xyz*r0.yyy+r8.xyz;
                        r8.xyz=normalize(r6.xyz);
                        r6.xyz=r8.yyy*v3.xyz;
                        r6.xyz=r8.xxx*v2.xyz+r6.xyz;
                        r6.xyz=r8.zzz*v1.xyz+r6.xyz;
                        r8.xyz=normalize(r6.xyz);
                        r0.x=clamp(dot(r8.xyz,r4.xyz),0.0, 1.0);
                        r0.xy=r0.xz*r0.xz;
                        r4.w=r0.z*c23.w;
                        r0.z=r0.y*r0.y+c21.z;
                        r0.x=r0.x*r0.z+c21.x;
                        r0.xyw=r0.xyw*r0.xyw;
                        r0.z=r0.x*c22.y;
                        r0.x=r0.x*c22.y+c22.z;
                        r0.z=1.0/r0.z;
                        r0.x=r0.x>=0.0?r0.z:c22.w;
                        r0.x=r0.x*r0.y;
                        r0.xyz=r10.xyz*r0.xxx+r5.xyz;
                        r1.w=clamp(dot(cb2[12].xyz,r8.xyz),0.0, 1.0);
                        r0.xyz=r0.xyz*r1.www;
                        r0.xyz=r1.xyz*r0.xyz;
                        r1.xyz=max(r0.xyz,c21.www);
                        r0.x=dot(r3.xyz,r8.xyz);
                        r0.y=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c25.w;
                        r0.x=exp2(r0.x);
                        r1.w=min(r0.x,r9.y);
                        r0.x=r9.x*r1.w+r9.z;
                        r5.xyz=saturate(mix(r0.xxx,r9.www,r7.xyz));
                        r0.xyz=r8.xyz*(-r0.yyy)+r3.xyz;
                        r4.x=dot((-r0.xyz),cb2[8].xyz);
                        r4.y=dot((-r0.xyz),cb2[9].xyz);
                        r4.z=dot((-r0.xyz),cb2[10].xyz);
                        r3=textureCubeLod(s0,r4.xyz,r4.w);
                        r0.xyz=r3.xyz*cb2[14].www;
                        r8.w=c26.x;
                        r3=textureCubeLod(s0,r8.xyz,r8.w);
                        r1.w=cb2[14].w;
                        r1.w=r1.w*c26.y;
                        r3.xyz=r3.xyz*cb2[14].www+r1.www;
                        r4.xyz=(-r5.xyz)+c21.xxx;
                        r2.xyz=r2.xyz*r4.xyz;
                        r2.xyz=r3.xyz*r2.xyz;
                        r2.xyz=r2.xyz*c26.zzz;
                        r0.xyz=r0.xyz*r5.xyz+r2.xyz;
                        r2.xyz=max(r0.xyz,c21.www);
                        r0.xyz=r1.xyz+r2.xyz;
                        r4.xy=mix(v0.xy,v0.zw,cb7[0].yy);
                                                
                        // NormalMap
                        r1.ywx=texture2D(s4,r4.xy).xyz;
                        
                        // AoMap
                        r1.z=texture2D(s5,r4.xy).x;
                        
                        r0.xyz=r0.xyz*r1.zzz+(-cb2[15].xyz);
                        r1.x=cb2[15].w*v4.w;
                        r1.x=r1.x*c26.w;
                        r1.x=exp2(r1.x);
                        r0.xyz=r1.xxx*r0.xyz+cb2[15].xyz;
                        r2.xyz=cb2[15].xyz;
                        r1.yzw=(-r2.xyz)+cb7[1].xyz;
                        r1.xyz=r1.xxx*r1.yzw+cb2[15].xyz;
                        r1.xyz=r1.xyz*cb4[0].yyy;
                        r0.xyz=r1.xyz*r0.www+r0.xyz;
                        r1.xyz=max(r0.xyz,c21.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c27.zzz;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c28.xxx+c28.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c27.xxx;
                        r2.xyz=r2.xyz*c27.yyy;
                        {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                        }
                        
                        ${ps.shadowFooter}
                    }
                `
            }
        }
    }
};

export const skinnedAsteroidV5 = {
    name: "skinned_asteroidV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/organic/skinned_asteroidV5",
    description: `skinned ${asteroidV5.description}`,
    techniques: {
        Depth: skinnedQuadDepthV5.techniques.Main,
        Picking: skinnedQuadPickingV5.techniques.Main,
        Normal: skinnedQuadNormalV5.techniques.Main,
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: asteroidV5.techniques.Main.ps
        }
    }
};