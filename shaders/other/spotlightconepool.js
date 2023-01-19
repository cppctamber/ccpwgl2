import { precision } from "../shared/func";
import { ps, vs, texture, constant } from "../shared";

const Selectors = {
    name: "Selectors",
    value: [
        0,0,0,0,
        1,0,0,0,
        1,1,0,0,
        0,1,0,0
    ],
    elements: 4,
    dimension: 4,
    size: 16
};

export const spotlightconepool = {
    name: "spotlightconepool",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/fx/spotlightconepool",
    description: "spotlight cone pool",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: [
                    { usage: "COLOR", usageIndex: 0, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 3, elements: 3 },
                    { usage: "TEXCOORD", usageIndex: 4, elements: 3 }
                ],
                constants: [
                    Selectors,
                    constant.ZOffset
                ],
                shader: `
                    
                    attribute vec4 attr0;
                    attribute vec4 attr1;
                    attribute vec4 attr2;
                    attribute vec4 attr3;
                    attribute vec4 attr4;
                    attribute vec4 attr5;
                    
                    varying vec4 color;
                    varying vec4 texcoord2;
                    uniform vec4 cb0[5];
                    uniform vec4 cb1[8];
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
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        ivec4 a0;
                        
                        vec4 c5=vec4(0.25,4,3.14159274,0.785398185);
                        vec4 c6=vec4(0.159154937,0.5,6.28318548,-3.14159274);
                        vec4 c7=vec4(1,0,0.785398185,1.57079637);
                        vec4 c8=vec4(1,-1,0,0);
                        
                        v0=attr0;
                        v1=attr1;
                        v2=attr2;
                        v3=attr3;
                        v4=attr4;
                        v5=attr5;
                        
                        color=v0*v0.wwww;
                        r0.x=fract(v5.x);
                        r0.y=c5.x*v5.x;
                        r0.z=fract(r0.y);
                        r0.y=(-r0.z)+r0.y;
                        r0.z=r0.y*(-c5.y)+v5.x;
                        r0.x=r0.z+(-r0.x);
                        a0.x=int(r0.x+0.5);
                        r1.xy=cb0[0+a0.x].xy;
                        r0.x=r1.x*c5.z;
                        r0.x=r0.y*c5.w+r0.x;
                        r0.y=r0.y*c7.z+c7.w;
                        r0.y=r0.y*c6.x+c6.y;
                        r0.y=fract(r0.y);
                        r0.y=r0.y*c6.z+c6.w;
                        r2.xy=vec2(cos(r0.y), sin(r0.y));
                        r2=r2.xyxx*c7.xxyy;
                        r0.x=r0.x*c6.x+c6.y;
                        r0.x=fract(r0.x);
                        r0.x=r0.x*c6.z+c6.w;
                        r3.xy=vec2(cos(r0.x), sin(r0.x));
                        r0.xyw=r3.xyx*c7.xxy+c7.yyx;
                        r0.z=r1.y+cb0[4].x;
                        texcoord2.xy=r1.xy*c8.xy+c8.zx;
                        r1.x=dot(r0,v1);
                        r1.y=dot(r0,v2);
                        r1.z=dot(r0,v3);
                        r1.w=c7.x;
                        gl_Position.x=dot(r1,cb1[4]);
                        gl_Position.y=dot(r1,cb1[5]);
                        gl_Position.z=dot(r1,cb1[6]);
                        gl_Position.w=dot(r1,cb1[7]);
                        r0.xyz=(-r1.xyz)+cb1[3].xyz;
                        r1.xyz=normalize(r0.xyz);
                        r0.x=dot(r2.xyww,v1);
                        r0.y=dot(r2.xyww,v2);
                        r0.z=dot(r2,v3);
                        r2.xyz=normalize(r0.xyz);
                        r0.x=dot(r1.xyz,r2.xyz);
                        texcoord2.z=abs(r0.x);
                        texcoord2.w=v4.x;
                        
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
                        varying vec4 texcoord2;
                        uniform sampler2D s0;
                        
                        ${ps.shadowHeader}
                        
                        void main()
                        {
                            vec4 v0;
                            vec4 v1;
                            vec4 r0;
                            vec4 r1;
                            
                            v0=color;
                            v1=texcoord2;
                            r0=texture2D(s0,v1.xy);
                            r0=r0*v0;
                            r1.x=v1.w*v1.z;
                            gl_FragData[0]=r0*r1.xxxx;
                            
                            ${ps.shadowFooter}
                        }
                `
            }
        }
    }
};