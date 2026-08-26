/**
 * Classes ONLY.
 *
 * `config.js` spreads this whole namespace into `constructors`, so every named
 * export here is registered as a class by its export name. That is what makes a
 * `.black` able to name one of these types and get it constructed, with no list
 * to maintain.
 *
 * It also means a plain object reaching this barrel is registered as a
 * constructor, and the store rejects it at LOAD with
 * "'Constructor' store value invalid" - taking the bundle down before anything
 * runs, without naming the file responsible.
 *
 * So an exposed helper belongs as a STATIC on the class it serves. Data that is
 * not a class at all - a shader definition, a lookup table - reaches its
 * consumer by direct import and is not re-exported here. See the note above
 * `constructors` in `config.js`.
 */
export * from "./core";
export * from "./curve";
export * from "./eve";
export * from "./particle";
export * from "./AudEmitter";
