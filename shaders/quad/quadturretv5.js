import { vs, ps, constant, texture } from "./shared";
import { precision } from "../shared/func";
import { ObjectID, AreaID } from "../shared/constant";
import { EveSpaceSceneEnvMap, EveSpaceSceneShadowMap, DustNoiseMap } from "../shared/texture";
import { PosBwtTexTanTex, PosBwtTex } from "../shared/input";


const quadTurretV5_PosBwtTex = {

    inputDefinitions: PosBwtTex,
    shader: `

        ${vs.shadowHeader}
        
        attribute vec4 attr0;
        attribute vec4 attr1;
        attribute vec4 attr2;
        
        varying vec4 texcoord;
        varying vec4 texcoord1;
        
        uniform vec4 cb1[8];
        uniform vec4 cb3[198];
        uniform vec3 ssyf;
        
        void main()
        {
            vec4 v0;
            vec4 v1;
            vec4 v2;
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
        
            ivec4 a0;
            vec4 c0=vec4(2,1,0,0);
        
            v0=attr0;
            v1=attr1;
            v2=attr2;
        
            r0.x=v2.x;
            r0.x=cb3[1].x*r0.x+v1.x;
            r0.y=r0.x+r0.x;
            r0.x=r0.x*c0.x+c0.y;
            r0.z=fract(r0.y);
            r0.xy=r0.xy+(-r0.zz);
            a0.xy=ivec2(r0.xy+vec2(0.5));
            r0.x=fract(v2.x);
            r0.x=(-r0.x)+v2.x;
            a0.z=int(r0.x+0.5);
            r0=cb3[30+a0.z].zyxx+cb3[30+a0.z].zyxx;
            r1.xy=cb3[30+a0.z].xy;
            r1.xyz=r0.yzz*(-r1.yxx)+c0.yyy;
            r1.xyz=r0.xxy*(-cb3[30+a0.z].zzy)+r1.xyz;
            r2.w=r1.x;
            r0.x=r0.x*cb3[30+a0.z].w;
            r2.x=r0.w*cb3[30+a0.z].y+(-r0.x);
            r3.x=r0.w*cb3[30+a0.z].y+r0.x;
            r4=r0.wwyy*cb3[30+a0.z].zwzw;
            r3.zw=r0.yw*cb3[30+a0.z].zz+(-r4.yw);
            r2.yz=r4.yw+r4.zx;
            r0.xyz=r2.wxz;
            r0.w=cb3[6+a0.z].x;
            r0.x=dot(cb3[54+a0.y],r0);
            r4.w=r0.x;
            r5=cb3[54+a0.x].zyxx+cb3[54+a0.x].zyxx;
            r6.xy=cb3[54+a0.x].xy;
            r6.xyz=r5.yzz*(-r6.yxx)+c0.yyy;
            r6.xyz=r5.xxy*(-cb3[54+a0.x].zzy)+r6.xyz;
            r7.w=r6.x;
            r1.x=r5.x*cb3[54+a0.x].w;
            r7.x=r5.w*cb3[54+a0.x].y+r1.x;
            r8.x=r5.w*cb3[54+a0.x].y+(-r1.x);
            r9=r5.wwyy*cb3[54+a0.x].zwzw;
            r7.yz=r5.wy*cb3[54+a0.x].zz+(-r9.wy);
            r8.zw=r9.yw+r9.zx;
            r5.x=dot(r7.xyw,r2.xzw);
            r4.x=r5.x;
            r8.y=r6.y;
            r9.x=dot(r8.yzx,r2.xzw);
            r4.y=r9.x;
            r6.x=r8.w;
            r6.y=r7.z;
            r10.x=dot(r6.yzx,r2.xzw);
            r4.z=r10.x;
            r11=v0.xyzx*c0.yyyz+c0.zzzy;
            texcoord.x=dot(r11,r4);
            r3.y=r1.y;
            r2.z=r1.z;
            r9.y=dot(r8.xyz,r3.xyz);
            r1.y=r9.y;
            r5.y=dot(r7.wxy,r3.xyz);
            r1.x=r5.y;
            r10.y=dot(r6.xyz,r3.xyz);
            r2.x=r3.w;
            r1.z=r10.y;
            r3.w=cb3[6+a0.z].y;
            r0.y=dot(cb3[54+a0.y],r3);
            r1.w=r0.y;
            texcoord.y=dot(r11,r1);
            r9.z=dot(r8.xyz,r2.xyz);
            r1.y=r9.z;
            r5.z=dot(r7.wxy,r2.xyz);
            r8.xz=r7.xz;
            r1.x=r5.z;
            r10.z=dot(r6.xyz,r2.xyz);
            r1.z=r10.z;
            r2.w=cb3[6+a0.z].z;
            r3.w=cb3[54+a0.y].w;
            r0.w=r3.w*cb3[6+a0.z].w;
            r0.z=dot(cb3[54+a0.y],r2);
            r8.w=cb3[54+a0.y].y;
            r2.x=dot(r11,r8);
            texcoord1.x=r2.x+(-cb3[0].x);
            r1.w=r0.z;
            texcoord.z=dot(r11,r1);
            r1.z=dot(r10.xyz,cb3[2].xyz);
            r1.x=dot(r5.xyz,cb3[2].xyz);
            r1.y=dot(r9.xyz,cb3[2].xyz);
            r1.w=dot(r0,cb3[2]);
            r1.x=dot(r11,r1);
            r2.z=dot(r10.xyz,cb3[3].xyz);
            r2.x=dot(r5.xyz,cb3[3].xyz);
            r2.y=dot(r9.xyz,cb3[3].xyz);
            r2.w=dot(r0,cb3[3]);
            r1.y=dot(r11,r2);
            r2.z=dot(r10.xyz,cb3[4].xyz);
            r3.z=dot(r10.xyz,cb3[5].xyz);
            r2.x=dot(r5.xyz,cb3[4].xyz);
            r3.x=dot(r5.xyz,cb3[5].xyz);
            r2.y=dot(r9.xyz,cb3[4].xyz);
            r3.y=dot(r9.xyz,cb3[5].xyz);
            r2.w=dot(r0,cb3[4]);
            r3.w=dot(r0,cb3[5]);
            texcoord.w=r0.w;
            r1.w=dot(r11,r3);
            r1.z=dot(r11,r2);
            gl_Position.x=dot(r1,cb1[4]);
            gl_Position.y=dot(r1,cb1[5]);
            gl_Position.z=dot(r1,cb1[6]);
            gl_Position.w=dot(r1,cb1[7]);
            texcoord1.y=c0.z;
        
            ${vs.shadowFooter}
        }
    `
};


export const quadTurretV5 = {
    name: "quadV5",
    replaces: "graphics/effect.gles2/managed/space/turret/v5/quadV5",
    description: "skinned turret quad shader",
    todo: "add dirt",
    techniques: {
        Picking: {
            vs: quadTurretV5_PosBwtTex,
            ps: {
                constants: [
                    ObjectID,
                    AreaID
                ],
                shader: `
                
                    ${ps.header}
                    
                    varying vec4 texcoord1;
                    uniform vec4 cb7[2];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        
                        vec4 c2=vec4(1,0.00390625,0.00392156886,1.00392163);
                        
                        v0=texcoord1;
                        r0=v0.xxxx;
                        
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.x=c2.x;
                        r0.y=r0.x+cb7[0].x;
                        r0.z=r0.y*c2.y;
                        r0.w=fract(r0.z);
                        r0.w=(-r0.w)+r0.z;
                        r0.z=fract(abs(r0.z));
                        r0.y=r0.y>=0.0?r0.z:(-r0.z);
                        gl_FragData[0].xy=r0.wy*c2.zw;
                        r0.x=r0.x+cb7[1].x;
                        r0.y=r0.x*c2.y;
                        r0.z=fract(r0.y);
                        r0.z=(-r0.z)+r0.y;
                        r0.y=fract(abs(r0.y));
                        r0.x=r0.x>=0.0?r0.y:(-r0.y);
                        gl_FragData[0].zw=r0.zx*c2.zw;
                        
                        ${ps.footer}
                    }
                
                `
            }
        },
        Depth: {
            vs: quadTurretV5_PosBwtTex,
            ps: {
                shader: `
                
                    ${precision}
                    ${ps.header}
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    uniform vec4 cb4[3];
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 r0;
                        vec4 c0=vec4(0,1,0,0);
                        v0=texcoord;
                        v1=texcoord1;
                        r0=v1.xxxx;
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        r0.xyz=(-cb4[1].xyz)+v0.xyz;
                        r0.x=dot(r0.xyz,r0.xyz);
                        r0.w=cb4[1].w;
                        r0=cb4[2].xxxx*r0.xxxx+(-r0.wwww);
                        if(any(lessThan(r0,vec4(0.0))))discard;
                        gl_FragData[0]=c0.xxxy;
                        
                        ${ps.footer}
                    }
                `
            }
        },
        Main: {
            vs: {
                inputDefinitions: PosBwtTexTanTex,
                shader: `

                    ${vs.shadowHeader}
                    
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    attribute vec4 attr4;
                    
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    varying vec4 texcoord2;
                    varying vec4 texcoord3;
                    varying vec4 texcoord4;
                    varying vec4 texcoord5;
                    varying vec4 texcoord6;
                    varying vec4 texcoord7;
                    varying vec4 texcoord8;
                    
                    uniform vec4 cb1[24];
                    uniform vec4 cb3[198];
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
                        vec4 r10;
                        vec4 r2;
                        vec4 r3;
                        vec4 r4;
                        vec4 r5;
                        vec4 r6;
                        vec4 r7;
                        vec4 r8;
                        vec4 r9;
                        
                        ivec4 a0;
                        
                        vec4 c0=vec4(2,1,6.28318548,-3.14159274);
                        vec4 c1=vec4(0.159154937,0.5,0,1);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        v3=attr3;
                        v4=attr4;
                        
                        r0.x=v4.x;
                        r0.x=cb3[1].x*r0.x+v1.x;
                        r0.y=r0.x+r0.x;
                        r0.x=r0.x*c0.x+c0.y;
                        r0.z=fract(r0.y);
                        r0.xy=r0.xy+(-r0.zz);
                        a0.xy=ivec2(r0.xy+vec2(0.5));
                        r0.x=fract(v4.x);
                        r0.x=(-r0.x)+v4.x;
                        a0.z=int(r0.x+0.5);
                        r0=cb3[30+a0.z].zyxx+cb3[30+a0.z].zyxx;
                        r1.y=c0.y;
                        r1.xzw=r0.yzz*(-cb3[30+a0.z].yxx)+r1.yyy;
                        r2.xyz=r0.xxy*(-cb3[30+a0.z].zzy)+r1.xzw;
                        r3.w=r2.y;
                        r0.x=r0.x*cb3[30+a0.z].w;
                        r3.x=r0.w*cb3[30+a0.z].y+r0.x;
                        r4.x=r0.w*cb3[30+a0.z].y+(-r0.x);
                        r5=r0.wwyy*cb3[30+a0.z].zwzw;
                        r3.yz=r0.wy*cb3[30+a0.z].zz+(-r5.wy);
                        r4.yz=r5.yw+r5.zx;
                        r0.xyz=r3.xwz;
                        r0.w=cb3[6+a0.z].y;
                        r0.y=dot(cb3[54+a0.y],r0);
                        r5.w=cb3[6+a0.z].x;
                        r4.w=r2.x;
                        r5.xyz=r4.wxz;
                        r0.x=dot(cb3[54+a0.y],r5);
                        r2.w=cb3[6+a0.z].z;
                        r1.w=cb3[54+a0.y].w;
                        r0.z=r1.w*cb3[6+a0.z].w;
                        r2.x=r3.y;
                        r2.y=r4.y;
                        r0.w=dot(cb3[54+a0.y],r2);
                        r5.w=cb3[54+a0.y].y;
                        r6.w=dot(r0.xywz,cb3[5]);
                        r7=cb3[54+a0.x].zyxx+cb3[54+a0.x].zyxx;
                        r1.xyz=r7.yzz*(-cb3[54+a0.x].yxx)+r1.yyy;
                        r1.xyz=r7.xxy*(-cb3[54+a0.x].zzy)+r1.xyz;
                        r8.w=r1.x;
                        r1.x=r7.x*cb3[54+a0.x].w;
                        r8.x=r7.w*cb3[54+a0.x].y+r1.x;
                        r9.x=r7.w*cb3[54+a0.x].y+(-r1.x);
                        r10=r7.wwyy*cb3[54+a0.x].zwzw;
                        r8.yz=r7.wy*cb3[54+a0.x].zz+(-r10.wy);
                        r9.yz=r10.yw+r10.zx;
                        r7.x=dot(r8.xyw,r4.xzw);
                        r7.y=dot(r8.wyx,r3.xzw);
                        r7.z=dot(r8.wxy,r2.xyz);
                        r5.xz=r8.xz;
                        r8.y=r5.z;
                        r6.x=dot(r7.xyz,cb3[5].xyz);
                        r9.w=r1.y;
                        r8.z=r1.z;
                        r1.x=dot(r9.wyx,r4.xzw);
                        r1.y=dot(r9.xyw,r3.xzw);
                        r1.z=dot(r9.xwy,r2.xyz);
                        r8.x=r9.z;
                        r5.y=r9.w;
                        r6.y=dot(r1.xyz,cb3[5].xyz);
                        r4.x=dot(r8.yzx,r4.xzw);
                        r4.z=dot(r8.xzy,r3.xzw);
                        r4.y=dot(r8.xyz,r2.xyz);
                        r6.z=dot(r4.xzy,cb3[5].xyz);
                        r2=v0.xyzx*c1.wwwz+c1.zzzw;
                        r3.w=dot(r2,r6);
                        r6.w=dot(r0.xywz,cb3[2]);
                        r6.z=dot(r4.xzy,cb3[2].xyz);
                        r6.x=dot(r7.xyz,cb3[2].xyz);
                        r6.y=dot(r1.xyz,cb3[2].xyz);
                        r3.x=dot(r2,r6);
                        r8.w=dot(r0.xywz,cb3[3]);
                        r9.w=dot(r0.xywz,cb3[4]);
                        r10.w=r0.x;
                        r4.w=r0.y;
                        r8.z=dot(r4.xzy,cb3[3].xyz);
                        r8.x=dot(r7.xyz,cb3[3].xyz);
                        r8.y=dot(r1.xyz,cb3[3].xyz);
                        r3.y=dot(r2,r8);
                        r9.z=dot(r4.xzy,cb3[4].xyz);
                        r0.z=r4.y;
                        r10.z=r4.x;
                        r9.x=dot(r7.xyz,cb3[4].xyz);
                        r0.x=r7.z;
                        r10.x=r7.x;
                        r4.x=r7.y;
                        r9.y=dot(r1.xyz,cb3[4].xyz);
                        r0.y=r1.z;
                        texcoord5.z=dot(r2,r0);
                        r10.y=r1.x;
                        texcoord5.x=dot(r2,r10);
                        r4.y=r1.y;
                        texcoord5.y=dot(r2,r4);
                        r3.z=dot(r2,r9);
                        r0.x=dot(r2,r5);
                        texcoord.w=r0.x+(-cb3[0].x);
                        gl_Position.x=dot(r3,cb1[4]);
                        gl_Position.y=dot(r3,cb1[5]);
                        gl_Position.z=dot(r3,cb1[6]);
                        gl_Position.w=dot(r3,cb1[7]);
                        r0=v3*c0.zzzz+c0.wwww;
                        {
                            bvec4 tmp=lessThan(c1.zzzz,r0.ywzw);
                            r1.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;
                        }
                        r0=r0*c1.xxxx+c1.yyyy;
                        r0=fract(r0);
                        r0=r0*c0.zzzz+c0.wwww;
                        r1.x=r1.y*r1.x;
                        r2.xy=vec2(cos(r0.x), sin(r0.x));
                        r4.xy=vec2(cos(r0.y), sin(r0.y));
                        r2.xy=r2.xy*abs(r4.yy);
                        r2.z=r4.x;
                        r4.xy=vec2(cos(r0.z), sin(r0.z));
                        r5.xy=vec2(cos(r0.w), sin(r0.w));
                        r0.xy=r4.xy*abs(r5.yy);
                        r0.z=r5.x;
                        r1.yzw=r0.yzx*r2.zxy;
                        r1.yzw=r2.yzx*r0.zxy+(-r1.yzw);
                        r4.xyz=mix((-r1.yzw),r1.yzw,r1.xxx);
                        texcoord1.x=dot(r4.xyz,r6.xyz);
                        texcoord1.y=dot(r4.xyz,r8.xyz);
                        texcoord1.z=dot(r4.xyz,r9.xyz);
                        texcoord2.x=dot(r2.xyz,r6.xyz);
                        texcoord3.x=dot(r0.xyz,r6.xyz);
                        texcoord2.y=dot(r2.xyz,r8.xyz);
                        texcoord3.y=dot(r0.xyz,r8.xyz);
                        texcoord3.z=dot(r0.xyz,r9.xyz);
                        texcoord2.z=dot(r2.xyz,r9.xyz);
                        r0.xyz=(-r3.xyz)+cb1[3].xyz;
                        r0.w=dot(r0.xyz,r0.xyz);
                        r0.w=r0.w==0.0?3.402823466e+38:inversesqrt(abs(r0.w));
                        texcoord4.xyz=r0.www*r0.xyz;
                        r0.x=1.0/r0.w;
                        texcoord7.x=dot(r3,cb1[16]);
                        texcoord7.y=dot(r3,cb1[17]);
                        texcoord7.z=dot(r3,cb1[18]);
                        texcoord7.w=dot(r3,cb1[19]);
                        texcoord8.x=dot(r3,cb1[20]);
                        texcoord8.y=dot(r3,cb1[21]);
                        texcoord8.z=dot(r3,cb1[22]);
                        texcoord8.w=dot(r3,cb1[23]);
                        texcoord.xyz=v2.xyy;
                        texcoord4.w=r0.x;
                        texcoord5.w=r0.x;
                        texcoord6=c1.zzzz;
                        
                        ${vs.shadowFooter}
                    }
                `
            },
            ps: {
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
                    DustNoiseMap,
                ],
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
                    constant.Mtl1DustDiffuseColor,
                    constant.Mtl2DustDiffuseColor,
                    constant.Mtl3DustDiffuseColor,
                    constant.Mtl4DustDiffuseColor,
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
                    uniform sampler2D s10;  // DustNoiseMap
                    
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
                        vec4 c14=vec4(9.99999997e-007,0.0383840017,0.0393519998,0.0391650014);
                        vec4 c15=vec4(1,2,-1,0);
                        vec4 c16=vec4(-0,-0.333333343,-0.666666687,-1);
                        vec4 c17=vec4(3.19148946,1.03191495,0.5,-0.5);
                        vec4 c18=vec4(0.400000006,3.14159274,-1e-015,9.99999987e+014);
                        vec4 c19=vec4(1,1.54499996,1.10000002,6);
                        vec4 c20=vec4(1.04166663,0.474999994,0.018229166,0.25);
                        vec4 c21=vec4(0,-0.015625,0.75,-9.27999973);
                        vec4 c22=vec4(7,0.119999997,0.318309873,-1.44269507e-005);
                        vec4 c23=vec4(-0.00313080009,12.9200001,0.416666657,0);
                        vec4 c24=vec4(1.05499995,-0.0549999997,0,0);
                        v0=texcoord;
                        v1=texcoord1;
                        v2=texcoord2;
                        v3=texcoord3;
                        v4=texcoord4;
                        v5=texcoord5;
                        v6=texcoord7;
                        v7=texcoord8;
                        r0=v0.wwww;
                        
                        if(any(lessThan(r0,vec4(0.0))))discard;
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
                        
                        gl_FragData[0].w=(-r0.x)+c15.x;
                        r0.z=(-cb2[19].x)+cb2[19].y;
                        r0.z=1.0/r0.z;
                        r1.x=(-cb2[19].x)+v6.z;
                        r0.z=r0.z*r1.x;
                        r0.z=sqrt(abs(r0.z));
                        r1.x=1.0/v7.w;
                        r1.xy=r1.xx*v7.xy;
                        r1.xy=r1.xy*c17.zw+c17.zz;
                        r1.z=c17.z;
                        r1.xy=cb2[18].xy*r1.zz+r1.xy;
                        r1=texture2D(s1,r1.xy);
                        r1.z=r0.z+(-r1.x);
                        r1.y=r1.x*(-r1.x)+r1.y;
                        r1.x=r1.x+cb2[18].z;
                        r0.z=(-r0.z)+r1.x;
                        r0.z=r0.z>=0.0?c15.x:c15.w;
                        r2.x=max(r1.y,c14.x);
                        r1.x=r1.z*r1.z+r2.x;
                        r1.x=1.0/r1.x;
                        r1.x=r1.x*r2.x;
                        r2.x=saturate(max(r0.z,r1.x));
                        r0.z=r2.x+(-cb2[18].w);
                        r1.x=c15.x;
                        r1.y=r1.x+(-cb2[18].w);
                        r1.y=1.0/r1.y;
                        r0.z=saturate(r0.z*r1.y);
                        r0.z=(-cb2[19].x)>=0.0?r0.z:r1.x;
                        r1.x=max(cb2[19].z,r0.z);
                        r0.z=r1.x*r1.x;
                        r1.xyz=r0.zzz*cb2[13].xyz;
                        r1.xyz=r1.xyz*(-c16.zzz);
                        r0.z=dot(v4.xyz,v4.xyz);
                        r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
                        r2.xyz=v4.xyz*r0.zzz+cb2[12].xyz;
                        r3.xyz=r0.zzz*v4.xyz;
                        r4.xyz=normalize(r2.xyz);
                        r0.z=clamp(dot(r4.xyz,r3.xyz),0.0, 1.0);
                        r0.z=r0.z*r0.z;
                        r0.x=r0.x*cb7[0].x;
                        r2=r0.yyyy+c16;
                        r0.y=r0.w*r0.w;
                        r2=r2*c17.xxxx;
                        r2=saturate((-abs(r2))+c17.yyyy);
                        r0.w=r2.y*cb7[11].x;
                        r0.w=r2.x*cb7[10].x+r0.w;
                        r0.w=r2.z*cb7[12].x+r0.w;
                        r0.w=r2.w*cb7[13].x+r0.w;
                        
                        // AlbedoMap 
                        r5.xyz=texture2D(s2,v0.xy).xyz;    
                        
                        // RoughnessMap    
                        r5.w=texture2D(s3,v0.xy).x;   

                        r1.w=r0.w*r5.w;
                        r0.w=r5.w*(-r0.w)+c18.x;
                        r0.w=r0.x*r0.w+r1.w;
                        r0.w=saturate((-r0.w)+c15.x);
                        r6.xy=(-r0.ww)+c19.xy;
                        r1.w=min(r6.y,c15.x);
                        r7.xyz=c21.xyz;
                        r6=r6.xxxx*c20+r7.xxyz;
                        r0.z=r0.z*r1.w+c19.z;
                        r0.z=(-r1.w)+r0.z;
                        r0.z=1.0/r0.z;
                        r7.xyz=r2.yyy*cb7[7].xyz;
                        r7.xyz=r2.xxx*cb7[6].xyz+r7.xyz;
                        r7.xyz=r2.zzz*cb7[8].xyz+r7.xyz;
                        r7.xyz=r2.www*cb7[9].xyz+r7.xyz;
                        r8.xyz=r5.www*r7.xyz;
                        r7.xyz=r5.www*(-r7.xyz)+c14.yzw;
                        r7.xyz=r0.xxx*r7.xyz+r8.xyz;
                        r1.w=clamp(dot(cb2[12].xyz,r4.xyz),0.0, 1.0);
                        r1.w=(-r1.w)+c15.x;
                        r3.w=r1.w*r1.w;
                        r3.w=r3.w*r3.w;
                        r1.w=r1.w*r3.w;
                        r8.xyz=mix(r7.xyz,c15.xxx,r1.www);
                        r9.xyz=r0.zzz*r8.xyz;
                        r8.xyz=(-r8.xyz)+c15.xxx;
                        r10.xyz=r2.yyy*cb7[3].xyz;
                        r10.xyz=r2.xxx*cb7[2].xyz+r10.xyz;
                        r2.xyz=r2.zzz*cb7[4].xyz+r10.xyz;
                        r2.xyz=r2.www*cb7[5].xyz+r2.xyz;
                        r10.xyz=mix(r2.xyz,c15.xxx,r0.xxx);
                        r2.xyz=r5.xyz*r10.xyz;
                        r5.xyz=r8.xyz*r2.xyz;
                        r0.x=r0.w*r0.w;
                        r8.w=r0.w*c19.w;
                        r0.z=r0.x*r0.x;
                        r0.x=r0.x*r0.x+c15.z;
                        
                        // NormalMap 
                        r10.ywx=texture2D(s4,v0.xy).xyz; 
                        
                        // AoMap
                        r10.z=texture2D(s5,v0.xy).x;  
                        
                        r10.xy=r10.yw*c15.yy+c15.zz;
                        r0.w=saturate(dot(r10.xy,r10.xy)+c15.w);
                        r0.w=(-r0.w)+c15.x;
                        r0.w=sqrt(abs(r0.w));
                        r11.xyz=r10.yyy*v3.xyz;
                        r10.xyw=r10.xxx*v2.xyz+r11.xyz;
                        r10.xyw=r0.www*v1.xyz+r10.xyw;
                        r11.xyz=normalize(r10.xyw);
                        r0.w=clamp(dot(r11.xyz,r4.xyz),0.0, 1.0);
                        r0.w=r0.w*r0.w;
                        r0.x=r0.w*r0.x+c15.x;
                        r0.x=r0.x*r0.x;
                        r0.w=r0.x*c18.y;
                        r0.x=r0.x*c18.y+c18.z;
                        r0.w=1.0/r0.w;
                        r0.x=r0.x>=0.0?r0.w:c18.w;
                        r0.x=r0.x*r0.z;
                        r0.xzw=r9.xyz*r0.xxx+r5.xyz;
                        r1.w=clamp(dot(cb2[12].xyz,r11.xyz),0.0, 1.0);
                        r0.xzw=r0.xzw*r1.www;
                        r0.xzw=r1.xyz*r0.xzw;
                        r1.xyz=max(r0.xzw,c15.www);
                        r0.x=dot(r3.xyz,r11.xyz);
                        r0.z=saturate(r0.x);
                        r0.x=r0.x+r0.x;
                        r3.xyz=r11.xyz*(-r0.xxx)+r3.xyz;
                        r0.x=r0.z*c21.w;
                        r0.x=exp2(r0.x);
                        r1.w=min(r0.x,r6.y);
                        r0.x=r6.x*r1.w+r6.z;
                        r4.xyz=saturate(mix(r0.xxx,r6.www,r7.xyz));
                        r0.xzw=(-r4.xyz)+c15.xxx;
                        r0.xzw=r0.xzw*r2.xyz;
                        r11.w=c22.x;
                        r2=textureCubeLod(s0,r11.xyz,r11.w);
                        r1.w=cb2[14].w;
                        r1.w=r1.w*c22.y;
                        r2.xyz=r2.xyz*cb2[14].www+r1.www;
                        r0.xzw=r0.xzw*r2.xyz;
                        r0.xzw=r0.xzw*c22.zzz;
                        r8.x=dot((-r3.xyz),cb2[8].xyz);
                        r8.y=dot((-r3.xyz),cb2[9].xyz);
                        r8.z=dot((-r3.xyz),cb2[10].xyz);
                        r2=textureCubeLod(s0,r8.xyz,r8.w);
                        r2.xyz=r2.xyz*cb2[14].www;
                        r0.xzw=r2.xyz*r4.xyz+r0.xzw;
                        r2.xyz=max(r0.xzw,c15.www);
                        r0.xzw=r1.xyz+r2.xyz;
                        r0.xzw=r0.xzw*r10.zzz+(-cb2[15].xyz);
                        r1.x=cb2[15].w*v4.w;
                        r1.x=r1.x*c22.w;
                        r1.x=exp2(r1.x);
                        r0.xzw=r1.xxx*r0.xzw+cb2[15].xyz;
                        r2.xyz=cb2[15].xyz;
                        r1.yzw=(-r2.xyz)+cb7[1].xyz;
                        r1.xyz=r1.xxx*r1.yzw+cb2[15].xyz;
                        r1.xyz=r1.xyz*cb4[0].yyy;
                        r0.xyz=r1.xyz*r0.yyy+r0.xzw;
                        r1.xyz=max(r0.xyz,c15.www);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c23.zzz;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c24.xxx+c24.yyy;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c23.xxx;
                        r2.xyz=r2.xyz*c23.yyy;
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