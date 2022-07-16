import { quadDepthV5, skinnedQuadDepthV5 } from "./quadDepthV5";
import { quadPickingV5, skinnedQuadPickingV5 } from "./quadPickingV5";
import { vs, ps, texture, constant } from "./shared";
import { clampToBorder } from "../shared/func";
import { DustNoiseMap, EveSpaceSceneEnvMap, EveSpaceSceneShadowMap } from "../shared/texture";


export const quadDetailV5 = {
    name: "quadDetailV5",
    path: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/",
    description: "detail shader",
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
                    constant.Detail1Data,
                    constant.Detail2Data,
                    constant.Detail3Data,
                    constant.DetailAlbedoColor,
                    constant.DetailFresnelColor,
                    constant.DetailSelector,
                    constant.Mtl1DustDiffuseColor,
                    constant.Mtl2DustDiffuseColor,
                    constant.Mtl3DustDiffuseColor,
                    constant.Mtl4DustDiffuseColor,
                ],
                textures : [
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
                    DustNoiseMap,
                    texture.Detail1Map,
                    texture.Detail2Map,
                    texture.Detail3Map
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
                    
                    uniform samplerCube s0;
                    uniform sampler2D s1;
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
                    uniform sampler2D s13;  // Detail1Map
                    uniform sampler2D s14;  // Detail2Map
                    uniform sampler2D s15;  // Detail3Map
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[30];
                    
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
                        vec4 r17;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        vec4 c26=vec4(9.99999997e-007,-5,0.400000006,3.14159274);
                        vec4 c27=vec4(1,2,-1,0);
                        vec4 c28=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c29=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c30=vec4(0.0383840017,0.0393519998,0.0391650014,9.99999987e+014);
                        vec4 c31=vec4(1.10000002,6,-9.27999973,7);
                        vec4 c32=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c33=vec4(0,-0.015625,0.75,0.119999997);
                        vec4 c34=vec4(0.318309873,-1.44269507e-005,-0.00313080009,12.9200001);
                        vec4 c35=vec4(0.416666657,1.05499995,-0.0549999997,0);
                        vec4 c36=vec4(-1,-2,-3,-4);
                        vec4 c37=vec4(3.14159274,-1e-015,1,1.54499996);
                        
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
                        
                        gl_FragData[0].w=(-r0.x)+c27.x;
                        r0.z=(-cb2[19].x)+cb2[19].y;
                        r0.z=1.0/r0.z;
                        r1.x=(-cb2[19].x)+v7.z;
                        r0.z=r0.z*r1.x;
                        r0.z=sqrt(abs(r0.z));
                        r1.x=1.0/v8.w;
                        r1.xy=r1.xx*v8.xy;
                        r1.xy=r1.xy*c29.zw+c29.zz;
                        r1.z=c29.z;
                        r1.xy=cb2[18].xy*r1.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r1.z=r0.z+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.z=(-r0.z)+r1.x;
                        r0.z=r0.z>=0.0?c27.x:c27.w;
                        r2.x=max(r1.y,c26.x);
                        r1.x=r1.z*r1.z+r2.x;
                        r1.x=1.0/r1.x;
                        r1.x=r1.x*r2.x;
                        r2.x=saturate(max(r0.z,r1.x));
                        r0.z=r2.x+(-cb2[18].w);
                        r1.x=c27.x;
                        r1.y=r1.x+(-cb2[18].w);
                        r1.y=1.0/r1.y;
                        r0.z=saturate(r0.z*r1.y);
                        r0.z=(-cb2[19].x)>=0.0?r0.z:r1.x;
                        r1.x=max(cb2[19].z,r0.z);
                        r0.z=r1.x*r1.x;
                        r1.xyz=r0.zzz*cb2[13].xyz;
                        r1.xyz=r1.xyz*(-c28.zzz);
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xyz=v4.xyz*r0.zzz+cb2[12].xyz;
                        r3.xyz=r0.zzz*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.z=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r0.z=(-r0.z)+c27.x;
                        r1.w=r0.z*r0.z;
                        r1.w=r1.w*r1.w;
                        r0.z=r0.z*r1.w;
                       
                        // Detail 2 map
                        r2.xy=cb7[21].xx*v0.xy+cb7[21].zw;
                        r2=texture2D(s14,r2.xy);
                        r1.w=r2.w*cb7[21].y;
                        
                        // Detail 1 map
                        r5.xy=cb7[20].xx*v0.xy+cb7[20].zw;
                        r5=texture2D(s13,r5.xy);
                        r1.w=cb7[20].y*r5.w+r1.w;
                        
                        r5.xyz=r5.xyz*c27.yyy+c27.zzz;
                        r2.xyz=r2.xyz*c27.yyy+r5.xyz;
                        
                        // Detail 3 map
                        r5.xy=cb7[22].xx*v0.xy+cb7[22].zw;
                        r5=texture2D(s15,r5.xy);
                        r1.w=saturate(cb7[22].y*r5.w+r1.w);
                        
                        r2.xyz=r5.xyz*c27.yyy+r2.xyz;
                        r2.xyz=r2.xyz+(-c27.yyy);
                        r5=r0.yyyy+c28;
                        r5=r5*c29.xxxx;
                        r5=saturate((-abs(r5))+c29.yyyy);
                        
                        r0.y=dot(cb7[25],r5);
                        r1.w=r0.y*r1.w;
                        r6.x=cb4[11].x;
                        r2.w=r6.x+c26.y;
                        r7.xyz=cb7[18].xyz;
                        {bvec3 tmp=greaterThanEqual(r2.www,vec3(0.0));r6.yzw=vec3(tmp.x?r7.x:cb7[15].x,tmp.y?r7.y:cb7[15].y,tmp.z?r7.z:cb7[15].z);};
                        r8=r6.xxxx+c36;
                        {bvec3 tmp=greaterThanEqual(r8.www,vec3(0.0));r6.xyz=vec3(tmp.x?r6.y:cb7[9].x,tmp.y?r6.z:cb7[9].y,tmp.z?r6.w:cb7[9].z);};
                        {bvec3 tmp=greaterThanEqual(r8.zzz,vec3(0.0));r6.xyz=vec3(tmp.x?r6.x:cb7[8].x,tmp.y?r6.y:cb7[8].y,tmp.z?r6.z:cb7[8].z);};
                        {bvec3 tmp=greaterThanEqual(r8.yyy,vec3(0.0));r6.xyz=vec3(tmp.x?r6.x:cb7[7].x,tmp.y?r6.y:cb7[7].y,tmp.z?r6.z:cb7[7].z);};
                        {bvec3 tmp=greaterThanEqual(r8.xxx,vec3(0.0));r6.xyz=vec3(tmp.x?r6.x:cb7[6].x,tmp.y?r6.y:cb7[6].y,tmp.z?r6.z:cb7[6].z);};
                        r9.x=cb4[10].x;
                        r3.w=r9.x+c26.y;
                        {bvec3 tmp=greaterThanEqual(r3.www,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[15].x,tmp.y?r7.y:cb7[15].y,tmp.z?r7.z:cb7[15].z);};
                        r9=r9.xxxx+c36;
                        {bvec3 tmp=greaterThanEqual(r9.www,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[9].x,tmp.y?r7.y:cb7[9].y,tmp.z?r7.z:cb7[9].z);};
                        {bvec3 tmp=greaterThanEqual(r9.zzz,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[8].x,tmp.y?r7.y:cb7[8].y,tmp.z?r7.z:cb7[8].z);};
                        {bvec3 tmp=greaterThanEqual(r9.yyy,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[7].x,tmp.y?r7.y:cb7[7].y,tmp.z?r7.z:cb7[7].z);};
                        {bvec3 tmp=greaterThanEqual(r9.xxx,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[6].x,tmp.y?r7.y:cb7[6].y,tmp.z?r7.z:cb7[6].z);};
                        
                        // webgl doesn't support CLAMP_TO_BORDER
                        
                        // PatternMask1Map
                        r10=clampToBorder(s10,v6.xy, cb4[10].yz, c27.wwww);
                        
                        // PatternMask2Map
                        r12=clampToBorder(s11,v6.zw, cb4[11].yz, c27.wwww);
                        
                        r10=r10.xxxx*cb4[12];
                        r11.xyz=mix(cb7[6].xyz,r7.xyz,r10.xxx);
                        r12=r12.xxxx*cb4[13];
                        r13.xyz=mix(r11.xyz,r6.xyz,r12.xxx);
                        r11.xyz=mix(cb7[7].xyz,r7.xyz,r10.yyy);
                        r14.xyz=mix(r11.xyz,r6.xyz,r12.yyy);
                        r11.xyz=r5.yyy*r14.xyz;
                        r11.xyz=r5.xxx*r13.xyz+r11.xyz;
                        r13.xyz=mix(cb7[8].xyz,r7.xyz,r10.zzz);
                        r14.xyz=mix(cb7[9].xyz,r7.xyz,r10.www);
                        r7.xyz=mix(r14.xyz,r6.xyz,r12.www);
                        r14.xyz=mix(r13.xyz,r6.xyz,r12.zzz);
                        r6.xyz=r5.zzz*r14.xyz+r11.xyz;
                        r6.xyz=r5.www*r7.xyz+r6.xyz;
                        r7.xyz=mix(r6.xyz,cb7[24].xyz,r1.www);
                        
                        // AlbedoMap 
                        r6.xyz=texture2D(s2,v0.xy).xyz;    
                        
                        // RoughnessMap    
                        r6.w=texture2D(s3,v0.xy).x;  
                        
                        r11.xyz=r7.xyz*r6.www;
                        r7.xyz=r6.www*(-r7.xyz)+c30.xyz;
                        r0.x=r0.x*cb7[0].x;
                        r7.xyz=r0.xxx*r7.xyz+r11.xyz;
                        r11.xyz=mix(r7.xyz,c27.xxx,r0.zzz);
                        r13.x=cb7[19].x;
                        r0.z=r2.w>=0.0?r13.x:cb7[16].x;
                        r14.xyz=cb7[17].xyz;
                        {bvec3 tmp=greaterThanEqual(r2.www,vec3(0.0));r13.yzw=vec3(tmp.x?r14.x:cb7[14].x,tmp.y?r14.y:cb7[14].y,tmp.z?r14.z:cb7[14].z);};
                        {bvec3 tmp=greaterThanEqual(r8.www,vec3(0.0));r13.yzw=vec3(tmp.x?r13.y:cb7[5].x,tmp.y?r13.z:cb7[5].y,tmp.z?r13.w:cb7[5].z);};
                        {bvec3 tmp=greaterThanEqual(r8.zzz,vec3(0.0));r13.yzw=vec3(tmp.x?r13.y:cb7[4].x,tmp.y?r13.z:cb7[4].y,tmp.z?r13.w:cb7[4].z);};
                        {bvec3 tmp=greaterThanEqual(r8.yyy,vec3(0.0));r13.yzw=vec3(tmp.x?r13.y:cb7[3].x,tmp.y?r13.z:cb7[3].y,tmp.z?r13.w:cb7[3].z);};
                        {bvec3 tmp=greaterThanEqual(r8.xxx,vec3(0.0));r13.yzw=vec3(tmp.x?r13.y:cb7[2].x,tmp.y?r13.z:cb7[2].y,tmp.z?r13.w:cb7[2].z);};
                        r0.z=r8.w>=0.0?r0.z:cb7[13].x;
                        r0.z=r8.z>=0.0?r0.z:cb7[12].x;
                        r0.z=r8.y>=0.0?r0.z:cb7[11].x;
                        r0.z=r8.x>=0.0?r0.z:cb7[10].x;
                        r2.w=r3.w>=0.0?r13.x:cb7[16].x;
                        {bvec3 tmp=greaterThanEqual(r3.www,vec3(0.0));r8.xyz=vec3(tmp.x?r14.x:cb7[14].x,tmp.y?r14.y:cb7[14].y,tmp.z?r14.z:cb7[14].z);};
                        {bvec3 tmp=greaterThanEqual(r9.www,vec3(0.0));r8.xyz=vec3(tmp.x?r8.x:cb7[5].x,tmp.y?r8.y:cb7[5].y,tmp.z?r8.z:cb7[5].z);};
                        {bvec3 tmp=greaterThanEqual(r9.zzz,vec3(0.0));r8.xyz=vec3(tmp.x?r8.x:cb7[4].x,tmp.y?r8.y:cb7[4].y,tmp.z?r8.z:cb7[4].z);};
                        {bvec3 tmp=greaterThanEqual(r9.yyy,vec3(0.0));r8.xyz=vec3(tmp.x?r8.x:cb7[3].x,tmp.y?r8.y:cb7[3].y,tmp.z?r8.z:cb7[3].z);};
                        {bvec3 tmp=greaterThanEqual(r9.xxx,vec3(0.0));r8.xyz=vec3(tmp.x?r8.x:cb7[2].x,tmp.y?r8.y:cb7[2].y,tmp.z?r8.z:cb7[2].z);};
                        r2.w=r9.w>=0.0?r2.w:cb7[13].x;
                        r2.w=r9.z>=0.0?r2.w:cb7[12].x;
                        r2.w=r9.y>=0.0?r2.w:cb7[11].x;
                        r2.w=r9.x>=0.0?r2.w:cb7[10].x;
                        r3.w=mix(cb7[10].x,r2.w,r10.x);
                        r4.w=mix(r3.w,r0.z,r12.x);
                        r3.w=mix(cb7[11].x,r2.w,r10.y);
                        r7.w=mix(r3.w,r0.z,r12.y);
                        r3.w=r5.y*r7.w;
                        r3.w=r5.x*r4.w+r3.w;
                        r4.w=mix(cb7[12].x,r2.w,r10.z);
                        r7.w=mix(cb7[13].x,r2.w,r10.w);
                        r2.w=mix(r7.w,r0.z,r12.w);
                        r7.w=mix(r4.w,r0.z,r12.z);
                        r0.z=r5.z*r7.w+r3.w;
                        r0.z=r5.w*r2.w+r0.z;
                        r2.w=r0.z*r6.w;
                        r0.z=r6.w*(-r0.z)+c26.z;
                        r0.z=r0.x*r0.z+r2.w;
                        r0.z=saturate((-r0.z)+c27.x);
                        r9.xy=(-r0.zz)+c37.zw;
                        r2.w=min(r9.y,c27.x);
                        r14=c33;
                        r9=r9.xxxx*c32+r14.xxyz;
                        r3.w=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r3.w=r3.w*r3.w;
                        r3.w=r3.w*r2.w+c31.x;
                        r2.w=(-r2.w)+r3.w;
                        r2.w=1.0/r2.w;
                        r14.xyz=r2.www*r11.xyz;
                        r11.xyz=(-r11.xyz)+c27.xxx;
                        r15.xyz=mix(cb7[3].xyz,r8.xyz,r10.yyy);
                        r16.xyz=mix(r15.xyz,r13.yzw,r12.yyy);
                        r15.xyz=r5.yyy*r16.xyz;
                        r16.xyz=mix(cb7[2].xyz,r8.xyz,r10.xxx);
                        r17.xyz=mix(r16.xyz,r13.yzw,r12.xxx);
                        r15.xyz=r5.xxx*r17.xyz+r15.xyz;
                        r16.xyz=mix(cb7[4].xyz,r8.xyz,r10.zzz);
                        r17.xyz=mix(cb7[5].xyz,r8.xyz,r10.www);
                        r8.xyz=mix(r17.xyz,r13.yzw,r12.www);
                        r10.xyz=mix(r16.xyz,r13.yzw,r12.zzz);
                        r5.xyz=r5.zzz*r10.xyz+r15.xyz;
                        r5.xyz=r5.www*r8.xyz+r5.xyz;
                        r8.xyz=mix(r5.xyz,cb7[23].xyz,r1.www);
                        r5.xyz=mix(r8.xyz,c27.xxx,r0.xxx);
                        r5.xyz=r5.xyz*r6.xyz;
                        r6.xyz=r11.xyz*r5.xyz;
                        r0.x=r0.z*r0.z;
                        r8.w=r0.z*c31.y;
                        r0.z=r0.x*r0.x+c27.z;
                        
                        // NormalMap 
                        r10.ywx=texture2D(s4,v0.xy).xyz; 
                        
                        // AoMap
                        r10.z=texture2D(s5,v0.xy).x;   
                        
                        r10.xy=r10.yw*c27.yy+c27.zz;
                        r1.w=saturate(dot(r10.xy,r10.xy)+c27.w);
                        r1.w=(-r1.w)+c27.x;
                        r1.w=r1.w==0.0?3.402823466e+38:inversesqrt(abs(r1.w));
                        r10.z=1.0/r1.w;
                        r2.xyz=r2.xyz*r0.yyy+r10.xyz;
                        r10.xyz=normalize(r2.xyz);
                        r2.xyz=r10.yyy*v3.xyz;
                        r2.xyz=r10.xxx*v2.xyz+r2.xyz;
                        r2.xyz=r10.zzz*v1.xyz+r2.xyz;
                        r10.xyz=normalize(r2.xyz);
                        r0.y=clamp(dot(r10.xyz,r4.xyz),0.0, 1.0);
                        r0.y=r0.y*r0.y;
                        r0.y=r0.y*r0.z+c27.x;
                        r0.xyw=r0.xyw*r0.xyw;
                        r0.z=r0.y*c26.w;
                        r0.y=r0.y*c37.x+c37.y;
                        r0.z=1.0/r0.z;
                        r0.y=r0.y>=0.0?r0.z:c30.w;
                        r0.x=r0.y*r0.x;
                        r0.xyz=r14.xyz*r0.xxx+r6.xyz;
                        r1.w=clamp(dot(cb2[12].xyz,r10.xyz),0.0, 1.0);
                        r0.xyz=r0.xyz*r1.www;
                        r0.xyz=r1.xyz*r0.xyz;
                        r1.xyz=max(r0.xyz,c27.www);
                        r0.x=dot(r3.xyz,r10.xyz);
                        r0.y=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c31.z;
                        r0.x=exp2(r0.x);
                        r1.w=min(r0.x,r9.y);
                        r0.x=r9.x*r1.w+r9.z;
                        r2.xyz=saturate(mix(r0.xxx,r9.www,r7.xyz));
                        r0.xyz=r10.xyz*(-r0.yyy)+r3.xyz;
                        r8.x=dot((-r0.xyz),cb2[8].xyz);
                        r8.y=dot((-r0.xyz),cb2[9].xyz);
                        r8.z=dot((-r0.xyz),cb2[10].xyz);
                        r3=textureCubeLod(s0,r8.xyz,r8.w);
                        r0.xyz=r3.xyz*cb2[14].www;
                        r10.w=c31.w;
                        r3=textureCubeLod(s0,r10.xyz,r10.w);
                        r1.w=r14.w*cb2[14].w;
                        r3.xyz=r3.xyz*cb2[14].www+r1.www;
                        r4.xyz=(-r2.xyz)+c27.xxx;
                        r4.xyz=r4.xyz*r5.xyz;
                        r3.xyz=r3.xyz*r4.xyz;
                        r3.xyz=r3.xyz*c34.xxx;
                        r0.xyz=r0.xyz*r2.xyz+r3.xyz;
                        r2.xyz=max(r0.xyz,c27.www);
                        r0.xyz=r1.xyz+r2.xyz;
                        
                        r10.xy=mix(v0.xy,v0.zw,cb7[0].yy);
                        
                        // NormalMap 
                        r1.ywx=texture2D(s4,r10.xy).xyz; 
                        
                        // AoMap
                        r1.z=texture2D(s5,r10.xy).x;   
                        
                        r0.xyz=r0.xyz*r1.zzz+(-cb2[15].xyz);
                        r1.x=cb2[15].w*v4.w;
                        r1.x=r1.x*c34.y;
                        r1.x=exp2(r1.x);
                        r0.xyz=r1.xxx*r0.xyz+cb2[15].xyz;
                        r2.xyz=cb2[15].xyz;
                        r1.yzw=(-r2.xyz)+cb7[1].xyz;
                        r1.xyz=r1.xxx*r1.yzw+cb2[15].xyz;
                        r1.xyz=r1.xyz*cb4[0].yyy;
                        r0.xyz=r1.xyz*r0.www+r0.xyz;
                        r1.xyz=max(r0.xyz,c27.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c35.xxx;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c35.yyy+c35.zzz;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c34.zzz;
                        r2.xyz=r2.xyz*c34.www;
                        {bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);};

                        ${ps.shadowFooter}
                        
                    }
                `
            }
        }
    }
};


export const skinnedQuadDetailV5 = {
    name: "skinned_QuadDetailV5",
    path: quadDetailV5.path,
    description: `skinned ${quadDetailV5.description}`,
    todo: quadDetailV5.todo,
    techniques: {
        Depth: skinnedQuadDepthV5.techniques.Main,
        Picking: skinnedQuadPickingV5.techniques.Main,
        Main: {
            vs: vs.skinnedQuadV5_PosBwtTexTanTex,
            ps: quadDetailV5.techniques.Main.ps
        }
    }
};