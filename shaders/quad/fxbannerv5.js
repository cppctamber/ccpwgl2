import { texture, constant, func, vs, ps, input } from "../shared";
import { WidgetType } from "../shared/util";
import { ObjectID } from "../shared/constant";
import { getVec2FromID } from "./extended/func";
import { PickingBlueChannel } from "constant";


const g_banner = {
    name: "g_banner",
    value: [ 1, 0.0, 1, 1 ],
    isAutoregister: 1,
    ui: {
        group: "Global",
        description: "Global Banner Settings",
        components: [
            "multiplier",
            "alpha",
            "unused1",
            "unused2"
        ],
        widget: WidgetType.MIXED
    }
};

const vsShared = {
    inputDefinitions: input.PosTexNorTanBinTex,
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
                vec4 r0;
                vec4 r1;
                vec4 c0=vec4(1,0,0,0);
                
                v0=attr0;
                v1=attr1;
                v2=attr2;
                v3=attr3;
                v4=attr4;
                v5=attr5;
                
                r0=v0.xyzx*c0.xxxy+c0.yyyx;
                r1.w=dot(r0,cb3[3]);
                r1.x=dot(r0,cb3[0]);
                r1.y=dot(r0,cb3[1]);
                r1.z=dot(r0,cb3[2]);
                gl_Position.x=dot(r1,cb1[4]);
                gl_Position.y=dot(r1,cb1[5]);
                gl_Position.z=dot(r1,cb1[6]);
                gl_Position.w=dot(r1,cb1[7]);
                
                texcoord1.x=dot(v2.xyz,cb3[0].xyz);
                texcoord1.y=dot(v2.xyz,cb3[1].xyz);
                texcoord1.z=dot(v2.xyz,cb3[2].xyz);
                texcoord2.x=dot(v3.xyz,cb3[0].xyz);
                texcoord2.y=dot(v3.xyz,cb3[1].xyz);
                texcoord2.z=dot(v3.xyz,cb3[2].xyz);
                texcoord3.x=dot(v4.xyz,cb3[0].xyz);
                texcoord3.y=dot(v4.xyz,cb3[1].xyz);
                texcoord3.z=dot(v4.xyz,cb3[2].xyz);
                
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
                texcoord.zw=v5.xy;
                texcoord4.w=r0.x;
                texcoord5.w=r0.x;
                texcoord5.xyz=v0.xyz;
                texcoord6=c0.yyyy;
                
                ${vs.shadowFooter}
            }
        `
};


export const fxBannerV5 = {
    name: "fxbannerv5",
    description: "Banner shader",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/fx/banner/unpacked_fxbannerv5",
    techniques: {
        Main: {
            vs: vsShared,
            ps: {
                constants: [
                    constant.Layer1Transform,
                    constant.Layer2Transform,
                    constant.Layer1Scroll,
                    constant.Layer2Scroll,
                    constant.BaseColor,
                    g_banner
                ],
                textures: [
                    texture.MaskMap,
                    texture.Layer1Map,
                    texture.Layer2Map,
                    texture.ImageMap,
                    texture.BorderMap
                ],
                shader: `
                
                    ${func.precision}
                    ${func.saturate}
                    ${ps.shadowHeader}
                
                    varying vec4 texcoord;
                    
                    uniform sampler2D s0; // MaskMap
                    uniform sampler2D s1; // Layer1Map
                    uniform sampler2D s2; // Layer2Map
                    uniform sampler2D s3; // ImageMap
                    uniform sampler2D s4; // BorderMap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb7[6];
                                     
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        
                        vec4 r4 = cb7[5];
                        
                        vec4 c5=vec4(1,-1,0,-0);
                        vec4 c6=vec4(0.5,0,1,0);
                        
                        v0=texcoord;
                        vec4 vFace = gl_FrontFacing ? vec4(1.0) : vec4(-1.0);
                        r0.xy=v0.xy*cb7[0].xy+cb7[0].zw;
                        r1.xy=cb7[2].xy;
                        r0.xy=r1.xy*cb2[21].xx+r0.xy;
                        r0.xy=r0.xy+cb7[2].zw;
                        
                        // Layer1Map
                        r0=texture2D(s1,r0.xy);
                        r1.xy=v0.xy*cb7[1].xy+cb7[1].zw;
                        r2.xy=cb7[3].xy;
                        r1.xy=r2.xy*cb2[21].xx+r1.xy;
                        r1.xy=r1.xy+cb7[3].zw;
                        
                        // Layer2Map
                        r1=texture2D(s2,r1.xy);
                        r0.xyz=r0.xyz*r1.xyz;
                        r0.w=vFace.w>=0.0?c5.x:c5.y;
                        r0.w=(-r0.w)>=0.0?c5.z:c5.x;
                        r1.x=vFace.x>=0.0?c5.w:c5.y;
                        r0.w=r0.w+r1.x;
                        r1.x=r0.w*c6.x;
                        r1.x=v0.x*(-r0.w)+r1.x;
                        r1.y=v0.y;
                        r1.xy=saturate(r1.xy+c6.xy);
                        
                        // MaskMap
                        r2=texture2D(s0,r1.xy);
                        
                        // ImageMap
                        r1=texture2D(s3,r1.xy);
                        
                        r3.xyz=mix(cb7[4].xyz,r1.xyz,r1.www);
                        r0.xyz=r0.xyz*r2.xyz;
                        r1.xy=v0.ww*c6.zy+c6.yx;
                        
                        // BorderMap
                        r1=texture2D(s4,r1.xy);
                        
                        r1.xyz=r1.xyz*cb7[4].xyz;
                        r0.xyz=r0.xyz*r3.xyz+r1.xyz;
                        
                        gl_FragData[0].xyz=r0.xyz*r1.www*r4.x;
                        gl_FragData[0].w=r4.y;
                        
                        ${ps.shadowFooter}
                    }
                
                `
            }
        },
        ExtendedPicking: {
            vs: vsShared,
            ps: {
                constants: [
                    ObjectID
                ],
                textures: [
                    texture.MaskMap,
                    texture.ImageMap,
                    texture.BorderMap
                ],
                shader: `
                
                    ${func.precision}
                    ${func.saturate}
                    ${getVec2FromID}
                    
                    varying vec4 texcoord;
                    
                    uniform sampler2D s0; // MaskMap
                    uniform sampler2D s1; // ImageMap
                    uniform sampler2D s2; // BorderMap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb7[1];
                                     
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        
                        float c0 = 0.00392156886;
                        vec4 c5=vec4(1,-1,0,-0);
                        vec4 c6=vec4(0.5,0,1,0);
                        
                        v0=texcoord;
                        vec4 vFace = gl_FrontFacing ? vec4(1.0) : vec4(-1.0);
                       
                        // MaskMap
                        r2=texture2D(s0,v0.xy);
                        
                        // ImageMap
                        r1=texture2D(s1,v0.xy);
                        
                        r3.xyz=r1.xyz*r1.www;
                        r0.xyz=r0.xyz*r2.xyz;
                        
                        // BorderMap
                        r1=texture2D(s2,v0.xy);
                        r0.xyz=r0.xyz*r3.xyz+r1.xyz;
                        r0.xyz=r0.xyz*r1.www;

                        if(r0.x+r0.y+r0.z<0.1)discard;
                        
                        // ObjectID
                        r0.xy=getVec2FromID(cb7[0].x);
                        r0.z=float(${PickingBlueChannel.BANNER})*c0;
                        
                        gl_FragData[0].xyz=r0.xyz;
                        gl_FragData[0].w=0.0;
                    }
                
                `
            }
        }
    }
};