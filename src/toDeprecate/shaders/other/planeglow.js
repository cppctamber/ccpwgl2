import { PlaneCornerOffset, PlaneTexCoord, PlaneNormal, PlaneData } from "../shared/constant";

// GLES hi programs captured from the shipped planeglow/skinned_planeglow
// containers. Preserve their square atlas and layer calculations; these
// are deliberately not the DX11 rectangular-atlas contract.
// Operator-requested GLES correction: flip U at the corner, before layer
// transforms and atlas tile offsets, so atlas selection is unchanged.
// Inherit the original additive two-sided state; geometry is unchanged.
const planeTexCoord = {
    ...PlaneTexCoord,
    value: PlaneTexCoord.value.map((value, index) => index % 4 === 0 ? 1 - value : value)
};
const inputDefinitions = [
    ...[ 0, 1, 2 ].map(usageIndex => ({ usage: "TEXCOORD", usageIndex, elements: 4 })),
    { usage: "COLOR", usageIndex: 0, elements: 4 },
    ...[ 3, 4, 5, 6, 7 ].map(usageIndex => ({ usage: "TEXCOORD", usageIndex, elements: 4 }))
];
const constants = [ PlaneCornerOffset, planeTexCoord, PlaneNormal, PlaneData ];
const textures = [ "Layer1Map", "Layer2Map", "MaskMap" ].map(name => ({
    name, type: 2, sampler: {
        name: name + "Sampler", filterMode: 3, mipFilterMode: 2,
        magFilterMode: 2, addressUMode: 1, addressVMode: 1,
        addressWMode: 1, maxAnisotropy: 4
    }
}));

export const planeglow = {
    name: "planeglow",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/fx/planeglow",
    techniques: {
        Main: {
            vs: {
                inputDefinitions, constants,
                shader: `//planeglow.sm_hi
attribute vec4 attr0;
attribute vec4 attr1;
attribute vec4 attr2;
attribute vec4 attr3;
attribute vec4 attr4;
attribute vec4 attr5;
attribute vec4 attr6;
attribute vec4 attr7;
attribute vec4 attr8;
varying vec4 texcoord;
varying vec4 texcoord1;
varying vec4 texcoord2;
varying vec4 texcoord3;
varying vec4 texcoord4;
varying vec4 texcoord5;
varying vec4 color;
uniform vec4 cb0[10];
uniform vec4 cb1[34];
uniform vec4 cb3[13];
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
vec4 v7;
vec4 v8;
vec4 r0;
vec4 r1;
ivec4 a0;
vec4 c10=vec4(1,0,0,0);
v0=attr0;
v1=attr1;
v2=attr2;
v3=attr3;
v4=attr4;
v5=attr5;
v6=attr6;
v7=attr7;
v8=attr8;
r0.w=c10.x;
a0.x=int(v8.x+0.5);
r1.xy=c10.xy;
r1=cb0[0+a0.x].xyzx*r1.xxxy+r1.yyyx;
r0.x=dot(r1,v0);
r0.y=dot(r1,v1);
r0.z=dot(r1,v2);
r1.x=dot(r0,cb3[0]);
r1.y=dot(r0,cb3[1]);
r1.z=dot(r0,cb3[2]);
r1.w=dot(r0,cb3[3]);
gl_Position.x=dot(r1,cb1[4]);
gl_Position.y=dot(r1,cb1[5]);
gl_Position.z=dot(r1,cb1[6]);
gl_Position.w=dot(r1,cb1[7]);
texcoord2=r1;
r0.x=dot(cb0[8].xyz,v0.xyz);
r0.y=dot(cb0[8].xyz,v1.xyz);
r0.z=dot(cb0[8].xyz,v2.xyz);
texcoord3.x=dot(r0.xyz,cb3[0].xyz);
texcoord3.y=dot(r0.xyz,cb3[1].xyz);
texcoord3.z=dot(r0.xyz,cb3[2].xyz);
texcoord3.w=dot(r0.xyz,cb3[3].xyz);
r0.xy=v6.xy*cb1[33].xx+v6.zw;
r0.zw=cb0[4+a0.x].xy*v4.xy+v4.zw;
texcoord.xy=r0.xy+r0.zw;
r0.xy=v7.xy*cb1[33].xx+v7.zw;
r0.zw=cb0[4+a0.x].xy*v5.xy+v5.zw;
texcoord.zw=r0.xy+r0.zw;
r0.x=1.0/cb0[9].y;
r0.y=r0.x*v8.z;
r0.z=fract(r0.y);
r0.w=r0.y+(-r0.z);
r0.z=(-r0.z)<r0.z?1.0:0.0;
r0.y=r0.y<(-r0.y)?1.0:0.0;
r0.y=r0.y*r0.z+r0.w;
r0.z=v8.z*r0.x+(-r0.y);
r0.y=r0.y+cb0[4+a0.x].y;
texcoord1.x=cb0[4+a0.x].x*r0.x+r0.z;
texcoord1.y=r0.x*r0.y;
color=cb3[12].yyyy*v3;
texcoord1.zw=c10.yy;
texcoord4=c10.yyyy;
texcoord5=c10.yyyy;

#ifdef PS
ssv=dot(ssf[0],gl_Position);
#endif
gl_Position.xy += ssyf.xy*gl_Position.w;
gl_Position.y*=ssyf.z;
gl_Position.z=gl_Position.z*2.0-gl_Position.w;
}
`
            },
            ps: {
                constants: [ PlaneData ], textures,
                shader: `//planeglow.sm_hi
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif
varying vec4 texcoord;
varying vec4 texcoord1;
varying vec4 texcoord2;
varying vec4 texcoord3;
varying vec4 color;
uniform sampler2D s0;
uniform sampler2D s1;
uniform sampler2D s2;
uniform vec4 cb2[4];
uniform vec4 cb7[1];

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
vec4 r0;
vec4 r1;
vec4 c1=vec4(-1,1,0,0);
v0=texcoord;
v1=texcoord1;
v2=texcoord2;
v3=texcoord3;
v4=color;
r0.xyz=cb2[3].xyz+(-v2.xyz);
r1.xyz=normalize(r0.xyz);
r0.xyz=normalize(v3.xyz);
r0.x=dot(r1.xyz,r0.xyz);
r0.x=abs(r0.x)+c1.x;
r0.y=c1.y;
r0.x=cb7[0].x*r0.x+r0.y;
r1=texture2D(s0,v0.xy);
r0=r0.xxxx*r1;
r1=texture2D(s1,v0.zw);
r0=r0*r1;
r1=texture2D(s2,v1.xy);
r0=r0*r1;
gl_FragData[0]=r0*v4;

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
`
            }
        }
    }
};

export const skinned_planeglow = {
    name: "skinned_planeglow",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/fx/skinned_planeglow",
    techniques: {
        Main: {
            vs: {
                inputDefinitions, constants,
                shader: `//skinned_planeglow.sm_hi
attribute vec4 attr0;
attribute vec4 attr1;
attribute vec4 attr2;
attribute vec4 attr3;
attribute vec4 attr4;
attribute vec4 attr5;
attribute vec4 attr6;
attribute vec4 attr7;
attribute vec4 attr8;
varying vec4 texcoord;
varying vec4 texcoord1;
varying vec4 texcoord2;
varying vec4 texcoord3;
varying vec4 texcoord4;
varying vec4 texcoord5;
varying vec4 color;
uniform vec4 cb0[10];
uniform vec4 cb1[34];
uniform vec4 cb3[200];
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
vec4 v7;
vec4 v8;
vec4 r0;
vec4 r1;
vec4 r2;
vec4 r3;
vec4 r4;
vec4 r5;
vec4 r6;
vec4 r7;
vec4 r8;
ivec4 a0;
vec4 c10=vec4(1,0,3,0);
v0=attr0;
v1=attr1;
v2=attr2;
v3=attr3;
v4=attr4;
v5=attr5;
v6=attr6;
v7=attr7;
v8=attr8;
r0.x=c10.z*v8.y;
a0.x=int(r0.x+0.5);
r0=cb3[27+a0.x];
r1=r0*cb3[0].yyyy;
r2=cb3[26+a0.x];
r1=r2*cb3[0].xxxx+r1;
r3=cb3[28+a0.x];
r1=r3*cb3[0].zzzz+r1;
r4.xy=c10.xy;
r1=cb3[0].wwww*r4.yyyx+r1;
r5.w=c10.x;
a0.x=int(v8.x+0.5);
r6=cb0[0+a0.x].xyzx*r4.xxxy+r4.yyyx;
r5.x=dot(r6,v0);
r5.y=dot(r6,v1);
r5.z=dot(r6,v2);
r6.x=dot(r5,r1);
r7=r0*cb3[1].yyyy;
r7=r2*cb3[1].xxxx+r7;
r7=r3*cb3[1].zzzz+r7;
r7=cb3[1].wwww*r4.yyyx+r7;
r6.y=dot(r5,r7);
r8=r0*cb3[2].yyyy;
r8=r2*cb3[2].xxxx+r8;
r8=r3*cb3[2].zzzz+r8;
r8=cb3[2].wwww*r4.yyyx+r8;
r6.z=dot(r5,r8);
r0=r0*cb3[3].yyyy;
r0=r2*cb3[3].xxxx+r0;
r0=r3*cb3[3].zzzz+r0;
r0=cb3[3].wwww*r4.yyyx+r0;
r6.w=dot(r5,r0);
gl_Position.x=dot(r6,cb1[4]);
gl_Position.y=dot(r6,cb1[5]);
gl_Position.z=dot(r6,cb1[6]);
gl_Position.w=dot(r6,cb1[7]);
texcoord2=r6;
r2.x=dot(cb0[8].xyz,v0.xyz);
r2.y=dot(cb0[8].xyz,v1.xyz);
r2.z=dot(cb0[8].xyz,v2.xyz);
texcoord3.x=dot(r2.xyz,r1.xyz);
texcoord3.y=dot(r2.xyz,r7.xyz);
texcoord3.z=dot(r2.xyz,r8.xyz);
texcoord3.w=dot(r2.xyz,r0.xyz);
r0.xy=v6.xy*cb1[33].xx+v6.zw;
r0.zw=cb0[4+a0.x].xy*v4.xy+v4.zw;
texcoord.xy=r0.xy+r0.zw;
r0.xy=v7.xy*cb1[33].xx+v7.zw;
r0.zw=cb0[4+a0.x].xy*v5.xy+v5.zw;
texcoord.zw=r0.xy+r0.zw;
r0.x=1.0/cb0[9].y;
r0.y=r0.x*v8.z;
r0.z=fract(r0.y);
r0.w=r0.y+(-r0.z);
r0.z=(-r0.z)<r0.z?1.0:0.0;
r0.y=r0.y<(-r0.y)?1.0:0.0;
r0.y=r0.y*r0.z+r0.w;
r0.z=v8.z*r0.x+(-r0.y);
r0.y=r0.y+cb0[4+a0.x].y;
texcoord1.x=cb0[4+a0.x].x*r0.x+r0.z;
texcoord1.y=r0.x*r0.y;
color=v3*cb3[12].yyyy;
texcoord1.zw=c10.yy;
texcoord4=c10.yyyy;
texcoord5=c10.yyyy;

#ifdef PS
ssv=dot(ssf[0],gl_Position);
#endif
gl_Position.xy += ssyf.xy*gl_Position.w;
gl_Position.y*=ssyf.z;
gl_Position.z=gl_Position.z*2.0-gl_Position.w;
}
`
            },
            ps: {
                constants: [ PlaneData ], textures,
                shader: `//skinned_planeglow.sm_hi
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif
varying vec4 texcoord;
varying vec4 texcoord1;
varying vec4 texcoord2;
varying vec4 texcoord3;
varying vec4 color;
uniform sampler2D s0;
uniform sampler2D s1;
uniform sampler2D s2;
uniform vec4 cb2[4];
uniform vec4 cb7[1];

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
vec4 r0;
vec4 r1;
vec4 c1=vec4(-1,1,0,0);
v0=texcoord;
v1=texcoord1;
v2=texcoord2;
v3=texcoord3;
v4=color;
r0.xyz=cb2[3].xyz+(-v2.xyz);
r1.xyz=normalize(r0.xyz);
r0.xyz=normalize(v3.xyz);
r0.x=dot(r1.xyz,r0.xyz);
r0.x=abs(r0.x)+c1.x;
r0.y=c1.y;
r0.x=cb7[0].x*r0.x+r0.y;
r1=texture2D(s0,v0.xy);
r0=r0.xxxx*r1;
r1=texture2D(s1,v0.zw);
r0=r0*r1;
r1=texture2D(s2,v1.xy);
r0=r0*r1;
gl_FragData[0]=r0*v4;

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
`
            }
        }
    }
};
