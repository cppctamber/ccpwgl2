import { WidgetType, WrapMode, createTex, createLinearColor } from "../shared/util";
import { TEX_2D, RS_ZENABLE, RS_CULLMODE, CULL_CW } from "constant/d3d";


/**
 * Hand crafted booster volumetric shader, sm_depth tier. NOT REGISTERED.
 *
 * The two programs are CCP's own GLES2 `boostervolumetric.sm_depth`, taken
 * verbatim from the legacy-gles resource overlay, so the maths is the shipped
 * maths rather than a re-derivation. What this file adds is the declaration
 * around them, which is where the shipped container does not survive the trip
 * to WebGL.
 *
 * `sm_depth` is the high quality tier and the one worth hand crafting: it
 * carries a second shape layer and a second warp layer that `sm_hi` has no
 * constants for, and it fades the flame against scene depth. The vertex program
 * is byte identical across the tiers; only the pixel side grows. `replaces`
 * keys on the path without the quality suffix, so this one definition serves
 * every tier.
 *
 * It is deliberately left out of ./index.js, so nothing registers it and the
 * sm_hi definition in boostervolumetric.js stays in force. To enable it, export
 * this file from the barrel INSTEAD of that one - both declare the same shader
 * name and replace the same path, so registering both would have them fight
 * over the override.
 *
 * It is parked rather than deleted because it fades the flame against scene
 * depth, and with the DepthMap prepass broken that reproduced the dx11 failure:
 * boosters render blank. Re-enable once scene depth is trustworthy.
 *
 * The container types NoiseMap as a VOLUME, so a `TEXTURE_3D` gets bound. But
 * these programs are ESSL1, and ESSL1 has no `sampler3D` - every WebGL build
 * takes the shader's own fallback branch, which does
 * `#define sampler3D sampler2D` and reads the volume as a flat sheet of slices
 * addressed with the `s4sl` slice count. The shipped declaration therefore asks
 * for a 3D texture the compiled program cannot sample. NoiseMap is declared 2D
 * here with `isVolume` kept true: 2D so the sheet binds, `isVolume` so the slice
 * count still reaches the shader.
 */

const vs = `
attribute vec4 attr0;
attribute vec4 attr1;
attribute vec4 attr2;
attribute vec4 attr3;
attribute vec4 attr4;
attribute vec4 attr5;
attribute vec4 attr6;
varying vec4 texcoord;
varying vec4 texcoord1;
varying vec4 texcoord2;
varying vec4 texcoord3;
varying vec4 texcoord4;
varying vec4 texcoord5;
varying vec4 texcoord6;
varying vec4 texcoord7;
float saturate(float x){return clamp(x,0.0,1.0);}
vec2 saturate(vec2 x){return clamp(x,vec2(0.0),vec2(1.0));}
vec3 saturate(vec3 x){return clamp(x,vec3(0.0),vec3(1.0));}
vec4 saturate(vec4 x){return clamp(x,vec4(0.0),vec4(1.0));}
uniform vec4 cb0[1];
uniform vec4 cb1[16];
uniform vec4 cb3[5];
uniform vec3 ssyf;

#ifdef PS
uniform vec4 ssf[4];
varying float ssv;
#endif
void main()
{
vec4 v0;
vec4 v1;
vec4 v2;
vec4 v3;
vec4 v4;
vec4 v5;
vec4 v6;
vec4 r0;
vec4 r1;
vec4 r10;
vec4 r11;
vec4 r12;
vec4 r13;
vec4 r14;
vec4 r2;
vec4 r3;
vec4 r4;
vec4 r5;
vec4 r6;
vec4 r7;
vec4 r8;
vec4 r9;
vec4 c1=vec4(0.5,1,0,9.99999975e-005);
v0=attr0;
v1=attr1;
v2=attr2;
v3=attr3;
v4=attr4;
v5=attr5;
v6=attr6;
r0.w=dot(v4,cb3[0]);
r1.x=r0.w;
r2.w=dot(v4,cb3[1]);
r1.y=r2.w;
r3.x=dot(v4,cb3[3]);
r1.w=r3.x;
r4.w=dot(v4,cb3[2]);
r1.z=r4.w;
texcoord6.w=dot(r1,cb1[11]);
r5.x=saturate(cb3[4].x);
r5.y=r5.x*c1.x+c1.x;
r6=cb0[0].xxxx*v1;
r3.w=dot(r6,cb3[3]);
r7.w=r3.w;
r0.x=dot(r6,cb3[0]);
r7.x=r0.x;
r2.x=dot(r6,cb3[1]);
r7.y=r2.x;
r4.x=dot(r6,cb3[2]);
r7.z=r4.x;
texcoord3.w=dot(r7,cb1[11]);
r8=cb0[0].yyyy*v2;
r3.y=dot(r8,cb3[3]);
r9=cb0[0].zzzz*v3;
r9=r5.yyyy*r9;
r3.z=dot(r9,cb3[3]);
r10.w=r3.y;
r0.y=dot(r8,cb3[0]);
r10.x=r0.y;
r2.y=dot(r8,cb3[1]);
r10.y=r2.y;
r4.y=dot(r8,cb3[2]);
r10.z=r4.y;
texcoord4.w=dot(r10,cb1[11]);
r11.w=r3.z;
r0.z=dot(r9,cb3[0]);
r11.x=r0.z;
r2.z=dot(r9,cb3[1]);
r11.y=r2.z;
r4.z=dot(r9,cb3[2]);
r11.z=r4.z;
texcoord5.w=dot(r11,cb1[11]);
r5.yzw=r3.zwy*r4.yzx;
r5.yzw=r4.zxy*r3.yzw+(-r5.yzw);
r12.w=dot(r5.yzw,r2.xyz);
r5.yzw=r3.zxy*r4.wyz;
r5.yzw=r4.zwy*r3.xyz+(-r5.yzw);
r12.x=dot(r5.yzw,r2.yzw);
r5.yzw=r3.xwz*r4.zwx;
r5.yzw=r4.wxz*r3.zxw+(-r5.yzw);
r12.y=dot(r5.yzw,r2.xzw);
r5.yzw=r3.yxw*r4.wxy;
r5.yzw=r4.ywx*r3.xwy+(-r5.yzw);
r12.z=dot(r5.yzw,r2.xyw);
r5.y=dot(r12,r0);
r5.x=c1.w>=r5.x?1.0:0.0;;
r8=r8*v0.yyyy;
r6=v0.xxxx*r6+r8;
r6=v0.zzzz*r9+r6;
r6=r6+v4;
r8.w=dot(r6,cb3[3]);
r8.x=dot(r6,cb3[0]);
r8.y=dot(r6,cb3[1]);
r8.z=dot(r6,cb3[2]);
r6.w=dot(r8,cb1[11]);
r6.x=dot(r8,cb1[8]);
r6.y=dot(r8,cb1[9]);
r6.z=dot(r8,cb1[10]);
r8.w=dot(r6,cb1[15]);
r8.x=dot(r6,cb1[12]);
r8.y=dot(r6,cb1[13]);
r8.z=dot(r6,cb1[14]);
if(((-abs(r5.y))>=abs(r5.y))){
r6=r0;
r9=r2;
r12=r4;
}else{
r5.y=1.0/r5.y;
r5.zw=r2.ww*r4.zy;
r5.zw=r2.zy*r4.ww+(-r5.zw);
r13.xy=r0.ww*r4.zy;
r13.xy=r0.zy*r4.ww+(-r13.xy);
r14.xyz=r2.yxx*r13.xxy;
r14.xyz=r0.yxx*r5.zzw+(-r14.xyz);
r13.zw=r0.ww*r2.zy;
r13.zw=r0.zy*r2.ww+(-r13.zw);
r14.xyz=r4.yxx*r13.zzw+r14.xyz;
r12.w=r5.y*(-r14.z);
r6.w=r5.y*(-r14.x);
r9.w=r5.y*r14.y;
r14.xy=r2.ww*r3.zy;
r2.zw=r2.zy*r3.xx+(-r14.xy);
r14.xy=r0.ww*r3.zy;
r0.zw=r0.zy*r3.xx+(-r14.xy);
r14.xyz=r0.zzw*r2.yxx;
r14.xyz=r0.yxx*r2.zzw+(-r14.xyz);
r14.xyz=r3.yww*r13.zzw+r14.xyz;
r6.z=r5.y*r14.x;
r9.z=(-r5.y)*r14.y;
r12.z=r5.y*r14.z;
r13.zw=r3.zy*r4.ww;
r3.xz=r4.zy*r3.xx+(-r13.zw);
r14.xyz=r0.zzw*r4.yxx;
r0.xyz=r0.yxx*r3.xxz+(-r14.xyz);
r0.xyz=r3.yww*r13.xxy+r0.xyz;
r6.y=(-r0.x)*r5.y;
r9.y=r0.y*r5.y;
r12.y=(-r0.z)*r5.y;
r0.xyz=r2.zzw*r4.yxx;
r0.xyz=r2.yxx*r3.xxz+(-r0.xyz);
r0.xyz=r3.yww*r5.zzw+r0.xyz;
r6.x=r0.x*r5.y;
r9.x=r0.y*(-r5.y);
r12.x=r0.z*r5.y;
}
r0.yz=c1.yz;
r0=cb1[3].xyzx*r0.yyyz+r0.zzzy;
texcoord2.z=dot(r0,r12);
gl_Position=r5.xxxx*(-r8)+r8;
texcoord2.x=dot(r0,r6);
texcoord2.y=dot(r0,r9);
texcoord3.x=dot(r7,cb1[8]);
texcoord3.y=dot(r7,cb1[9]);
texcoord3.z=dot(r7,cb1[10]);
texcoord4.x=dot(r10,cb1[8]);
texcoord4.y=dot(r10,cb1[9]);
texcoord4.z=dot(r10,cb1[10]);
texcoord5.x=dot(r11,cb1[8]);
texcoord5.y=dot(r11,cb1[9]);
texcoord5.z=dot(r11,cb1[10]);
texcoord6.x=dot(r1,cb1[8]);
texcoord6.y=dot(r1,cb1[9]);
texcoord6.z=dot(r1,cb1[10]);
texcoord.x=v5.x;
texcoord1.xyz=v0.xyz;
texcoord7.xy=v6.xy;

#ifdef PS
ssv=dot(ssf[0],gl_Position);
#endif
gl_Position.xy += ssyf.xy*gl_Position.w;
gl_Position.y*=ssyf.z;
gl_Position.z=gl_Position.z*2.0-gl_Position.w;
}
`;

const ps = `
#if defined(GL_EXT_shader_texture_lod)
#extension GL_EXT_shader_texture_lod: enable
#define texture2DLod texture2DLodEXT
#define texture2DProjLod texture2DProjLodEXT
#define textureCubeLod textureCubeLodEXT
#define texture2DGrad texture2DGradEXT
#define texture2DProjGrad texture2DProjGradEXT
#define textureCubeGrad textureCubeGradEXT
#elif defined(EXT_shader_texture_lod)
#extension EXT_shader_texture_lod: enable
#define texture2DLod texture2DLodEXT
#define texture2DProjLod texture2DProjLodEXT
#define textureCubeLod textureCubeLodEXT
#define texture2DGrad texture2DGradEXT
#define texture2DProjGrad texture2DProjGradEXT
#define textureCubeGrad textureCubeGradEXT
#elif defined(GL_ARB_shader_texture_lod)
#extension GL_ARB_shader_texture_lod: enable
#define texture2DGrad texture2DGradARB
#endif
#ifdef GL_OES_texture_3D
#extension GL_OES_texture_3D: enable
#endif
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif
#if defined(GL_ES)&&!defined(GL_EXT_shader_texture_lod)&&!defined(EXT_shader_texture_lod)
#define texture2DLod(s,u,l) texture2D(s,u)
#define textureCubeLod(s,u,l) textureCube(s,u)
#define texture2DGrad(s,u,x,y) texture2D(s,u)
#define textureCubeGrad(s,u,x,y) textureCube(s,u)
#endif
#if !defined(GL_ES)||defined(GL_OES_texture_3D)
#define tex3D(s,uvw,sl,su,sw,lw,l) texture3D(s,uvw,l)
#ifdef GL_EXT_shader_texture_lod
#define tex3DLod(s,uvw,l,sl,su,sw,lw) texture3DLod(s,uvw,l)
#else
#define tex3DLod(s,uvw,l,sl,su,sw,lw) texture3D(s,uvw)
#endif
#else
#define sampler3D sampler2D
vec4 tex3D(sampler2D s,vec3 uvw,float sl,bool su,bool sw,bool lw,float l)
{
float y;
if(su) y=fract(uvw.y);
else y=clamp(uvw.y,0.0,1.0);
y/=sl;
float z,s0,s1;
z=uvw.z*sl;
s0=floor(z);
s1=s0+1.0;
if(!sw){
s0=clamp(s0,0.0,sl-1.0);
s1=clamp(s0,0.0,sl-1.0);
}
s0/=sl;
s1/=sl;
z=fract(z);
vec4 c0=texture2D(s,vec2(uvw.x,y+s0));
vec4 c1=texture2D(s,vec2(uvw.x,y+s1));
if(lw) return mix(c0,c1,z);
return z<0.5?c0:c1;
}
#ifndef tex3DLod
vec4 tex3DLod(sampler2D s,vec3 uvw,float l,float sl,bool su,bool sw,bool lw)
{
float y;
if(su) y=fract(uvw.y);
else y=clamp(uvw.y,0.0,1.0);
y/=sl;
float z,s0,s1;
z=uvw.z*sl;
s0=floor(z);
s1=s0+1.0;
if(!sw){
s0=clamp(s0,0.0,sl-1.0);
s1=clamp(s0,0.0,sl-1.0);
}
s0/=sl;
s1/=sl;
z=fract(z);
vec4 c0=texture2DLod(s,vec2(uvw.x,y+s0),l);
vec4 c1=texture2DLod(s,vec2(uvw.x,y+s1),l);
if(lw) return mix(c0,c1,z);
return z<0.5?c0:c1;
}
#endif
#endif
varying vec4 texcoord;
varying vec4 texcoord1;
varying vec4 texcoord2;
varying vec4 texcoord3;
varying vec4 texcoord4;
varying vec4 texcoord5;
varying vec4 texcoord6;
varying vec4 texcoord7;
uniform sampler2D s0;
uniform sampler2D s1;
uniform sampler2D s2;
uniform sampler2D s3;
uniform sampler3D s4;
#ifndef GL_OES_texture_3D
uniform float s4sl;
#else
#define s4sl 0.0
#endif
float saturate(float x){return clamp(x,0.0,1.0);}
vec2 saturate(vec2 x){return clamp(x,vec2(0.0),vec2(1.0));}
vec3 saturate(vec3 x){return clamp(x,vec3(0.0),vec3(1.0));}
vec4 saturate(vec4 x){return clamp(x,vec4(0.0),vec4(1.0));}
uniform vec4 cb2[22];
uniform vec4 cb4[1];
uniform vec4 cb7[20];
uniform ivec4 i0;

#ifdef PS
uniform vec4 ssi;
varying float ssv;
#endif
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
vec4 r12;
vec4 r13;
vec4 r14;
vec4 r15;
vec4 r16;
vec4 r17;
vec4 r18;
vec4 r19;
vec4 r2;
vec4 r20;
vec4 r3;
vec4 r4;
vec4 r5;
vec4 r6;
vec4 r7;
vec4 r8;
vec4 r9;
vec4 c20=vec4(0.5,0.375,0.0625,0.5625);
vec4 c21=vec4(0,0.100000001,0.0666666701,0.0416666679);
vec4 c22=vec4(-0.00313080009,12.9200001,0.416666657,0);
vec4 c23=vec4(1.05499995,-0.0549999997,0,0);
vec4 c24=vec4(-1,1,0,-9.99999975e-006);
ivec4 i0=ivec4(16,0,0,0);
v0=texcoord;
v1=texcoord1;
v2=texcoord2;
v3=texcoord3;
v4=texcoord4;
v5=texcoord5;
v6=texcoord6;
v7=texcoord7;
vec4 vPos = gl_FragCoord;
r0.xyz=v1.xyz;
r1.xyz=r0.xyz+(-v2.xyz);
r0.w=1.0/r1.x;
r2=c24.xyxy+(-v2.xxyy);
r2.xy=r0.ww*r2.xy;
r0.w=r1.x>=0.0?r2.x:r2.y;
r1.x=1.0/r1.y;
r1.xw=r1.xx*r2.zw;
r1.x=r1.y>=0.0?r1.x:r1.w;
r2.x=max(r0.w,r1.x);
r0.w=1.0/r1.z;
r1.x=r0.w*(-v2.z);
r1.y=c24.x+(-v2.z);
r0.w=r0.w*r1.y;
r0.w=r1.z>=0.0?r0.w:r1.x;
r1.x=max(r2.x,r0.w);
r2.xyz=mix(v2.xyz,r0.xyz,r1.xxx);
r0.xy=c24.xy;
r0.y=r0.y+cb2[20].y;
r0.y=1.0/r0.y;
r1.y=r0.y*cb2[20].x;
r1.xw=c24.yy;
r3.w=dot(v6.zw,r1.xy)+c24.z;
r3.x=dot(v3.zw,r1.xy)+c24.z;
r3.y=dot(v4.zw,r1.xy)+c24.z;
r3.z=dot(v5.zw,r1.xy)+c24.z;
r2.w=c24.y;
r0.y=dot(r2,r3);
r0.z=1.0/r3.z;
r1.z=r0.z*(-r3.w);
r4.xyz=r2.xyz+(-v1.xyz);
r0.z=dot(r3.xyz,r4.xyz);
r0.z=1.0/r0.z;
r1.xy=c24.zz;
r4.xyz=r1.yyz+(-v1.xyz);
r0.w=dot(r3.xyz,r4.xyz);
r0.z=r0.z*r0.w;
r4.xyz=mix(v1.xyz,r2.xyz,r0.zzz);
{bvec3 tmp=greaterThanEqual((-r0.yyy),vec3(0.0));r2.xyz=vec3(tmp.x?r2.x:r4.x,tmp.y?r2.y:r4.y,tmp.z?r2.z:r4.z);};
r4=v1.xyzx*c24.yyyz+c24.zzzy;
r0.y=dot(r4,r3);
r1.xyz=r1.xyz+(-r2.xyz);
r0.z=dot(r3.xyz,r1.xyz);
r1.xyz=(-r2.xyz)+v1.xyz;
r0.w=dot(r3.xyz,r1.xyz);
r0.w=1.0/r0.w;
r0.z=r0.w*r0.z;
r1.xyz=mix(r2.xyz,v1.xyz,r0.zzz);
{bvec3 tmp=greaterThanEqual((-r0.yyy),vec3(0.0));r1.xyz=vec3(tmp.x?v1.x:r1.x,tmp.y?v1.y:r1.y,tmp.z?v1.z:r1.z);};
r3.x=1.0/cb2[17].x;
r3.y=1.0/cb2[17].y;
r3.xy=r3.xy*vPos.xy;
r3.zw=c24.zz;
r3=texture2DLod(s0,r3.xy,r3.w);
r0.y=r3.x+cb2[20].y;
r0.y=1.0/r0.y;
r0.y=r0.y*cb2[20].x;
r3.y=(-r0.y);
r3.x=c24.x;
r4.w=dot(v6.zw,r3.xy)+c24.z;
r4.x=dot(v3.zw,r3.xy)+c24.z;
r4.y=dot(v4.zw,r3.xy)+c24.z;
r4.z=dot(v5.zw,r3.xy)+c24.z;
r2.w=c24.y;
r0.y=dot(r2,r4);
r0.z=1.0/r4.z;
r3.z=r0.z*(-r4.w);
r5.xyz=(-r1.xyz)+r2.xyz;
r0.z=dot(r4.xyz,r5.xyz);
r0.z=1.0/r0.z;
r3.xy=c24.zz;
r5.xyz=(-r1.xyz)+r3.yyz;
r0.w=dot(r4.xyz,r5.xyz);
r0.z=r0.z*r0.w;
r5.xyz=mix(r1.xyz,r2.xyz,r0.zzz);
{bvec3 tmp=greaterThanEqual((-r0.yyy),vec3(0.0));r0.yzw=vec3(tmp.x?r2.x:r5.x,tmp.y?r2.y:r5.y,tmp.z?r2.z:r5.z);};
r2.xyz=(-r0.yzw)+r3.xyz;
r2.x=dot(r4.xyz,r2.xyz);
r1.w=dot(r1,r4);
r2.yzw=(-r0.yzw)+r1.xyz;
r2.y=dot(r4.xyz,r2.yzw);
r2.y=1.0/r2.y;
r2.x=r2.y*r2.x;
r3.xyz=mix(r0.yzw,r1.xyz,r2.xxx);
{bvec3 tmp=greaterThanEqual((-r1.www),vec3(0.0));r1.xyz=vec3(tmp.x?r1.x:r3.x,tmp.y?r1.y:r3.y,tmp.z?r1.z:r3.z);};
r2.xyz=r0.yzw+(-r1.xyz);
r1.w=dot(r2.xyz,r2.xyz);
r1.w=r1.w+c24.w;
{bvec4 tmp=greaterThanEqual(r1.wwww,vec4(0.0));r2=vec4(tmp.x?(-c24.z):(-c24.y),tmp.y?(-c24.z):(-c24.y),tmp.z?(-c24.z):(-c24.y),tmp.w?(-c24.z):(-c24.y));};
if(any(lessThan(r2,vec4(0.0))))discard;
r1.xyz=(-r0.yzw)+r1.xyz;
r2.x=cb7[4].x;
r1.w=(-r2.x)+cb7[13].x;
r1.w=cb4[0].z*r1.w+r2.x;
r1.w=r1.w*cb2[21].x+v0.x;
r2.x=cb7[8].x;
r2.y=(-r2.x)+cb7[17].x;
r2.x=cb4[0].z*r2.y+r2.x;
r2.x=r2.x*cb2[21].x+v0.x;
r3.xz=cb4[0].xz;
r2.y=saturate(r3.x*c20.x);
r2.yz=r2.yy*c20.yy+c20.zw;
r4.z=(-cb4[0].z)>=0.0?r2.y:r2.z;
r2.y=1.0/cb7[0].x;
r2.z=r2.y*c20.x;
r2.w=1.0/cb7[0].y;
r5.xy=v7.xy*r2.ww+r2.zz;
r0.x=cb7[0].x*r2.w+r0.x;
r6.x=r2.y*r0.x;
r4.w=c24.z;
r7.z=c24.z;
r8.z=c24.z;
r9.xyz=cb7[1].xyz;
r2.yzw=(-r9.xyz)+cb7[10].xyz;
r2.yzw=r3.zzz*r2.yzw+cb7[1].xyz;
r9.xyz=cb7[2].xyz;
r3.xyw=(-r9.xyz)+cb7[11].xyz;
r3.xyw=r3.zzz*r3.xyw+cb7[2].xyz;
r9.xyz=cb7[3].xyz;
r9.xyz=(-r9.xyz)+cb7[12].xyz;
r9.xyz=r3.zzz*r9.xyz+cb7[3].xyz;
r10.xyz=cb7[6].xyz;
r10.xyz=(-r10.xyz)+cb7[15].xyz;
r10.xyz=r3.zzz*r10.xyz+cb7[6].xyz;
r11.xyz=cb7[7].xyz;
r11.xyz=(-r11.xyz)+cb7[16].xyz;
r11.xyz=r3.zzz*r11.xyz+cb7[7].xyz;
r12=cb7[5];
r12=(-r12)+cb7[14];
r12=r3.zzzz*r12+cb7[5];
r13=cb7[9];
r13=(-r13)+cb7[18];
r13=r3.zzzz*r13+cb7[9];
r6.yz=c24.yy;
r5.zw=c24.zz;
r14=c24.zzzz;
r15.xyz=r0.yzw;
for(int i=0;i<12;++i){ // dynamic bound: ESSL1 forbids a non-constant loop comparison
r16.xyz=mix(r2.yzw,r3.xyw,(-r15.zzz));
r17.xyz=r15.xyz*cb7[19].xyz;
r17.xyz=r9.xyz*r17.xyz;
r0.x=r15.z*r15.z;
r18.z=r17.z*r0.x+r1.w;
r18.xyw=r17.xyx*c24.yyz;
r19=tex3DLod(s4,r18.xyz,r18.w,s4sl,true,true,true);
r17.xyw=r19.xyz+(-c20.xxx);
r16.xyz=r17.xyw*r16.xyz+r15.xyz;
r4.y=(-r16.z);
r19=texture2DLod(s2,r4.yz,r4.yzww.w);
{bvec3 tmp=greaterThanEqual((-r19.xyz),vec3(0.0));r17.xyw=vec3(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y,tmp.z?c24.z:c24.y);};
r3.z=dot(r17.xyw,r17.xyw);
r3.z=(-r3.z)>=0.0?c24.z:c24.y;
r3.z=(-r19.w)>=0.0?c24.z:r3.z;
if((r3.z!=(-r3.z))){
r3.z=1.0/r19.w;
r16.xy=r3.zz*r16.xy;
r16.xy=r16.xy*c20.xx+c20.xx;
r16.zw=(-r16.xy)+c24.yy;
{bvec2 tmp=greaterThanEqual(r16.zw,vec2(0.0));r16.zw=vec2(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y);};
{bvec2 tmp=greaterThanEqual(r16.xy,vec2(0.0));r17.xy=vec2(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y);};
r16.zw=r16.zw+r17.xy;
{bvec2 tmp=greaterThanEqual((-r16.zw),vec2(0.0));r16.zw=vec2(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y);};
r4.y=dot(r16.zw,r16.zw)+c24.z;
if(((-r4.y)<c24.z)){
r20=c24.zzzz;
}else{
r7.xy=r16.xy*r6.yx+r5.zx;
r3.z=r3.z*r3.z;
r7.w=r3.z*c21.y;
r20=texture2DLod(s1,r7.xy,r7.w);
}
r16=r19*r20;
r14=r16*r12+r14;
}
r7.xyw=mix(r10.xyz,r11.xyz,(-r15.zzz));
r18.z=r17.z*r0.x+r2.x;
r16=tex3DLod(s4,r18.xyz,r18.w,s4sl,true,true,true);
r16.xyz=r16.xyz+(-c20.xxx);
r7.xyw=r16.xyz*r7.xyw+r15.xyz;
r4.x=(-r7.w);
r16=texture2DLod(s3,r4.xz,r4.xzww.w);
{bvec3 tmp=greaterThanEqual((-r16.xyz),vec3(0.0));r17.xyz=vec3(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y,tmp.z?c24.z:c24.y);};
r0.x=dot(r17.xyz,r17.xyz);
r0.x=(-r0.x)>=0.0?c24.z:c24.y;
r0.x=(-r16.w)>=0.0?c24.z:r0.x;
if((r0.x!=(-r0.x))){
r0.x=1.0/r16.w;
r4.xy=r0.xx*r7.xy;
r4.xy=r4.xy*c20.xx+c20.xx;
r7.xy=(-r4.xy)+c24.yy;
{bvec2 tmp=greaterThanEqual(r7.xy,vec2(0.0));r7.xy=vec2(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y);};
{bvec2 tmp=greaterThanEqual(r4.xy,vec2(0.0));r17.xy=vec2(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y);};
r7.xy=r7.xy+r17.xy;
{bvec2 tmp=greaterThanEqual((-r7.xy),vec2(0.0));r7.xy=vec2(tmp.x?c24.z:c24.y,tmp.y?c24.z:c24.y);};
r3.z=dot(r7.xy,r7.xy)+c24.z;
if(((-r3.z)<c24.z)){
r17=c24.zzzz;
}else{
r8.xy=r4.xy*r6.zx+r5.wy;
r0.x=r0.x*r0.x;
r8.w=r0.x*c21.y;
r17=texture2DLod(s1,r8.xy,r8.w);
}
r16=r16*r17;
r14=r16*r13+r14;
}
r15.xyz=r1.xyz*c21.zzz+r15.xyz;
}
r0.xyz=r1.xyz*cb7[19].xyz;
r0.x=dot(r0.xyz,r0.xyz);
r0.x=sqrt(abs(r0.x));
r0.x=r0.x*c21.w;
r0=r0.xxxx*r14;
r1.xyz=max(r0.xyz,c24.zzz);
r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
r0.xyz=r0.xyz*c22.zzz;
r2.x=exp2(r0.x);
r2.y=exp2(r0.y);
r2.z=exp2(r0.z);
r0.xyz=r2.xyz*c23.xxx+c23.yyy;
r2.xyz=r1.xyz+c22.xxx;
r1.xyz=r1.xyz*c22.yyy;
{bvec3 tmp=greaterThanEqual(r2.xyz,vec3(0.0));gl_FragData[0].xyz=vec3(tmp.x?r0.x:r1.x,tmp.y?r0.y:r1.y,tmp.z?r0.z:r1.z);};
gl_FragData[0].w=r0.w;

#ifdef PS
float av=floor(clamp(gl_FragData[0].a,0.0,1.0)*255.0+0.5);
if(ssi.z==0.0)
{
if(av*ssi.x+ssi.y<0.0)
discard;
}
else
{
if(ssi.x>0.0)
{
if(av==ssi.y)
discard;
}
else
{
if(av!=ssi.y)
discard;
}
}
if(ssv<0.0)discard;
#endif
}
`;

const BoosterScale = {
    name: "BoosterScale",
    value: [ 1, 1, 1, 1 ],
    ui: { group: "Booster", description: "Booster scale", widget: WidgetType.MIXED }
};

const ShapeAtlasSize = {
    name: "ShapeAtlasSize",
    value: [ 1, 1, 0, 0 ],
    ui: { group: "Booster", description: "Shape atlas height and slice count", widget: WidgetType.MIXED }
};

/**
 * Declares one of the shader's float4 tuning constants
 * @param {String} name
 * @param {String} description
 * @returns {Object}
 */
function constant(name, description)
{
    return {
        name,
        value: [ 0, 0, 0, 0 ],
        ui: { group: "Booster", description, widget: WidgetType.MIXED }
    };
}

/**
 * Declares one of the shader's colour constants
 * @param {String} name
 * @param {String} description
 * @returns {Object}
 */
function colour(name, description)
{
    return createLinearColor({ name, ui: { group: "Booster", description } });
}

export const boostervolumetricDepth = {
    name: "boostervolumetric",
    replaces: "graphics/effect.gles2/managed/space/booster/boostervolumetric",
    description: "volumetric booster flame",
    techniques: {
        Main: {
            vs: {
                // Container order, which is also attr0..attr6. The vertex layout
                // carries TEXCOORD0 and TEXCOORD5 but the program never reads
                // them, so they are absent here exactly as they are there.
                inputDefinitions: [
                    { usage: "POSITION", usageIndex: 0, elements: 3 },
                    { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 6, elements: 1 },
                    { usage: "TEXCOORD", usageIndex: 7, elements: 2 }
                ],
                constants: [ BoosterScale ],
                shader: vs
            },
            ps: {
                // cb7 order, matching the container's byte offsets
                constants: [
                    ShapeAtlasSize,
                    constant("NoiseAmplitudeStart0", "Noise amplitude start"),
                    constant("NoiseAmplitudeEnd0", "Noise amplitude end"),
                    constant("NoiseFrequency0", "Noise frequency"),
                    constant("NoiseSpeed0", "Noise speed"),
                    colour("Color0", "Flame colour, layer 0"),
                    constant("NoiseAmplitudeStart1", "Second layer noise amplitude start"),
                    constant("NoiseAmplitudeEnd1", "Second layer noise amplitude end"),
                    constant("NoiseSpeed1", "Second layer noise speed"),
                    colour("Color1", "Flame colour, layer 1"),
                    constant("WarpNoiseAmplitudeStart0", "Warp noise amplitude start"),
                    constant("WarpNoiseAmplitudeEnd0", "Warp noise amplitude end"),
                    constant("WarpNoiseFrequency0", "Warp noise frequency"),
                    constant("WarpNoiseSpeed0", "Warp noise speed"),
                    colour("WarpColor0", "Warp flame colour, layer 0"),
                    constant("WarpNoiseAmplitudeStart1", "Second layer warp noise amplitude start"),
                    constant("WarpNoiseAmplitudeEnd1", "Second layer warp noise amplitude end"),
                    constant("WarpNoiseSpeed1", "Second layer warp noise speed"),
                    colour("WarpColor1", "Warp flame colour, layer 1"),
                    BoosterScale
                ],
                textures: [
                    // Scene depth from the DepthMap prepass, so the flame fades
                    // where it meets geometry. Autoregistered: nothing authors it
                    // per effect, the scene publishes it.
                    createTex("DepthMap", TEX_2D, {
                        isAutoregister: 1,
                        sampler: {
                            addressUMode: WrapMode.CLAMP_TO_EDGE,
                            addressVMode: WrapMode.CLAMP_TO_EDGE
                        },
                        ui: { description: "Scene depth", display: 0 }
                    }),
                    // A tile strip and a gradient ramp must both clamp. At the
                    // sampler default of REPEAT a tap near a tile edge wraps into
                    // the neighbouring tile, which tears the flame's silhouette.
                    createTex("ShapeMap", TEX_2D, {
                        sampler: {
                            addressUMode: WrapMode.CLAMP_TO_EDGE,
                            addressVMode: WrapMode.CLAMP_TO_EDGE
                        },
                        ui: { description: "Booster shape atlas" }
                    }),
                    createTex("GradientMap0", TEX_2D, {
                        sampler: {
                            addressUMode: WrapMode.CLAMP_TO_EDGE,
                            addressVMode: WrapMode.CLAMP_TO_EDGE
                        },
                        ui: { description: "Booster gradient, layer 0" }
                    }),
                    createTex("GradientMap1", TEX_2D, {
                        sampler: {
                            addressUMode: WrapMode.CLAMP_TO_EDGE,
                            addressVMode: WrapMode.CLAMP_TO_EDGE
                        },
                        ui: { description: "Booster gradient, layer 1" }
                    }),
                    // 2D because an ESSL1 program cannot sample a sampler3D, but
                    // still flagged volume so the slice count reaches s4sl. It
                    // keeps the default REPEAT: the noise has to tile.
                    createTex("NoiseMap", TEX_2D, {
                        isVolume: 1,
                        ui: { description: "Booster noise volume" }
                    })
                ],
                shader: ps
            },
            // The container's own render states. Note these INVERT against
            // sm_hi, which enables the depth test and culls CCW - they belong to
            // the program, so they move with it.
            states: {
                [RS_ZENABLE]: 0,
                [RS_CULLMODE]: CULL_CW
            }
        }
    }
};
