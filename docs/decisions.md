# Decisions

Settled calls, with the date they were settled and what would reopen them.
Promoted from `.agents/DECISIONS.md`, which was gitignored and unbacked.

Only decisions that are **current and verified against the code** are here.
Older protocol-era entries stayed in scratch deliberately: they describe an
agent workflow and a scaffold that have both moved on, and promoting them
unverified would give them an authority they have not earned.

---

## Compiled effects use device-selected profiles and quality tiers

**Settled 2026-07-19. Current.**

A `.fx` path in a `.black` is not the file that loads. `Tw2Device.ToEffectPath`
swaps `/effect/` for the profile directory and appends the quality tier:

| Quality | Tier suffix |
|---|---|
| High | `sm_depth` |
| Medium | `sm_hi` (the default) |
| Low | `sm_lo` |

Both axes can be pinned per effect in `config.js` (`FX_TIER_PINS`) when an
effect must not follow the session — see [divergences.md](divergences.md) for
the pins that exist and why each must eventually be removed.

**Consequence worth knowing:** a pinned path no longer ends in `.fx`, so
`Tw2Effect.OnValueChanged` does not call `ToEffectPath` at all, and a pin must
therefore substitute the profile directory itself.

---

## Depth convention: Carbon shaders are reverse-Z, ccpwgl's buffer is not

**Settled 2026-08-18. Partially implemented.**

dx11-translated shaders are handed Carbon's **reversed** clip space; the
engine's depth **buffer** stays conventional. The two disagree, and the
disagreement is not uniform across shader classes — some want the opposite
setting from others.

The org repo owns this seam. Read `/docs/contracts/depth-convention.md` before
changing anything here; that page records the taxonomy and the two fixes that
were tried and were wrong.

---

## Design flows Carbon > carbonenginejs > ccpwgl

**Settled 2026-08-19. Current. This is an organisation-wide rule.**

Knowledge and design move one way — **Carbon (`e:\carbonengine`) →
carbonenginejs (`runtime-*`) → ccpwgl** — and only where it makes sense for the
receiving library. **ccpwgl is never evidence about Carbon.**

Going upward, ccpwgl is **prior art, not law**. carbonenginejs may consider it
and adopt from it only with a stated reason, and the reason that qualifies is a
constraint Carbon never faced — ccpwgl runs in a browser on WebGL2 and has
shipped that way for years.

Where ccpwgl is merely *more correct* than carbonenginejs, that is a
Carbon-parity defect to fix **against Carbon**, not a licence to copy ccpwgl's
file. Worked example, 2026-08-20: ccpwgl reads the server clock in UTC with a
real FILETIME-epoch phase while runtime-trinity uses local-time getters and a
plain modulo. runtime-trinity is wrong — and the fix is Carbon's source, not
ccpwgl's.

**The half that gets missed:** the three are not the same engine. ccpwgl's
constrained designs stay. Bring Carbon's *behaviour* across when it fits; never
Carbon's *structure* on top of a working engine. The register of what that
protects is [divergences.md](divergences.md).
