
export const shadowHeader = `

    #ifdef PS
    uniform vec4 ssi;
    varying float ssv;
    #endif
    
`;

export const shadowFooter = `

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
    
`;