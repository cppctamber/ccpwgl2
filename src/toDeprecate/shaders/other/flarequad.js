import { RS_CULLMODE, CULL_NONE } from "constant/d3d";


/**
 * Hand crafted lens flare quad shader.
 *
 * Both programs are CCP's own GLES2 `flarequad.sm_hi`, taken verbatim from the
 * legacy-gles resource overlay, so the maths is the shipped maths rather than a
 * re-derivation. What this file adds is the render state around them.
 *
 * The shipped container declares NO render states at all, so the pass inherited
 * the device default of `RS_CULLMODE CULL_CW` (Tw2Device sets it). That made the
 * quad's visibility depend entirely on the winding `EveChildQuad` happens to
 * emit, and the winding is a single class constant shared by every quad child.
 * When it was changed to Carbon's order (`Tr2QuadRenderer.cpp:222`) so that
 * `ubershaderquad` would stop being culled, this effect started being culled
 * instead - the two want opposite faces and one constant cannot serve both.
 *
 * Declaring `CULL_NONE` here removes this effect from that argument entirely: a
 * flare is a camera facing sheet with no meaningful back face, so there is
 * nothing for culling to save. The winding constant can then be whatever
 * `ubershaderquad` needs without taking this effect down with it.
 *
 * The programs read no constant buffer the engine has to fill beyond the
 * per-frame block (`cb1`), and sample no textures, so there are no constants or
 * textures to declare - the colour comes in through the instance buffer and the
 * falloff is computed procedurally.
 *
 * Three lines deviate from the container, and must stay deviated. They are the
 * same three fixes `shaderOverrides.json` already applies to `flarequad` as
 * source patches; a patch cannot reach this module, because a `replaces` entry
 * supersedes the container rather than editing it, so they are inlined here.
 *
 * The first two: the shipped vertex program selects its quad corner with
 * `c[0+a0.x]`, and ESSL1 forbids indexing a non-uniform array by anything but a
 * const or a loop counter, so it fails to compile with "Index expression can
 * only contain const or loop symbols". Both sites become an explicit branch over
 * the corner index. Four ways, not the six the JSON patch writes: only `c[0]` to
 * `c[3]` are corners here, `c[4]` and `c[5]` are the arc-tangent constants the
 * program uses further down.
 *
 * The third: the fragment program calls `saturate` but, unlike the vertex
 * program, never declares the helper overloads, so it cannot compile as shipped.
 * That one call becomes the equivalent `clamp`.
 */

const vs = `
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
varying vec4 texcoord3;
float saturate(float x){return clamp(x,0.0,1.0);}
vec2 saturate(vec2 x){return clamp(x,vec2(0.0),vec2(1.0));}
vec3 saturate(vec3 x){return clamp(x,vec3(0.0),vec3(1.0));}
vec4 saturate(vec4 x){return clamp(x,vec4(0.0),vec4(1.0));}
uniform vec4 cb1[16];
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
ivec4 a0;
vec4 c[6];
c[4]=vec4(0.333333343,-0.0187292993,0.0742610022,-0.212114394);
c[5]=vec4(1.57072878,1.57079637,0.636619747,0);
c[0]=vec4(-0.5,-0.5,0,0);
c[1]=vec4(0.5,-0.5,1,0);
c[2]=vec4(0.5,0.5,1,1);
c[3]=vec4(-0.5,0.5,0,1);
v0=attr0;
v1=attr1;
v2=attr2;
v3=attr3;
v4=attr4;
v5=attr5;
v6=attr6;
v7=attr7;
v8=attr8;
r0.x=v1.y;
r0.y=v2.y;
r0.z=v3.y;
r0.x=dot(r0.xyz,r0.xyz);
r0.x=sqrt(abs(r0.x));
r0.x=r0.x*c[4].x;
r1.x=v1.x;
r1.y=v2.x;
r1.z=v3.x;
r0.y=dot(r1.xyz,r1.xyz);
r0.y=sqrt(abs(r0.y));
r0.x=r0.y*c[4].x+r0.x;
r1.x=v1.z;
r1.y=v2.z;
r1.z=v3.z;
r0.y=dot(r1.xyz,r1.xyz);
r0.y=sqrt(abs(r0.y));
r0.x=r0.y*c[4].x+r0.x;
r0.y=fract(v0.x);
r0.y=(-r0.y)+v0.x;
a0.x=int(r0.y+0.5);
r0.zw=c[1].zw;
if(a0.x==0){r1.xyz=r0.zzw*c[0].xyx;}else if(a0.x==1){r1.xyz=r0.zzw*c[1].xyx;}else if(a0.x==2){r1.xyz=r0.zzw*c[2].xyx;}else{r1.xyz=r0.zzw*c[3].xyx;}
if(a0.x==0){texcoord.xyw=r0.zzw*c[0].zwz;}else if(a0.x==1){texcoord.xyw=r0.zzw*c[1].zwz;}else if(a0.x==2){texcoord.xyw=r0.zzw*c[2].zwz;}else{texcoord.xyw=r0.zzw*c[3].zwz;}
r2.x=dot(v4.xyz,r1.xyz);
r2.y=dot(v5.xyz,r1.xyz);
r2.z=dot(v6.xyz,r1.xyz);
r1.xw=v4.ww*c[1].zw+c[1].wz;
r1.y=v5.w;
r1.z=v6.w;
r3.x=dot(v1,r1);
r3.y=dot(v2,r1);
r3.z=dot(v3,r1);
r3.w=c[1].z;
r1.x=dot(r3,cb1[8]);
r1.y=dot(r3,cb1[9]);
r1.z=dot(r3,cb1[10]);
r3.w=dot(r3,cb1[11]);
r3.xyz=r2.xyz*r0.xxx+r1.xyz;
r0.y=dot(r1.xyz,r1.xyz);
r0.y=r0.y==0.0?3.402823466e+38:inversesqrt(abs(r0.y));
r0.y=r0.y*r1.z;
r0.y=saturate((-r0.y));
gl_Position.x=dot(r3,cb1[12]);
gl_Position.y=dot(r3,cb1[13]);
gl_Position.z=dot(r3,cb1[14]);
gl_Position.w=dot(r3,cb1[15]);
r1.x=v4.x;
r1.y=v5.x;
r1.z=v6.x;
r0.z=dot(r1.xyz,r1.xyz);
r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
r1.x=1.0/r0.z;
r2.x=v4.y;
r2.y=v5.y;
r2.z=v6.y;
r0.z=dot(r2.xyz,r2.xyz);
r0.z=r0.z==0.0?3.402823466e+38:inversesqrt(abs(r0.z));
r1.y=1.0/r0.z;
r0.xz=r0.xx*r1.xy;
texcoord.z=min(r0.z,r0.x);
r0.x=r0.y*c[4].y+c[4].z;
r0.x=r0.x*r0.y+c[4].w;
r0.x=r0.x*r0.y+c[5].x;
r0.y=(-r0.y)+c[1].z;
r0.y=sqrt(abs(r0.y));
r0.x=r0.x*(-r0.y)+c[5].y;
r0.x=r0.x*c[5].z;
r0.x=r0.x*r0.x;
r1=v7;
r1=r1*v8.xxxx;
texcoord3=r0.xxxx*r1;

#ifdef PS
ssv=dot(ssf[0],gl_Position);
#endif
gl_Position.xy += ssyf.xy*gl_Position.w;
gl_Position.y*=ssyf.z;
gl_Position.z=gl_Position.z*2.0-gl_Position.w;
}
`;

const ps = `
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif
varying vec4 texcoord;
varying vec4 texcoord3;

#ifdef PS
uniform vec4 ssi;
varying float ssv;
#endif
void main()
{
vec4 v0;
vec4 v1;
vec4 r0;
vec4 c0=vec4(-0.5,0,0.00100000005,-0.999001026);
vec4 c1=vec4(1.00100005,0,0,0);
v0=texcoord;
v1=texcoord3;
r0.xy=c0.xx+v0.xy;
r0.xy=r0.xy+r0.xy;
r0.x=dot(r0.xy,r0.xy)+c0.y;
r0.x=clamp(sqrt(abs(r0.x)),0.0,1.0);
r0.x=r0.x+c0.z;
r0.x=1.0/r0.x;
r0.x=r0.x+c0.w;
r0.x=r0.x*c1.x;
gl_FragData[0]=r0.xxxx*v1;

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

export const flarequad = {
    name: "flarequad",
    replaces: "graphics/effect.gles2/managed/space/specialfx/flarequad",
    description: "lens flare quad",
    techniques: {
        Main: {
            vs: {
                // Container order, which is also attr0..attr8, and matches
                // EveChildQuad.vertexDeclarations one for one: the corner index,
                // the parent transform's three rows, the local transform's three
                // rows, the instance colour, then the two data floats.
                inputDefinitions: [
                    { usage: "TEXCOORD", usageIndex: 5, elements: 1 },
                    { usage: "POSITION", usageIndex: 0, elements: 4 },
                    { usage: "POSITION", usageIndex: 1, elements: 4 },
                    { usage: "POSITION", usageIndex: 2, elements: 4 },
                    { usage: "POSITION", usageIndex: 3, elements: 4 },
                    { usage: "POSITION", usageIndex: 4, elements: 4 },
                    { usage: "POSITION", usageIndex: 5, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 1, elements: 2 }
                ],
                shader: vs
            },
            ps: {
                shader: ps
            },
            // The container declares none, so the pass inherited the device
            // default CULL_CW and its visibility depended on EveChildQuad's
            // winding constant. See the file header.
            states: {
                [RS_CULLMODE]: CULL_NONE
            }
        }
    }
};
