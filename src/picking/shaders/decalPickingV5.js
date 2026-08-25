import {
    RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE,
    RS_ALPHABLENDENABLE, RS_ALPHATESTENABLE,
    CMP_LEQUAL, CULL_CW
} from "constant";
import { precision } from "../../toDeprecate/shaders/shared/func";
import {
    PickingThreshold, PatternBlendMode, PickingArea, PickingInclude, PickingPresence,
    DecalTransparencyMap
} from "./pickingInputs";
import { GLSL_PACK, PickingMaterial, PickingShaderKind } from "./materialResolve";


/**
 * Material picking for the `decals/v5` family.
 *
 * A decal is NOT a material layer - it is separate geometry drawn over the hull
 * - so it reports `PickingMaterial.DECAL` with its kind in the shader-kind
 * channel and its index in the area channel. A caller that gets `DECAL` back
 * knows the drop landed on a decal rather than on the surface beneath it, and
 * which one.
 *
 * ## One implementation, six kinds
 *
 * All six plain decal shaders bind `DecalTransparencyMap`, and that map alone
 * decides where a decal covers. The rest of what they bind - glow, hole,
 * cylindric projection, counter digits - changes how a decal LOOKS, never where
 * it IS. So picking needs one shader body, parameterised by which kind reports.
 *
 * ## It DISCARDS, unlike the quad shaders
 *
 * A quad shader writes every pixel it draws. A decal must not: it covers only
 * part of its own geometry, and where it is transparent the hull underneath is
 * what the user is pointing at. Writing the whole decal quad would make a small
 * logo pick as a large rectangle.
 *
 * ## Coverage
 *
 * `DecalTransparencyMap.x`, taken at the decal mesh's own `TEXCOORD0` - decals
 * carry their own UVs rather than being projected like the hull patterns are.
 * The shipped shader multiplies it by an intensity before writing alpha; that
 * is deliberately NOT applied here, for the same reason paint influence is not:
 * a decal faded down is still exactly where it was, and a picker should find it.
 */

/**
 * A decal's own per-object layout, which is NOT the hull's.
 *
 * `EveSpaceObjectDecal.perObjectData` in vec4 registers: worldMatrix 0-3,
 * invWorldMatrix 4-7, decalMatrix 8-11, invDecalMatrix 12-15,
 * parentBoneMatrix 16-19, invParentBoneMatrix 20-23.
 *
 * Two things follow, and the first version of this shader got both wrong.
 *
 * A decal is drawn as a SUBSET OF THE HULL'S TRIANGLES with a swapped index
 * buffer - `EveSpaceObjectDecal.Render` re-renders hull geometry - so its
 * vertices carry the hull's UVs, not the decal's. The decal's own UV is
 * PROJECTED: the shipped stage computes `dot(vec4(pos,1), cb3[13])` and
 * `cb3[14])`, rows one and two of the inverse decal matrix (rows one and two
 * because it arrives transposed, the same convention the hull patterns use),
 * and the pixel stage maps it with `(1 + uv) * 0.5`.
 *
 * Sampling the hull UV instead reads the transparency map somewhere else
 * entirely, which is a decal-shaped hole in the wrong place.
 *
 * And the world transform runs through the PARENT BONE first: `cb3[16..19]`
 * combined with `cb3[0..3]`, exactly as the shipped stage does it. Using
 * `cb3[0..3]` alone puts the decal at the hull's origin rather than on its
 * surface.
 * @type {String}
 */
const vs = `
attribute vec4 attr0;

uniform vec4 cb1[24];
uniform vec4 cb3[24];

varying vec4 texcoord;

void main()
{
    vec4 position = vec4(attr0.xyz, 1.0);

    vec4 b0 = cb3[16];
    vec4 b1 = cb3[17];
    vec4 b2 = cb3[18];
    vec4 b3 = cb3[19];

    vec4 wx = b0 * cb3[0].xxxx + b1 * cb3[0].yyyy + b2 * cb3[0].zzzz + b3 * cb3[0].wwww;
    vec4 wy = b0 * cb3[1].xxxx + b1 * cb3[1].yyyy + b2 * cb3[1].zzzz + b3 * cb3[1].wwww;
    vec4 wz = b0 * cb3[2].xxxx + b1 * cb3[2].yyyy + b2 * cb3[2].zzzz + b3 * cb3[2].wwww;
    vec4 ww = b0 * cb3[3].xxxx + b1 * cb3[3].yyyy + b2 * cb3[3].zzzz + b3 * cb3[3].wwww;

    vec4 world = vec4(dot(position, wx), dot(position, wy), dot(position, wz), dot(position, ww));

    gl_Position.x = dot(world, cb1[4]);
    gl_Position.y = dot(world, cb1[5]);
    gl_Position.z = dot(world, cb1[6]);
    gl_Position.w = dot(world, cb1[7]);

    // The decal's own UV, projected - see the note above.
    texcoord.xy = (vec2(dot(position, cb3[13]), dot(position, cb3[14])) + vec2(1.0)) * vec2(0.5);
    texcoord.zw = vec2(0.0);
}
`;

/**
 * @param {Number} kind - a {@link PickingShaderKind} decal value
 * @returns {String}
 */
function makePs(kind)
{
    return `
${precision}

uniform sampler2D s0;            // DecalTransparencyMap

uniform vec4 cb7[5];             // threshold, blendMode, area, include, presence

varying vec4 texcoord;

${GLSL_PACK}

void main()
{
    // Excluded decals do not draw at all, so the hull underneath keeps the
    // pixel - the same fall-through the material layers get.
    if (cb7[3].w <= 0.5) discard;

    // Clamped rather than wrapped. The shipped shader addresses this map with a
    // BORDER mode, so a decal does not tile - sampling outside its own UVs must
    // read as "no coverage" and not as a repeat of the logo.
    vec2 uv = clamp(texcoord.xy, 0.0, 1.0);

    if (uv.x != texcoord.x || uv.y != texcoord.y) discard;

    // Presence-gated: a decal with no transparency map covers its whole quad,
    // rather than reading an unbound sampler and discarding - or not - by
    // whatever was last left in the unit.
    float coverage = mix(1.0, texture2D(s0, uv).x, cb7[4].z);

    // Discard, so the hull underneath keeps the pixel. See the file header.
    if (coverage <= cb7[0].y) discard;

    gl_FragColor = cjsPackPicking(
        ${PickingMaterial.DECAL}.0,
        cb7[2].x,
        ${kind}.0,
        cb7[2].y
    );
}
`;
}

/**
 * @param {String} name
 * @param {Number} kind
 * @returns {Object}
 */
function makeDefinition(name, kind)
{
    return {
        name,
        description: "material picking for the " + name.replace("picking", "") + " family",
        techniques: {
            Main: {
                vs: {
                    // POSITION only: the decal UV is projected in the shader, so
                    // the hull TEXCOORD the vertices carry is of no use here.
                    inputDefinitions: [
                        { usage: "POSITION", usageIndex: 0, elements: 3 }
                    ],
                    shader: vs
                },
                ps: {
                    // POSITIONAL binding - the order here IS the cb7 index and the
                    // s# order. A named uniform would link and never be written.
                    constants: [ PickingThreshold, PatternBlendMode, PickingArea, PickingInclude, PickingPresence ],
                    textures: [ DecalTransparencyMap ],
                    shader: makePs(kind)
                },
                // Depth EQUAL-or-less against the hull already drawn, so a decal
                // wins its pixel where it covers. It writes depth too, so two
                // overlapping decals resolve by depth rather than by draw order.
                states: {
                    [RS_ZENABLE]: 1,
                    [RS_ZWRITEENABLE]: 1,
                    [RS_ZFUNC]: CMP_LEQUAL,
                    [RS_CULLMODE]: CULL_CW,

                    // Declared rather than inherited - blending a packed nibble
                    // would corrupt the id rather than merely dim it.
                    [RS_ALPHABLENDENABLE]: 0,
                    [RS_ALPHATESTENABLE]: 0
                }
            }
        }
    };
}

export const decalPickingV5 = makeDefinition("cjspickingdecalv5", PickingShaderKind.DECAL);
export const decalCounterPickingV5 = makeDefinition("cjspickingdecalcounterv5", PickingShaderKind.DECAL_COUNTER);
export const decalCylindricPickingV5 = makeDefinition("cjspickingdecalcylindricv5", PickingShaderKind.DECAL_CYLINDRIC);
export const decalGlowPickingV5 = makeDefinition("cjspickingdecalglowv5", PickingShaderKind.DECAL_GLOW);
export const decalGlowCylindricPickingV5 = makeDefinition("cjspickingdecalglowcylindricv5", PickingShaderKind.DECAL_GLOW_CYLINDRIC);
export const decalHolePickingV5 = makeDefinition("cjspickingdecalholev5", PickingShaderKind.DECAL_HOLE);
