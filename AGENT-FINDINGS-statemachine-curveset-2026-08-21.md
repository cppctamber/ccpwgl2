# State machine / curve set parity review - 2026-08-21

Two independent read-only reviews of `e:\carbonengine` vs `e:\ccpwgl`, run while
chasing the violent flicker on the Triglavian hologram VFX
(`tgc01_t1:crisis_triglavian:...`). Both converged on the same root cause without
seeing each other's work. Neither agent could write files, so this is a
transcription; the ranking and the file:line citations are theirs.

Context: content authors build a ring of states (e.g. an off state, an off-to-on
transition state, an on state, an on-to-off state). Each state has a
`Tr2ActionPlayCurveSet` playing ONE named range of a curve set. Observed defect:
ccpwgl walked the ring at roughly one state per frame, so every frame re-played a
different range and `scaledTime` never advanced. The state names above are
illustrative - content may name them anything.

## Root cause (both reviews, independently, rank 1)

**`EveShip2` is not a complete `ITr2CurveSetOwner`.** It implements
`PlayCurveSet` (`EveShip2.js:1009`) and `StopCurveSet` (`:1020`) but NOT
`GetRangeDuration` or `GetCurveSetDuration`. In Carbon both are pure-virtual on
`ITr2CurveSetOwner`, so a space object cannot exist without them
(`EveSpaceObject2.cpp:3451-3503`, and `EveEffectRoot2.cpp:790-827`), and both
recurse into `m_children` and `m_effectChildren` taking a max.

That single gap collapses BOTH mechanisms that hold a state:

1. **The `syncToRange` action veto never arms.**
   `Tr2ActionPlayCurveSet.Start` (`:37`) asks `owner.GetRangeDuration(...)`;
   absent, it falls back to `FindCurveSet(owner)`, which scans only
   `owner.curveSets` with no recursion - and `EveShip2` has no `curveSets`
   property at all. So `_duration === 0`, and `CanTransition` (`:82`)
   short-circuits `if (!syncToRange || _duration <= 0) return true`. Carbon would
   veto until the range had played an iteration
   (`Tr2ActionPlayCurveSet.cpp:53-67`).

2. **`CurveSetTime("Set/Range")` in transition conditions returns 0.**
   `Tr2ExpressionProgram.js:1132-1148` requires `owner.GetRangeDuration`; absent,
   it falls through to `CallContextFunction` which returns 0. So the canonical
   hold `StateTime() > CurveSetTime("Set/Range")` is false only on the entry
   frame, where `_stateTime` is 0, and true from the next frame on - exactly one
   state per frame.

**Why the dirty-variable gate only slowed the flicker.** `StateTime` and
`CurveSetTime` are non-pure, so the transition's variable mask is null
("assume everything") and it is evaluated live every frame - in BOTH engines.
That is faithful to Carbon (`Tr2ControllerExpression.cpp:509-515,556`; every
`s_functions` entry is registered non-pure). Carbon survives it because the
condition is genuinely false until the range elapses. The gate is correct and
still needed; it simply cannot cover these conditions.

Note the asymmetry: controllers owned by an `EveChildContainer` are unaffected,
because the container DOES implement both (`EveChildContainer.js:187,218`). This
reproduces only on ship/hull-level machines.

## Also fixed this cycle

**Empty transition condition was always TRUE.** Carbon's parser rejects an empty
expression - its own suite asserts it, `parser/tests/basic.cpp:26`
`ASSERT_FALSE(CanParse(""))` - so `Eval` returns `{false, 0}` and `CanActivate`
returns false: a blank condition is a DEAD EDGE. ccpwgl compiled it to the
literal 1 via `emptyValue: 1`, the only such value in the codebase, making it a
permanent unconditional exit that the dirty gate could never cover (a blank
condition names no variable, so its mask is null). Fixed.

**`Tr2ActionPlayCurveSet.Start` early-returned on a falsy `Play`.** Carbon
ignores `PlayCurveSet`'s return and arms the `syncToRange` block unconditionally
(`Tr2ActionPlayCurveSet.cpp:24-33`). ccpwgl's `if (!this.Play(owner)) return
false;` skipped the arming entirely. Compounding this, `PlayCurveSetOn` sets
`played = true` even when `PlayTimeRange` returned false for a missing range - so
the boolean is unreliable in both directions. Fixed.

## Confirmed NOT the problem (ruled out by reading, do not re-derive)

- Per-frame evaluation order: snapshot dirty set, zero it, update machines, then
  updateables. Identical (`Tr2Controller.cpp:250-256` / `Tr2Controller.js:227-249`).
- In-frame hop semantics, including re-evaluating a newly entered state with all
  bits dirty. Identical - this is Carbon behaviour, not a ccpwgl bug.
- Veto abandons the whole walk; `_hasBeenVetoed` latch; finalizing branch
  including restart-in-place; `Stop()` asking the finalizer after stopping
  actions. All faithful.
- Mask OR-ing with the zero/null short-circuit. Faithful.
- `Tw2CurveSet` vs `TriCurveSet`: `Play`/`PlayFrom`/`SetTimeRange`/
  `ResetTimeRange`/`ApplyTimeRange` clamp order/`StopAfter` encoding/`Stop`
  semantics all identical. Carbon's `if (rangeFound) Stop();`
  (`TriCurveSet.cpp:198-201`) is dead code; ccpwgl's `return false` matches the
  effective behaviour.
- Repeated same-value writes dirty the variable in both - no equality check
  either side.
- Transition `name` IS the destination state name
  (`Tr2StateMachineTransition_Blue.cpp:18`).
- **"Ranges colliding" is not a state a curve set can be in.** A curve set holds
  ONE time-range triple on both sides, and neither engine dedupes a re-play of
  the already-playing range. The collision is temporal - N plays per frame - not
  structural. The reported `_lastTime ~= one frame delta` is the exact
  fingerprint of ccpwgl's play-every-frame path.

## Open, NOT fixed this cycle (ranked)

1. **`EveChildContainer`'s guard is `display`, Carbon's is `IsUpdating()`**
   (`EveChildContainer.cpp:676-679`, `:368-371` =
   `(display || !updateOnDisplay) && (IsRendering() || displayFilter == ONLY_REFLECTIONS)`).
   ccpwgl has no `updateOnDisplay` at all, and - more importantly - the guard is
   not paired with the update path: `EveChildContainer.Update` ticks controllers
   and curve sets unconditionally, so a hidden container's machines keep issuing
   plays its own `PlayCurveSet` then refuses. Carbon short-circuits both.
2. **No cycle detector in `FollowTransitions`.** Carbon logs
   "infinite loop in state machine %s detected" after 20 revisits
   (`Tr2StateMachine.cpp:120-140`). ccpwgl has a bare `i < 20` cap, so a ring
   walk is silent - this is the diagnostic that would have named this bug in
   minutes. Worth porting for its own sake.
3. **`Tw2Action.CanTransition()` returns `!isDisabled`; Carbon's default returns
   `true`.** A disabled action therefore vetoes FOREVER, and
   `Tr2StateMachineState.CanTransition` does not skip disabled actions the way
   `Start`/`Stop` do. Makes ccpwgl stickier, not more eager - not this bug, but
   it will freeze a machine the moment an author toggles `isDisabled`.
4. **`startState` is an object reference in Carbon, a `@meta.uint` index in
   ccpwgl** (`Tr2StateMachine.h:47` + Blue `MAP_ATTRIBUTE` vs
   `Tr2StateMachine.js:12`). A persisted object read as a uint yields 0, so
   ccpwgl always starts at `states[0]`. Wrong entry point, not a per-frame walk.
5. **`Tr2ActionPlayCurveSet.CanTransition` mutates `_prevTime`; Carbon's is
   `const`** and advances it only in `Update`. The veto is asked more than once
   per frame, and the first "yes" rebases the baseline. Only observable now that
   the veto actually arms.
6. **`Tr2SyncToAnimation` fails open on an empty mask.** Carbon passes `nullptr`,
   which resolves to the BASE animation layer and holds while remaining time > 0
   (`Tr2SyncToAnimation.cpp:9-27`); ccpwgl returns true immediately. A strictly
   weaker hold.
7. **`UpdateDelta` forces `_startTime = 0`**, defeating the `-1` sentinel on the
   sim path, so every `Play` costs one extra frame of `scaledTime` versus Carbon
   and `OnSimClockRebase` is a no-op there.
8. **`PlayAllCurveSets` / `StopAllCurveSets` are absent from ccpwgl entirely**
   (`EveChildContainer.cpp:708-737`, `EveEffectRoot2.cpp:575-590`).
9. **A condition edited at runtime never recomputes the source state's mask.**
   Carbon's `OnModified` calls `m_source->UpdateVariableMask()`
   (`Tr2StateMachineTransition.cpp:24-31`); ccpwgl's `UpdateDestination()` is an
   empty method. Tooling correctness only.
10. **`EveChildContainer.StopCurveSet`'s comment states the opposite of Carbon** -
    Carbon's `StopCurveSet`, `GetCurveSetDuration` and `GetRangeDuration` all DO
    carry the `IsUpdating()` guard (`cpp:740-743, 784, 811`). ccpwgl's choice is
    safer, but the comment is factually wrong and should be corrected or the
    behaviour decided deliberately.

## Unverified assumption worth confirming empirically

Neither agent read the `.black` content. Which of the three mechanisms is
actually in play for this skin can be settled by dumping the ring's transition
conditions and each action's `syncToRange`:
conditions naming `CurveSetTime`/`AnimationTime` implicate the duration gap;
blank conditions implicate the `emptyValue` bug; pure-variable conditions with
`syncToRange` set implicate the veto.
