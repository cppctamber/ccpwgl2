import { shadowHeader, shadowFooter } from "../../shared/vs";
import * as input from "../../shared/input";
export { shadowHeader, shadowFooter };


export const quadV5_PosTexTanTex = {
    inputDefinitions: input.PosTexTanTex,
    shader: `

        ${shadowHeader}
            
        attribute vec4 attr0;
        attribute vec4 attr1;
        attribute vec4 attr2;
        attribute vec4 attr3;
        
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
        uniform vec4 cb3[26];
        uniform vec3 ssyf;
        
        // Temp lighting
        varying vec4 lighting0;
        varying vec4 lighting1;
        varying vec4 lighting2;
        varying vec4 lighting3;       
        uniform vec4 cb8[4];
        
        vec4 getLightingSurfaceToLight(vec4 lightingData, vec4 worldData)
        {
            vec4 tmp = vec4(1.0);
            if(lightingData.w<=0.0)return tmp;
            tmp.xyz=lightingData.xyz-worldData.xyz;
            tmp.w=lightingData.w;
            return tmp;
        }
        
        void main()
        {
            vec4 v0;
            vec4 v1;
            vec4 v2;
            vec4 v3;
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
            
            r0=v0.xyzx*c1.yyyx+c1.xxxy;
            r1.x=dot(r0,cb3[0]);
            r1.y=dot(r0,cb3[1]);
            r1.z=dot(r0,cb3[2]);
            r1.w=dot(r0,cb3[3]);
            
            // Temp lighting world surface to light
            lighting0 = getLightingSurfaceToLight(cb8[0], r1);
            lighting1 = getLightingSurfaceToLight(cb8[1], r1);
            lighting2 = getLightingSurfaceToLight(cb8[2], r1);
            lighting3 = getLightingSurfaceToLight(cb8[3], r1);
            
            gl_Position.x=dot(r1,cb1[4]);
            gl_Position.y=dot(r1,cb1[5]);
            gl_Position.z=dot(r1,cb1[6]);
            gl_Position.w=dot(r1,cb1[7]);
            
            r0=v2*c0.xxxx+c0.yyyy;
            {
                bvec4 tmp=lessThan(c1.xxxx,r0.ywzw);
                r2.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;
            }
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
            r1.x=v0.x;
            r1.x=(-r1.x)+abs(r1.x);
            r1.yzw=c1.xxy;
            r2.xyz=cb3[24].yyy*r1.xyz+v0.xyz;
            r1.xyz=cb3[25].yyy*r1.xyz+v0.xyz;
            r2.w=c1.y;
            r3.x=dot(r2,cb3[17]);
            r3.y=dot(r2,cb3[18]);
            r0.yz=r3.xy+c1.yy;
            texcoord6.xy=r0.yz*c0.ww;
            r0.z=dot(r1,cb3[21]);
            r0.w=dot(r1,cb3[22]);
            r0.yz=r0.zw+c1.yy;
            texcoord6.zw=r0.yz*c0.ww;
            texcoord.xy=v1.xy;
            texcoord.zw=v3.xy;
            texcoord4.w=r0.x;
            texcoord5.w=r0.x;
            texcoord5.xyz=v0.xyz;
            
            ${shadowFooter}
        }
    `
};

export const quadOilV5_PosTexTanTex = {
    inputDefinitions: input.PosTexTanTex,
    shader: `
    
        ${shadowHeader}
    
        attribute vec4 attr0;
        attribute vec4 attr1;
        attribute vec4 attr2;
        attribute vec4 attr3;
        
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
        uniform vec4 cb3[4];
        uniform vec3 ssyf;
        
        void main()
        {
            vec4 v0;
            vec4 v1;
            vec4 v2;
            vec4 v3;
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
            {
                bvec4 tmp=lessThan(c1.xxxx,r0.ywzw);
                r2.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;
            }
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
            texcoord.zw=v3.xy;
            texcoord4.w=r0.x;
            texcoord5.w=r0.x;
            texcoord5.xyz=v0.xyz;
            texcoord6=c1.xxxx;
            
            ${shadowFooter}
        }
    `
};

export const quadV5_PosTex = {
    inputDefinitions: input.PosTex,
    shader: `
        
        ${shadowHeader}
                
        attribute vec4 attr0;
        attribute vec4 attr1;
        
        varying vec4 texcoord;
        varying vec4 texcoord1;
        
        uniform vec4 cb1[8];
        uniform vec4 cb3[4];
        uniform vec3 ssyf;
        
        void main()
        {
            vec4 v0;
            vec4 v1;
            vec4 r0;
            vec4 r1;
            
            vec4 c0=vec4(1,0,0,0);
            
            v0=attr0;
            v1=attr1;
            
            r0=v0.xyzx*c0.xxxy+c0.yyyx;
            r1.x=dot(r0,cb3[0]);
            r1.y=dot(r0,cb3[1]);
            r1.z=dot(r0,cb3[2]);
            r1.w=dot(r0,cb3[3]);
            gl_Position.x=dot(r1,cb1[4]);
            gl_Position.y=dot(r1,cb1[5]);
            gl_Position.z=dot(r1,cb1[6]);
            gl_Position.w=dot(r1,cb1[7]);
            
            texcoord=c0.xxxy*v0.xyzx;
            texcoord1.xy=v1.xy;
        
            ${shadowFooter}
        }
    `
};


export const skinnedQuadV5_PosBwtTexTanTex = {
    inputDefinitions: input.PosBwtTexTanTex,
    shader: `
    
        ${shadowHeader}
        
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
        uniform vec4 cb3[200];
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
            vec4 r6;
            vec4 r7;
            vec4 r8;
            
            ivec4 a0;
            
            vec4 c0=vec4(3,0,1,0.5);
            vec4 c1=vec4(6.28318548,-3.14159274,0.159154937,0.5);
            
            v0=attr0;
            v1=attr1;
            v2=attr2;
            v3=attr3;
            v4=attr4;
            
            r0.x=c0.x*v1.x;         
            a0.x=int(r0.x+0.5);      
            r0=cb3[27+a0.x];
            r1=r0*cb3[3].yyyy;
            r2=cb3[26+a0.x];
            r1=r2*cb3[3].xxxx+r1;
            r3=cb3[28+a0.x];
            r1=r3*cb3[3].zzzz+r1;
            r4.yz=c0.yz;
            r1=cb3[3].wwww*r4.yyyz+r1;
            r5=v0.xyzx*c0.zzzy+c0.yyyz;
            r1.w=dot(r5,r1);
            r6=r0*cb3[0].yyyy;
            r6=r2*cb3[0].xxxx+r6;
            r6=r3*cb3[0].zzzz+r6;
            r6=cb3[0].wwww*r4.yyyz+r6;
            r1.x=dot(r5,r6);
            r7=r0*cb3[1].yyyy;
            r7=r2*cb3[1].xxxx+r7;
            r7=r3*cb3[1].zzzz+r7;
            r7=cb3[1].wwww*r4.yyyz+r7;
            r1.y=dot(r5,r7);
            r0=r0*cb3[2].yyyy;
            r0=r2*cb3[2].xxxx+r0;
            r0=r3*cb3[2].zzzz+r0;
            r0=cb3[2].wwww*r4.yyyz+r0;
            r1.z=dot(r5,r0);
            gl_Position.x=dot(r1,cb1[4]);
            gl_Position.y=dot(r1,cb1[5]);
            gl_Position.z=dot(r1,cb1[6]);
            gl_Position.w=dot(r1,cb1[7]);
            
            r2=v3*c1.xxxx+c1.yyyy;
            {
                bvec4 tmp=lessThan(c0.yyyy,r2.ywzw);
                r3.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;
            }
            r2=r2*c1.zzzz+c1.wwww;
            r2=fract(r2);
            r2=r2*c1.xxxx+c1.yyyy;
            r0.w=r3.y*r3.x;
            r3.xy=vec2(cos(r2.x), sin(r2.x));
            r4.xy=vec2(cos(r2.y), sin(r2.y));
            r3.xy=r3.xy*abs(r4.yy);
            r3.z=r4.x;
            r4.xy=vec2(cos(r2.z), sin(r2.z));
            r8.xy=vec2(cos(r2.w), sin(r2.w));
            r2.xy=r4.xy*abs(r8.yy);
            r2.z=r8.x;
            r4.xyz=r2.yzx*r3.zxy;
            r4.xyz=r3.yzx*r2.zxy+(-r4.xyz);
            r8.xyz=mix((-r4.xyz),r4.xyz,r0.www);
            texcoord1.x=dot(r8.xyz,r6.xyz);
            texcoord1.y=dot(r8.xyz,r7.xyz);
            texcoord1.z=dot(r8.xyz,r0.xyz);
            texcoord2.x=dot(r3.xyz,r6.xyz);
            texcoord3.x=dot(r2.xyz,r6.xyz);
            texcoord2.y=dot(r3.xyz,r7.xyz);
            texcoord3.y=dot(r2.xyz,r7.xyz);
            texcoord3.z=dot(r2.xyz,r0.xyz);
            texcoord2.z=dot(r3.xyz,r0.xyz);
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
            texcoord5.x=dot(r5,cb3[26+a0.x]);
            texcoord5.y=dot(r5,cb3[27+a0.x]);
            texcoord5.z=dot(r5,cb3[28+a0.x]);
            r1.x=v0.x;
            r1.x=(-r1.x)+abs(r1.x);
            r1.yzw=c0.yyz;
            r2.xyz=cb3[24].yyy*r1.xyz+v0.xyz;
            r1.xyz=cb3[25].yyy*r1.xyz+v0.xyz;
            r2.w=c0.z;
            r3.x=dot(r2,cb3[17]);
            r3.y=dot(r2,cb3[18]);
            r0.yz=r3.xy+c0.zz;
            texcoord6.xy=r0.yz*c0.ww;
            r0.z=dot(r1,cb3[21]);
            r0.w=dot(r1,cb3[22]);
            r0.yz=r0.zw+c0.zz;
            texcoord6.zw=r0.yz*c0.ww;
            texcoord.xy=v2.xy;
            texcoord.zw=v4.xy;
            texcoord4.w=r0.x;
            texcoord5.w=r0.x;
            
            ${shadowFooter}
        }
    `
};

export const skinnedQuadOilV5_PosBwtTexTanTex = {
    inputDefinitions: input.PosBwtTexTanTex,
    shader: `
    
        ${shadowHeader}
        
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
        uniform vec4 cb3[200];
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
            vec4 r6;
            vec4 r7;
            vec4 r8;
            ivec4 a0;
            
            vec4 c0=vec4(3,0,1,0);
            vec4 c1=vec4(6.28318548,-3.14159274,0.159154937,0.5);
            
            v0=attr0;
            v1=attr1;
            v2=attr2;
            v3=attr3;
            v4=attr4;
            
            r0.x=c0.x*v1.x;
            a0.x=int(r0.x+0.5);
            r0=cb3[27+a0.x];
            r1=r0*cb3[3].yyyy;
            r2=cb3[26+a0.x];
            r1=r2*cb3[3].xxxx+r1;
            r3=cb3[28+a0.x];
            r1=r3*cb3[3].zzzz+r1;
            r4.yz=c0.yz;
            r1=cb3[3].wwww*r4.yyyz+r1;
            r5=v0.xyzx*c0.zzzy+c0.yyyz;
            r1.w=dot(r5,r1);
            r6=r0*cb3[0].yyyy;
            r6=r2*cb3[0].xxxx+r6;
            r6=r3*cb3[0].zzzz+r6;
            r6=cb3[0].wwww*r4.yyyz+r6;
            r1.x=dot(r5,r6);
            r7=r0*cb3[1].yyyy;
            r7=r2*cb3[1].xxxx+r7;
            r7=r3*cb3[1].zzzz+r7;
            r7=cb3[1].wwww*r4.yyyz+r7;
            r1.y=dot(r5,r7);
            r0=r0*cb3[2].yyyy;
            r0=r2*cb3[2].xxxx+r0;
            r0=r3*cb3[2].zzzz+r0;
            r0=cb3[2].wwww*r4.yyyz+r0;
            r1.z=dot(r5,r0);
            gl_Position.x=dot(r1,cb1[4]);
            gl_Position.y=dot(r1,cb1[5]);
            gl_Position.z=dot(r1,cb1[6]);
            gl_Position.w=dot(r1,cb1[7]);
            
            r2=v3*c1.xxxx+c1.yyyy;
            {
                bvec4 tmp=lessThan(c0.yyyy,r2.ywzw);
                r3.xy=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xy;
            }
            r2=r2*c1.zzzz+c1.wwww;
            r2=fract(r2);
            r2=r2*c1.xxxx+c1.yyyy;
            r0.w=r3.y*r3.x;
            r3.xy=vec2(cos(r2.x), sin(r2.x));
            r4.xy=vec2(cos(r2.y), sin(r2.y));
            r3.xy=r3.xy*abs(r4.yy);
            r3.z=r4.x;
            r4.xy=vec2(cos(r2.z), sin(r2.z));
            r8.xy=vec2(cos(r2.w), sin(r2.w));
            r2.xy=r4.xy*abs(r8.yy);
            r2.z=r8.x;
            r4.xyz=r2.yzx*r3.zxy;
            r4.xyz=r3.yzx*r2.zxy+(-r4.xyz);
            r8.xyz=mix((-r4.xyz),r4.xyz,r0.www);
            texcoord1.x=dot(r8.xyz,r6.xyz);
            texcoord1.y=dot(r8.xyz,r7.xyz);
            texcoord1.z=dot(r8.xyz,r0.xyz);
            texcoord2.x=dot(r3.xyz,r6.xyz);
            texcoord3.x=dot(r2.xyz,r6.xyz);
            texcoord2.y=dot(r3.xyz,r7.xyz);
            texcoord3.y=dot(r2.xyz,r7.xyz);
            texcoord3.z=dot(r2.xyz,r0.xyz);
            texcoord2.z=dot(r3.xyz,r0.xyz);
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
            texcoord5.x=dot(r5,cb3[26+a0.x]);
            texcoord5.y=dot(r5,cb3[27+a0.x]);
            texcoord5.z=dot(r5,cb3[28+a0.x]);
            texcoord.xy=v2.xy;
            texcoord.zw=v4.xy;
            texcoord4.w=r0.x;
            texcoord5.w=r0.x;
            texcoord6=c0.yyyy;
            
            ${shadowFooter}
        }
    `
};


export const skinnedQuadV5_PosBwtTex = {
    inputDefinitions: input.PosBwtTex,
    shader: `
    
        ${shadowHeader}
        
        attribute vec4 attr0;
        attribute vec4 attr1;
        attribute vec4 attr2;
        
        varying vec4 texcoord;
        varying vec4 texcoord1;
        
        uniform vec4 cb1[8];
        uniform vec4 cb3[200];
        uniform vec3 ssyf;
        
        void main()
        {
            vec4 v0;
            vec4 v1;
            vec4 v2;
            vec4 r0;
            vec4 r1;
            vec4 r2;
            vec4 r3;
            vec4 r4;
            vec4 r5;
            vec4 r6;
            
            ivec4 a0;
            vec4 c0=vec4(3,0,1,0);
            
            v0=attr0;
            v1=attr1;
            v2=attr2;
            
            r0.x=c0.x*v1.x;
            a0.x=int(r0.x+0.5);
            r0=cb3[27+a0.x];
            r1=r0*cb3[0].yyyy;
            r2=cb3[26+a0.x];
            r1=r2*cb3[0].xxxx+r1;
            r3=cb3[28+a0.x];
            r1=r3*cb3[0].zzzz+r1;
            r4.yz=c0.yz;
            r1=cb3[0].wwww*r4.yyyz+r1;
            r5=v0.xyzx*c0.zzzy+c0.yyyz;
            r1.x=dot(r5,r1);
            r6=r0*cb3[1].yyyy;
            r6=r2*cb3[1].xxxx+r6;
            r6=r3*cb3[1].zzzz+r6;
            r6=cb3[1].wwww*r4.yyyz+r6;
            r1.y=dot(r5,r6);
            r6=r0*cb3[2].yyyy;
            r6=r2*cb3[2].xxxx+r6;
            r6=r3*cb3[2].zzzz+r6;
            r6=cb3[2].wwww*r4.yyyz+r6;
            r1.z=dot(r5,r6);
            r0=r0*cb3[3].yyyy;
            r0=r2*cb3[3].xxxx+r0;
            r0=r3*cb3[3].zzzz+r0;
            r0=cb3[3].wwww*r4.yyyz+r0;
            r1.w=dot(r5,r0);
            gl_Position.x=dot(r1,cb1[4]);
            gl_Position.y=dot(r1,cb1[5]);
            gl_Position.z=dot(r1,cb1[6]);
            gl_Position.w=dot(r1,cb1[7]);
            
            texcoord.x=dot(r5,cb3[26+a0.x]);
            texcoord.y=dot(r5,cb3[27+a0.x]);
            texcoord.z=dot(r5,cb3[28+a0.x]);
            texcoord.w=c0.y;
            texcoord1.xy=v2.xy;
            
            ${shadowFooter}
        }
    `
};


export const quadInstancedV5_PosTexTanTexTexTexTex = {
    inputDefinitions: [
        { usage: "POSITION", usageIndex: 0 },
        { usage: "TEXCOORD", usageIndex: 0 },
        { usage: "TANGENT", usageIndex: 0 },
        { usage: "TEXCOORD", usageIndex: 8 },
        { usage: "TEXCOORD", usageIndex: 9 },
        { usage: "TEXCOORD", usageIndex: 10 },
        { usage: "TEXCOORD", usageIndex: 1 },
    ],
    shader: `
  
        ${shadowHeader}
        
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
        varying vec4 texcoord8;
        
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
            vec4 v5;
            vec4 v6;
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
            v5=attr5;
            v6=attr6;
            
            r0.w=c1.y;
            r1=v0.xyzx*c1.yyyx+c1.xxxy;
            r0.x=dot(r1,v3);
            r0.y=dot(r1,v4);
            r0.z=dot(r1,v5);
            r1.w=dot(r0,cb3[3]);
            r1.x=dot(r0,cb3[0]);
            r1.y=dot(r0,cb3[1]);
            r1.z=dot(r0,cb3[2]);
            texcoord5.xyz=r0.xyz;
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
            r2.x=dot(r4.xyz,v3.xyz);
            r2.y=dot(r4.xyz,v4.xyz);
            r2.z=dot(r4.xyz,v5.xyz);
            r4.xyz=normalize(r2.xyz);
            texcoord1.x=dot(r4.xyz,cb3[0].xyz);
            texcoord1.y=dot(r4.xyz,cb3[1].xyz);
            texcoord1.z=dot(r4.xyz,cb3[2].xyz);
            r2.x=dot(r3.xyz,v3.xyz);
            r2.y=dot(r3.xyz,v4.xyz);
            r2.z=dot(r3.xyz,v5.xyz);
            r3.xyz=normalize(r2.xyz);
            texcoord2.x=dot(r3.xyz,cb3[0].xyz);
            texcoord2.y=dot(r3.xyz,cb3[1].xyz);
            texcoord2.z=dot(r3.xyz,cb3[2].xyz);
            r2.x=dot(r0.xyz,v3.xyz);
            r2.y=dot(r0.xyz,v4.xyz);
            r2.z=dot(r0.xyz,v5.xyz);
            r0.xyz=normalize(r2.xyz);
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
            texcoord.zw=v6.xy;
            texcoord4.w=r0.x;
            texcoord5.w=r0.x;
            texcoord6=c1.xxxx;
                         
            ${shadowFooter}
        }
    `
};


export const quadInstancedV5_PosTexTexTexTex = {
    inputDefinitions: [
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
        { usage: "TEXCOORD", usageIndex: 8, elements: 4 },  // 4 ??
        { usage: "TEXCOORD", usageIndex: 9, elements: 4 },  // 4 ??
        { usage: "TEXCOORD", usageIndex: 10, elements: 4 }  // 4 ??
    ],
    shader: `
    
        ${shadowHeader}
       
        attribute vec4 attr0;
        attribute vec4 attr1;
        attribute vec4 attr2;
        attribute vec4 attr3;
        attribute vec4 attr4;
        
        varying vec4 texcoord;
        varying vec4 texcoord1;
        
        uniform vec4 cb1[8];
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
            
            vec4 c0=vec4(1,0,0,0);
            
            v0=attr0;
            v1=attr1;
            v2=attr2;
            v3=attr3;
            v4=attr4;
            
            r0.w=c0.x;
            r1=v0.xyzx*c0.xxxy+c0.yyyx;
            r0.x=dot(r1,v2);
            r0.y=dot(r1,v3);
            r0.z=dot(r1,v4);
            r1.x=dot(r0,cb3[0]);
            r1.y=dot(r0,cb3[1]);
            r1.z=dot(r0,cb3[2]);
            r1.w=dot(r0,cb3[3]);
            texcoord.xyz=r0.xyz;
            gl_Position.x=dot(r1,cb1[4]);
            gl_Position.y=dot(r1,cb1[5]);
            gl_Position.z=dot(r1,cb1[6]);
            gl_Position.w=dot(r1,cb1[7]);
            
            texcoord.w=c0.y;
            texcoord1.xy=v1.xy;
            
            ${shadowFooter}
        }
    
    `
};


