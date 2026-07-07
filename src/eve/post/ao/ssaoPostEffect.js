/**
 * Default AO post-effect configuration (importable JS object).
 *
 * A small multi-pass post-effect description consumed by {@link EveSpaceSceneAO}.
 * Swap/extend this to change the AO without touching the runner.
 *
 * Shape:
 *   {
 *     name,
 *     output: "<texture name bound into SSAOMap>",
 *     vertexShader: "<fullscreen VS>",
 *     passes: [ { name, fragmentShader, samplers: { uniform: sourceTex }, target } ]
 *   }
 *
 * Reserved source texture names: "depth" = the scene depth prepass (32F).
 * Every other name is an intermediate RGBA8 target allocated by the runner.
 * The runner sets these uniforms when present on a pass program:
 *   uRes(vec2), uAB(vec2 = proj[10],proj[14]), uTan(vec2 = 1/proj0,1/proj5),
 *   uFocalPx(float), plus the tunables uRadius/uStrength/uBias/uMaxPx/uBlurPx/
 *   uView from the {@link EveSpaceSceneAO} decorated fields. Samplers bind per
 *   `samplers`.
 */

const FULLSCREEN_VS = `#version 300 es
void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); gl_Position=vec4(p*2.0-1.0,0.0,1.0); }`;

// Hemisphere AO from depth: reconstruct a view normal (cross of derivatives),
// occlude only samples above the surface, range falloff + screen-edge guard.
const AO_FS = `#version 300 es
precision highp float;
uniform highp sampler2D uDepth; uniform vec2 uRes, uAB, uTan;
uniform float uFocalPx, uRadius, uStrength, uBias, uMaxPx; uniform int uView; out vec4 o;
float vzat(vec2 uv){ float d=texture(uDepth,uv).r; return uAB.y/((2.0*d-1.0)+uAB.x); }
vec3 posAt(vec2 uv){ float z=vzat(uv); vec2 ndc=uv*2.0-1.0; return vec3(ndc*uTan*z, z); }
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; float dc=texture(uDepth,uv).r; float zc=uAB.y/((2.0*dc-1.0)+uAB.x);
  if(uView==1){ o=vec4(vec3(dc),1.0); return; }
  if(uView==2){ o=vec4(vec3(clamp(zc/8000.0,0.0,1.0)),1.0); return; }
  if(dc>=0.9999995 || zc<=0.0){ o=vec4(1.0); return; }
  vec3 P=vec3((uv*2.0-1.0)*uTan*zc, zc);
  vec3 n=normalize(cross(dFdx(P), dFdy(P))); if(dot(n,P)>0.0) n=-n;
  if(uView==3){ o=vec4(n*0.5+0.5,1.0); return; }
  float radPx=clamp(uRadius*uFocalPx/zc, 1.0, uMaxPx);
  float occ=0.0; const int N=16;
  for(int i=0;i<N;i++){
    float a=float(i)*2.3999632, r=radPx*sqrt((float(i)+0.5)/float(N));
    vec2 suv=uv+vec2(cos(a),sin(a))*r/uRes;
    if(suv.x<0.0||suv.x>1.0||suv.y<0.0||suv.y>1.0) continue;
    float ds=texture(uDepth,suv).r; if(ds>=0.9999995) continue;
    vec3 dir=posAt(suv)-P; float dist=length(dir);
    float ndl=max(0.0, dot(n, dir/max(dist,1e-4)) - uBias);
    occ += ndl * (uRadius/(uRadius+dist));
  }
  o=vec4(vec3(clamp(1.0-(occ/float(N))*uStrength,0.0,1.0)),1.0);
}`;

// Box blur with a screen-edge guard.
const BLUR_FS = `#version 300 es
precision highp float; uniform highp sampler2D uTex; uniform vec2 uRes; uniform float uBlurPx; out vec4 o;
void main(){ int R=int(uBlurPx); vec2 uv=gl_FragCoord.xy/uRes; float s=0.0,n=0.0;
  for(int y=-4;y<=4;y++)for(int x=-4;x<=4;x++){ if(abs(x)>R||abs(y)>R)continue;
    vec2 suv=uv+vec2(float(x),float(y))/uRes; if(suv.x<0.0||suv.x>1.0||suv.y<0.0||suv.y>1.0)continue;
    s+=texture(uTex,suv).r; n+=1.0; }
  o=vec4(vec3(n>0.0?s/n:1.0),1.0); }`;

export const DEFAULT_AO_POST_EFFECT = {
    name: "ssao",
    output: "ssao",
    vertexShader: FULLSCREEN_VS,
    passes: [
        { name: "ao",   fragmentShader: AO_FS,   samplers: { uDepth: "depth" }, target: "aoRaw" },
        { name: "blur", fragmentShader: BLUR_FS, samplers: { uTex: "aoRaw" },   target: "ssao" }
    ]
};

export default DEFAULT_AO_POST_EFFECT;
