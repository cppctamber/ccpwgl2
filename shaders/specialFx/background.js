import { createTex, createLinearColor, WidgetType, TEX_2D, TEX_CUBE_MAP } from "../shared/util";
import { RS_ZENABLE, RS_ZFUNC, RS_ZWRITEENABLE, CMP_ALWAYS } from "constant";
import { precision, saturate } from "../shared/func";
import { Pos } from "../shared/input";


const NebulaScaling = {
    name: "NebulaScaling",
    value: [ 1, 1, 1, 1 ],
    ui: {
        group: "Nebula",
        description: "Nebula scaling",
        components: [ "x axis", "y axis", "z axis" ],
        visible: 0,
        widget: WidgetType.MIXED
    }
};

const StarParameters = {
    name: "StarParameters",
    value: [ 2, 3, 7, 1.5 ],
    ui: {
        group: "Stars",
        components: [ "Tiling 1", "Tiling 2", "Tiling 3", "Intensity" ],
        visible: 1,
        widget: WidgetType.MIXED
    }
};

const AlphaBlend1 = {
    name: "AlphaBlend1",
    value: [ 0.699999988079071, 0.8999999761581421, 0, 0.05000000074505806 ],
    ui: {
        group: "Stars",
        components: [ "1u", "1v", "2u", "2v" ],
        visible: 1,
        widget: WidgetType.MIXED
    }
};
const AlphaBlend2 = {
    name: "AlphaBlend2",
    value: [ 0, 0.004999999888241291, 0.05000000074505806, 1 ],
    ui: {
        group: "Stars",
        components: [ "3u", "3v" ],
        visible: 1,
        widget: WidgetType.MIXED
    }
};

const Tint = createLinearColor({
    name: "Tint",
    ui: {
        group: "Nebula",
    }
});

const NebulaBrightnessOverride = {
    name: "NebulaBrightnessOverride",
    value: [ 1, 0, 0, 0 ],
    ui: {
        group: "Nebula",
        components: [ "brightness" ],
        visible: 1,
        widget: WidgetType.MIXED
    }
};

const StarMap = createTex("StarMap", TEX_2D);
const NebulaMap = createTex("NebulaMap", TEX_CUBE_MAP);
const AlphaMap = createTex("AlphaMap", TEX_CUBE_MAP);


export const test_background = {
    name: "background",
    replaces: "graphics/effect.gles2/managed/space/specialfx/background",
    description: "nebula shader",
    todo: "Temporary fix, come back and fix this up",
    techniques: {
        Main: {
            vertex: {
                inputDefinitions: Pos,
                constants: [
                    NebulaScaling
                ],
                shader: `
                
                    attribute vec4 attr0;
                    
                    varying vec4 texcoord;
                    
                    uniform vec4 cb0[1];
                    uniform vec4 cb1[28];
                    uniform vec3 ssyf;
                    
                    #ifdef PS
                    uniform vec4 ssf[4];
                    varying float ssv;
                    #endif
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        vec4 c1=vec4(1,0,0,0);
                        v0=attr0;
                        r0.xyz=cb1[9].xyz*v0.yyy;
                        r0.xyz=v0.xxx*cb1[8].xyz+r0.xyz;
                        r0.xyz=v0.zzz*cb1[10].xyz+r0.xyz;
                        r0.xyz=r0.xyz*cb0[0].xyz;
                        r0.w=c1.x;
                        texcoord.x=dot(r0,cb1[24]);
                        texcoord.y=dot(r0,cb1[25]);
                        texcoord.z=dot(r0,cb1[26]);
                        texcoord.w=dot(r0,cb1[27]);
                        r0.x=dot(v0,cb1[12]);
                        r0.y=dot(v0,cb1[13]);
                        r0.z=dot(v0,cb1[15]);
                        gl_Position=r0.xyzz;
                        
                        #ifdef PS
                        ssv=dot(ssf[0],gl_Position);
                        #endif
                        
                        gl_Position.xy += ssyf.xy*gl_Position.w;
                        gl_Position.y*=ssyf.z;
                        gl_Position.z=gl_Position.z*2.0-gl_Position.w;
                    }
                `
            },
            fragment: {
                constants: [
                    StarParameters,
                    AlphaBlend1,
                    AlphaBlend2,
                    Tint,
                    NebulaBrightnessOverride
                ],
                textures: [
                    StarMap,
                    NebulaMap,
                    AlphaMap
                ],
                shader: `
                
                    ${precision}
                    ${saturate}
                    
                    varying vec4 texcoord;
                    
                    uniform sampler2D s0;   // StarMap
                    uniform samplerCube s1; // NebulaMap
                    uniform samplerCube s2; // AlphaMap
                    
                    uniform vec4 cb2[22];
                    uniform vec4 cb7[5];
                    
                    #ifdef PS
                    uniform vec4 ssi;
                    varying float ssv;
                    #endif
                    
                    void main()
                    {
                        vec4 v0;
                        vec4 r0;
                        vec4 r1;
                        vec4 r2;
                        vec4 r3;
                        vec4 c5=vec4(0.0773993805,0.0549999997,0.947867274,2.4000001);
                        vec4 c6=vec4(1,0,-0.5,0.344139993);
                        vec4 c7=vec4(1,-1,-0.00313080009,12.9200001);
                        vec4 c8=vec4(0.416666657,1.05499995,-0.0549999997,0);
                        vec4 c9=vec4(0.714139998,1.40199995,1.77199996,-0.0404499359);
                        v0=texcoord;
                        
                        r0.xyz=c7.xyx*v0.zzx;
                        r0.w=max(abs(v0.y),abs(v0.z));
                        r1.x=max(abs(v0.x),r0.w);
                        r1.yzw=(-r1.xxx)+abs(v0.xyz);
                        r0.w=1.0/r1.x;
                        
                        {
                            bvec3 tmp=greaterThanEqual(r1.yzw,vec3(0.0));
                            r1.xyz=vec3(tmp.x?c6.x:c6.y,tmp.y?c6.x:c6.y,tmp.z?c6.x:c6.y);
                        }
                        
                        r0.x=dot(r1.xyz,r0.xyz);
                        r2.xyz=c7.xxy*v0.yxy;
                        r0.y=dot(r1.xyz,r2.xyz);
                        r0.xy=r0.xy*r0.ww+c6.xx;
                        r0.xy=r0.xy*(-c6.zz);
                        r1=r0.xyxy*cb7[0].xxyy;
                        r0.xy=r0.xy*cb7[0].zz;
                        
                        // Stars
                        r0=texture2D(s0,r0.xy);
                        r2=texture2D(s0,r1.xy);
                        r1=texture2D(s0,r1.zw);
                        
                        r3.xy=(-cb7[1].xz)+cb7[1].yw;
                        r0.w=1.0/r3.y;
                        r1.w=1.0/r3.x;
                        
                        // AlphaMap
                        r3=textureCube(s2,v0.xyz);
                        
                        r3.xy=r3.ww+(-cb7[1].xz);
                        r2.w=r3.w+(-cb7[2].x);
                        r0.w=saturate(r0.w*r3.y);
                        r1.w=saturate(r1.w*r3.x);
                        r1.w=(-r1.w)+c6.x;
                        r0.w=(-r0.w)+c6.x;
                        r1.xyz=r1.xyz*r0.www;
                        r1.xyz=r1.www*r2.xyz+r1.xyz;
                        r0.w=(-cb7[2].x)+cb7[2].y;
                        r0.w=1.0/r0.w;
                        r0.w=saturate(r0.w*r2.w);
                        r0.w=(-r0.w)+c6.x;
                        r0.xyz=r0.www*r0.xyz+r1.xyz;
                        
                        // NebulaMap
                        r1=textureCube(s1,v0.xyz);
                        
                        // UVMap
                        r2=c6.yyyy;
                        
                        r3=c6.xxxx;
                        {
                            bvec2 tmp=greaterThanEqual((-abs(r2.xy)),vec2(0.0));
                            r1.yz=vec2(tmp.x?c6.x:c6.y,tmp.y?c6.x:c6.y);
                        }
                        
                        r0.w=r1.z*r1.y;
                        r1.y=r3.y*(-c6.w)+r1.x;
                        r2.xz=r3.xw*c9.yz+r1.xx;
                        r2.y=r3.z*(-c9.x)+r1.y;
                        r1.xyz=r2.xyz+c5.yyy;
                        r1.xyz=r1.xyz*c5.zzz;
                        r3.x=abs(r1.x)>0.0?log2(abs(r1.x)):-3.402823466e+38;
                        r3.y=abs(r1.y)>0.0?log2(abs(r1.y)):-3.402823466e+38;
                        r3.z=abs(r1.z)>0.0?log2(abs(r1.z)):-3.402823466e+38;
                        r1.xyz=r3.xyz*c5.www;
                        r3.x=exp2(r1.x);
                        r3.y=exp2(r1.y);
                        r3.z=exp2(r1.z);
                        r1.xyz=r2.xyz+c9.www;
                        r2.xyz=r2.xyz*c5.xxx;
                        
                        {
                            bvec3 tmp=greaterThanEqual(r1.xyz,vec3(0.0));
                            r1.xyz=vec3(tmp.x?r3.x:r2.x,tmp.y?r3.y:r2.y,tmp.z?r3.z:r2.z);
                        }
                        
                        {
                            bvec3 tmp=greaterThanEqual((-r0.www),vec3(0.0));
                            r1.xyz=vec3(tmp.x?r1.x:c6.y,tmp.y?r1.y:c6.y,tmp.z?r1.z:c6.y);
                        }
                        
                        r0.xyz=cb7[0].www*r0.xyz+r1.xyz;
                        r1.xyz=cb7[3].xyz;
                        r1.xyz=r1.xyz*cb7[4].xxx;
                        r0.xyz=r0.xyz*r1.xyz;
                        r1.xyz=max(r0.xyz,c6.yyy);
                        r0.x=r1.x>0.0?log2(r1.x):-3.402823466e+38;
                        r0.y=r1.y>0.0?log2(r1.y):-3.402823466e+38;
                        r0.z=r1.z>0.0?log2(r1.z):-3.402823466e+38;
                        r0.xyz=r0.xyz*cb2[21].www;
                        r1.xyz=r0.xyz*c8.xxx;
                        r2.x=exp2(r1.x);
                        r2.y=exp2(r1.y);
                        r2.z=exp2(r1.z);
                        r1.xyz=r2.xyz*c8.yyy+c8.zzz;
                        r2.x=exp2(r0.x);
                        r2.y=exp2(r0.y);
                        r2.z=exp2(r0.z);
                        r0.xyz=r2.xyz+c7.zzz;
                        r2.xyz=r2.xyz*c7.www;
                        vec3 result;
                        {
                            bvec3 tmp=greaterThanEqual(r0.xyz,vec3(0.0));
                            result=vec3(tmp.x?r1.x:r2.x,tmp.y?r1.y:r2.y,tmp.z?r1.z:r2.z);
                        }
                        
                         vec4 cube=textureCube(s1,v0.xyz);
                         vec4 refl=textureCube(s2, v0.xyz);
                         gl_FragData[0].xyz = cube.xyz;
                         gl_FragData[0].xyz += max(result * (.6-refl.x), vec3(0.0));
                         if (refl.x < 0.25)
                         {
                            gl_FragData[0].xyz += result;
                         }
                        
                        #ifdef PS
                        float av=floor(clamp(gl_FragData[0].a,0.0,1.0)*255.0+0.5);
                        if(ssi.z==0.0)
                        {
                            if(av*ssi.x+ssi.y<0.0) discard;
                        }
                        else
                        {
                            if(ssi.x>0.0)
                            {
                                if(av==ssi.y) discard;
                            }
                            else
                            {
                                if(av!=ssi.y) discard;
                            }
                        }
                        if(ssv<0.0)discard;
                        #endif
                    }

               `
            },
            states: {
                [RS_ZENABLE]: 0,
                [RS_ZWRITEENABLE]: 0,
                [RS_ZFUNC]: CMP_ALWAYS
            }
        }
    }
};

