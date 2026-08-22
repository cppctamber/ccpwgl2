# ccpwgl documentation

Durable knowledge that belongs to **this repository** and nowhere else.

Until now ccpwgl had no tracked home for its own findings, so everything landed
in gitignored scratch — `.agents/`, `artifacts/`, `_dev/`, `_internal/`,
`_review/`. Five stores, none backed up, holding rules the whole organisation
depends on. This tree exists so that stops happening.

## What goes where

| Knowledge | Home |
|---|---|
| Why this code is written this way | a comment at the implementation site |
| A ccpwgl-only contract, decision or divergence | **here** |
| Anything spanning Carbon, the runtime packages and ccpwgl | the org `/docs` repo |
| Work in flight, run notes, handovers | `artifacts/notes/`, and delete when it lands |

**The org `/docs` repo outranks this tree for anything cross-package.** Where a
page here touches a seam the org owns — the depth convention, shadow resolve,
constant-buffer slots — it should be a short local note that defers to the org
contract rather than restating it, because a restatement drifts and a pointer
cannot.

## Two rules this tree must keep

**ccpwgl is never authority about Carbon.** `e:\carbonengine` is what this
organisation recreates. A page here records what ccpwgl does; it must never read
as evidence for what Carbon does. Going upward, ccpwgl is prior art at most —
see [decisions.md](decisions.md) D038.

**This repository is public.** No machine paths, no private data, no credentials,
nothing under NDA. That was previously guaranteed by these notes being ignored;
here it has to be deliberate.

## Pages

- [decisions.md](decisions.md) — settled calls with dates, and what would reopen them
- [divergences.md](divergences.md) — deliberate departures from Carbon that are NOT porting gaps
