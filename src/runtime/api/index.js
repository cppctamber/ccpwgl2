/**
 * The object shapes an api service has to answer with.
 *
 * They live in the barrel rather than on `TnyApiService` because the facade
 * only forwards - the providers are what actually read these fields, and
 * `BuildSkinDna` in `TnySkinApiProvider` reads most of them by name. Keeping
 * the shapes beside both means neither side owns them.
 *
 * @module runtime/api
 */

/**
 * What `ResolveDna` gives back for a typeID.
 *
 * Consumed by `TnySpaceObject.resolve`, which uses `name` only when the caller
 * did not supply one.
 *
 * @typedef {Object} TnyDnaResolution
 * @property {String} dna    - a sof dna string
 * @property {String} [name] - a display name for the resolved type
 *
 * @see TnySkinDnaResolution for the extra fields a skinID adds
 */

/**
 * What `GenerateSkinrDna` and `GenerateSkinrDnaFromId` give back.
 *
 * `pattern` MUST arrive with the design rather than be fetched afterwards: sof
 * resolves pattern names while building, so a pattern registered late draws as
 * an unpatterned hull, which reads as the skin failing rather than as a
 * missing registration.
 *
 * `blendMode` cannot ride along in the dna, because Carbon compiles it in as a
 * permutation. Left out, a design falls back to overlay on the dx11 path while
 * gles2 - which reads it from a constant buffer - looks right, and the two
 * profiles disagree over one design.
 *
 * @typedef {Object} TnySkinrDesign
 * @property {String} dna         - a sof dna string
 * @property {String} [name]      - the design's name
 * @property {String} [blendMode] - a Carbon permutation blend mode name
 * @property {Object} [pattern]   - a skinrSofPattern document, hydrated by the provider
 */

/**
 * What `ResolveDna` and `ResolveSkinDna` add when a skinID was supplied.
 *
 * @typedef {TnyDnaResolution} TnySkinDnaResolution
 * @property {Number} skinID
 * @property {Number} skinMaterialID
 * @property {Number} materialSetID
 */

/**
 * What `GetSkin` has to answer, of the fields this library reads.
 *
 * A service may return anything else alongside; only these are consumed.
 *
 * @typedef {Object} TnySkin
 * @property {Number} skinMaterialID - looked up through `GetSkinMaterial`
 * @property {String} internalName   - becomes the skin's dna name
 */

/**
 * What `GetSkinMaterial` has to answer, of the fields this library reads.
 *
 * @typedef {Object} TnySkinMaterial
 * @property {Number} materialSetID - looked up through `GetSkinMaterialSet`
 */

/**
 * What `GetSkinMaterialSet` has to answer.
 *
 * These are the parts a skin's dna is built FROM, so every one of them ends up
 * in the dna string: the four mesh materials, the pattern and its two
 * materials, an optional faction override, and an optional res path insert.
 * A missing field is normalised to "none" rather than dropped, so partial
 * answers change the dna rather than failing.
 *
 * @typedef {Object} TnySkinMaterialSet
 * @property {String} [description]      - falls back to the skin's display name
 * @property {String} [material1]
 * @property {String} [material2]
 * @property {String} [material3]
 * @property {String} [material4]
 * @property {String} [sofPatternName]
 * @property {String} [patternMaterial1]
 * @property {String} [patternMaterial2]
 * @property {String} [sofFactionName]   - overrides the faction in the base dna
 * @property {String} [resPathInsert]
 */

/**
 * A SKINR skin payload, as handed to `GenerateSkinrDna` / `GetSkinrPattern`.
 *
 * This is SKINR's own shape, snake_case and all. It is an INPUT, not something
 * ccpwgl produces, and only the fields below are read here.
 *
 * @typedef {Object} TnySkinrSkin
 * @property {String} id             - skinr design id; becomes the sof pattern name
 * @property {String} [name]
 * @property {Number} ship_type_id   - type id of the ship to build
 * @property {TnySkinrLayout} layout
 */

/**
 * The layout half of a SKINR payload.
 *
 * @typedef {Object} TnySkinrLayout
 * @property {String} [pattern_blend_mode] - SKINR's vocabulary, not Carbon's
 * @property {Array<TnySkinrSlot>} slots   - cosmetic slots, one of which may carry the pattern
 */

/**
 * One cosmetic slot. The pattern lives on whichever slot declares one, so the
 * slots are searched rather than indexed.
 *
 * @typedef {Object} TnySkinrSlot
 * @property {Object} [configuration]
 * @property {TnySkinrDesignPattern} [configuration.pattern]
 */

/**
 * The pattern a cosmetic slot carries.
 *
 * `projection.slot1..slot4` are BOOLEANS naming which cosmetic slots the
 * pattern paints. They are not material indices, and turning them into
 * `isTargetMtl1..4` is one of the translations below.
 *
 * @typedef {Object} TnySkinrDesignPattern
 * @property {Number} id
 * @property {Object} [configuration]
 * @property {Boolean} [configuration.mirrored]
 * @property {Object} [configuration.projection]         - { slot1, slot2, slot3, slot4 }
 * @property {Object} [configuration.transform]          - x/y/z(/w) objects, not arrays
 */

/**
 * The generated document `GetSkinrPattern` answers with, before hydration.
 *
 * `FromPatternJson` turns this into real sof classes and translates NOTHING,
 * so it has to arrive final-form. See the translation list below.
 *
 * @typedef {Object} TnySkinrSofPattern
 * @property {String} name
 * @property {String} dna
 * @property {Object} pattern
 * @property {String} pattern.name
 * @property {Boolean} [pattern.sof6]
 * @property {TnySkinrSofPatternLayer} [pattern.layer1]
 * @property {TnySkinrSofPatternLayer} [pattern.layer2]
 * @property {Array<Object>} [pattern.projections] - { name, transformLayer1, transformLayer2 }
 */

/**
 * One layer of a generated sof pattern. Every field here is already in the
 * engine's vocabulary.
 *
 * @typedef {Object} TnySkinrSofPatternLayer
 * @property {String} textureName
 * @property {Boolean} [isTargetMtl1]
 * @property {Boolean} [isTargetMtl2]
 * @property {Boolean} [isTargetMtl3]
 * @property {Boolean} [isTargetMtl4]
 * @property {String} [blendMode]           - a name GetBlendMode recognises
 * @property {Number} [materialSource]
 * @property {Number} [projectionTypeU]     - 0, 1 or 2
 * @property {Number} [projectionTypeV]     - 0, 1 or 2
 * @property {String} [textureResFilePath]
 */

/**
 * WHAT THE SERVICE HAS TO TRANSLATE.
 *
 * ccpwgl does not own the mapping and should not: the cosmetic slot names, the
 * components, the factionID slot conversion and the typeID to factionID join
 * are all SKINR library data, cheap to obtain once and painful to keep current.
 * A second copy here could not be tested and would drift.
 *
 * So a service answering `GetSkinrPattern` owes all of this, and
 * `FromPatternJson` now REJECTS a payload that skipped it rather than
 * defaulting silently:
 *
 *   slots -> materials     `projection.slot1..slot4` booleans become
 *                          `isTargetMtl1..4`, and slot ordering becomes
 *                          `materialSource`
 *
 *   blend mode            SKINR's `pattern_blend_mode` becomes a name
 *                         `EveCustomMask.GetBlendMode` recognises. SKINR has
 *                         ADD, MULTIPLY, DIVIDE and DIFFERENCE, which Carbon
 *                         has no permutation for; `ToBlendMode` returns null
 *                         for those rather than pretending they are OVERLAY
 *
 *   projection types      whatever SKINR calls them become 0, 1 or 2
 *
 *   faction               the factionID slot conversion, and the typeID to
 *                         factionID join, both resolved into the dna
 *
 *   transforms            `{x,y,z}` / `{x,y,z,w}` objects become arrays
 *
 * @typedef {TnySkinrSofPattern} TnySkinrTranslationContract
 */

/**
 * What `GetGraphic` gives back for a graphicID.
 * - Note that any graphicFile with .red will be translated to .black 
 * - as part of the resource pipeline, as we don't have access to those
 *
 * @typedef {Object} TnyGraphic
 * @property {String} graphicFile - a resource path, `.red` or `.black`
 */

/**
 * What `GetPlanet` and `GetMoon` give back for a celestial id.
 *
 * Every field may sit either at the top level or under `attributes`, and in
 * either camelCase or snake_case - the runtime reads both, because an
 * ESI-shaped answer and an SDE-shaped answer disagree about which. See
 * `GetAttribute` in `TnyPlanet.js`.
 *
 * The three graphic fields are graphicIDs, not paths: they are resolved
 * through `GetGraphic` to reach a `graphicFile`.
 *
 * @typedef {Object} TnyCelestial
 * @property {Number} [radius]                     - metres
 * @property {String} [name]
 * @property {Number} [shaderPreset|shader_preset] - graphicID of the surface shader
 * @property {Number} [heightMap1|height_map_1]    - graphicID
 * @property {Number} [heightMap2|height_map_2]    - graphicID
 */

export { TnyApiService } from "./TnyApiService";
export * from "./default";
export * from "./providers";
