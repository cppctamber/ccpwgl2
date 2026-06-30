import { precision } from "../shared/func";


export const ubershaderdistortion = {
    name: "ubershaderdistortion",
    replaces: "graphics/effect.gles2/managed/space/specialfx/ubershaderdistortion",
    description: "Temporary transparent replacement for the broken server ubershaderdistortion shader",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: [],
                shader: `

                    uniform vec3 ssyf;

                    void main()
                    {
                        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
                        gl_Position.xy += ssyf.xy * gl_Position.w;
                        gl_Position.y *= ssyf.z;
                        gl_Position.z = gl_Position.z * 2.0 - gl_Position.w;
                    }
                `
            },
            ps: {
                shader: `

                    ${precision}

                    void main()
                    {
                        gl_FragData[0] = vec4(0.0);
                    }
                `
            }
        }
    }
};