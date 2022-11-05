import { vs, ps, constant, texture } from "./shared";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap } from "../shared/texture";
import { WidgetType } from "../shared/util";
import { PosTexTanColTexL01 } from "../shared/input";


const g_wreckShaderAdjustments = {
    name: "g_wreckShaderAdjustments",
    value: [ 1.1, 3.0, 0.1, 0 ],
    autoRegister: true,
    ui: {
        description: "Provides adjustments so that wrecks look correct in webgl",
        components: [
            "adjust pow",
            "albedo override",
            "adjust lights"
        ],
        widget: WidgetType.MIXED,
        display: 0
    }
};

export const quadWreckV5 = {
    name: "quadWreckV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadWreckV5",
    description: "wreck quad shader",
    todo: "Add picking and depth",
    techniques : {
        Main: {
            vs: {
                inputDefinitions: PosTexTanColTexL01,
                shader: `
                
                    ${vs.shadowHeader}
                
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    attribute vec4 attr4;
                    attribute vec4 attr5;
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    varying vec4 texcoord2;
                    varying vec4 texcoord3;
                    varying vec4 texcoord4;
                    varying vec4 texcoord5;
                    varying vec4 texcoord6;
                    varying vec4 texcoord7;
                    varying vec4 texcoord8;
                    
                    varying vec4 color;
                    varying vec4 lighting;
                    
                    uniform vec4 cb1[24];
                    uniform vec4 cb3[4];
                    uniform vec3 ssyf;
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 v2;
                        vec4 v3;
                        vec4 v4;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        
                        vec4 c0=vec4(6.28318548,-3.14159274,0.159154937,0.5);
                        vec4 c1=vec4(0,1,0,0);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        v3=attr3;
                        v4=attr4;
                        
                        lighting.x=attr5.x;
                        
                        r0=v0.xyzx*c1.yyyx+c1.xxxy;
                        r1.w=dot(r0,cb3[3]);
                        r1.x=dot(r0,cb3[0]);
                        r1.y=dot(r0,cb3[1]);
                        r1.z=dot(r0,cb3[2]);
                        gl_Position.x=dot(r1,cb1[4]);
                        gl_Position.y=dot(r1,cb1[5]);
                        gl_Position.z=dot(r1,cb1[6]);
                        gl_Position.w=dot(r1,cb1[7]);
                        
                        r0=v2*c0.xxxx+c0.yyyy;
                        {bvec4 tmp=lessThan(c1.xxxx,r0.ywzw);r2.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;};
                        r0=r0*c0.zzzz+c0.wwww;
                        r0=fract(r0);
                        r0=r0*c0.xxxx+c0.yyyy;
                        r2.x=r2.y*r2.x;
                        r3.xy=vec2(cos(r0.x), sin(r0.x));
                        r4.xy=vec2(cos(r0.y), sin(r0.y));
                        r3.xy=r3.xy*abs(r4.yy);
                        r3.z=r4.x;
                        r4.xy=vec2(cos(r0.z), sin(r0.z));
                        r5.xy=vec2(cos(r0.w), sin(r0.w));
                        r0.xy=r4.xy*abs(r5.yy);
                        r0.z=r5.x;
                        r2.yzw=r0.yzx*r3.zxy;
                        r2.yzw=r3.yzx*r0.zxy+(-r2.yzw);
                        r4.xyz=mix((-r2.yzw),r2.yzw,r2.xxx);
                        texcoord1.x=dot(r4.xyz,cb3[0].xyz);
                        texcoord1.y=dot(r4.xyz,cb3[1].xyz);
                        texcoord1.z=dot(r4.xyz,cb3[2].xyz);
                        texcoord2.x=dot(r3.xyz,cb3[0].xyz);
                        texcoord2.y=dot(r3.xyz,cb3[1].xyz);
                        texcoord2.z=dot(r3.xyz,cb3[2].xyz);
                        texcoord3.x=dot(r0.xyz,cb3[0].xyz);
                        texcoord3.y=dot(r0.xyz,cb3[1].xyz);
                        texcoord3.z=dot(r0.xyz,cb3[2].xyz);
                        r0.xyz=(-r1.xyz)+cb1[3].xyz;
                        r0.w=dot(r0.xyz,r0.xyz);
                        r0.w=r0.w==0.0?3.402823466e+38:inversesqrt(abs(r0.w));
                        texcoord4.xyz=r0.www*r0.xyz;
                        r0.x=1.0/r0.w;
                        texcoord7.x=dot(r1,cb1[16]);
                        texcoord7.y=dot(r1,cb1[17]);
                        texcoord7.z=dot(r1,cb1[18]);
                        texcoord7.w=dot(r1,cb1[19]);
                        texcoord8.x=dot(r1,cb1[20]);
                        texcoord8.y=dot(r1,cb1[21]);
                        texcoord8.z=dot(r1,cb1[22]);
                        texcoord8.w=dot(r1,cb1[23]);
                        texcoord.xy=v1.xy;
                        texcoord.zw=v4.xy;
                        texcoord4.w=r0.x;
                        texcoord5.w=r0.x;
                        texcoord5.xyz=v0.xyz;
                        texcoord6=c1.xxxx;
                        color=v3;
                        
                        ${vs.shadowFooter}
                    }
                `
            },
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
                    constant.WreckColor,
                    constant.WreckFactors,
                    g_wreckShaderAdjustments
                ],
                textures: [
                    EveSpaceSceneEnvMap,
                    EveSpaceSceneShadowMap,
                    texture.AlphaThresholdMap,
                    texture.AlbedoMap,
                    texture.RoughnessMap,
                    texture.NormalMap,
                    texture.PaintMaskMap,
                    texture.MaterialMap,
                    texture.DirtMap,
                    texture.GlowMap
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
                    varying vec4 color;
                    
                    varying vec4 lighting;
                    
                    uniform samplerCube s0;
                    uniform sampler2D s1;
                    uniform sampler2D s2;  // AlphaThresholdMap
                    uniform sampler2D s3;  // AlbedoMap,
                    uniform sampler2D s4;  // RoughnessMap
                    uniform sampler2D s5;  // NormalMap,
                    uniform sampler2D s6;  // PaintMaskMap
                    uniform sampler2D s7;  // MaterialMap,
                    uniform sampler2D s8;  // DirtMap,
                    uniform sampler2D s9;  // GlowMap
                   
                    uniform vec4 cb2[22];
                    uniform vec4 cb4[3];
                    uniform vec4 cb7[17];
                    
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
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        vec4 c16=vec4(9.99999997e-007,15,0.0666666701,0.400000006);
                        vec4 c17=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c18=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c19=vec4(0.0383840017,0.0393519998,0.0391650014,3.14159274);
                        vec4 c20=vec4(1,2,-1,0);
                        vec4 c21=vec4(3.14159274,-1e-015,9.99999987e+014,1.10000002);
                        vec4 c22=vec4(1,1.54499996,6,-9.27999973);
                        vec4 c23=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c24=vec4(0,-0.015625,0.75,7);
                        vec4 c25=vec4(0.119999997,0.318309873,-1.44269507e-005,-0.00313080009);
                        vec4 c26=vec4(12.9200001,0.416666657,1.05499995,-0.0549999997);
                        
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v4=texcoord4;
                        v5=texcoord5;
                        v6=texcoord7;
                        v7=texcoord8;
                        v8=color;
                        
                        r0.xyz=(-cb4[1].xyz)+v5.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        
                        // PaintMaskMap
                        r0.x=texture2D(s6,v0.xy).x;
                        
                        // MaterialMap
                        r0.y=texture2D(s7,v0.xy).x;    
                        
                        // DirtMap (Not required here)
                        r0.z=texture2D(s8,v0.xy).x;   
                        
                        // GlowMap     
                        r0.w=texture2D(s9,v0.xy).x;  
                        
                        //gl_FragData[0].w=(-r0.x)+c20.x;
                        gl_FragData[0].w=c20.x;
                        
                        r0.z=(-cb2[19].x)+cb2[19].y;
                        r0.z=1.0/r0.z;
                        r1.x=(-cb2[19].x)+v6.z;
                        r0.z=r0.z*r1.x;
                        r0.z=sqrt(abs(r0.z));
                        r1.x=1.0/v7.w;
                        r1.xy=r1.xx*v7.xy;
                        r1.xy=r1.xy*c18.zw+c18.zz;
                        r1.z=c18.z;
                        r1.xy=cb2[18].xy*r1.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r1.z=r0.z+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.z=(-r0.z)+r1.x;
                        r0.z=r0.z>=0.0?c20.x:c20.w;
                        r2.x=max(r1.y,c16.x);
                        r1.x=r1.z*r1.z+r2.x;
                        r1.x=1.0/r1.x;
                        r1.x=r1.x*r2.x;
                        r2.x=saturate(max(r0.z,r1.x));
                        r0.z=r2.x+(-cb2[18].w);
                        r1.x=c20.x;
                        r1.y=r1.x+(-cb2[18].w);
                        r1.y=1.0/r1.y;
                        r0.z=saturate(r0.z*r1.y);
                        r0.z=(-cb2[19].x)>=0.0?r0.z:r1.x;
                        r1.y=max(cb2[19].z,r0.z);
                        r0.z=r1.y*r1.y;
                        r1.yzw=r0.zzz*cb2[13].xyz;
                        r1.yzw=r1.yzw*(-c17.zzz);
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xyz=v4.xyz*r0.zzz+cb2[12].xyz;
                        r3.xyz=r0.zzz*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.z=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r0.z=r0.z*r0.z;
                        r0.x=r0.x*cb7[0].x;
                        r2=r0.yyyy+c17;
                        r0.y=r0.w*r0.w;
                        r2=r2*c18.xxxx;
                        r2=saturate((-abs(r2))+c18.yyyy);
                        r0.w=r2.y*cb7[11].x;
                        r0.w=r2.x*cb7[10].x+r0.w;
                        r0.w=r2.z*cb7[12].x+r0.w;
                        r0.w=r2.w*cb7[13].x+r0.w;
                        
                        // AlbedoMap
                        r5.xyz=texture2D(s3,v0.xy).xyz;
                        
                        // RoughnessMap
                        r5.w=texture2D(s4,v0.xy).x;
                        
                        r3.w=r0.w*r5.w;
                        r0.w=r5.w*(-r0.w)+c16.w;
                        r0.w=r0.x*r0.w+r3.w;
                        r0.w=saturate((-r0.w)+c20.x);
                        r6.xy=(-r0.ww)+c22.xy;
                        r3.w=min(r6.y,c20.x);
                        r7.xyz=c24.xyz;
                        r6=r6.xxxx*c23+r7.xxyz;
                        r0.z=r0.z*r3.w+c21.w;
                        r0.z=(-r3.w)+r0.z;
                        r0.z=1.0/r0.z;
                        r7.xyz=r2.yyy*cb7[7].xyz;
                        r7.xyz=r2.xxx*cb7[6].xyz+r7.xyz;
                        r7.xyz=r2.zzz*cb7[8].xyz+r7.xyz;
                        r7.xyz=r2.www*cb7[9].xyz+r7.xyz;
                        r8.xyz=r5.www*r7.xyz;
                        r7.xyz=r5.www*(-r7.xyz)+c19.xyz;
                        r7.xyz=r0.xxx*r7.xyz+r8.xyz;
                        r3.w=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r3.w=(-r3.w)+c20.x;
                        r4.w=r3.w*r3.w;
                        r4.w=r4.w*r4.w;
                        r3.w=r3.w*r4.w;
                        r8.xyz=mix(r7.xyz,c20.xxx,r3.www);
                        r9.xyz=r0.zzz*r8.xyz;
                        r8.xyz=(-r8.xyz)+c20.xxx;
                        r10.xyz=r2.yyy*cb7[3].xyz;
                        r10.xyz=r2.xxx*cb7[2].xyz+r10.xyz;
                        r2.xyz=r2.zzz*cb7[4].xyz+r10.xyz;
                        r2.xyz=r2.www*cb7[5].xyz+r2.xyz;
                        r10.xyz=mix(r2.xyz,c20.xxx,r0.xxx);
                        r2.xyz=r5.xyz*r10.xyz;
                        r5.xyz=r8.xyz*r2.xyz;
                        r0.x=r0.w*r0.w;
                        r8.w=r0.w*c22.z;
                        r0.z=r0.x*r0.x;
                        r0.x=r0.x*r0.x+c20.z;
                        
                        // NormalMap
                        r10.ywx=texture2D(s5,v0.xy).xyz;
                        
                        // Ambient Occlusion
                        r10.z=lighting.x;
                        
                        r10.xy=r10.yw*c20.yy+c20.zz;
                        r11.xyz=r10.yyy*v3.xyz;
                        r11.xyz=r10.xxx*v2.xyz+r11.xyz;
                        r0.w=saturate(dot(r10.xy,r10.xy)+c20.w);
                        r0.w=(-r0.w)+c20.x;
                        r0.w=sqrt(abs(r0.w));
                        r10.xyz=r0.www*v1.xyz+r11.xyz;
                        r11.xyz=normalize(r10.xyz);
                        r0.w=clamp(dot(r11.xyz,r4.xyz),0.0, 1.0);
                        r0.w=r0.w*r0.w;
                        r0.x=r0.w*r0.x+c20.x;
                        r0.x=r0.x*r0.x;
                        r0.w=r0.x*c19.w;
                        r0.x=r0.x*c21.x+c21.y;
                        r0.w=1.0/r0.w;
                        r0.x=r0.x>=0.0?r0.w:c21.z;
                        r0.x=r0.x*r0.z;
                        r0.xzw=r9.xyz*r0.xxx+r5.xyz;
                        r2.w=clamp(dot(cb2[12].xyz,r11.xyz),0.0, 1.0);
                        r0.xzw=r0.xzw*r2.www;
                        r0.xzw=r1.yzw*r0.xzw;
                        r1.yzw=max(r0.xzw,c20.www);
                        r0.x=dot(r3.xyz,r11.xyz);
                        r0.z=r0.x+r0.x;
                        r0.x=saturate(r0.x);
                        r0.x=r0.x*c22.w;
                        r0.x=exp2(r0.x);
                        r2.w=min(r0.x,r6.y);
                        r0.x=r6.x*r2.w+r6.z;
                        r4.xyz=saturate(mix(r0.xxx,r6.www,r7.xyz));
                        r0.xzw=r11.xyz*(-r0.zzz)+r3.xyz;
                        r8.x=dot((-r0.xzw),cb2[8].xyz);
                        r8.y=dot((-r0.xzw),cb2[9].xyz);
                        r8.z=dot((-r0.xzw),cb2[10].xyz);
                        r3=textureCubeLod(s0,r8.xyz,r8.w);
                        r0.xzw=r3.xyz*cb2[14].www;
                        r11.w=c24.w;
                        r3=textureCubeLod(s0,r11.xyz,r11.w);
                        r5.x=c25.x;
                        r2.w=r5.x*cb2[14].w;
                        r3.xyz=r3.xyz*cb2[14].www+r2.www;
                        r5.xyz=(-r4.xyz)+c20.xxx;
                        r2.xyz=r2.xyz*r5.xyz;
                        r2.xyz=r3.xyz*r2.xyz;
                        r2.xyz=r2.xyz*c25.yyy;
                        r0.xzw=r0.xzw*r4.xyz+r2.xyz;
                        r2.xyz=max(r0.xzw,c20.www);
                        r0.xzw=r1.yzw+r2.xyz;
                        r1.yz=mix(v0.xy,v0.zw,cb7[0].yy);
                        
                        // NormalMap
                        r2.ywx=texture2D(s5,r1.xy).xyz;
                        
                        if (cb7[16].y > 0.0)
                        {
                            r2.z=cb7[16].y;
                        }
                        else
                        {
                            // Ambient Occlusion
                            r2.z=lighting.x;
                        }
                        
                        r0.xzw=r0.xzw*r2.zzz+(-cb2[15].xyz);
                        r1.y=cb2[15].w*v4.w;
                        r1.y=r1.y*c25.z;
                        r1.y=exp2(r1.y);
                        r0.xzw=r1.yyy*r0.xzw+cb2[15].xyz;
                        r1.zw=c16.yy*v0.xy;
                        r2.xy=fract(r1.zw);
                        r1.zw=r1.zw+(-r2.xy);
                        r1.zw=r1.zw*c16.zz;
                        r2.x=dot(r1.zw,r1.zw)+c20.w;
                        r2.x=r2.x==0.0?3.402823466e+38:inversesqrt(abs(r2.x));
                        r2.xy=r1.zw*r2.xx;
                        r2.xy=r2.xy*cb7[15].ww;
                        r1.zw=r2.xy*cb2[21].xx+r1.zw;
                        
                        // GlowMap     
                        r2.w=texture2D(s9,r1.zw).x;  
                        
                        r1.z=r2.w*r2.w;
                        r1.z=sqrt(abs(r1.z));
                        r1.w=r1.z*cb7[15].z;
                        r1.x=cb7[15].z*(-r1.z)+r1.x;
                        r1.z=saturate((-cb7[15].z)) + cb7[16].z;
                        r1.x=r1.z*r1.x+r1.w;
                        r2.xyz=cb2[15].xyz;
                        r1.xzw=cb7[1].xyz*r1.xxx+(-r2.xyz);
                        r1.xyz=r1.yyy*r1.xzw+cb2[15].xyz;
                        r1.xyz=r1.xyz*cb4[0].yyy;
                        r0.xyz=r1.xyz*r0.yyy+r0.xzw;
                        r1.xy=cb7[15].xx*v0.xy;
                        
                        // AlphaThresholdMap
                        r1=texture2D(s2,r1.xy);
                        
                        r0.xyz=cb7[14].xyz*(-r1.xyz)+r0.xyz;
                        r0.w=saturate(r1.w+v8.x);
                        r1.xyz=r1.xyz*cb7[14].xyz;
                        r1.w=pow(r0.w,cb7[15].y-cb7[16].x);
                        r0.xyz=r1.www*r0.xyz+r1.xyz;
                        r1.xyz=max(r0.xyz,c20.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c26.yyy;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c26.zzz+c26.www;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c25.www;
                        r2.xyz=r2.xyz*c26.xxx;
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