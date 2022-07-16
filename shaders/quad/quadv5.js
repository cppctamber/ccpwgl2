import { constant, texture, vs, ps } from "./shared";
import { clampToBorder } from "../shared/func";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap, DustNoiseMap } from "../shared/texture";
import { quadDepthV5, skinnedQuadDepthV5 } from "./quaddepthv5";
import { quadPickingV5, skinnedQuadPickingV5 } from "./quadpickingv5";


export const quadV5 = {
    name: "quadV5",
    path: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/",
    description: "quad shader",
    todo: "Add dirt",
    techniques: {
        Depth: quadDepthV5.techniques.Main,
        Picking: quadPickingV5.techniques.Main,
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
                    constant.PMtl1DiffuseColor,
                    constant.PMtl1FresnelColor,
                    constant.PMtl1Gloss,
                    constant.PMtl2DiffuseColor,
                    constant.PMtl2FresnelColor,
                    constant.PMtl2Gloss,
                    constant.Mtl1DustDiffuseColor,
                    constant.Mtl2DustDiffuseColor,
                    constant.Mtl3DustDiffuseColor,
                    constant.Mtl4DustDiffuseColor,
                ],
                textures: [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    texture.AlbedoMap,                  // a
                    texture.RoughnessMap,               // r
                    texture.NormalMap,                  // n
                    texture.AoMap,                      // a
                    texture.PaintMaskMap,               // p3
                    texture.MaterialMap,                // m
                    texture.DirtMap,                    // d
                    texture.GlowMap,                    // g
                    texture.PatternMask1Map,
                    texture.PatternMask2Map,
                    DustNoiseMap,
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
                    varying vec4 texcoord6;
                    varying vec4 texcoord7;
                    varying vec4 texcoord8;
                    
                    uniform samplerCube s0; // EveSpaceSceneEnvMap
                    uniform sampler2D s1;   // EveSpaceSceneShadowMap
                    uniform sampler2D s2;   // AlbedoMap
                    uniform sampler2D s3;   // RoughnessMap
                    uniform sampler2D s4;   // NormalMap
                    uniform sampler2D s5;   // AoMap
                    uniform sampler2D s6;   // PaintMaskMap
                    uniform sampler2D s7;   // MaterialMap
                    uniform sampler2D s8;   // DirtMap
                    uniform sampler2D s9;   // GlowMap
                    uniform sampler2D s10;  // PatternMask1Map;
                    uniform sampler2D s11;  // PatternMask2Map;
                    uniform sampler2D s12;  // DustNoiseMap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[24];
       
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
                        vec4 r0;
                        vec4 r1;
                        vec4 r10;
                        vec4 r11;
                        vec4 r12;
                        vec4 r13;
                        vec4 r14;
                        vec4 r15;
                        vec4 r16;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        vec4 c20=vec4(9.99999997e-007,-5,0.400000006,3.14159274);
                        vec4 c21=vec4(1,2,-1,0);
                        vec4 c22=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c23=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c24=vec4(0.0383840017,0.0393519998,0.0391650014,9.99999987e+014);
                        vec4 c25=vec4(1.10000002,6,-9.27999973,7);
                        vec4 c26=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c27=vec4(0,-0.015625,0.75,0.119999997);
                        vec4 c28=vec4(0.318309873,-1.44269507e-005,-0.00313080009,12.9200001);
                        vec4 c29=vec4(0.416666657,1.05499995,-0.0549999997,0);
                        vec4 c30=vec4(-1,-2,-3,-4);
                        vec4 c31=vec4(3.14159274,-1e-015,1,1.54499996);
                        
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v4=texcoord4;
                        v5=texcoord5;
                        v6=texcoord6;
                        v7=texcoord7;
                        v8=texcoord8;
                        
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
                        r1.x=(-cb2[19].x)+v7.z;
                        r0.z=r0.z*r1.x;
                        r0.z=sqrt(abs(r0.z));
                        r1.x=1.0/v8.w;
                        r1.xy=r1.xx*v8.xy;
                        r1.xy=r1.xy*c23.zw+c23.zz;
                        r1.z=c23.z;
                        r1.xy=cb2[18].xy*r1.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r1.z=r0.z+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.z=(-r0.z)+r1.x;
                        r0.z=r0.z>=0.0?c21.x:c21.w;
                        r2.x=max(r1.y,c20.x);
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
                        r1.xyz=r1.xyz*(-c22.zzz);
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xyz=v4.xyz*r0.zzz+cb2[12].xyz;
                        r3.xyz=r0.zzz*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.z=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r0.z=r0.z*r0.z;
                        r0.x=r0.x*cb7[0].x;
                        r2.x=cb4[11].x;
                        r1.w=r2.x+c20.y;
                        r5.x=cb7[19].x;
                        r2.y=r1.w>=0.0?r5.x:cb7[16].x;
                        r6=r2.xxxx+c30;
                        r2.x=r6.w>=0.0?r2.y:cb7[13].x;
                        r2.x=r6.z>=0.0?r2.x:cb7[12].x;
                        r2.x=r6.y>=0.0?r2.x:cb7[11].x;
                        r2.x=r6.x>=0.0?r2.x:cb7[10].x;
                        r7.x=cb4[10].x;
                        r2.y=r7.x+c20.y;
                        r2.z=r2.y>=0.0?r5.x:cb7[16].x;
                        r5=r7.xxxx+c30;
                        r2.z=r5.w>=0.0?r2.z:cb7[13].x;
                        r2.z=r5.z>=0.0?r2.z:cb7[12].x;
                        r2.z=r5.y>=0.0?r2.z:cb7[11].x;
                        r2.z=r5.x>=0.0?r2.z:cb7[10].x;
                        
                        // Webgl doesn't support CLAMP_TO_BORDER
                        
                        // PatternMask1Map
                        r7=clampToBorder(s10,v6.xy, cb4[10].yz, c21.wwww);
                         
                        // PatternMask2Map
                        r8=clampToBorder(s11,v6.zw, cb4[11].yz, c21.wwww); 
                        
                        r7=r7.xxxx*cb4[12];
                        r3.w=mix(cb7[11].x,r2.z,r7.y);
                        r8=r8.xxxx*cb4[13];
                        r4.w=mix(r3.w,r2.x,r8.y);
                        r9=r0.yyyy+c22;
                        r0.y=r0.w*r0.w;
                        r9=r9*c23.xxxx;
                        r9=saturate((-abs(r9))+c23.yyyy);
                        r0.w=r4.w*r9.y;
                        r3.w=mix(cb7[10].x,r2.z,r7.x);
                        r4.w=mix(r3.w,r2.x,r8.x);
                        r0.w=r9.x*r4.w+r0.w;
                        r3.w=mix(cb7[12].x,r2.z,r7.z);
                        r4.w=mix(cb7[13].x,r2.z,r7.w);
                        r10.x=mix(r4.w,r2.x,r8.w);
                        r4.w=mix(r3.w,r2.x,r8.z);
                        r0.w=r9.z*r4.w+r0.w;
                        r0.w=r9.w*r10.x+r0.w;
                        
                        // AlbedoMap 
                        r10.xyz=texture2D(s2,v0.xy).xyz;    
                        
                        // RoughnessMap    
                        r10.w=texture2D(s3,v0.xy).x;        
                        
                        r2.x=r0.w*r10.w;
                        r0.w=r10.w*(-r0.w)+c20.z;
                        r0.w=r0.x*r0.w+r2.x;
                        r0.w=saturate((-r0.w)+c21.x);
                        r2.xz=(-r0.ww)+c31.zw;
                        r3.w=min(r2.z,c21.x);
                        r11=c27;
                        r12=r2.xxxx*c26+r11.xxyz;
                        r0.z=r0.z*r3.w+c25.x;
                        r0.z=(-r3.w)+r0.z;
                        r0.z=1.0/r0.z;
                        
                        r11.xyz=cb7[18].xyz;
                        {
                            bvec3 tmp=greaterThanEqual(r1.www,vec3(0.0));
                            r2.xzw=vec3(tmp.x?r11.x:cb7[15].x,tmp.y?r11.y:cb7[15].y,tmp.z?r11.z:cb7[15].z);
                        }
                        r13.xyz=cb7[17].xyz;
                        {
                            bvec3 tmp=greaterThanEqual(r1.www,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r13.x:cb7[14].x,tmp.y?r13.y:cb7[14].y,tmp.z?r13.z:cb7[14].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[5].x,tmp.y?r14.y:cb7[5].y,tmp.z?r14.z:cb7[5].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[4].x,tmp.y?r14.y:cb7[4].y,tmp.z?r14.z:cb7[4].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[3].x,tmp.y?r14.y:cb7[3].y,tmp.z?r14.z:cb7[3].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[2].x,tmp.y?r14.y:cb7[2].y,tmp.z?r14.z:cb7[2].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));
                            r2.xzw=vec3(tmp.x?r2.x:cb7[9].x,tmp.y?r2.z:cb7[9].y,tmp.z?r2.w:cb7[9].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));
                            r2.xzw=vec3(tmp.x?r2.x:cb7[8].x,tmp.y?r2.z:cb7[8].y,tmp.z?r2.w:cb7[8].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));
                            r2.xzw=vec3(tmp.x?r2.x:cb7[7].x,tmp.y?r2.z:cb7[7].y,tmp.z?r2.w:cb7[7].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));
                            r2.xzw=vec3(tmp.x?r2.x:cb7[6].x,tmp.y?r2.z:cb7[6].y,tmp.z?r2.w:cb7[6].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r2.yyy,vec3(0.0));
                            r6.xyz=vec3(tmp.x?r11.x:cb7[15].x,tmp.y?r11.y:cb7[15].y,tmp.z?r11.z:cb7[15].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r2.yyy,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r13.x:cb7[14].x,tmp.y?r13.y:cb7[14].y,tmp.z?r13.z:cb7[14].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.www,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r11.x:cb7[5].x,tmp.y?r11.y:cb7[5].y,tmp.z?r11.z:cb7[5].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.zzz,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r11.x:cb7[4].x,tmp.y?r11.y:cb7[4].y,tmp.z?r11.z:cb7[4].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.yyy,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r11.x:cb7[3].x,tmp.y?r11.y:cb7[3].y,tmp.z?r11.z:cb7[3].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.xxx,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r11.x:cb7[2].x,tmp.y?r11.y:cb7[2].y,tmp.z?r11.z:cb7[2].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.www,vec3(0.0));
                            r6.xyz=vec3(tmp.x?r6.x:cb7[9].x,tmp.y?r6.y:cb7[9].y,tmp.z?r6.z:cb7[9].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.zzz,vec3(0.0));
                            r6.xyz=vec3(tmp.x?r6.x:cb7[8].x,tmp.y?r6.y:cb7[8].y,tmp.z?r6.z:cb7[8].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.yyy,vec3(0.0));
                            r5.yzw=vec3(tmp.x?r6.x:cb7[7].x,tmp.y?r6.y:cb7[7].y,tmp.z?r6.z:cb7[7].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.xxx,vec3(0.0));
                            r5.xyz=vec3(tmp.x?r5.y:cb7[6].x,tmp.y?r5.z:cb7[6].y,tmp.z?r5.w:cb7[6].z);
                        }
                        
                        // r7 = pattern mask 1 (on/off each mat layer)
                        // r5 = pattern mask 1 fresnel
                        // r11 = pattern mask 1 diffuse 
                        
                        // r8 = pattern mask 2 (on/off each mat layer)
                        // r14 = pattern mask 1 diffuse
                        // r2 = pattern mask 2 fresnel
                        
                        r6.xyz=mix(cb7[6].xyz,r5.xyz,r7.xxx);
                        r13.xyz=mix(r6.xyz,r2.xzw,r8.xxx);
                        r6.xyz=mix(cb7[7].xyz,r5.xyz,r7.yyy);
                        r15.xyz=mix(r6.xyz,r2.xzw,r8.yyy);
                        r6.xyz=r9.yyy*r15.xyz;
                        r6.xyz=r9.xxx*r13.xyz+r6.xyz;
                        r13.xyz=mix(cb7[8].xyz,r5.xyz,r7.zzz);
                        r15.xyz=mix(cb7[9].xyz,r5.xyz,r7.www);
                        r5.xyz=mix(r15.xyz,r2.xzw,r8.www);
                        r15.xyz=mix(r13.xyz,r2.xzw,r8.zzz);
                        r2.xyz=r9.zzz*r15.xyz+r6.xyz;
                        r2.xyz=r9.www*r5.xyz+r2.xyz;
                        r5.xyz=r2.xyz*r10.www;
                        r2.xyz=r10.www*(-r2.xyz)+c24.xyz;
                        r2.xyz=r0.xxx*r2.xyz+r5.xyz;
                        r1.w=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r1.w=(-r1.w)+c21.x;
                        r2.w=r1.w*r1.w;
                        r2.w=r2.w*r2.w;
                        r1.w=r1.w*r2.w;
                        r5.xyz=mix(r2.xyz,c21.xxx,r1.www);
                        r6.xyz=r0.zzz*r5.xyz;
                        r5.xyz=(-r5.xyz)+c21.xxx;
                        r13.xyz=mix(cb7[3].xyz,r11.xyz,r7.yyy);
                        r15.xyz=mix(r13.xyz,r14.xyz,r8.yyy);
                        r13.xyz=r9.yyy*r15.xyz;
                        r15.xyz=mix(cb7[2].xyz,r11.xyz,r7.xxx);
                        r16.xyz=mix(r15.xyz,r14.xyz,r8.xxx);
                        r13.xyz=r9.xxx*r16.xyz+r13.xyz;
                        r15.xyz=mix(cb7[4].xyz,r11.xyz,r7.zzz);
                        r16.xyz=mix(cb7[5].xyz,r11.xyz,r7.www);
                        r7.xyz=mix(r16.xyz,r14.xyz,r8.www);
                        r11.xyz=mix(r15.xyz,r14.xyz,r8.zzz);
                        r8.xyz=r9.zzz*r11.xyz+r13.xyz;
                        r7.xyz=r9.www*r7.xyz+r8.xyz;
                        r8.xyz=mix(r7.xyz,c21.xxx,r0.xxx);
                        
                        r7.xyz=r8.xyz*r10.xyz;
                        r5.xyz=r5.xyz*r7.xyz;
                        r0.x=r0.w*r0.w;
                        r8.w=r0.w*c25.y;
                        r0.z=r0.x*r0.x;
                        r0.x=r0.x*r0.x+c21.z;
                        
                        // NormalMap 
                        r9.ywx=texture2D(s4,v0.xy).xyz; 
                        
                        // AoMap
                        r9.z=texture2D(s5,v0.xy).x;     
                        
                        r9.xy=r9.yw*c21.yy+c21.zz;
                        r10.xyz=r9.yyy*v3.xyz;
                        r10.xyz=r9.xxx*v2.xyz+r10.xyz;
                        r0.w=saturate(dot(r9.xy,r9.xy)+c21.w);
                        r0.w=(-r0.w)+c21.x;
                        r0.w=sqrt(abs(r0.w));
                        r9.xyz=r0.www*v1.xyz+r10.xyz;
                        r10.xyz=normalize(r9.xyz);
                        r0.w=clamp(dot(r10.xyz,r4.xyz),0.0, 1.0);
                        r0.w=r0.w*r0.w;
                        r0.x=r0.w*r0.x+c21.x;
                        r0.x=r0.x*r0.x;
                        r0.w=r0.x*c20.w;
                        r0.x=r0.x*c31.x+c31.y;
                        r0.w=1.0/r0.w;
                        r0.x=r0.x>=0.0?r0.w:c24.w;
                        r0.x=r0.x*r0.z;
                        r0.xzw=r6.xyz*r0.xxx+r5.xyz;
                        r1.w=clamp(dot(cb2[12].xyz,r10.xyz),0.0, 1.0);
                        
                        // Dirt test
                        float unknown1 = r1.w; // Whatever this is? 
                        vec4 dustDetailNoise = texture2D(s12, v0.xy);
                        vec3 dirt = texture2D(s8,v0.xy).xxx; 
                        dustDetailNoise = dustDetailNoise += vec4(0.5);
                        float unknownShadowValue = 0.0;
                        float unknown0 = saturate(unknownShadowValue * (-dustDetailNoise.z) + 1.0);
                        float dirty = dirt.x * dustDetailNoise.w;
                        dustDetailNoise.xy = (vec2(-unknown0)) + vec2(1,1.54499996);
                        float unknown3 = min(dustDetailNoise.y, 1.0);
                        dustDetailNoise = dustDetailNoise.xxxx * vec4(1.04166663,0.474999994,0.018229166,0.25) + r8.xxyz;  
                        
                        r0.xzw=r0.xzw*r1.www;
                        r0.xzw=r1.xyz*r0.xzw;
                        r1.xyz=max(r0.xzw,c21.www);
                        r0.x=dot(r3.xyz,r10.xyz);
                        r0.z=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c25.z;
                        r0.x=exp2(r0.x);
                        r1.w=min(r0.x,r12.y);
                        r0.x=r12.x*r1.w+r12.z;
                        r4.xyz=saturate(mix(r0.xxx,r12.www,r2.xyz));
                        r0.xzw=r10.xyz*(-r0.zzz)+r3.xyz;
                        r8.x=dot((-r0.xzw),cb2[8].xyz);
                        r8.y=dot((-r0.xzw),cb2[9].xyz);
                        r8.z=dot((-r0.xzw),cb2[10].xyz);
                        r2=textureCubeLod(s0,r8.xyz,r8.w);
                        r0.xzw=r2.xyz*cb2[14].www;
                        r10.w=c25.w;
                        r2=textureCubeLod(s0,r10.xyz,r10.w);
                        r1.w=r11.w*cb2[14].w;
                        r2.xyz=r2.xyz*cb2[14].www+r1.www;
                        r3.xyz=(-r4.xyz)+c21.xxx;
                        r3.xyz=r3.xyz*r7.xyz;
                        r2.xyz=r2.xyz*r3.xyz;
                        r2.xyz=r2.xyz*c28.xxx;
                        r0.xzw=r0.xzw*r4.xyz+r2.xyz;
                        r2.xyz=max(r0.xzw,c21.www);
                        r0.xzw=r1.xyz+r2.xyz;
                        
                        // use r2 as r1 gets reassigned
                        // r1.xy=mix(v0.xy,v0.zw,cb7[0].yy); <----------------------------------------------------------
                        r2.xy=mix(v0.xy,v0.zw,cb7[0].yy);
                        
                        // NormalMap 
                        r1.ywx=texture2D(s4,r2.xy).xyz;     
                        
                        // AoMap        
                        r1.z=texture2D(s5,r2.xy).x;         
                       
                        r0.xzw=r0.xzw*r1.zzz+(-cb2[15].xyz);
                        r1.x=cb2[15].w*v4.w;
                        r1.x=r1.x*c28.y;
                        r1.x=exp2(r1.x);
                        r0.xzw=r1.xxx*r0.xzw+cb2[15].xyz;
                        r2.xyz=cb2[15].xyz;
                        r1.yzw=(-r2.xyz)+cb7[1].xyz;
                        r1.xyz=r1.xxx*r1.yzw+cb2[15].xyz;
                        r1.xyz=r1.xyz*cb4[0].yyy;
                        r0.xyz=r1.xyz*r0.yyy+r0.xzw;
                        r1.xyz=max(r0.xyz,c21.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c29.xxx;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c29.yyy+c29.zzz;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c28.zzz;
                        r2.xyz=r2.xyz*c28.www;
                        {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                        }
                        
                        // Dirt test
                        gl_FragData[0].xyz = mix(gl_FragData[0].xyz, dirt * cb4[0].z, -dirt);
                        
                        ${ps.shadowFooter}
                    }
                `
            }
        }
    }
};


export const skinnedQuadV5 = {
    name: "skinned_QuadV5",
    path: quadV5.path,
    description: `skinned ${quadV5.description}`,
    todo: quadV5.todo,
    techniques: {
        Depth: skinnedQuadDepthV5.techniques.Main,
        Picking: skinnedQuadPickingV5.techniques.Main,
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadV5.techniques.Main.ps
        }
    }
};