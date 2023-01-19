import { precision } from "../shared/func";
import { ps, vs, texture } from "../shared";
import { Selectors } from "./spotlightconepool";

export const spotlightglowpool = {
    name: "spotlightglowpool",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/fx/spotlightglowpool",
    description: "spotlight glow pool",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: [
                    { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
                    { usage: "COLOR", usageIndex: 0, elements: 4 },
                    { usage: "COLOR", usageIndex: 1, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 4, elements: 1 }
                ],
                constants: [
                    Selectors
                ],
                shader: `
                    
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    attribute vec4 attr4;
                    attribute vec4 attr5;
                    attribute vec4 attr6;
                    
                    varying vec4 color;
                    varying vec4 texcoord;
                    varying vec4 texcoord1;
                    varying vec4 texcoord2;
                    varying vec4 texcoord3;
                    
                    uniform vec4 cb0[4];
                    uniform vec4 cb1[16];
                    uniform vec3 ssyf;
                    
                    ${vs.shadowHeader}
                    
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
                        ivec4 a0;
                        
                        vec4 c4=vec4(0.25,4,1,0);
                        vec4 c5=vec4(0.150000006,-0.5,0.5,0);
                        vec4 c6=vec4(1,-1,0,0);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        v3=attr3;
                        v4=attr4;
                        v5=attr5;
                        v6=attr6;
                       
                        r0=v3;
                        r1.x=c4.x*v6.x;
                        r1.y=fract(r1.x);
                        r1.x=(-r1.y)+r1.x;
                        r1.y=(-abs(r1.x))>=abs(r1.x)?1.0:0.0;;
                        r2=mix(v4,r0,r1.yyyy);
                        r0.xy=mix(v5.yz,v5.xx,r1.yy);
                        color=r2*v3.wwww;
                        r0.z=r1.x*(-c4.y)+v6.x;
                        r0.w=(-r1.x)+c4.z;
                        r0.w=r0.w*c5.x;
                        r1.x=fract(v6.x);
                        r0.z=r0.z+(-r1.x);
                        a0.x=int(r0.z+0.5);
                        r1.xy=cb0[0+a0.x].xy;
                        r1.zw=r1.xy+c5.yy;
                        texcoord3.xyz=r1.xyx*c6.xyz+c6.zxz;
                        r2.x=v0.z;
                        r2.y=v1.z;
                        r2.z=v2.z;
                        r3.xyz=normalize(r2.xyz);
                        r2.xw=v0.ww*c4.zw+c4.wz;
                        r2.y=v1.w;
                        r2.z=v2.w;
                        r4.xyz=(-r2.xyz)+cb1[3].xyz;
                        r5.xyz=normalize(r4.xyz);
                        r0.z=dot(r5.xyz,r3.xyz);
                        r0.z=max(r0.w,r0.z);
                        r0.z=min(r0.z,c4.z);
                        r0.zw=r0.zz*r1.zw;
                        r1.x=dot(r2,cb1[8]);
                        r1.y=dot(r2,cb1[9]);
                        r0.xy=r0.zw*r0.xy+r1.xy;
                        r0.z=dot(r2,cb1[10]);
                        r0.w=dot(r2,cb1[11]);
                        gl_Position.x=dot(r0,cb1[12]);
                        gl_Position.y=dot(r0,cb1[13]);
                        r1.x=dot(r0,cb1[14]);
                        r0.x=dot(r0,cb1[15]);
                        r0.y=1.0/r0.x;
                        gl_Position.w=r0.x;
                        gl_Position.z=r0.y*(-c5.z)+r1.x;
                        texcoord=c4.wwww;
                        texcoord1=c4.wwww;
                        texcoord2=c4.wwww;
                        texcoord3.w=v5.w;
                        
                        ${vs.shadowFooter}
                    }
                `
            },
            ps: {
                textures: [
                    texture.TextureMap_ClampBorder
                ],
                shader: `
                  
                    ${precision}

                        varying vec4 color;
                        varying vec4 texcoord3;
                        uniform sampler2D s0;
                        
                        ${ps.shadowHeader}
                        
                        void main()
                        {
                            vec4 v0;
                            vec4 v1;
                            vec4 r0;
                            v0=color;
                            v1=texcoord3;
                            r0=texture2D(s0,v1.xy);
                            r0=r0*v1.wwww;
                            gl_FragData[0]=r0*v0;
                            
                            ${ps.shadowFooter}
                        }
                `
            }
        }
    }
};