import { vs, ps } from "./shared";
import { TextureMap_ClampBorder } from "../shared/texture";
import { createLinearColor, overrideTex, WrapMode } from "../shared/util";

/**
 * GLES replacement for the DX11-only QuadSimpleInstancedLight effect.
 * Derived from build 3494416, BINDLESS_RENDERING_DISABLED, Main.
 * Only UV0 reaches the pixel shader; the native VS's other varyings are unused.
 */
export const quadSimpleInstancedLight = {
    name: "quadSimpleInstancedLight",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/fx/quadsimpleinstancedlight",
    techniques: {
        Main: {
            vs: vs.quadInstancedV5_PosTexTexTexTex,
            ps: {
                constants: [
                    createLinearColor({ name: "OuterGlow", ui: { group: "Color" } }),
                    createLinearColor({ name: "InnerGlow", ui: { group: "Color" } })
                ],
                textures: [ overrideTex(TextureMap_ClampBorder, {
                    isSRGB: 0,
                    sampler: {
                        addressUMode: WrapMode.CLAMP_TO_EDGE,
                        addressVMode: WrapMode.CLAMP_TO_EDGE,
                        addressWMode: WrapMode.CLAMP_TO_EDGE,
                        maxAnisotropy: 16
                    }
                }) ],
                shader: `
                    ${ps.header}
                    varying vec4 texcoord1;
                    uniform sampler2D s0;
                    uniform vec4 cb7[2];
                    uniform vec4 cb2[22];

                    void main()
                    {
                        vec3 texel = texture2D(s0, texcoord1.xy, cb2[21].y).rgb;
                        // Native DXBC uses xyzz for both colours and texture:
                        // alpha is the blue result, not either colour's alpha.
                        vec4 outer = texel.rgbb * cb7[0].rgbb;
                        vec4 inner = texel.rgbb * cb7[1].rgbb;
                        gl_FragData[0] = outer + texel.b * (inner - outer);
                        ${ps.shadowFooter}
                    }
                `
            }
        }
    }
};
