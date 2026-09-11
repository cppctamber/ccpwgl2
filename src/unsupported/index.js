/**
 * What "unsupported" means here, and what it does not.
 *
 * Two kinds of class live in this folder, and both are here so that a `.black`
 * naming the type LOADS:
 *
 *   a schema mirror   the shipped object as data, with the fields it persists
 *                     and methods that do nothing. Without it the reader hits a
 *                     type it cannot construct and the whole file fails, taking
 *                     everything else in it with it - so a stub that draws
 *                     nothing is worth more than no class at all.
 *
 *   a partial port    real behaviour, incomplete. It runs, and some paths
 *                     through it are finished while others are missing or out
 *                     of date against Carbon.
 *
 * So a class being here does NOT mean it does nothing. `Tw2GpuParticleRenderer`
 * left for `particle/gpu` once it was clear it was complete; others are used
 * every frame while still sitting here.
 *
 * ## Some of these throw
 *
 * A partial port can reach a path nobody finished. Where that is known, the
 * throw is gated so the object still loads and the file still reads - the cost
 * is a feature that does not appear, rather than a scene that does not.
 *
 * The gating is not complete, and an ungated one is a real bug rather than an
 * accepted state. `EveStretch3` is the standing example: its `Update(dt)`
 * forwards only the delta to `sourceObject`, so an `EveChild*` source - which
 * needs `Update(dt, parentTransform, …)` - dereferences an undefined transform.
 * A mining turret reaches it every frame and kills the render loop, because the
 * scene update runs before anything draws.
 *
 * Report those. A throw from here is a porting gap with a name, not a reason to
 * work around the class.
 *
 * ## Classes ONLY
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
export * from "./AudEmitter";
