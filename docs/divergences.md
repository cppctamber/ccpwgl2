# Deliberate divergences from Carbon

Things in ccpwgl that look like porting gaps and are not. Each was decided for a
reason that still holds, and each has been "fixed" at least once by someone who
did not know that.

Carbon is the authority on behaviour. It is **not** the authority on structure:
ccpwgl runs in a browser on WebGL2 and has shipped that way for years. Bring
Carbon's behaviour across where it fits; do not bring Carbon's structure across
on top of a working engine.

## Controllers, state machines and curves

- **`Tr2StateMachineTransition.CanTransition` ignores the dirty mask.** An
  in-code note cites the state-loss regression this caused. It has been tried.
- **The controller takes a raw `dt`**, not Carbon's absolute clock plus a
  normalised update frequency, because ccpwgl threads `dt` uniformly through
  every `Update` in the engine. There is no throttle, so passing a frequency
  where `dt` is expected silently stops controllers updating.
- **Dirty variables are a `Set` of names, not a packed bitmask** — ccpwgl has no
  packed variable buffer to index.
- **Curve sets tick unconditionally, with no LOD gate**, because ccpwgl's LOD
  model is simpler than Carbon's and separately known to be wrong.
- **The legacy `Tw2*` curve, sequencer and Maya families exist alongside the
  `Tr2*` ones** because the `.black` loader instantiates by registered class
  name. Deleting a "superseded" class breaks loading.

Settled by the 2026-08-17 three-way audit, which also established that the
controller and state-machine layer in **both** JS libraries is fully implemented,
not a shell. `@meta.notImplemented` is not a reliable stub signal here — judge by
the code.

## Turrets

- **`EveTurretSetItem` and the persisted `turrets` list are a ccpwgl extension.**
  Carbon has no such class anywhere; its `SingleTurretData` is runtime-only,
  rebuilt from ship locators.
- **The `visible` bag (`turrets`/`firingEffects`)** stands in for Carbon's
  non-persisted `display`/`displayEffects` pair.
- **`EveTurretSet.State` keeps ccpwgl's own ordinals** even though the persisted
  `state` attribute uses Carbon's, because `PACKING`/`UNPACKING` have no Carbon
  counterpart and the local state machine depends on them. Carbon's ordinals are
  recorded alongside as `CarbonState`. **The wire value needs a map, not an
  assignment** — every shared name sits at a different ordinal.

## Smart lights

- **Quads are de-instanced** into four corner vertices rather than pushed into a
  process-wide quad-renderer singleton, because ccpwgl has no `Tr2QuadRenderer`.
  `AddQuadsToQuadRenderer`, `RegisterWithQuadRenderer` and `GetRenderables` are
  therefore absent by design — and Carbon's interface defaults them to empty
  bodies anyway, so absence matches Carbon's behaviour.
- **Beams are genuinely instanced**, unlike the quads, because
  `ubershaderinstanced` wants per-instance attributes.

## Temporary, with a removal condition

These are NOT settled divergences. They exist because an engine input is
missing, and each must go when it arrives.

- **`tw2.forceUberDepthOff`** and the **`flarequad`/`flarequadsoft` tier pins**
  in `config.js` all exist because nothing publishes `DepthMap`. A surface
  authored `UBER_DEPTH_ON` fades against it, the fade resolves to zero, and the
  surface draws perfectly while contributing no pixels. Publish `DepthMap` and
  all three come out together. Left in place afterwards, they silently hold
  surfaces below what was authored.
