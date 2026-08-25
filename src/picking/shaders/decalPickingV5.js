import { RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE, CMP_LEQUAL, CULL_CW } from "constant";
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

const vs = `
attribute vec4 attr0;
attribute vec4 attr1;

uniform vec4 cb1[24];
uniform vec4 cb3[26];

varying vec4 texcoord;

void main()
{
    vec4 position = vec4(attr0.xyz, 1.0);

    vec4 world;
    world.x = dot(position, cb3[0]);
    world.y = dot(position, cb3[1]);
    world.z = dot(position, cb3[2]);
    world.w = dot(position, cb3[3]);

    gl_Position.x = dot(world, cb1[4]);
    gl_Position.y = dot(world, cb1[5]);
    gl_Position.z = dot(world, cb1[6]);
    gl_Position.w = dot(world, cb1[7]);

    texcoord.xy = attr1.xy;
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
precision highp float;

uniform sampler2D DecalTransparencyMap;

// (material, pattern, paint, unused). Decals use .y, the pattern threshold -
// coverage is a plain 0..1 mask, the same shape as a pattern mask.
uniform vec4 PickingThreshold;

// (areaType, areaIndex, unused, unused), set per decal by the picker.
uniform vec4 PickingArea;

varying vec4 texcoord;

${GLSL_PACK}

void main()
{
    // Clamped rather than wrapped. The shipped shader addresses this map with a
    // BORDER mode, so a decal does not tile - sampling outside its own UVs must
    // read as "no coverage" and not as a repeat of the logo.
    vec2 uv = clamp(texcoord.xy, 0.0, 1.0);

    if (uv.x != texcoord.x || uv.y != texcoord.y) discard;

    float coverage = texture2D(DecalTransparencyMap, uv).x;

    // Discard, so the hull underneath keeps the pixel. See the file header.
    if (coverage <= PickingThreshold.y) discard;

    gl_FragColor = cjsPackPicking(
        ${PickingMaterial.DECAL}.0,
        PickingArea.x,
        ${kind}.0,
        PickingArea.y
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
                    inputDefinitions: [
                        { usage: "POSITION", usageIndex: 0, elements: 3 },
                        { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
                    ],
                    shader: vs
                },
                ps: {
                    shader: makePs(kind)
                },
                // Depth EQUAL-or-less against the hull already drawn, so a decal
                // wins its pixel where it covers. It writes depth too, so two
                // overlapping decals resolve by depth rather than by draw order.
                states: {
                    [RS_ZENABLE]: 1,
                    [RS_ZWRITEENABLE]: 1,
                    [RS_ZFUNC]: CMP_LEQUAL,
                    [RS_CULLMODE]: CULL_CW
                }
            }
        }
    };
}

export const decalPickingV5 = makeDefinition("decalpickingv5", PickingShaderKind.DECAL);
export const decalCounterPickingV5 = makeDefinition("decalcounterpickingv5", PickingShaderKind.DECAL_COUNTER);
export const decalCylindricPickingV5 = makeDefinition("decalcylindricpickingv5", PickingShaderKind.DECAL_CYLINDRIC);
export const decalGlowPickingV5 = makeDefinition("decalglowpickingv5", PickingShaderKind.DECAL_GLOW);
export const decalGlowCylindricPickingV5 = makeDefinition("decalglowcylindricpickingv5", PickingShaderKind.DECAL_GLOW_CYLINDRIC);
export const decalHolePickingV5 = makeDefinition("decalholepickingv5", PickingShaderKind.DECAL_HOLE);
