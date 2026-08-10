# CCPWGL character demo

This is the clean integration harness for the current
`@carbonenginejs/runtime-character` library and appearance-plan contracts.
The legacy `_dev/character` harness remains unchanged as diagnostic evidence.

The first visual proof adds a sex-specific nude LOD0 foundation after
source-library hydration, paper-doll selection, and appearance-plan resolution.
It now also attaches every exact configuration/geometry pair emitted by the
plan through ccpwgl's registered Black object route.
The exact-build schema-v8 corpus contains every decoded authoring definition,
548 typed metadata records, and additive part-type and effective part-source
catalogs. Ordered modifier-reference records sit beside every unchanged raw
dependency and occlusion string. Exact unsuffixed support targets can therefore
reach the resolver without runtime filename parsing; suffixed values remain
opaque. The resolver keeps
every exact source-version contribution, including texture-only garments, and
fills configuration/geometry only when uniquely determined. The demo joins
each contribution back to its exact retained `.type` and sibling `.color`
records. It preserves every texture candidate while applying an explicitly
labelled legacy filename policy to select proof roles.

The current atlas proof composes the authored body diffuse foundation and
ordered colorized body contributions with the shipped GLES `ColorizedBlit`
shader. Every texture contribution that this bounded body-diffuse proof cannot
compose remains in diagnostics as an explicit deferred contribution; it is not
filtered out. Head composition, normal/specular atlases, wider
coverage/tucking policy, patterns, projections, and final backend-neutral
bindings remain incomplete and visible in diagnostics. Exact tuck-support
geometry can now attach as a requester-owned dependency contribution. The
bounded body-diffuse proof also restores the authored foundation through an
exact typed body cut mask immediately before that owner's colorized overlay.
This is implemented pass ordering and browser execution, not proof that every
cut-mask fixture produces correct pixels.
The retained female `bootscf01` owner and
`female/dependants/bootmasks/bootmaskshin` `comp_body_m.png` relationship is
also preserved as a separate `CutMaskMap` experiment. It is not treated as a
geometry-removal contract: an earlier diffuse-alpha trial made the monolithic
foundation translucent and exposed the HTML background. The exact mask,
source records, and negative result remain retained rather than being dropped
or used to infer a wider coverage rule.
The body-diffuse proof decodes PNG `oFFs`/`pHYs` values and interprets them as
normalized source bounds plus a destination viewport while composing the
2048-square target. That interpretation is explicit experimental demo policy,
not an assertion that the old demo had every UV correct. Each pass reports the
decoded image size, offset, extent, and inferred target separately from the
policy-selected bounds and viewport. The full target then attaches to the
authored foundation consumer without replacing its loaded `TransformUV0`.
This does not prove a global transform rule: configured full-atlas consumers,
private-map garments, head/hair/accessory consumers, and final cut-mask
consumers require their own resource-specific binding decisions.
The composed full body-diffuse atlas attaches to the authored foundation
consumer and to demo-owned configured proof-fallback effects. Only those
fallback consumers currently receive identity `TransformUV0` as an
`experimental-policy` choice. The attachment report records the prior and
applied bounds and labels correctness unverified. A configured authored effect
is eligible for a separate target only when it matches one of the two reviewed
body-atlas contracts. That target copies the authored RGBA, applies its ordered
cut masks to alpha only when an explicit consumer relationship supplies them,
and replaces RGB with the shared composed body atlas; the full target is then
sampled with identity bounds. Dependency ownership by itself does not select a
cut-mask consumer: unresolved targets remain named diagnostics and no mask is
guessed onto the owner. Effects with the same
authored diffuse and ordered masks share one target. A shared effect with
divergent signatures is explicitly deferred, and a partial attachment failure
rolls every affected effect back before its target is released. Ordinary
private garment effects remain untouched. This consumer branch has render-state,
pixel-contract, grouping, ambiguity, and rollback tests, but the currently
checked female `3000001` and male `3003873` fixtures use proof fallbacks and do
not provide a live eligible authored consumer. It is therefore structural
proof, not visual proof. Normal, specular, final alpha, and other unimplemented
channels can still make configured geometry overlap or look incomplete. The
demo reports those states without a default-zero
mesh-index fallback. Filename
classification exists only inside the labelled legacy texture policy; raw
candidates remain present beside its selections. A
valid Black-authored mesh index is retained; when that value is not an index in
the paired GR2, the adapter uses only the skeleton binding resolved by
`Tr2SkinnedModel.SetGeometryResource` and otherwise fails. If an authored
garment effect fails to prepare or links without an authored `DiffuseMap`
resource, the legacy proof adapter applies the same
verified GLES `skinnedavatar.sm_hi` shader and neutral proof textures used by
the working demo. A linked shader is therefore not treated as a renderable
material. Diagnostics preserve the authored state and label that substitution as proof rendering;
it is not final garment material resolution.

Interactive comparison found female outer tops and some female
midriff/belly combinations working where the old `_dev/character` harness had
no successful examples. Some male characters are also partially working and
materially farther along than the earlier demos. Other garment combinations
remain comparably broken. These are comparative fixture results, not proof of
garment-wide or sex-wide UV correctness.

`src/character` contains small promotion candidates for a future
`ccpwgl/src/character` owner. Browser controls and demo orchestration remain in
`src/demo`.

## Run

Supply a caller-owned schema-v8 character library. Schema v7 remains accepted
as a migration input. No game data is included in
this repository.

```powershell
node demo/character/server.mjs --library <path-to-character-v8.json>
```

Then open:

```text
http://127.0.0.1:8083/demo/character/
```

The server reads the existing ccpwgl dist snapshot and the generated
runtime-character modules from the sibling CarbonEngineJS workspace. It does
not rebuild either project and never serves `node_modules`, repository
metadata, or arbitrary source paths.

The demo registers an explicit no-SOF DNA handler before ccpwgl initializes.
It returns an empty `EveSOFData` for the library boot call, rejects unexpected
space-object DNA, and therefore fetches neither the combined SOF `data.black`
nor the lazy manager's `generic.black`. Character construction does not consume
SOF data.

Character resources and atlas metadata are requested only from the exact
numeric `sourceBuild` carried by the installed library. Both the adapter and
composer reject a mutable `latest` root rather than changing source identity.

## Renderer boundary

The temporary renderer capability is labelled `legacy-opengl`: it exposes the
known 58-bone limit against the female LOD0 body's requirement of 69 bones.
CEWG is not a fallback. The connected adapter renders the female or male nude
LOD0 foundation. Its female-body construction explicitly applies the temporary
legacy `RightHand` triangle mask proven by the older working harness, retains
the original CPU indices for idempotence, and reports the affected vertices and
triangles. Failure to obtain the CPU mirror or upload the changed indices fails
preparation instead of publishing corrupt geometry. This intentionally removes
the anatomical right hand only from the temporary legacy rendering result; it
does not remove geometry, bones, or source records from the character library.
The temporary foundation remains an explicit demo-owned construction
description containing the exact skeleton, ordered geometry, shader, and
neutral proof-texture policy. A second demo-owned resolver inserts the plan's
exact configured parts before the final animation bind. Foundation choices
remain labelled legacy OpenGL policy; configured-part paths retain their
derived plan evidence.

The demo has two exact, sex-specific foundation-coverage policies. For
`male + feet + male/feet/bootsam01`, once the configured boot is render-ready,
the adapter hides every carrier sharing the captured male-feet geometry. Live
paper doll `3003873` reported one applied `feet` coverage: mesh index `4`
changed from visible to `display: false`. The female foundation cannot use that
strategy because its head/body/feet are one monolithic body mesh. For
`female + feet + female/feet/bootscf01`, the adapter instead collapses only
triangles influenced by the exact `LeftFoot`, `RightFoot`, `LeftToe`, and
`RightToe` binding prefixes. The mutation is applied atomically at commit,
leased across shared cached geometry, and restores the captured indices after
the final appearance releases. Live paper doll `3000001` reports 348 affected
vertices and 618 affected triangles. Both strategies are explicitly keyed
demo policy, not decoded library metadata, and establish nothing for other
footwear.

The adapter uses four bright neutral-white legacy V8 interior lights arranged
at the character's front, left, right, and back, plus ccpwgl per-object packing. This is
demo-owned lighting policy, not a character-lighting contract supplied by
runtime-trinity. Its body-diffuse
atlas is a proof adapter over exact source values, not a new runtime-character
source fact. Wider foundation coverage, non-diffuse channels, head composition, and final
bindings stay gated until later appearance-plan stages exist. The adapter can
then be replaced by the new WebGL path without changing the library/session
contract.

For controlled overlap comparisons, the optional `isolatePart` query parameter
hides only the exact attached configured-part identity after commit. For
example, `?isolatePart=female%2Fdependants%2Ftuck%2Fbasic` hides the tuck support
without changing the appearance plan, retained source data, or composition
report. Diagnostics mark that part `hidden-for-isolation`.

The exact `3000001` comparison confirms that hiding
`female/dependants/tuck/basic` removes the shirt's waist and belly coverage.
The support mesh is therefore required for this selection; deleting it is not
a valid z-fighting fix. The demo now applies one exact experimental binding
after final resource readiness: it copies alpha from the selected
`female/topmiddle/shirtcf01` `colorize_body_l_4k.png`, cuts that alpha with the
support owner's retained `female/dependants/masktuck/tuckmaskmid`
`comp_body_m.png`, and replaces RGB with the shared body atlas. Only the single
ready demo-owned fallback effect on `female/dependants/tuck/basic` receives the
result. Append `?tuckRgb=pants` only for the rejected same-owner-pants RGB
experiment; it changes the stomach/waist support to grayscale and therefore is
not the default. The paths differ only in the final RGB pass. The
normal/isolation comparison proves that this target retains the required
waist/belly coverage; it does not establish a general tuck rule for other
shirts, masks, sexes, or support meshes. Any missing or ambiguous identity is
deferred without changing the fallback attachment or dropping retained data.

Paper doll `3000001` also has one exact, structurally tested upper-sleeve
material policy. The ready
`female/dependants/sleevesupper/creased_01` contribution and selected
`female/topmiddle/shirtcf01` contribution both retain owner selection `13`.
For only that exact relationship, the composer copies authored RGBA from the
shirt's `colorize_body_l_4k.png`, then replaces RGB from the shared body atlas,
and binds the result to the upper sleeve's unique, unshared demo fallback
effect. No cut mask, normal, specular, other upper-sleeve source, or general
sleeve rule is inferred.
Planner and direct-composer tests cover identity rejection, ordered passes,
material-only attachment, ordinary-failure target destruction, and the
comparison-control path.

Append `?upperSleeveMaterial=off` for the one-variable control. It retains the
same configured geometry and fallback binding, still builds and tracks the
two-pass target, reports `prepared-disabled`, and attaches no replacement
texture. The default URL reports `applied`; both upper and lower sleeve meshes
remain visible in both runs. At the current full-character camera framing the
two screenshots are not visually decisive, so the selected-shirt alpha is
documented as structurally implemented, not yet as visually proved.

The same paper doll retains a distinct, typed lower dependency,
`female/dependants/sleeveslower/longcreased_01`, under owner selection `13`.
The demo applies the same bounded authored-RGBA-then-shared-RGB contract to
that lower sleeve's own unique fallback effect and target. Upper and lower
qualification, reports, targets, and failure paths remain independent; neither
effect is shared or combined. Append `?lowerSleeveMaterial=off` to keep both
sleeve meshes and the upper material unchanged while leaving only the lower
fallback binding in place. Browser diagnostics prove `prepared-disabled` with
zero lower attachments versus `applied` with one lower attachment, while both
meshes remain visible. As with the upper control, the current full-character
framing does not visually prove alpha correctness; a fixed close view of the
upper/lower seam and wrist remains open.

For the same exact fixture, the composer now builds a separate white-visible,
black-cut `CutMaskMap` from the retained
`female/dependants/bootmasks/bootmaskshin` source after the boot passes the
final render-readiness watch. It binds only the female foundation body effect;
`DiffuseMap` and configured garment effects remain untouched. The live path
created and attached the 2048-square target without restoring the earlier
transparency or belly regression. It is retained as texture evidence alongside
the independent semantic triangle coverage above; neither path is discarded
or presented as a substitute for the other.

The footwear tuck is distinct from that waist support. The retained
`female/dependants/boottucking/standard` records are metadata-only, resolve to
two source versions, and provide no configuration, geometry, texture, or live
effect to attach. The demo therefore does not fabricate a cover part. The
configured `pantscf01.black` instead retains two distinct consumers:
`PantsCF01Shape` owns the pants material while `LegsShape` remains a skin
consumer. The body-atlas path previously treated exact `bootmaskshin` as a
request to restore nude foundation diffuse immediately before the boot layer;
that overwrote already composed pants pixels at the footwear with skin. The
body-diffuse composer now retains those pants pixels and defers this exact mask
to its independently reported foundation `CutMaskMap` path. Actual boot-tuck
deformation and the unresolved utility-shape policy remain open and retained.

For a one-variable comparison, append `?foundationCutMask=off`. The composer
still resolves and builds the exact target, retains it for normal release, and
reports `prepared-disabled`, but attaches nothing to the foundation. The
default URL reports `applied`. This control does not remove the boot, semantic
triangle coverage, mask, foundation, library record, or composition evidence.

## Checks

These checks do not rebuild ccpwgl:

```powershell
node --test demo/character/test/*.test.mjs
node --check demo/character/server.mjs
node --check demo/character/src/main.mjs
```
