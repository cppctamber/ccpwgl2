
export const shadowHeader = `

    #ifdef PS
    uniform vec4 ssf[4];
    varying float ssv;
    #endif

`;

export const shadowFooter = `

    #ifdef PS
    ssv=dot(ssf[0],gl_Position);
    #endif
    
    gl_Position.xy+=ssyf.xy*gl_Position.w;
    gl_Position.y*=ssyf.z;
    gl_Position.z=gl_Position.z*2.0-gl_Position.w;

`;