# State machines, controllers and actions

This tree is ccpwgl's supported implementation of the Trinity state layer:

- `Tr2StateMachine` / `Tr2StateMachineState` / `Tr2StateMachineTransition`;
- `Tr2Controller` with its event handlers, references, binding points and
  float variables;
- `Tr2Expression` / `Tr2ExpressionProgram` expression evaluation;
- the `Tw2Action` family, including the audio actions that drive
  `tw2.audMan` emitters (`Tr2ActionPlaySound`, `Tr2ActionSetAudioSwitch`,
  `Tr2ActionSetAudioEmitterPrefix`, `Tr2ActionSetAttenuationScaling`) through
  the discovery helpers in `action/Tr2ActionAudioHelpers.js`.

The implementation was promoted atomically from `src/unsupported/state`.
The old path is intentionally absent.

A few classes remain explicitly `@meta.notImplemented`: `Tr2SyncToAnimation`,
`Tr2ActionBindRTPC`, `Tr2ActionOverlay`, `Tr2ActionPython` and
`Tr2ActionSpawnParticles`. They deserialize without evaluating.

This is not an authority for Carbon class behavior. Source-backed runtime
contracts remain in CarbonEngineJS (`runtime-trinity` is the superset for
controller/expression semantics); ccpwgl carries the browser-facing behavior
proven against live ships.

Run the focused checks from the repository root:

```powershell
npm run test:audio-manager
```
