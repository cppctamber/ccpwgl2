import { PosTex } from "../../shared/input";

export const post = {
    inputDefinitions: PosTex,
    shader: `
        
        attribute vec4 attr0;
        attribute vec4 attr1;
        
        varying vec2 uv;
    
        void main()
        {
            vec4 v0;
            vec4 v1;
            v0=attr0;
            v1=attr1;
            gl_Position=v0;
            uv.xy=v1.xy;
        }
    `
};
