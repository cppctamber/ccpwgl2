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
