import { vs, ps } from "../shared";
import { precision } from "../shared/func";

// Native traffic.sm_hi DXBC has two passes: lights and rear-facing boosters.
// Ported from its instruction stream. GLES uses MiscSettings at cb1[33]
// instead of cb1[45], and the standard GLES clip conversion. Its shipped
// fragment shader has no volumetric fog; retain that GLES contract here.
const inputDefinitions = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "POSITION", usageIndex: 8, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 8, elements: 4 }
];
const constants = [
    { name: "TextureProperties", value: [ 64, 3, 1, 1 ] },
    { name: "SpriteSizes", value: [ 1, 1, 4, 0.5 ] },
    { name: "SpriteProperties", value: [ 0.8, 0.02, 1000, 1 ] }
];
const sampler = {
    filterMode: 3, mipFilterMode: 2, magFilterMode: 2,
    addressUMode: 3, addressVMode: 3, addressWMode: 3, maxAnisotropy: 16
};
const positionMap = {
    name: "PositionMap", type: 2,
    sampler: { ...sampler, name: "PositionMapSampler" }
};
const fragment = {
    textures: [ {
        name: "TexMap", type: 2,
        sampler: { ...sampler, name: "TexMapSampler", addressUMode: 1, addressVMode: 1 }
    } ],
    shader: `
        ${precision}
        varying vec4 color;
        varying vec2 texcoord;
        uniform sampler2D s0;
        ${ps.shadowHeader}
        void main()
        {
            vec4 texel = texture2D(s0, texcoord);
            gl_FragData[0] = vec4(texel.rgb * color.rgb, 1.0) * texel.a;
            ${ps.shadowFooter}
        }
    `
};

function vertex(booster)
{
    return {
        inputDefinitions,
        textures: [ positionMap ],
        constants: [ ...constants, ...(booster ? [
            { name: "BoosterColor", value: [ 1, 1, 1, 1 ] }
        ] : [
            { name: "GlowColor1", value: [ 1, 1, 1, 1 ] },
            { name: "GlowColor2", value: [ 1, 1, 1, 1 ] }
        ]) ],
        shader: `
            attribute vec3 attr0;
            attribute vec2 attr1;
            attribute vec4 attr2;
            attribute vec4 attr3;
            varying vec4 color;
            varying vec2 texcoord;
            uniform vec4 cb0[${booster ? 4 : 5}];
            uniform vec4 cb1[34];
            uniform vec4 cb3[4];
            uniform highp sampler2D vs0;
            uniform vec3 ssyf;
            ${vs.shadowHeader}

            vec3 samplePosition(float phase, vec3 rows)
            {
                return vec3(
                    texture2DLod(vs0, vec2(phase, rows.x), 0.0).r,
                    texture2DLod(vs0, vec2(phase, rows.y), 0.0).r,
                    texture2DLod(vs0, vec2(phase, rows.z), 0.0).r);
            }

            void main()
            {
                // DXBC uses signed fractional remainder for the path index.
                float row = attr2.w * 3.0 / cb0[0].y;
                row = (row >= 0.0 ? 1.0 : -1.0) * fract(abs(row));
                vec3 rows = (row * cb0[0].y + vec3(0.5, 1.5, 2.5)) / cb0[0].y;
                float phase = fract(attr3.y * cb0[0].z * cb1[33].x + attr3.w);
                vec3 position = samplePosition(phase, rows);
                ${booster ? `
                float previousPhase = fract(phase - sign(attr3.y) / cb0[0].x);
                vec3 direction = normalize(samplePosition(previousPhase, rows) - position);
                // Native quirk: this dot uses the local path direction directly.
                float facing = clamp(dot(cb1[2].xyz, direction), 0.0, 1.0);
                vec2 corner = facing * attr3.x * attr0.xy * cb0[1].zw;
                ` : `
                vec2 corner = attr0.xy * attr3.x * cb0[1].xy;
                `}
                vec4 local = vec4(position + cb0[0].w * attr2.xyz, 1.0);
                vec4 world = vec4(dot(local, cb3[0]), dot(local, cb3[1]), dot(local, cb3[2]), dot(local, cb3[3]));
                vec4 view = vec4(dot(world, cb1[8]), dot(world, cb1[9]), dot(world, cb1[10]), dot(world, cb1[11]));
                float size = exp2(log2(abs(view.z)) * cb0[2].x) * cb0[2].y;
                view.xy += corner * size;
                gl_Position = vec4(dot(view, cb1[12]), dot(view, cb1[13]), dot(view, cb1[14]), dot(view, cb1[15]));
                float fade = clamp(-cb0[2].z / view.z, 0.0, 1.0);
                color = fade * ${booster ? "cb0[3]" : "(cb0[3].xyzz + attr3.z * (cb0[4].xyzz - cb0[3].xyzz))"};
                texcoord = attr1;
                ${vs.shadowFooter}
            }
        `
    };
}

export const traffic = {
    name: "traffic",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/fx/traffic/traffic",
    techniques: {
        Main: { passes: [ { vs: vertex(false), ps: fragment }, { vs: vertex(true), ps: fragment } ] }
    }
};
