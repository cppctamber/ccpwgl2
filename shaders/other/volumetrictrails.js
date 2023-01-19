import { precision, saturate } from "../shared/func";

const vs = `

    //volumetrictrails.sm_hi
    
    attribute vec4 attr0; // Position
    attribute vec4 attr1; // Texcoord
    attribute vec4 attr2; // Texcoord
    
    varying vec4 texcoord;
    varying vec4 texcoord1;
    varying vec4 texcoord2;
    varying vec4 texcoord3;
    varying vec4 texcoord4;
    varying vec4 texcoord5;
    varying vec4 texcoord6;
    
    ${saturate}
    
    uniform vec4 cb0[1];
    uniform vec4 cb1[15];
    uniform vec4 cb3[15];
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
        vec4 r0;
        vec4 r1;
        vec4 r10;
        vec4 r2;
        vec4 r3;
        vec4 r4;
        vec4 r5;
        vec4 r6;
        vec4 r7;
        vec4 r8;
        vec4 r9;
        ivec4 a0;
        
        vec4 c1=vec4(-1,1,2,-0.5);
        vec4 c2=vec4(100.5,0.00999999978,0,1);
        vec4 c3=vec4(3,2,-0.5,0.5);
        vec4 c4=vec4(-0.300000012,-0.100000001,-0.200000003,0);
        
        v0=attr0;
        v1=attr1;
        v2=attr2;
        
        r0.w=cb0[0].x*v2.w; // width ?
        r1.xyz=c1.xyz+v0.zzz;
        r2.xyz=cb3[5].xyz;
        r2.xyz=r2.xyz+(-cb3[10].xyz);
        
        if((r1.x<c1.w))
        {
            r3.xyz=r2.xyz;
        }
        else
        {
            if((c2.x<r1.x))
            {
                r4.xyz=cb3[9].xyz;
                r3.xyz=r4.xyz+cb3[14].xyz;
            }
            else
            {
                r1.x=saturate(r1.x*c2.y);
                r1.x=r1.x+(-cb3[6].w);
                r1.w=1.0/cb3[6].w;
                r1.w=r1.w*r1.x;
                r4.z=c2.z;
                r2.w=r4.z<cb3[6].w?1.0:0.0;
                r5.w=r2.w*r1.w+c1.y;
                r1.w=r1.x+(-cb3[7].w);
                r2.w=1.0/cb3[7].w;
                r2.w=r1.w*r2.w;
                r3.w=r4.z<cb3[7].w?1.0:0.0;
                r5.y=r3.w*r2.w+c1.y;
                r2.w=r1.w+(-cb3[8].w);
                r3.w=1.0/cb3[8].w;
                r3.w=r2.w*r3.w;
                r4.x=r4.z<cb3[8].w?1.0:0.0;
                r6.w=r4.x*r3.w+c1.y;
                r3.w=1.0/cb3[9].w;
                r3.w=r2.w*r3.w;
                r4.x=r4.z<cb3[9].w?1.0:0.0;
                r6.y=r3.w*r4.x;
                {
                    bvec4 tmp=greaterThanEqual(c2.zzzz,r1);
                    r1.xw=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xw;
                };
                r2.w=c2.z>=r2.w?1.0:0.0;
                ;
                r6.xz=c3.xy;
                r4.xy=mix(r6.xy,r6.zw,r2.ww);
                r5.xz=c2.wz;
                r6.xy=mix(r4.xy,r5.xy,r1.ww);
                r4.xy=mix(r6.xy,r5.zw,r1.xx);
                r1.x=r4.y*r4.y;
                a0.x=int(r4.x+0.5);
                r4.x=c3.x;
                r5.xyz=r4.xxx*cb3[5+a0.x].xyz;
                r4.xzw=cb3[6+a0.x].xyz*r4.xxx+(-r5.xyz);
                r5.z=c1.z;
                r4.xzw=cb3[10+a0.x].xyz*(-r5.zzz)+r4.xzw;
                r4.xzw=cb3[11+a0.x].xyz*(-cb3[11+a0.x].www)+r4.xzw;
                r4.xzw=r1.xxx*r4.xzw;
                r5.xyw=cb3[6+a0.x].xyz+cb3[6+a0.x].xyz;
                r5.xyz=cb3[5+a0.x].xyz*r5.zzz+(-r5.xyw);
                r5.xyz=cb3[11+a0.x].xyz*cb3[11+a0.x].www+r5.xyz;
                r5.xyz=r5.xyz+cb3[10+a0.x].xyz;
                r5.xyz=r1.xxx*r5.xyz;
                r4.xzw=r5.xyz*r4.yyy+r4.xzw;
                r4.xyz=cb3[10+a0.x].xyz*r4.yyy+r4.xzw;
                r3.xyz=r4.xyz+cb3[5+a0.x].xyz;
            }
        }
        
        if((v0.z<c1.w))
        {
            r4.xyz=r2.xyz;
        }
        else
        {
            if((c2.x<v0.z))
            {
                r5.xyz=cb3[9].xyz;
                r4.xyz=r5.xyz+cb3[14].xyz;
            }
            else{
                r1.x=saturate(c2.y*v0.z);
                r1.x=r1.x+(-cb3[6].w);
                r1.w=1.0/cb3[6].w;
                r1.w=r1.w*r1.x;
                r5.z=c2.z;
                r2.w=r5.z<cb3[6].w?1.0:0.0;
                r6.w=r2.w*r1.w+c1.y;
                r1.w=r1.x+(-cb3[7].w);
                r2.w=1.0/cb3[7].w;
                r2.w=r1.w*r2.w;
                r3.w=r5.z<cb3[7].w?1.0:0.0;
                r6.y=r3.w*r2.w+c1.y;
                r2.w=r1.w+(-cb3[8].w);
                r3.w=1.0/cb3[8].w;
                r3.w=r2.w*r3.w;
                r4.w=r5.z<cb3[8].w?1.0:0.0;
                r7.w=r4.w*r3.w+c1.y;
                r3.w=1.0/cb3[9].w;
                r3.w=r2.w*r3.w;
                r4.w=r5.z<cb3[9].w?1.0:0.0;
                r7.y=r3.w*r4.w;
                {
                    bvec4 tmp=greaterThanEqual(c2.zzzz,r1);
                    r1.xw=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xw;
                }
                ;
                    r2.w=c2.z>=r2.w?1.0:0.0;
                ;
                    r7.xz=c3.xy;
                r5.xy=mix(r7.xy,r7.zw,r2.ww);
                r6.xz=c2.wz;
                r7.xy=mix(r5.xy,r6.xy,r1.ww);
                r5.xy=mix(r7.xy,r6.zw,r1.xx);
                r1.x=r5.y*r5.y;
                a0.x=int(r5.x+0.5);
                r5.x=c3.x;
                r6.xyz=r5.xxx*cb3[5+a0.x].xyz;
                r5.xzw=cb3[6+a0.x].xyz*r5.xxx+(-r6.xyz);
                r6.z=c1.z;
                r5.xzw=cb3[10+a0.x].xyz*(-r6.zzz)+r5.xzw;
                r5.xzw=cb3[11+a0.x].xyz*(-cb3[11+a0.x].www)+r5.xzw;
                r5.xzw=r1.xxx*r5.xzw;
                r6.xyw=cb3[6+a0.x].xyz+cb3[6+a0.x].xyz;
                r6.xyz=cb3[5+a0.x].xyz*r6.zzz+(-r6.xyw);
                r6.xyz=cb3[11+a0.x].xyz*cb3[11+a0.x].www+r6.xyz;
                r6.xyz=r6.xyz+cb3[10+a0.x].xyz;
                r6.xyz=r1.xxx*r6.xyz;
                r5.xzw=r6.xyz*r5.yyy+r5.xzw;
                r5.xyz=cb3[10+a0.x].xyz*r5.yyy+r5.xzw;
                r4.xyz=r5.xyz+cb3[5+a0.x].xyz;
            }
        }
        
        if((r1.y<c1.w))
        {
            r5.xyz=r2.xyz;
        }
        else
        {
            if((c2.x<r1.y))
            {
                r6.xyz=cb3[9].xyz;
                r5.xyz=r6.xyz+cb3[14].xyz;
            }
            else{
                r1.x=saturate(r1.y*c2.y);
                r1.x=r1.x+(-cb3[6].w);
                r1.y=1.0/cb3[6].w;
                r1.y=r1.y*r1.x;
                r6.z=c2.z;
                r1.w=r6.z<cb3[6].w?1.0:0.0;
                r7.w=r1.w*r1.y+c1.y;
                r1.y=r1.x+(-cb3[7].w);
                r1.w=1.0/cb3[7].w;
                r1.w=r1.w*r1.y;
                r2.w=r6.z<cb3[7].w?1.0:0.0;
                r7.y=r2.w*r1.w+c1.y;
                r1.w=r1.y+(-cb3[8].w);
                r2.w=1.0/cb3[8].w;
                r2.w=r1.w*r2.w;
                r3.w=r6.z<cb3[8].w?1.0:0.0;
                r8.w=r3.w*r2.w+c1.y;
                r2.w=1.0/cb3[9].w;
                r2.w=r1.w*r2.w;
                r3.w=r6.z<cb3[9].w?1.0:0.0;
                r8.y=r2.w*r3.w;
                {
                    bvec4 tmp=greaterThanEqual(c2.zzzz,r1);
                    r1.xyw=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xyw;
                }
                ;
                    r8.xz=c3.xy;
                r6.xy=mix(r8.xy,r8.zw,r1.ww);
                r7.xz=c2.wz;
                r8.xy=mix(r6.xy,r7.xy,r1.yy);
                r6.xy=mix(r8.xy,r7.zw,r1.xx);
                r1.x=r6.y*r6.y;
                a0.x=int(r6.x+0.5);
                r6.x=c3.x;
                r7.xyz=r6.xxx*cb3[5+a0.x].xyz;
                r6.xzw=cb3[6+a0.x].xyz*r6.xxx+(-r7.xyz);
                r7.z=c1.z;
                r6.xzw=cb3[10+a0.x].xyz*(-r7.zzz)+r6.xzw;
                r6.xzw=cb3[11+a0.x].xyz*(-cb3[11+a0.x].www)+r6.xzw;
                r6.xzw=r1.xxx*r6.xzw;
                r7.xyw=cb3[6+a0.x].xyz+cb3[6+a0.x].xyz;
                r7.xyz=cb3[5+a0.x].xyz*r7.zzz+(-r7.xyw);
                r7.xyz=cb3[11+a0.x].xyz*cb3[11+a0.x].www+r7.xyz;
                r7.xyz=r7.xyz+cb3[10+a0.x].xyz;
                r1.xyw=r1.xxx*r7.xyz;
                r1.xyw=r1.xyw*r6.yyy+r6.xzw;
                r1.xyw=cb3[10+a0.x].xyz*r6.yyy+r1.xyw;
                r5.xyz=r1.xyw+cb3[5+a0.x].xyz;
            }
        }
        if((r1.z<c1.w))
        {
        
        }
        else
        {
            if((c2.x<r1.z))
            {
                r6.xyz=cb3[9].xyz;
                r2.xyz=r6.xyz+cb3[14].xyz;
            }
            else
            {
                r1.x=saturate(r1.z*c2.y);
                r1.x=r1.x+(-cb3[6].w);
                r1.y=1.0/cb3[6].w;
                r1.y=r1.y*r1.x;
                r1.z=c2.z;
                r1.w=r1.z<cb3[6].w?1.0:0.0;
                r6.w=r1.w*r1.y+c1.y;
                r1.y=r1.x+(-cb3[7].w);
                r1.w=1.0/cb3[7].w;
                r1.w=r1.w*r1.y;
                r2.w=r1.z<cb3[7].w?1.0:0.0;
                r6.y=r2.w*r1.w+c1.y;
                r1.w=r1.y+(-cb3[8].w);
                r2.w=1.0/cb3[8].w;
                r2.w=r1.w*r2.w;
                r3.w=r1.z<cb3[8].w?1.0:0.0;
                r7.w=r3.w*r2.w+c1.y;
                r2.w=1.0/cb3[9].w;
                r2.w=r1.w*r2.w;
                r1.z=r1.z<cb3[9].w?1.0:0.0;
                r7.y=r2.w*r1.z;
                {
                    bvec4 tmp=greaterThanEqual(c2.zzzz,r1.xyww);
                    r1.xyz=(vec4(tmp.x?1.0:0.0,tmp.y?1.0:0.0,tmp.z?1.0:0.0,tmp.w?1.0:0.0)).xyz;
                }
                ;
                    r7.xz=c3.xy;
                r8.xy=mix(r7.xy,r7.zw,r1.zz);
                r6.xz=c2.wz;
                r7.xy=mix(r8.xy,r6.xy,r1.yy);
                r8.xy=mix(r7.xy,r6.zw,r1.xx);
                r1.x=r8.y*r8.y;
                a0.x=int(r8.x+0.5);
                r6.x=c3.x;
                r1.yzw=r6.xxx*cb3[5+a0.x].xyz;
                r1.yzw=cb3[6+a0.x].xyz*r6.xxx+(-r1.yzw);
                r6.z=c1.z;
                r1.yzw=cb3[10+a0.x].xyz*(-r6.zzz)+r1.yzw;
                r1.yzw=cb3[11+a0.x].xyz*(-cb3[11+a0.x].www)+r1.yzw;
                r1.yzw=r1.yzw*r1.xxx;
                r6.xyw=cb3[6+a0.x].xyz+cb3[6+a0.x].xyz;
                r6.xyz=cb3[5+a0.x].xyz*r6.zzz+(-r6.xyw);
                r6.xyz=cb3[11+a0.x].xyz*cb3[11+a0.x].www+r6.xyz;
                r6.xyz=r6.xyz+cb3[10+a0.x].xyz;
                r6.xyz=r1.xxx*r6.xyz;
                r1.xyz=r6.xyz*r8.yyy+r1.yzw;
                r1.xyz=cb3[10+a0.x].xyz*r8.yyy+r1.xyz;
                r2.xyz=r1.xyz+cb3[5+a0.x].xyz;
            }
        }
        
        r1.xyz=(-r5.xyz)+r2.xyz;
        r2.z=cb0[0].y+v2.z; // offset * z ?
        r2.xy=v2.xy;
        r6.z=dot(r2.xyz,cb3[2].xyz);
        r6.x=dot(r2.xyz,cb3[0].xyz);
        r6.y=dot(r2.xyz,cb3[1].xyz);
        r2.xyz=r4.xyz+r6.xyz;
        r5.xyz=(-r4.xyz)+r5.xyz;
        r2.xyz=r5.xyz*(-c1.www)+r2.xyz;
        r1.w=dot(r5.xyz,r5.xyz);
        r1.w=r1.w==0.0?3.402823466e+38:inversesqrt(abs(r1.w));
        r2.w=1.0/r1.w;
        texcoord1=r2;
        r3.xyz=(-r3.xyz)+r4.xyz;
        r5.xyz=r1.www*r5.xyz;
        r0.xyz=(-r5.xyz);
        texcoord2=r0;
        r1.w=dot(r3.xyz,r3.xyz);
        r1.w=r1.w==0.0?3.402823466e+38:inversesqrt(abs(r1.w));
        r3.xyz=r3.xyz*r1.www+r5.xyz;
        r1.w=r2.w+r2.w;
        r7.xy=r2.ww*c3.zw;
        r1.w=v1.x*r1.w+r7.x;
        r7.xz=r0.ww*v0.xy;
        r8.xyz=r5.yzx*c4.xyz;
        r8.xyz=r5.zxy*c4.zxy+(-r8.xyz);
        r9.xyz=normalize(r8.xyz);
        r8.xyz=r0.yzx*r9.zxy;
        r8.xyz=r9.yzx*r0.zxy+(-r8.xyz);
        r10.xyz=normalize(r8.xyz);
        r8.xyz=r7.zzz*r10.xyz;
        r7.xzw=r7.xxx*r9.xyz+r8.xyz;
        r7.xzw=r1.www*r5.xyz+r7.xzw;
        r4.xyz=r4.xyz+r7.xzw;
        r4.xyz=r6.xyz+r4.xyz;
        r4.w=c1.y;
        texcoord=r4;
        r6.xyz=normalize(r3.xyz);
        texcoord3.xyz=(-r6.xyz);
        r0.w=dot(r1.xyz,r1.xyz);
        r0.w=r0.w==0.0?3.402823466e+38:inversesqrt(abs(r0.w));
        r1.xyz=r1.xyz*r0.www+r5.xyz;
        r3.xyz=normalize(r1.xyz);
        r1.xyz=r7.yyy*(-r0.xyz)+r2.xyz;
        r0.w=dot(r1.xyz,r3.xyz);
        texcoord4.xyz=r3.xyz;
        gl_Position.x=dot(r4,cb1[4]);
        gl_Position.y=dot(r4,cb1[5]);
        gl_Position.z=dot(r4,cb1[6]);
        gl_Position.w=dot(r4,cb1[7]);
        r0.xyz=r7.yyy*r0.xyz+r2.xyz;
        r0.x=dot(r0.xyz,(-r6.xyz));
        texcoord3.w=(-r0.x);
        texcoord4.w=(-r0.w);
        r0.y=c1.y;
        r0.x=r0.y+cb1[14].z;
        r0.x=1.0/r0.x;
        r0.x=r0.x*cb1[14].w;
        texcoord5.w=(-r0.x);
        texcoord5.xyz=cb1[2].xyz;
        texcoord6.xzw=c2.yzz*v0.zzz;
        texcoord6.y=cb3[4].z;
        
        #ifdef PS
        ssv=dot(ssf[0],gl_Position);
        #endif
        gl_Position.xy += ssyf.xy*gl_Position.w;
        gl_Position.y*=ssyf.z;
        gl_Position.z=gl_Position.z*2.0-gl_Position.w;
    }

`;

const ps = `

    ${precision}
    ${saturate}

    varying vec4 texcoord;
    varying vec4 texcoord1;
    varying vec4 texcoord2;
    varying vec4 texcoord3;
    varying vec4 texcoord4;
    varying vec4 texcoord5;
    varying vec4 texcoord6;
    
    uniform vec4 cb2[4];
    uniform vec4 cb4[1];
    uniform vec4 cb7[2];
    
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
        vec4 r0;
        vec4 r1;
        vec4 r2;
        vec4 r3;
        vec4 r4;
        vec4 r5;
        vec4 r6;
        vec4 r7;
        vec4 c2=vec4(0.5,-0,-1,1);
        vec4 c3=vec4(0.00999999978,6.66666651,0.800000012,0.200000003);
        vec4 c4=vec4(10,1,0,0);
        v0=texcoord;
        v1=texcoord1;
        v2=texcoord2;
        v3=texcoord3;
        v4=texcoord4;
        v5=texcoord5;
        v6=texcoord6;
        r0.xyz=(-cb2[3].xyz)+v0.xyz;
        r1.xyz=normalize(r0.xyz);
        r0.xyz=v0.xyz;
        r0.xyz=v6.yyy*(-r1.xyz)+r0.xyz;
        r2.xyz=r0.xyz+(-v1.xyz);
        r0.w=dot(r2.xyz,v2.xyz);
        r2.xyz=r0.www*(-v2.xyz)+r2.xyz;
        r0.w=dot(r2.xyz,r2.xyz);
        r1.w=c2.x*v2.w;
        r0.w=r1.w*(-r1.w)+r0.w;
        r1.w=dot(r1.xyz,v2.xyz);
        r3.xyz=r1.www*(-v2.xyz)+r1.xyz;
        r1.w=dot(r3.xyz,r2.xyz);
        r2.x=dot(r3.xyz,r3.xyz);
        r2.y=1.0/r2.x;
        r0.w=r0.w*r2.y;
        r1.w=r1.w+r1.w;
        r2.x=r2.x+r2.x;
        r2.x=1.0/r2.x;
        r2.y=r1.w*r2.x;
        r0.w=r2.y*r2.y+(-r0.w);
        {
            bvec4 tmp=greaterThanEqual(r0.wwww,vec4(0.0));
            r3=vec4(tmp.x?c2.y:c2.z,tmp.y?c2.y:c2.z,tmp.z?c2.y:c2.z,tmp.w?c2.y:c2.z);
        }
        ;
            if(any(lessThan(r3,vec4(0.0))))discard;
            r0.w=sqrt(abs(r0.w));
        r2.y=r1.w*(-r2.x)+(-r0.w);
        r2.z=dot(v3.xyz,r1.xyz);
        r2.z=1.0/r2.z;
        r2.w=dot(v3.xyz,r0.xyz);
        r2.w=r2.w+v3.w;
        r2.z=r2.z*(-r2.w);
        r0.w=r1.w*(-r2.x)+r0.w;
        r3.xyz=r0.www*r1.xyz+r0.xyz;
        r2.xzw=r2.zzz*r1.xyz+r0.xyz;
        r4.xyz=(-r2.xzw)+r3.xyz;
        r4.y=dot(v3.xyz,r4.xyz);
        r5.xyz=r2.yyy*r1.xyz+r0.xyz;
        r6.xyz=(-r2.xzw)+r5.xyz;
        r4.x=dot(v3.xyz,r6.xyz);
        r4.zw=saturate(r4.xy);
        r0.w=r4.w*r4.z;
        {
            bvec4 tmp=greaterThanEqual((-r0.wwww),vec4(0.0));
            r6=vec4(tmp.x?c2.y:c2.z,tmp.y?c2.y:c2.z,tmp.z?c2.y:c2.z,tmp.w?c2.y:c2.z);
        }
        ;
            if(any(lessThan(r6,vec4(0.0))))discard;
            r0.w=dot(v4.xyz,r1.xyz);
        r0.w=1.0/r0.w;
        r1.w=dot(v4.xyz,r0.xyz);
        r1.w=r1.w+v4.w;
        r0.w=r0.w*(-r1.w);
        r0.xyz=r0.www*r1.xyz+r0.xyz;
        r6.xyz=(-r0.xyz)+r5.xyz;
        r6.x=dot(v4.xyz,r6.xyz);
        r7.xyz=(-r0.xyz)+r3.xyz;
        r6.y=dot(v4.xyz,r7.xyz);
        r4.zw=saturate(r6.xy);
        r0.w=r4.w*r4.z;
        {
            bvec4 tmp=greaterThanEqual((-r0.wwww),vec4(0.0));
            r7=vec4(tmp.x?c2.y:c2.z,tmp.y?c2.y:c2.z,tmp.z?c2.y:c2.z,tmp.w?c2.y:c2.z);
        }
        ;
            if(any(lessThan(r7,vec4(0.0))))discard;
        {
            bvec3 tmp=greaterThanEqual((-r4.yyy),vec3(0.0));
            r3.xyz=vec3(tmp.x?r3.x:r2.x,tmp.y?r3.y:r2.z,tmp.z?r3.z:r2.w);
        }
        ;
        {
            bvec3 tmp=greaterThanEqual((-r6.yyy),vec3(0.0));
            r3.xyz=vec3(tmp.x?r3.x:r0.x,tmp.y?r3.y:r0.y,tmp.z?r3.z:r0.z);
        }
        ;
        {
            bvec3 tmp=greaterThanEqual((-r4.xxx),vec3(0.0));
            r2.xyz=vec3(tmp.x?r5.x:r2.x,tmp.y?r5.y:r2.z,tmp.z?r5.z:r2.w);
        }
        ;
        {
            bvec3 tmp=greaterThanEqual((-r6.xxx),vec3(0.0));
            r0.xyz=vec3(tmp.x?r2.x:r0.x,tmp.y?r2.y:r0.y,tmp.z?r2.z:r0.z);
        }
        ;
            r0.w=dot(v5.xyz,r1.xyz);
        r0.w=1.0/r0.w;
        r0.w=r0.w*v5.w;
        r1.w=r0.w*r0.w;
        r2.xyz=r3.xyz+(-cb2[3].xyz);
        r2.w=dot(r1.xyz,r2.xyz);
        r2.w=r2.w>=0.0?(-c2.z):(-c2.y);
            r2.x=dot(r2.xyz,r2.xyz);
        r2.x=r2.x*(-r2.w)+r1.w;
        r2.yzw=r0.www*r1.xyz+cb2[3].xyz;
        {
            bvec3 tmp=greaterThanEqual(r2.xxx,vec3(0.0));
            r3.xyz=vec3(tmp.x?r2.y:r3.x,tmp.y?r2.z:r3.y,tmp.z?r2.w:r3.z);
        }
        ;
            r4.xyz=r0.xyz+(-cb2[3].xyz);
        r0.w=dot(r1.xyz,r4.xyz);
        r0.w=r0.w>=0.0?(-c2.z):(-c2.y);
            r2.x=dot(r4.xyz,r4.xyz);
        r0.w=r2.x*(-r0.w)+r1.w;
        {
            bvec3 tmp=greaterThanEqual(r0.www,vec3(0.0));
            r0.xyz=vec3(tmp.x?r2.y:r0.x,tmp.y?r2.z:r0.y,tmp.z?r2.w:r0.z);
        }
        ;
            r2.xyz=(-r3.xyz)+r0.xyz;
        r4.xyz=normalize(v2.xyz);
        r0.w=dot(r1.xyz,r4.xyz);
        r1.x=dot(r2.xyz,r2.xyz);
        r1.x=sqrt(abs(r1.x));
        r1.y=cb7[0].z*v6.y;
        r1.y=1.0/r1.y;
        r1.x=r1.y*r1.x;
        r1.x=r1.x*cb4[0].y;
        r0.w=(-abs(r0.w))+c2.w;
        r0.w=r0.w*c3.z+c3.w;
        r1.y=1.0/v1.w;
        r0.xyz=r3.xyz+r0.xyz;
        r0.xyz=r0.xyz*c2.xxx+(-v1.xyz);
        r0.x=dot(r0.xyz,v2.xyz);
        r0.x=r0.x*r1.y+c2.x;
        r0.x=(-r0.x)+c2.w;
        r0.x=r0.x*c3.x+v6.x;
        r0.y=saturate(r0.x*c3.y);
        r0.y=r0.y*r0.y;
        r0.x=(-r0.x)+c2.w;
        r1.y=pow(abs(r0.x),cb7[0].w);
        r2=r1.xxxx*cb7[1];
        r1=r1.yyyy*r2;
        r1=r0.yyyy*r1;
        r0=r0.wwww*r1;
        r1=max(r0,(-c2.yyyy));
        gl_FragData[0]=min(r1,c4.xxxy);
        
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