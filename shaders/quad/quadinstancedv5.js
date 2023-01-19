import { constant, ps, texture, vs } from "./shared";
import { quadDepthV5 } from "./quaddepthv5";
import { quadPickingV5 } from "./quadpickingv5";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap, DustNoiseMap } from "../shared/texture";
import { clampToBorder } from "../shared/func";
import { quadnormalv5 } from "./quadnormalv5";


export const quadInstancedV5 = {
    name: "quadInstancedV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadInstancedV5",
    description: "instanced quad shader",
    todo: "Add dirt",
    techniques: {
        Depth: {
            vs: vs.quadInstancedV5_PosTexTexTexTex,
            ps: quadDepthV5.techniques.Main.ps
        },
        Picking: {
            vs: vs.quadInstancedV5_PosTexTexTexTex,
            ps: quadPickingV5.techniques.Main.ps
        },
        Normal: {
            vs: vs.quadInstancedV5_PosTexTanTexTexTexTex,
            ps: quadnormalv5.techniques.Main.ps
        },
        Main: {
            vs: vs.quadInstancedV5_PosTexTanTexTexTexTexL01,
            ps: {
                textures : [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    texture.AlbedoMap,
                    texture.RoughnessMap,
                    texture.NormalMap,
                    texture.PaintMaskMap,
                    texture.MaterialMap,
                    texture.DirtMap,
                    texture.GlowMap,
                    texture.PatternMask1Map,
                    texture.PatternMask2Map,
                    DustNoiseMap
                ],
                constants: [
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
                    
                    varying vec4 lighting;
                    
                    uniform samplerCube s0;
                    uniform sampler2D s1;
                    uniform sampler2D s2;   // AlbedoMap
                    uniform sampler2D s3;   // RoughnessMap
                    uniform sampler2D s4;   // NormalMap
                    uniform sampler2D s5;   // PaintMaskMap
                    uniform sampler2D s6;   // MaterialMap
                    uniform sampler2D s7;   // DirtMap
                    uniform sampler2D s8;   // GlowMap
                    uniform sampler2D s9;   // PatternMask1Map;
                    uniform sampler2D s10;  // PatternMask2Map;
                    uniform sampler2D s11;  // DustNoiseMap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[14];
                    uniform vec4 cb7[23];

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
                        
                        vec4 c19=vec4(9.99999997e-007,-5,3.14159274,-1e-015);
                        vec4 c20=vec4(1,2,-1,0);
                        vec4 c21=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c22=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c23=vec4(9.99999987e+014,1,1.54499996,1.10000002);
                        vec4 c24=vec4(6,0,-0.015625,0.75);
                        vec4 c25=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c26=vec4(-9.27999973,7,0.119999997,0.318309873);
                        vec4 c27=vec4(-1.44269507e-005,-0.00313080009,12.9200001,0.416666657);
                        vec4 c28=vec4(1.05499995,-0.0549999997,0,0);
                        vec4 c29=vec4(-1,-2,-3,-4);
                        
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
                        r0.x=texture2D(s5,v0.xy).x;  
                        
                        // MaterialMap
                        r0.y=texture2D(s6,v0.xy).x;    
                        
                        // DirtMap (Not required here) 
                        r0.z=texture2D(s7,v0.xy).x;   
                        
                        // GlowMap     
                        r0.w=texture2D(s8,v0.xy).x; 
                        
                        //gl_FragData[0].w=(-r0.x)+c20.x;
                        gl_FragData[0].w=c20.x;
                        
                        r0.x=(-cb2[19].x)+cb2[19].y;
                        r0.x=1.0/r0.x;
                        r0.z=(-cb2[19].x)+v7.z;
                        r0.x=r0.x*r0.z;
                        r0.x=sqrt(abs(r0.x));
                        r0.z=1.0/v8.w;
                        r1.xy=r0.zz*v8.xy;
                        r1.xy=r1.xy*c22.zw+c22.zz;
                        r0.z=c22.z;
                        r1.xy=cb2[18].xy*r0.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r0.z=r0.x+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.x=(-r0.x)+r1.x;
                        r0.x=r0.x>=0.0?c20.x:c20.w;
                        r2.x=max(r1.y,c19.x);
                        r0.z=r0.z*r0.z+r2.x;
                        r0.z=1.0/r0.z;
                        r0.z=r0.z*r2.x;
                        r1.x=saturate(max(r0.x,r0.z));
                        r0.x=r1.x+(-cb2[18].w);
                        r1.x=c20.x;
                        r0.z=r1.x+(-cb2[18].w);
                        r0.z=1.0/r0.z;
                        r0.x=saturate(r0.z*r0.x);
                        r0.x=(-cb2[19].x)>=0.0?r0.x:r1.x;
                        r1.x=max(cb2[19].z,r0.x);
                        r0.x=r1.x*r1.x;
                        r1.xyz=r0.xxx*cb2[13].xyz;
                        r1.xyz=r1.xyz*(-c21.zzz);
                        r0.x=dot(v4.xyz,v4.xyz);
                        r0.x=r0.x==0.0?3.402823466e+38:inversesqrt(abs(r0.x));
                        r2.xyz=v4.xyz*r0.xxx+cb2[12].xyz;
                        r3.xyz=r0.xxx*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.x=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r0.x=(-r0.x)+c20.x;
                        r0.z=r0.x*r0.x;
                        r0.z=r0.z*r0.z;
                        r0.x=r0.z*r0.x;
                        r2.y=c19.y;
                        r0.z=r2.y+cb4[11].x;
                        r5.xyz=cb7[17].xyz;
                        {bvec3 tmp=greaterThanEqual(r0.zzz,vec3(0.0));r2.xzw=vec3(tmp.x?r5.x:cb7[14].x,tmp.y?r5.y:cb7[14].y,tmp.z?r5.z:cb7[14].z);};
                        r6=c29;
                        r7=r6+cb4[11].xxxx;
                        {bvec3 tmp=greaterThanEqual(r7.www,vec3(0.0));r2.xzw=vec3(tmp.x?r2.x:cb7[8].x,tmp.y?r2.z:cb7[8].y,tmp.z?r2.w:cb7[8].z);};
                        {bvec3 tmp=greaterThanEqual(r7.zzz,vec3(0.0));r2.xzw=vec3(tmp.x?r2.x:cb7[7].x,tmp.y?r2.z:cb7[7].y,tmp.z?r2.w:cb7[7].z);};
                        {bvec3 tmp=greaterThanEqual(r7.yyy,vec3(0.0));r2.xzw=vec3(tmp.x?r2.x:cb7[6].x,tmp.y?r2.z:cb7[6].y,tmp.z?r2.w:cb7[6].z);};
                        {bvec3 tmp=greaterThanEqual(r7.xxx,vec3(0.0));r2.xzw=vec3(tmp.x?r2.x:cb7[5].x,tmp.y?r2.z:cb7[5].y,tmp.z?r2.w:cb7[5].z);};
                        r1.w=r2.y+cb4[10].x;
                        {bvec3 tmp=greaterThanEqual(r1.www,vec3(0.0));r5.xyz=vec3(tmp.x?r5.x:cb7[14].x,tmp.y?r5.y:cb7[14].y,tmp.z?r5.z:cb7[14].z);};
                        r6=r6+cb4[10].xxxx;
                        {bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));r5.xyz=vec3(tmp.x?r5.x:cb7[8].x,tmp.y?r5.y:cb7[8].y,tmp.z?r5.z:cb7[8].z);};
                        {bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));r5.xyz=vec3(tmp.x?r5.x:cb7[7].x,tmp.y?r5.y:cb7[7].y,tmp.z?r5.z:cb7[7].z);};
                        {bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));r5.xyz=vec3(tmp.x?r5.x:cb7[6].x,tmp.y?r5.y:cb7[6].y,tmp.z?r5.z:cb7[6].z);};
                        {bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));r5.xyz=vec3(tmp.x?r5.x:cb7[5].x,tmp.y?r5.y:cb7[5].y,tmp.z?r5.z:cb7[5].z);};
                        
                        // Webgl doesn't support CLAMP_TO_EDGE
                        
                        // PatternMask1Map
                        r8=clampToBorder(s9,v6.xy, cb4[10].yz, c20.wwww);
                        
                        // PatternMask2Map
                        r10=clampToBorder(s10,v6.zw, cb4[11].yz, c20.wwww);
                        
                        r8=r8.xxxx*cb4[12];
                        r9.xyz=mix(cb7[6].xyz,r5.xyz,r8.yyy);
                        r10=r10.xxxx*cb4[13];
                        r11.xyz=mix(r9.xyz,r2.xzw,r10.yyy);
                        r9=r0.yyyy+c21;
                        r0.y=r0.w*r0.w;
                        r9=r9*c22.xxxx;
                        r9=saturate((-abs(r9))+c22.yyyy);
                        r11.xyz=r11.xyz*r9.yyy;
                        r12.xyz=mix(cb7[5].xyz,r5.xyz,r8.xxx);
                        r13.xyz=mix(r12.xyz,r2.xzw,r10.xxx);
                        r11.xyz=r9.xxx*r13.xyz+r11.xyz;
                        r12.xyz=mix(cb7[7].xyz,r5.xyz,r8.zzz);
                        r13.xyz=mix(cb7[8].xyz,r5.xyz,r8.www);
                        r5.xyz=mix(r13.xyz,r2.xzw,r10.www);
                        r13.xyz=mix(r12.xyz,r2.xzw,r10.zzz);
                        r2.xyz=r9.zzz*r13.xyz+r11.xyz;
                        r2.xyz=r9.www*r5.xyz+r2.xyz;
                        
                        // AlbedoMap 
                        r5.xyz=texture2D(s2,v0.xy).xyz;    
                        
                        // RoughnessMap    
                        r5.w=texture2D(s3,v0.xy).x;  
                        
                        r11.xyz=r5.www*(-r2.xyz)+c20.xxx;
                        r2.xyz=r2.xyz*r5.www;
                        r11.xyz=r11.xyz*r0.xxx+r2.xyz;
                        r0.x=cb7[18].x;
                        r0.w=r0.z>=0.0?r0.x:cb7[15].x;
                        r12.xyz=cb7[16].xyz;
                        {bvec3 tmp=greaterThanEqual(r0.zzz,vec3(0.0));r13.xyz=vec3(tmp.x?r12.x:cb7[13].x,tmp.y?r12.y:cb7[13].y,tmp.z?r12.z:cb7[13].z);};
                        {bvec3 tmp=greaterThanEqual(r7.www,vec3(0.0));r13.xyz=vec3(tmp.x?r13.x:cb7[4].x,tmp.y?r13.y:cb7[4].y,tmp.z?r13.z:cb7[4].z);};
                        {bvec3 tmp=greaterThanEqual(r7.zzz,vec3(0.0));r13.xyz=vec3(tmp.x?r13.x:cb7[3].x,tmp.y?r13.y:cb7[3].y,tmp.z?r13.z:cb7[3].z);};
                        {bvec3 tmp=greaterThanEqual(r7.yyy,vec3(0.0));r13.xyz=vec3(tmp.x?r13.x:cb7[2].x,tmp.y?r13.y:cb7[2].y,tmp.z?r13.z:cb7[2].z);};
                        {bvec3 tmp=greaterThanEqual(r7.xxx,vec3(0.0));r13.xyz=vec3(tmp.x?r13.x:cb7[1].x,tmp.y?r13.y:cb7[1].y,tmp.z?r13.z:cb7[1].z);};
                        r0.z=r7.w>=0.0?r0.w:cb7[12].x;
                        r0.z=r7.z>=0.0?r0.z:cb7[11].x;
                        r0.z=r7.y>=0.0?r0.z:cb7[10].x;
                        r0.z=r7.x>=0.0?r0.z:cb7[9].x;
                        r0.x=r1.w>=0.0?r0.x:cb7[15].x;
                        {bvec3 tmp=greaterThanEqual(r1.www,vec3(0.0));r7.xyz=vec3(tmp.x?r12.x:cb7[13].x,tmp.y?r12.y:cb7[13].y,tmp.z?r12.z:cb7[13].z);};
                        {bvec3 tmp=greaterThanEqual(r6.www,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[4].x,tmp.y?r7.y:cb7[4].y,tmp.z?r7.z:cb7[4].z);};
                        {bvec3 tmp=greaterThanEqual(r6.zzz,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[3].x,tmp.y?r7.y:cb7[3].y,tmp.z?r7.z:cb7[3].z);};
                        {bvec3 tmp=greaterThanEqual(r6.yyy,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[2].x,tmp.y?r7.y:cb7[2].y,tmp.z?r7.z:cb7[2].z);};
                        {bvec3 tmp=greaterThanEqual(r6.xxx,vec3(0.0));r7.xyz=vec3(tmp.x?r7.x:cb7[1].x,tmp.y?r7.y:cb7[1].y,tmp.z?r7.z:cb7[1].z);};
                        r0.x=r6.w>=0.0?r0.x:cb7[12].x;
                        r0.x=r6.z>=0.0?r0.x:cb7[11].x;
                        r0.x=r6.y>=0.0?r0.x:cb7[10].x;
                        r0.x=r6.x>=0.0?r0.x:cb7[9].x;
                        r1.w=mix(cb7[9].x,r0.x,r8.x);
                        r2.w=mix(r1.w,r0.z,r10.x);
                        r1.w=mix(cb7[10].x,r0.x,r8.y);
                        r3.w=mix(r1.w,r0.z,r10.y);
                        r0.w=r3.w*r9.y;
                        r0.w=r9.x*r2.w+r0.w;
                        r1.w=mix(cb7[11].x,r0.x,r8.z);
                        r2.w=mix(cb7[12].x,r0.x,r8.w);
                        r3.w=mix(r2.w,r0.z,r10.w);
                        r2.w=mix(r1.w,r0.z,r10.z);
                        r0.x=r9.z*r2.w+r0.w;
                        r0.x=r9.w*r3.w+r0.x;
                        r0.x=saturate(r5.w*(-r0.x)+c20.x);
                        r0.zw=(-r0.xx)+c23.yz;
                        r1.w=min(r0.w,c20.x);
                        r6.yzw=c24.yzw;
                        r6=r0.zzzz*c25+r6.yyzw;
                        r0.z=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r0.z=r0.z*r0.z;
                        r0.z=r0.z*r1.w+c23.w;
                        r0.z=(-r1.w)+r0.z;
                        r0.z=1.0/r0.z;
                        r12.xyz=r0.zzz*r11.xyz;
                        r11.xyz=(-r11.xyz)+c20.xxx;
                        r14.xyz=mix(cb7[2].xyz,r7.xyz,r8.yyy);
                        r15.xyz=mix(r14.xyz,r13.xyz,r10.yyy);
                        r14.xyz=r9.yyy*r15.xyz;
                        r15.xyz=mix(cb7[1].xyz,r7.xyz,r8.xxx);
                        r16.xyz=mix(r15.xyz,r13.xyz,r10.xxx);
                        r14.xyz=r9.xxx*r16.xyz+r14.xyz;
                        r15.xyz=mix(cb7[3].xyz,r7.xyz,r8.zzz);
                        r16.xyz=mix(cb7[4].xyz,r7.xyz,r8.www);
                        r7.xyz=mix(r16.xyz,r13.xyz,r10.www);
                        r8.xyz=mix(r15.xyz,r13.xyz,r10.zzz);
                        r8.xyz=r9.zzz*r8.xyz+r14.xyz;
                        r7.xyz=r9.www*r7.xyz+r8.xyz;
                        r5.xyz=r5.xyz*r7.xyz;
                        r7.xyz=r11.xyz*r5.xyz;
                        r0.z=r0.x*r0.x;
                        r8.w=r0.x*c24.x;
                        r0.x=r0.z*r0.z;
                        r0.z=r0.z*r0.z+c20.z;
                        
                        // NormalMap 
                        r9.ywx=texture2D(s4,v0.xy).xyz; 
                        
                        // Ambient occlusion
                        r9.z=lighting.x;   
                        
                        r9.xy=r9.yw*c20.yy+c20.zz;
                        r10.xyz=r9.yyy*v3.xyz;
                        r10.xyz=r9.xxx*v2.xyz+r10.xyz;
                        r0.w=saturate(dot(r9.xy,r9.xy)+c20.w);
                        r0.w=(-r0.w)+c20.x;
                        r0.w=sqrt(abs(r0.w));
                        r9.xyz=r0.www*v1.xyz+r10.xyz;
                        r10.xyz=normalize(r9.xyz);
                        r0.w=clamp(dot(r10.xyz,r4.xyz),0.0, 1.0);
                        r0.w=r0.w*r0.w;
                        r0.z=r0.w*r0.z+c20.x;
                        r0.z=r0.z*r0.z;
                        r0.w=r0.z*c19.z;
                        r0.z=r0.z*c19.z+c19.w;
                        r0.w=1.0/r0.w;
                        r0.z=r0.z>=0.0?r0.w:c23.x;
                        r0.x=r0.z*r0.x;
                        r0.xzw=r12.xyz*r0.xxx+r7.xyz;
                        r1.w=clamp(dot(cb2[12].xyz,r10.xyz),0.0, 1.0);
                        r0.xzw=r0.xzw*r1.www;
                        r0.xzw=r1.xyz*r0.xzw;
                        r1.xyz=max(r0.xzw,c20.www);
                        r0.x=dot(r3.xyz,r10.xyz);
                        r0.z=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c26.x;
                        r0.x=exp2(r0.x);
                        r1.w=min(r0.x,r6.y);
                        r0.x=r6.x*r1.w+r6.z;
                        r4.xyz=saturate(mix(r0.xxx,r6.www,r2.xyz));
                        r0.xzw=r10.xyz*(-r0.zzz)+r3.xyz;
                        r8.x=dot((-r0.xzw),cb2[8].xyz);
                        r8.y=dot((-r0.xzw),cb2[9].xyz);
                        r8.z=dot((-r0.xzw),cb2[10].xyz);
                        r2=textureCubeLod(s0,r8.xyz,r8.w);
                        r0.xzw=r2.xyz*cb2[14].www;
                        r10.w=c26.y;
                        r2=textureCubeLod(s0,r10.xyz,r10.w);
                        r1.w=cb2[14].w;
                        r1.w=r1.w*c26.z;
                        r2.xyz=r2.xyz*cb2[14].www+r1.www;
                        r3.xyz=(-r4.xyz)+c20.xxx;
                        r3.xyz=r3.xyz*r5.xyz;
                        r2.xyz=r2.xyz*r3.xyz;
                        r2.xyz=r2.xyz*c26.www;
                        r0.xzw=r0.xzw*r4.xyz+r2.xyz;
                        r2.xyz=max(r0.xzw,c20.www);
                        r0.xzw=r1.xyz+r2.xyz;
                        r1.x=cb2[15].w*v4.w;
                        r1.x=r1.x*c27.x;
                        r1.x=exp2(r1.x);
                        r2.xyz=mix(cb2[15].xyz,r0.xzw,r1.xxx);
                        r3.xyz=cb2[15].xyz;
                        r0.xzw=(-r3.xyz)+cb7[0].xyz;
                        r0.xzw=r1.xxx*r0.xzw+cb2[15].xyz;
                        r0.xzw=r0.xzw*cb4[0].yyy;
                        r0.xyz=r0.xzw*r0.yyy+r2.xyz;
                        r1.xyz=max(r0.xyz,c20.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c27.www;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c28.xxx+c28.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c27.yyy;
                        r2.xyz=r2.xyz*c27.zzz;
                        {bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));gl_FragData[0].xyz=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);};
                        
                        ${ps.shadowFooter}
                    }               
                `
            }
        }
    }
};


export const skinnedQuadInstancedV5 = {
    name: "skinned_quadInstancedV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/skinned_quadInstancedV5",
    description: `skinned ${quadInstancedV5.description}`,
    techniques: quadInstancedV5.techniques
};