import { vs } from "./shared";
import { TextureMap } from "../shared/texture";
import { G_TEXEL_SIZE } from "../shared/constant";

export const pp_background_image = {
    name: "pp_background_image",
    techniques: {
        Main: {
            vs: vs.post,
            ps: {
                textures: {
                    TextureMap
                },
                constants: {
                    G_TEXEL_SIZE,
                },
                shader: `
                
                
                `
            }
        }
    }
};