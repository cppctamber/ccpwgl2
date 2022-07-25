import { vs, ps, constant, texture } from "./shared";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap, DustNoiseMap } from "../shared/texture";
import { quadDepthV5, skinnedQuadDepthV5 } from "./quaddepthv5";
import { quadPickingV5, skinnedQuadPickingV5 } from "./quadpickingv5";
import { clampToBorder } from "../shared/func";


export const quadHeatV5 = {
    name: "quadHeatV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadHeatV5",
    description: "heat quad shader",
    todo: "Add dirt",
    techniques: {
        Depth: quadDepthV5.techniques.Main,
        Picking: quadPickingV5.techniques.Main,

        Main: {
            vs: vs.quadV5_PosTexTanTex,
            ps: {
                constants: [
                    constant.GeneralData,
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
                    constant.Mtl1HeatGlowData,
                    constant.Mtl2HeatGlowData,
                    constant.Mtl3HeatGlowData,
                    constant.Mtl4HeatGlowData,
                    constant.GeneralHeatGlowColor,
                    constant.Mtl1DustDiffuseColor,
                    constant.Mtl2DustDiffuseColor,
                    constant.Mtl3DustDiffuseColor,
                    constant.Mtl4DustDiffuseColor,
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
                    texture.PatternMask1Map,
                    texture.PatternMask2Map,
                    texture.HeatGlowNoiseMap,
                    DustNoiseMap
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
                    uniform sampler2D s12;  // HeatGlowNoiseMap;
                    uniform sampler2D s13;  // DustNoiseMap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[28];
                    
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
                        
                        vec4 c24=vec4(9.99999997e-007,-5,0.400000006,3.14159274);
                        vec4 c25=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c26=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c27=vec4(0.0383840017,0.0393519998,0.0391650014,9.99999987e+014);
                        vec4 c28=vec4(1.10000002,6,-9.27999973,7);
                        vec4 c29=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c30=vec4(0,-0.015625,0.75,0.119999997);
                        vec4 c31=vec4(0.318309873,-1.44269507e-005,-0.00499999989,66.6666641);
                        vec4 c32=vec4(-0.00313080009,12.9200001,0.416666657,0);
                        vec4 c33=vec4(1.05499995,-0.0549999997,0,0);
                        vec4 c34=vec4(1,2,-1,0);
                        vec4 c35=vec4(-1,-2,-3,-4);
                        vec4 c36=vec4(3.14159274,-1e-015,1,1.54499996);
                        
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
                        
                        gl_FragData[0].w=(-r0.x)+c34.x;
                        r0.z=(-cb2[19].x)+cb2[19].y;
                        r0.z=1.0/r0.z;
                        r0.w=(-cb2[19].x)+v7.z;
                        r0.z=r0.z*r0.w;
                        r0.z=sqrt(abs(r0.z));
                        r0.w=1.0/v8.w;
                        r1.xy=r0.ww*v8.xy;
                        r1.xy=r1.xy*c26.zw+c26.zz;
                        r1.z=c26.z;
                        r1.xy=cb2[18].xy*r1.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r0.w=r0.z+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.z=(-r0.z)+r1.x;
                        r0.z=r0.z>=0.0?c34.x:c34.w;
                        r2.x=max(r1.y,c24.x);
                        r0.w=r0.w*r0.w+r2.x;
                        r0.w=1.0/r0.w;
                        r0.w=r0.w*r2.x;
                        r1.x=saturate(max(r0.z,r0.w));
                        r0.z=r1.x+(-cb2[18].w);
                        r1.x=c34.x;
                        r0.w=r1.x+(-cb2[18].w);
                        r0.w=1.0/r0.w;
                        r0.z=saturate(r0.w*r0.z);
                        r0.z=(-cb2[19].x)>=0.0?r0.z:r1.x;
                        r1.x=max(cb2[19].z,r0.z);
                        r0.z=r1.x*r1.x;
                        r1.xyz=r0.zzz*cb2[13].xyz;
                        r1.xyz=r1.xyz*(-c25.zzz);
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xyz=v4.xyz*r0.zzz+cb2[12].xyz;
                        r3.xyz=r0.zzz*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.z=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r0.z=r0.z*r0.z;
                        r0.x=r0.x*cb7[0].x;
                        r2=r0.yyyy+c25;
                        r2=r2*c26.xxxx;
                        r2=saturate((-abs(r2))+c26.yyyy);
                        r5.x=cb4[11].x;
                        r0.y=r5.x+c24.y;
                        r6.x=cb7[18].x;
                        r0.w=r0.y>=0.0?r6.x:cb7[15].x;
                        r5=r5.xxxx+c35;
                        r0.w=r5.w>=0.0?r0.w:cb7[12].x;
                        r0.w=r5.z>=0.0?r0.w:cb7[11].x;
                        r0.w=r5.y>=0.0?r0.w:cb7[10].x;
                        r0.w=r5.x>=0.0?r0.w:cb7[9].x;
                        r7.x=cb4[10].x;
                        r1.w=r7.x+c24.y;
                        r3.w=r1.w>=0.0?r6.x:cb7[15].x;
                        r6=r7.xxxx+c35;
                        r3.w=r6.w>=0.0?r3.w:cb7[12].x;
                        r3.w=r6.z>=0.0?r3.w:cb7[11].x;
                        r3.w=r6.y>=0.0?r3.w:cb7[10].x;
                        r3.w=r6.x>=0.0?r3.w:cb7[9].x;
                        
                        // Webgl doesn't support CLAMP_TO_BORDER
                        
                        // PatternMask1Map
                        r7=clampToBorder(s10,v6.xy, cb4[10].yz, c34.wwww); 
                        
                        // PatternMask2Map
                        r8=clampToBorder(s11,v6.zw, cb4[11].yz, c34.wwww); 
                        
                        r7=r7.xxxx*cb4[12];
                        r4.w=mix(cb7[9].x,r3.w,r7.x);
                        r8=r8.xxxx*cb4[13];
                        r9.x=mix(r4.w,r0.w,r8.x);
                        r4.w=mix(cb7[10].x,r3.w,r7.y);
                        r9.y=mix(r4.w,r0.w,r8.y);
                        r4.w=r2.y*r9.y;
                        r4.w=r2.x*r9.x+r4.w;
                        r9.x=mix(cb7[11].x,r3.w,r7.z);
                        r9.y=mix(cb7[12].x,r3.w,r7.w);
                        r3.w=mix(r9.y,r0.w,r8.w);
                        r10.x=mix(r9.x,r0.w,r8.z);
                        r0.w=r2.z*r10.x+r4.w;
                        r0.w=r2.w*r3.w+r0.w;
                        
                        // AlbedoMap 
                        r9.xyz=texture2D(s2,v0.xy).xyz;    
                        
                        // RoughnessMap    
                        r9.w=texture2D(s3,v0.xy).x;  
                        
                        r3.w=r0.w*r9.w;
                        r0.w=r9.w*(-r0.w)+c24.z;
                        r0.w=r0.x*r0.w+r3.w;
                        r0.w=saturate((-r0.w)+c34.x);
                        r10.xy=(-r0.ww)+c36.zw;
                        r3.w=min(r10.y,c34.x);
                        r11=c30;
                        r10=r10.xxxx*c29+r11.xxyz;
                        r0.z=r0.z*r3.w+c28.x;
                        r0.z=(-r3.w)+r0.z;
                        r0.z=1.0/r0.z;
                        r3.w=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r3.w=(-r3.w)+c34.x;
                        r4.w=r3.w*r3.w;
                        r4.w=r4.w*r4.w;
                        r3.w=r3.w*r4.w;
                        r11.xyz=cb7[17].xyz;
                        {
                            bvec3 tmp=greaterThanEqual(r0.yyy,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r11.x:cb7[14].x,tmp.y?r11.y:cb7[14].y,tmp.z?r11.z:cb7[14].z);
                        }
                        r13.xyz=cb7[16].xyz;
                        {
                            bvec3 tmp=greaterThanEqual(r0.yyy,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r13.x:cb7[13].x,tmp.y?r13.y:cb7[13].y,tmp.z?r13.z:cb7[13].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.www,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[4].x,tmp.y?r14.y:cb7[4].y,tmp.z?r14.z:cb7[4].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.zzz,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[3].x,tmp.y?r14.y:cb7[3].y,tmp.z?r14.z:cb7[3].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.yyy,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[2].x,tmp.y?r14.y:cb7[2].y,tmp.z?r14.z:cb7[2].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.xxx,vec3(0.0));
                            r14.xyz=vec3(tmp.x?r14.x:cb7[1].x,tmp.y?r14.y:cb7[1].y,tmp.z?r14.z:cb7[1].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.www,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r12.x:cb7[8].x,tmp.y?r12.y:cb7[8].y,tmp.z?r12.z:cb7[8].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.zzz,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r12.x:cb7[7].x,tmp.y?r12.y:cb7[7].y,tmp.z?r12.z:cb7[7].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.yyy,vec3(0.0));
                            r5.yzw=vec3(tmp.x?r12.x:cb7[6].x,tmp.y?r12.y:cb7[6].y,tmp.z?r12.z:cb7[6].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r5.xxx,vec3(0.0));
                            r5.xyz=vec3(tmp.x?r5.y:cb7[5].x,tmp.y?r5.z:cb7[5].y,tmp.z?r5.w:cb7[5].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r1.www,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r11.x:cb7[14].x,tmp.y?r11.y:cb7[14].y,tmp.z?r11.z:cb7[14].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r1.www,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r13.x:cb7[13].x,tmp.y?r13.y:cb7[13].y,tmp.z?r13.z:cb7[13].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r12.x:cb7[4].x,tmp.y?r12.y:cb7[4].y,tmp.z?r12.z:cb7[4].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r12.x:cb7[3].x,tmp.y?r12.y:cb7[3].y,tmp.z?r12.z:cb7[3].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r12.x:cb7[2].x,tmp.y?r12.y:cb7[2].y,tmp.z?r12.z:cb7[2].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));
                            r12.xyz=vec3(tmp.x?r12.x:cb7[1].x,tmp.y?r12.y:cb7[1].y,tmp.z?r12.z:cb7[1].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r11.x:cb7[8].x,tmp.y?r11.y:cb7[8].y,tmp.z?r11.z:cb7[8].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));
                            r11.xyz=vec3(tmp.x?r11.x:cb7[7].x,tmp.y?r11.y:cb7[7].y,tmp.z?r11.z:cb7[7].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));
                            r6.yzw=vec3(tmp.x?r11.x:cb7[6].x,tmp.y?r11.y:cb7[6].y,tmp.z?r11.z:cb7[6].z);
                        }
                        {
                            bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));
                            r6.xyz=vec3(tmp.x?r6.y:cb7[5].x,tmp.y?r6.z:cb7[5].y,tmp.z?r6.w:cb7[5].z);
                        }
                        
                        r11.xyz=mix(cb7[5].xyz,r6.xyz,r7.xxx);
                        r13.xyz=mix(r11.xyz,r5.xyz,r8.xxx);
                        r11.xyz=mix(cb7[6].xyz,r6.xyz,r7.yyy);
                        r15.xyz=mix(r11.xyz,r5.xyz,r8.yyy);
                        r11.xyz=r2.yyy*r15.xyz;
                        r11.xyz=r2.xxx*r13.xyz+r11.xyz;
                        r13.xyz=mix(cb7[7].xyz,r6.xyz,r7.zzz);
                        r15.xyz=mix(cb7[8].xyz,r6.xyz,r7.www);
                        r6.xyz=mix(r15.xyz,r5.xyz,r8.www);
                        r15.xyz=mix(r13.xyz,r5.xyz,r8.zzz);
                        r5.xyz=r2.zzz*r15.xyz+r11.xyz;
                        r5.xyz=r2.www*r6.xyz+r5.xyz;
                        r6.xyz=r5.xyz*r9.www;
                        r5.xyz=r9.www*(-r5.xyz)+c27.xyz;
                        r5.xyz=r0.xxx*r5.xyz+r6.xyz;
                        r6.xyz=mix(r5.xyz,c34.xxx,r3.www);
                        r11.xyz=r0.zzz*r6.xyz;
                        r6.xyz=(-r6.xyz)+c34.xxx;
                        r13.xyz=mix(cb7[1].xyz,r12.xyz,r7.xxx);
                        r15.xyz=mix(r13.xyz,r14.xyz,r8.xxx);
                        r13.xyz=mix(cb7[2].xyz,r12.xyz,r7.yyy);
                        r16.xyz=mix(r13.xyz,r14.xyz,r8.yyy);
                        r13.xyz=r2.yyy*r16.xyz;
                        r13.xyz=r2.xxx*r15.xyz+r13.xyz;
                        r15.xyz=mix(cb7[3].xyz,r12.xyz,r7.zzz);
                        r16.xyz=mix(cb7[4].xyz,r12.xyz,r7.www);
                        r7.xyz=mix(r16.xyz,r14.xyz,r8.www);
                        r12.xyz=mix(r15.xyz,r14.xyz,r8.zzz);
                        r8.xyz=r2.zzz*r12.xyz+r13.xyz;
                        r7.xyz=r2.www*r7.xyz+r8.xyz;
                        r8.xyz=mix(r7.xyz,c34.xxx,r0.xxx);
                        r0.xyz=r8.xyz*r9.xyz;
                        r6.xyz=r6.xyz*r0.xyz;
                        r1.w=r0.w*r0.w;
                        r7.w=r0.w*c28.y;
                        r0.w=r1.w*r1.w+c34.z;
                        r1.w=r1.w*r1.w;
                        
                        // NormalMap 
                        r8.ywx=texture2D(s4,v0.xy).xyz; 
                        
                        // AoMap
                        r8.z=texture2D(s5,v0.xy).x;  
                        
                        r8.xy=r8.yw*c34.yy+c34.zz;
                        r9.xyz=r8.yyy*v3.xyz;
                        r9.xyz=r8.xxx*v2.xyz+r9.xyz;
                        r3.w=saturate(dot(r8.xy,r8.xy)+c34.w);
                        r3.w=(-r3.w)+c34.x;
                        r3.w=sqrt(abs(r3.w));
                        r8.xyz=r3.www*v1.xyz+r9.xyz;
                        r9.xyz=normalize(r8.xyz);
                        r3.w=clamp(dot(r9.xyz,r4.xyz),0.0, 1.0);
                        r3.w=r3.w*r3.w;
                        r0.w=r3.w*r0.w+c34.x;
                        r0.w=r0.w*r0.w;
                        r3.w=r0.w*c24.w;
                        r0.w=r0.w*c36.x+c36.y;
                        r3.w=1.0/r3.w;
                        r0.w=r0.w>=0.0?r3.w:c27.w;
                        r0.w=r0.w*r1.w;
                        r4.xyz=r11.xyz*r0.www+r6.xyz;
                        r0.w=clamp(dot(cb2[12].xyz,r9.xyz),0.0, 1.0);
                        r4.xyz=r0.www*r4.xyz;
                        r1.xyz=r1.xyz*r4.xyz;
                        r4.xyz=max(r1.xyz,c34.www);
                        r0.w=dot(r3.xyz,r9.xyz);
                        r1.x=saturate(r0.w);
                        r0.w=r0.w+r0.w;
                        r1.yzw=r9.xyz*(-r0.www)+r3.xyz;
                        r0.w=r1.x*c28.z;
                        r0.w=exp2(r0.w);
                        r1.x=min(r0.w,r10.y);
                        r0.w=r10.x*r1.x+r10.z;
                        r3.xyz=saturate(mix(r0.www,r10.www,r5.xyz));
                        r5.xyz=(-r3.xyz)+c34.xxx;
                        r0.xyz=r0.xyz*r5.xyz;
                        r9.w=c28.w;
                        r5=textureCubeLod(s0,r9.xyz,r9.w);
                        r0.w=r11.w*cb2[14].w;
                        r5.xyz=r5.xyz*cb2[14].www+r0.www;
                        r0.xyz=r0.xyz*r5.xyz;
                        r0.xyz=r0.xyz*c31.xxx;
                        r7.x=dot((-r1.yzw),cb2[8].xyz);
                        r7.y=dot((-r1.yzw),cb2[9].xyz);
                        r7.z=dot((-r1.yzw),cb2[10].xyz);
                        r1=textureCubeLod(s0,r7.xyz,r7.w);
                        r1.xyz=r1.xyz*cb2[14].www;
                        r0.xyz=r1.xyz*r3.xyz+r0.xyz;
                        r1.xyz=max(r0.xyz,c34.www);
                        r0.xyz=r1.xyz+r4.xyz;
                        
                        // Use r3 instead of r1 <-----------------------------------------------------------------------
                        r3.xy=mix(v0.xy,v0.zw,cb7[0].yy);
                        
                        // NormalMap 
                        r1.ywx=texture2D(s4,r3.xy).xyz; 
                        
                        // AoMap
                        r1.z=texture2D(s5,r3.xy).x;    
                        
                        r0.xyz=r0.xyz*r1.zzz+(-cb2[15].xyz);
                        r0.w=cb2[15].w*v4.w;
                        r0.w=r0.w*c31.y;
                        r0.w=exp2(r0.w);
                        r0.xyz=r0.www*r0.xyz+cb2[15].xyz;
                        r1=r2.yyyy*cb7[20];
                        r1=r2.xxxx*cb7[19]+r1;
                        r1=r2.zzzz*cb7[21]+r1;
                        r1=r2.wwww*cb7[22]+r1;
                        r2.xy=r1.yy*cb2[21].xx+v0.xy;
                        r2.xy=r1.zz*r2.xy;
                        r2=texture2D(s12,r2.xy);
                        r2.zw=r1.yy*(-cb2[21].xx)+v0.xy;
                        r1.yz=r1.zz*r2.zw;
                        
                        r3=texture2D(s12,r1.yz);
                        
                        r1.yz=r2.xy*r3.xy+c26.ww;
                        r2.z=c31.z;
                        r0.w=r2.z+cb4[0].x;
                        r0.w=saturate(r0.w*c31.w);
                        r0.w=r0.w+c34.z;
                        r0.w=saturate(r1.x*r0.w+c34.x);
                        r1.x=r1.w*r0.w;
                        r1.xy=r1.xx*r1.yz+v0.xy;
                        
                        // Use r5 to temp store uvs <-------------------------------------------------------------------
                        r5.xy = r1.xy;
                        
                        // PaintMaskMap
                        r1.x=texture2D(s6,r5.xy).x * ${texture.PaintMaskMap.multiplier};  
                        
                        // MaterialMap
                        r1.y=texture2D(s7,r5.xy).x;    
                        
                        // DirtMap (Not required here) <----------------------------------------------------------------    
                        r1.z=texture2D(s8,r5.xy).x;   
                        
                        // GlowMap     
                        r1.w=texture2D(s9,r5.xy).x;    
                        
                        r1.x=r1.w*r1.w;
                        r1.x=r1.x*cb4[0].y;
                        r0.w=r0.w*r1.x;
                        r0.xyz=cb7[23].xyz*r0.www+r0.xyz;
                        r1.xyz=max(r0.xyz,c34.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c32.zzz;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c33.xxx+c33.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c32.xxx;
                        r2.xyz=r2.xyz*c32.yyy;
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


export const skinnedQuadHeatV5 = {
    name: "skinned_quadHeatV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/skinned_quadHeatV5",
    description: `skinned ${quadHeatV5.description}`,
    todo: quadHeatV5.todo,
    techniques: {
        Depth: skinnedQuadDepthV5.techniques.Main,
        Picking: skinnedQuadPickingV5.techniques.Main,

        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadHeatV5.techniques.Main.ps
        }
    }
};