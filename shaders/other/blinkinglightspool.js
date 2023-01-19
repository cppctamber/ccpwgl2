import { precision, saturate, standardDerivatives } from "../shared/func";
import { ps, vs } from "../shared";


export const blinkinglightspool = {
    name: "blinkinglightspool",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/fx/blinkinglightspool",
    description: "Blinking lights pool",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: [
                    { usage: "POSITION", usageIndex: 0, elements: 3 },
                    { usage: "COLOR", usageIndex: 0, elements: 3 },
                    { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 1, elements: 2 },
                    { usage: "TEXCOORD", usageIndex: 5, elements: 1 }
                ],
                shader: `
                
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    attribute vec4 attr4;
                    
                    varying vec4 color;
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    uniform vec4 cb1[34];
                    uniform vec3 ssyf;
                    
                    ${vs.shadowHeader}
                    
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
                        ivec4 a0;
                        
                        vec4 c[5];
                        c[4]=vec4(0.0500000007,0.200000003,0.00200000009,1);
                        c[0]=vec4(-0.5,-0.5,0,0);
                        c[1]=vec4(0.5,-0.5,1,0);
                        c[2]=vec4(0.5,0.5,1,1);
                        c[3]=vec4(-0.5,0.5,0,1);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        v3=attr3;
                        v4=attr4;
                        
                        r0.x=v2.z<c[4].z?1.0:0.0;
                        r0.y=v2.z*(-c[4].x)+c[4].w;
                        r0.zw=v2.zz*c[4].xy;
                        r0.x=r0.x*r0.y+r0.z;
                        r0.y=v2.z*c[4].y+(-r0.x);
                        r0.y=1.0/r0.y;
                        r0.z=cb1[33].x*v2.z+v2.y;
                        r0.z=fract(r0.z);
                        r1.x=(-r0.x)+r0.z;
                        r0.y=r1.x*(-r0.y)+c[1].z;
                        r0.w=r0.z<r0.w?1.0:0.0;
                        r0.y=r0.y*r0.w;
                        r0.w=1.0/r0.x;
                        r0.x=r0.z<r0.x?1.0:0.0;
                        r0.z=r0.z*r0.w+(-r0.y);
                        r0.x=r0.x*r0.z+r0.y;
                        r0.y=r0.x+c[1].z;
                        r0.y=r0.y*v2.x;
                        color=r0.yyyy*v1;
                        r0.w=v2.w;
                        r0.y=(-r0.w)+v3.x;
                        r0.x=r0.x*r0.y+v2.w;
                        r1=v0.xyzx*c[1].zzzw+c[1].wwwz;
                        r2.z=dot(r1,cb1[10]);
                        r0.y=pow(abs(r2.z),v3.y);
                        r0.x=r0.y*r0.x;
                        r0.y=fract(v4.x);
                        r0.y=(-r0.y)+v4.x;
                        a0.x=int(r0.y+0.5);
                        if(a0.x==0){r0.xy=r0.xx*c[0].xy;}else if(a0.x==1){r0.xy=r0.xx*c[1].xy;}else if(a0.x==2){r0.xy=r0.xx*c[2].xy;}else if(a0.x==3){r0.xy=r0.xx*c[3].xy;}else if(a0.x==4){r0.xy=r0.xx*c[4].xy;}
                        r3.zw=c[1].zw;
                        if(a0.x==0){texcoord=r3.zzww*c[0].zwzz;}else if(a0.x==1){texcoord=r3.zzww*c[1].zwzz;}else if(a0.x==2){texcoord=r3.zzww*c[2].zwzz;}else if(a0.x==3){texcoord=r3.zzww*c[3].zwzz;}else if(a0.x==4){texcoord=r3.zzww*c[4].zwzz;}
                        r0.zw=c[0].ww;
                        r2.x=dot(r1,cb1[8]);
                        r2.y=dot(r1,cb1[9]);
                        r2.w=dot(r1,cb1[11]);
                        r0=r0+r2;
                        gl_Position.x=dot(r0,cb1[12]);
                        gl_Position.y=dot(r0,cb1[13]);
                        gl_Position.z=dot(r0,cb1[14]);
                        gl_Position.w=dot(r0,cb1[15]);
                        texcoord1=c[0].wwww;
                        
                        ${vs.shadowFooter}
                    }
                `
            },
            ps: {
                shader: `
                  
                    ${precision}
                    ${saturate}
                    ${standardDerivatives}
                    
                    varying vec4 color;
                    varying vec4 texcoord;
                    
                    ${ps.shadowHeader}
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 v1;
                        vec4 r0;
                        vec4 r1;
                        vec4 c0=vec4(-0.5,0,1,0.300000012);
                        vec4 c1=vec4(1.57079637,4.5,0,0);
                        v0=color;
                        v0.w=0.5;
                        v1=texcoord;
                        
                        r0.xy=c0.xx+v1.xy;
                        r0.xy=r0.xy+r0.xy;
                        r0.x=dot(r0.xy,r0.xy)+c0.y;
                        r0.x=sqrt(abs(r0.x));
                        r0.y=saturate(r0.x);
                        r1.x=pow(r0.y,c0.w);
                        r0.y=r1.x*c1.x;
                        r1.x=cos(r0.y);
                        r0.y=r1.x*r1.x;
                        r0.y=r0.y*c1.y;
                        r1=r0.yyyy*v0;
                        r0.y=dFdx(r0.x);
                        r0.x=dFdy(r0.x);
                        r0.x=abs(r0.x)+abs(r0.y);
                        r0.x=(-r0.x)+c0.z;
                        r1=r0.xxxx*r1;
                        {bvec4 tmp=greaterThanEqual(r0.xxxx,vec4(0.0));gl_FragData[0]=vec4(tmp.x?r1.x:c0.y,tmp.y?r1.y:c0.y,tmp.z?r1.z:c0.y,tmp.w?r1.w:c0.y);};
                        
                        ${ps.shadowFooter}
                    }
                `
            }
        }
    }
};