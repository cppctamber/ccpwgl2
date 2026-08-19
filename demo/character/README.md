# CCPWGL character demo

This is the clean integration harness for the current
`@carbonenginejs/runtime-character` library and appearance-plan contracts.
The legacy `_dev/character` harness remains unchanged as diagnostic evidence.

The page derives both its character-library URL and `res:/` resource root from
the one `/local/tools-service.json` bootstrap supplied by the demo server. The
default library route is `<service target/build>/character/library.json`;
`?library=` remains an explicit comparison override. This keeps library and
resource bytes on the same service, target, and exact build.

The Parts panel is a demo-only editor over retained source records. It follows
the useful old studio layout pattern: the canvas fills the viewport while
selection panels float over it. The default inventory exposes only modifier
groups with a reviewed adapter path; an explicit checkbox reveals every exact
same-gender resource/location combination observed in retained paper dolls as
experimental. Selecting a value mutates the loaded paper doll in memory and
resolves it again. A rejected renderer change is rolled back automatically,
Reset restores the page's original modifier relationships, and a page reload
discards all edits. Existing colour selections are deliberately retained.
When the selected part family has a uniquely matched sex-specific type and the
demo's labelled material-resolution policy finds a retained `.color`
definition, its sibling colour choices appear in a compact disclosure below
the selector. Patterned definitions use their authored pattern colours and
carry a striped marker. The tiles never cross into another garment family;
they select exact observed resources within the selected family. They preview
authored material values through a derived demo relationship rather than
claiming a typed prepared-library join or providing free-form colour editing.
Fixed-texture, ambiguous, and unresolved choices receive no inferred palette.

`?region=eyes` applies a deterministic front-on camera preset for close eye,
eyelash, tear-duct, and eyebrow comparisons. An explicit `cameraDistance` or
`cameraYaw` still overrides the corresponding preset value. The additional
`?background=violent-green-html` leaves the WebGL clear alpha transparent and
sets the HTML page behind the canvas to neon green. It is the preferred proof
for accidental canvas transparency: genuine holes reveal green through the
3D canvas rather than merely changing the scene clear colour.
`?auditAlpha=1` adds a hidden `#character-alpha-audit` output for browser
automation. After every resolved paper-doll change it reads the actual WebGL
framebuffer and reports alpha coverage, enclosed transparent components,
fallback-magenta pixels, and a stable alpha hash. It does not change normal
demo rendering and is useful only with a deliberately contrasting HTML
background.
`?browSupport=off` and `?tearducts=off` switches are comparison controls: they
hide only the exact configured carrier so a visible defect can be separated
from pixels already baked into the shared head atlas. They do not change the
default character policy or remove retained source data.
`?browLighting=neutral` keeps the composed eyebrow-support diffuse and alpha
but substitutes neutral normal and specular maps. It is a comparison control,
not a proposed default material.
`?browDiffuse=neutral` keeps the authored shader and composed target while
replacing only its additional material diffuse multiplier with white.
`?tearductLighting=neutral` keeps the selected tear-duct diffuse but substitutes
neutral normal and specular maps, allowing material lighting to be separated
from diffuse sampling.
`?tearductUV=identity` compares the authored half-width sampling transform with
identity sampling. The authored transform remains the default.
The default `?tearductDiffuse=base` path binds private D/N/S targets copied from
the exact generic-head texture inventory beside the configured face topology.
Its diffuse target preserves that topology-specific RGB but writes opaque
coverage for the tear-duct gap; the same source remains alpha-preserving on the
separate transparent EyeWet carrier.
The tear-duct shader's retained `CutMaskInfluence` gives its cut-mask sampler
almost complete ownership of output alpha. The configured carrier therefore
binds an explicit uniform-white cut mask: the exact generic-head sibling mask
and the older compatibility fallback are both uniform white, while allowing
the missing sampler to fall through to transparent black exposes the HTML page
despite the carrier living in an opaque geometry area.
This is an experimentally qualified GLES material policy, not proof that folder
adjacency is an authored tear-duct contract. `?tearductDiffuse=composed` restores
the selected archetype/cosmetic head targets as a comparison.
`?tearductDiffuse=dark` replaces only that sample with a known dark resource to
distinguish carrier shape from atlas content and dynamic-colour allocation.
`?eyeWetMaterial=retained` restores the configured carrier's empty authored
slots without exposing an opaque proof diffuse. The default composed policy
binds the exact generic-head support diffuse at the carrier's authored identity
transform, with bounded neutral normal/specular maps. This source has zero
alpha across the retained lower-lid geometry; the selected cosmetic head atlas
is fully opaque there and produced the broad lower-eye sheet. The older GLES
reference's completed-head binding remains comparison evidence, not authority.
`?eyeWet=off` and `?eyeballs=off` remain carrier-isolation controls.
`?lashCarrier=eyelashes-off` and `?lashCarrier=eyeshadow-off` hide one exact
lash-family carrier at a time to identify opaque upper/lower card geometry.
`?lashCarrier=off` hides both carriers and proves which eye-rim pixels already
belong to the composed head layers. The default lash target preserves source
alpha. The dependency's retained numeric weight remains reported but does not
scale texture alpha because appearance planning does not assign it that render
meaning; `?lashAlpha=weighted` restores the earlier comparison.
`?lashDepth=test-no-write` and `?lashDepth=off` compare explicit depth state
without changing the default authored state.
`?lashUV=identity` compares identity sampling on both completed-atlas lash
carriers with the current carrier-specific transform.
`?lashUV=raw-direct` reproduces the older reference's bounded
`EyeShadow_GeoShape` contract: the retained raw lash detail with its
metadata-derived crop-local transform. The actual `Eyelashes_GeoShape` strands
remain on the composed target during this comparison.

The first visual proof adds a sex-specific nude LOD0 foundation after
source-library hydration, paper-doll selection, and appearance-plan resolution.
It now also attaches every exact configuration/geometry pair emitted by the
plan through ccpwgl's registered Black object route.
The exact-build schema-v10 corpus contains every decoded authoring definition,
548 typed metadata records, 9,526 extension-neutral texture-metadata records,
and additive part-type and effective part-source
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
The body-diffuse proof consumes PNG `oFFs`/`pHYs` evidence retained in the
schema-v10 library and interprets it as normalized source bounds plus a
destination viewport while composing the 2048-square target. Metadata identity
is the lowercase resource path without an extension, so a rendered DDS can use
placement extracted from its exact same-stem PNG during library construction.
Older or sparse libraries may still inspect the exact same-stem PNG at runtime;
the diagnostic source distinguishes `character-library` from `png-bytes`.
Neither route guesses between different quality suffixes. That interpretation
is explicit experimental demo policy, not an assertion that the old demo had
every UV correct. Each pass reports the retained image size, offset, extent,
and inferred target separately from the policy-selected bounds and viewport.
The full target then attaches to the
authored foundation consumer without replacing its loaded `TransformUV0`.
This does not prove a global transform rule: configured full-atlas consumers,
private-map garments, head/hair/accessory consumers, and final cut-mask
consumers require their own resource-specific binding decisions.
The shared body-diffuse composer excludes every contribution that owns a
configured, non-dependency geometry part. Those contributions remain retained
with `configured-garment-material-owned-separately`; compositing them into the
skin target made `3003917`'s nearly full-atlas `robeam01` layer paint garment
material onto the chest and then fed skin back to `pantsam01` geometry. The
composed atlas attaches to authored foundation consumers and to a demo-owned
configured proof fallback only when the part is explicit dependency geometry
and the effect's preserved authored state matches a reviewed body-atlas
contract.
The retained `3000001` and `3003917` sources also prove that one configured
part can contain different surface contracts. Female `pantscf01.black`, for
example, has a private `PantsCF01Shape` surface with non-zero
`MaterialLibraryID` and a separate `LegsShape` body/garment carrier whose
primary material is skin while `Material2LibraryID` identifies the garment.
When those authored effects cannot render, the adapter retains both material
identities instead of collapsing the whole part to one guessed surface.

The private surface receives a transparent 2048-square target. The composer
first copies the retained colorize-detail RGBA into its exact schema-v10 atlas
placement, then replaces only RGB with the retained colorize zones and
material colors. This preserves the authored garment silhouette instead of
forcing either a transparent garment or an opaque rectangular placement. The
reviewed `bootscf01` detail map contains 76,773 fully opaque and 251,149 fully
transparent pixels; `pantscf01` likewise contains a binary authored alpha
shape, so neither can be replaced by a rectangle. The hybrid surface receives
a distinct target: the
composed body atlas RGBA is copied first and the same garment layer is then
blended over it with its authored detail alpha. Copying only body RGB left
uncovered hybrid pixels transparent. Once either target is attached,
the temporary diagnostic material tint is reset to white so the already
colorized texture is not tinted twice. This exact split is visually proved for
female paper doll `3000001`; the same `MaterialLibraryID`/`Material2LibraryID`
classification elsewhere remains structural evidence until each asset family
is checked. Normal and specular composition remain separate unresolved
channels.

Patterned private garments follow the same alpha-preserving target contract.
The retained material pattern name resolves to its character pattern-zone
resource, while retained pattern colours, transform, and rotation drive the
shipped GLES `PatternBlit` shader. Only RGB is replaced after authored detail
RGBA has been copied into the target, so enabling a pattern cannot turn the
garment's transparent background into visible geometry. Female paper doll
`3003869` exercises this path with `female/outer/jacketaf01` version `v3`, its
`nikunni.color` material, and pattern `Amarr_B`; the live report records
`amarr_b_z.dds`, transform `[0,0,8,8]`, rotation `0`, and a `patterned-rgb`
pass. The exact-build pattern directory contains a same-token `_z.dds` for
each of the 22 symbolic pattern values retained by the current schema-v10
character definitions. That inventory proves the current build's lookup
convention; the library still does not retain an explicit symbolic-pattern to
resource relationship, so a future producer must publish that link rather
than making consumers rely on the convention. This proves the diffuse path
for that exact configured private surface, not every hybrid surface,
normal/specular channel, or garment family.

Versioned character texture folders are resolved as overlays by family. A
version keeps every texture family it actually publishes and inherits only
missing families from the part's unversioned source; the resolver never drops
either the exact-version candidates or the inherited candidates. Male paper
doll `3003977` proves the source shape: `robeam01/v2` publishes only its
specular family, while the retained unversioned source owns its colorize layer,
zones, mask, and normal families. The live policy now selects the exact `v2`
specular plus those four missing base families instead of treating the garment
as textureless. This proves family-overlay resolution, not final robe geometry
or occlusion correctness. Direct outer-garment maps such as `jacketmf01_d` are
also classified as body diffuse from the selected `outer` modifier location.
After restarting the exact-build resource service, paper doll `3004001`
loaded its retained `jacketmf01.black` and rendered the authored direct-diffuse
jacket without a neon fallback. That proves the direct outer-diffuse target for
this exact source; it does not make inherited colorize candidates override an
authored, render-ready direct diffuse.

Male paper doll `3003901` proves the two alpha requirements: its page-background
leak is removed. Geometry inspection then distinguishes three surfaces which
the shared name had obscured. `PantsAM01Shape` is the full-leg garment (1,238
vertices and 2,027 triangles); the configured `LegsShape` is only a 54-vertex,
52-triangle waistband patch; and the separately staged nude foundation owns a
different full `LegsShape` (1,179 vertices and 2,160 triangles). The retained
PantsAM01 metadata explicitly occludes `bottominner` and `bottomunderwear`.
The exact male PantsAM01 policy therefore retains both configured meshes,
retains but does not compose the selected underwear contribution, and hides
only the separate `legs` foundation carrier after the configured pants are
render-ready. This source- and geometry-backed mapping is not generalized to
other `bottomouter` parts; its final pixels remain live-proof pending.
The same rule now covers upper underwear without inventing a garment table.
Female `TanktopF01` metadata authors the legacy identity `topunderwear`, and
the active bikini contribution is exposed under the current `topinner`
category. The GLES policy maps that proved legacy/current pair and deduplicates
the retained structured and raw occlusion forms. The selected bikini-top
contribution is retained but not composed when the singlet is present. A body-affecting augmentation does not
hide underwear unless its own retained data authors that occlusion; the current
face augmentation does not.
The exact-build library builder resolves texture paths through the retained
resource index and stores placement evidence before the browser consumes the
library. Actual rendered textures remain DDS resources; PNG is an authoring
metadata source, not a replacement render format.
Merely belonging to configured garment geometry is not sufficient: an
unresolved private-material effect remains deferred instead of inheriting the
skin atlas. This is an effect-level decision, so one garment may eventually
contain both proven body-atlas consumers and separately resolved private
surfaces. Qualified dependency consumers retain their preserved authored
`TransformUV0`; forcing every configured mesh to identity bounds visibly made
garment regions sample unrelated skin and introduced hard joins between
support and foundation geometry. The attachment report records the retained
bounds and labels correctness unverified. A configured
authored effect is eligible for a separate target only when it matches one of
the two reviewed body-atlas contracts. That target copies the authored RGBA,
applies its ordered cut masks to alpha only when an explicit consumer
relationship supplies them,
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
`Tr2SkinnedModel.SetGeometryResource` and otherwise fails. Character geometry
initialization also disables ccpwgl's `Gr2Reader` `firstMeshOnly` preparation
default before the first character resource fetch. This is required because
the resource cache is path-keyed and the removed meshes cannot be recovered
after preparation. Every Black mesh is then rebound to its exact retained GR2
mesh name and index after each resource watch; an absent, ambiguous, or
differently named target fails instead of falling back to mesh zero. Live male
paper doll `3003917` proves the multi-mesh case: `robeam01.black` contributes
`polySurfaceShape7` at index 0 (440 vertices, 734 triangles) and `Robe1Shape`
at index 1 (2,486 vertices, 3,964 triangles). The second carrier has 35 bone
bindings, below the legacy 58-bone limit, and the full floor-length robe now
renders. These exact decoded counts, binding identities, and live pixels prove
the loading/binding fix for this resource; they do not prove general garment
material, occlusion, UV, or alpha correctness. If an authored
garment effect fails to prepare or links without an authored `DiffuseMap`
resource, the legacy proof adapter preserves that effect as evidence and gives
the rendered area a fresh effect using the same
verified GLES `skinnedavatar.sm_hi` shader and neutral proof textures used by
the working demo. This avoids carrying incompatible authored material
parameters into the proof shader. A linked shader is therefore not treated as a renderable
material. Diagnostics preserve the authored state and label that substitution as proof rendering;
it is not final garment material resolution.

A live `3003917` comparison also rejects diffuse-only promotion back to the
retained `skinnedavatarbrdflinear` effect. Attaching the successfully composed
private diffuse target, resetting `TransformUV0`, neutralizing the material
diffuse color, and swapping the areas back to the authored effect turned the
entire robe neon magenta. Restoring the proof effect restored the brown
colorized robe. The authored Black leaves diffuse, normal, and specular slots
empty, so a composed diffuse alone is not evidence that the complete authored
shader contract is ready. The experiment was reverted: the adapter continues
to preserve the authored effect and all empty texture-slot evidence while the
visible proof fallback remains active. The compiled authored shader samples
diffuse, normal, specular, Fresnel, NdotL-lookup, and cut-mask textures in
addition to scene/environment inputs. The retained robe contribution supplies
exact `robeam01_n` and `robeam01_s` candidates, but a complete binding also
needs reviewed Fresnel, lookup, cut-mask, and scene-environment contracts plus
resource readiness before an atomic swap. This is a proved lower bound for the
exact robe, not proof of which missing input individually caused the magenta
output.

Interactive comparison found female outer tops and some female
midriff/belly combinations working where the old `_dev/character` harness had
no successful examples. Some male characters are also partially working and
materially farther along than the earlier demos. Other garment combinations
remain comparably broken. These are comparative fixture results, not proof of
garment-wide or sex-wide UV correctness.

The preserved legacy GLES harness remains the visual parity baseline for the
complete tattoo inventory: manual comparison reports that all of its authored
tattoo selections render there. It also renders augmentations, masks, glasses,
eyebrows, additive skin contributions, and a subset of hair. Those visible
capabilities must be accounted for by the replacement, but their legacy
classification, discovery, and composition mechanisms are not authoritative.
Additive-layer order and some hair results remain suspect, so the new path must
recover them through retained identities and typed relationships rather than
copying the old routing rules.

`ccpwgl/src/runtime/character` owns the reusable Tny character wrappers and
GLES realization adapter. Browser controls and demo orchestration remain under
this harness's `src/demo` tree.

## Run

Supply a caller-owned schema-v10 character library. Schema v7, schema v8, and schema v9
remain accepted as migration inputs. No game data is included in
this repository.

```powershell
node demo/character/server.mjs --library <path-to-character-v10.json>
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

Footwear foundation coverage is selected from the exact hydrated part-version
metadata, not from a footwear filename. Typed dependency `modifierPath` values
for `pantstucklowshape`, `pantstuckshinshape`, `pantstuckmediumshape`,
`pantstuckkneeshape`, `pantstuckhighshape`, `pantstuckxhighshape`, and matching
`bootmask*` dependencies prove an authored boot height. A `pantstuckshoeshape`
or `pantstuckshoesshape` dependency identifies shoe-height footwear and keeps
the nude ankle/instep carrier. Missing, mixed, or unrecognized height evidence
remains unresolved and preserves the foundation instead of guessing from a
source name.

Authored utility-shape dependencies are realized separately from coverage.
The source-neutral appearance plan carries exact target names and weights; the
GLES adapter then matches those names case-insensitively against morph targets
actually exposed by loaded geometry. It composes dense or sparse delta and
absolute targets from an immutable CPU copy, uploads the result only during
atomic commit, and restores that copy after the final lease releases. Shared
geometry may be reused only by identical target maps.

Live paper doll `3003917` proves this path for three retained resources:
`pinchtuckshape` and `pinchbootankleshape` apply to the pants, while
`pantstuckmediumshape` applies to the nude legs and boots. The robe's authored
occlusions retain `bottomouter`, so hiding pants would contradict the decoded
category relationship. Requested targets absent from every loaded GR2 remain
explicitly `deferred-target-unavailable`; the adapter does not substitute a
filename rule or silently discard them. This is fixture-bounded live evidence,
not proof that every utility target is published on every relevant resource.

Once a metadata-qualified male boot is render-ready, the adapter hides every
carrier sharing the captured male-feet geometry. Live paper doll `3003873`
reported one applied `feet` coverage: mesh index `4` changed from visible to
`display: false`. A qualified female boot instead collapses semantic triangles
on the exact captured foundation carrier using the `LeftFoot`, `RightFoot`,
`LeftToe`, and `RightToe` binding prefixes. Paired leg-tattoo occlusions do not
authorize deleting the nude leg or pelvis carrier: live split and combined-body
comparisons both produced open waist boundaries when that relation was mapped
to bone-based triangle deletion. The mutation is applied atomically at commit,
leased across shared cached geometry, and restores the captured indices after
the final appearance releases. Live
paper doll `3000001` resolves `pantstuckshinshape` plus `bootmaskshin` as
authored shin-height evidence and reports 348 affected vertices and 618
affected triangles. The mapping from authored relationships to the legacy
foundation operation is still demo policy; the dependency and occlusion paths
remain retained library facts.

Upper-body coverage follows the same evidence boundary. The hydrated
`male/outer/robeam01` metadata contains an exact occlusion reference whose
resolved modifier location is `topinner`; the male foundation's nude torso is
the `topinner/torso_nude` carrier. The demo therefore maps only that exact
typed relationship to the male `torso` role. It does not infer coverage from
the robe name, paper-doll ID, bounds, bone overlap, or its six tattoo
occlusions. A live `3003917` comparison first hid only the robe and exposed the
nude torso underneath, then applied the typed rule after the robe became
render-ready: all captured torso carriers changed from visible to hidden while
the head and hands remained visible. This proves the exact legacy carrier
operation for `topinner`; it does not establish policies for other modifier
locations. Exact normalized `modifierPath` is retained as a labelled fallback
when a library has not hydrated the modifier-location reference.

The adapter uses four neutral-white legacy V8 interior lights arranged
at the character's front, left, right, and back, plus ccpwgl per-object packing. This is
demo-owned lighting policy, not a character-lighting contract supplied by
runtime-trinity. Its body-diffuse
atlas is a proof adapter over exact source values, not a new runtime-character
source fact. Other foundation coverage, non-diffuse channels, head composition, and final
bindings stay gated until later appearance-plan stages exist. The adapter can
then be replaced by the new WebGL path without changing the library/session
contract.

For controlled overlap comparisons, the optional `isolatePart` query parameter
hides only the exact attached configured-part identity after commit. For
example, `?isolatePart=female%2Fdependants%2Ftuck%2Fbasic` hides the tuck support
without changing the appearance plan, retained source data, or composition
report. Diagnostics mark that part `hidden-for-isolation`.

The demo record selector navigates to a fresh `paperdoll` URL. This is required
by the temporary GLES CPU-morph proof: cached geometry cannot simultaneously
carry two different deformation leases while the prior character remains
published. The runtime continues to reject that unsafe shared-resource
mutation; the demo does not weaken the guard or imply support for multiple
differently morphed characters on this legacy path.

The default `headNormal=detail` face path retains the exact generic head normal
plus the authored additive aging and scarring twist-normal passes. It omits
only the eye and eyebrow replacement-normal passes, whose combined authored
comparison produced the visually rejected hard chin/neck seam.
`headNormal=authored` restores every retained normal pass,
`headNormal=base` retains only the base and therefore deliberately makes the
face look younger, and `headNormal=neutral` uses the engine's packed flat-normal
resource. These are rendering controls, not alternate library records: no
authored contribution is discarded. The exact replacement pass responsible
for the seam remains unresolved. Head-local D/N/S targets bind only to the exact
`meshIndex 0` / `meshShape` / `C_Skin_blinn1` carrier; shared head-region UVs
do not make eyes, tongue, or teeth skin consumers. `cameraDistance=<number>`
sets the initial test-camera distance between `0.5` and `20` for close visual
comparisons without changing character construction. `cameraYaw=<radians>`
sets a deterministic initial horizontal view for silhouette comparisons; it
is also a demo control rather than character data.
Rebuilding the temporary split nude foundation with the authored head skin's
`skinnedavatarbrdflinear` shader family is visually disproved: without the
head Black's complete parameter contract the body becomes black and
mirror-like. The remaining head/body seam therefore cannot be corrected by
matching only the effect filename.
The exact configured `C_Skin_blinn1` head carrier uses the same active
`skinnedavatar.sm_hi` resource as the body foundation, but changing the effect
resource is not sufficient by itself. The reviewed GLES path calls
`AutoPopulate(false)` after effect changes. The adapter now does the same
before restoring `TransformUV0` and installing proof textures, so every
sampler and constant declared by the generic shader exists while authored
state remains retained. A focused adapter test guards that lifecycle. Live
diagnostics confirm that the head and body then share the same active effect
resource and that no body-declared generic input is missing from the head.

That fix does not by itself remove the complete neck boundary. With both
head and body forced to the same solid diffuse plus neutral normal/specular
maps, a hard line remains with both the six-part split foundation and the old
monolithic `basenude.gr2` foundation. Cleaning the head down to the generic
material controls and matching the body's diffuse/specular defaults also
retains the line. The ordinary selected CD head/body images independently
produce a colour difference, while the remaining neutral-input boundary is a
geometry shading or unrealized sculpt issue. These are separate defects; the
demo does not hide either with an invented tint, gamma conversion, head scale,
or neck transform.

The configured-head planner now exposes an explicit logical recipe for each
diffuse, normal, and specular output. Each pass records its channel-local
`compositionIndex`, its sparse numeric `layerOrder`, the
`experimental-head-composition-order-v1` ordering rule, and one of
`colorize`, `alpha-overlay`, `normal-replace`, or `normal-add`. Replacement
normal inputs use the shipped `maskednormalblit` contract, while retained
twist-normal inputs use the distinct additive `twistnormalblit` contract; they
are no longer alpha-copied through the ordinary colour overlay path.

The current complete order is explicitly an operator hypothesis awaiting
visual proof, not a Carbon fact: base skin colours `0`, aging `10`, blemish
`20`, scarring and `scars/head` `30`, freckles `40`, augmentations `50`, head
tattoos `60`, eyes `70`, eyeshadow `80`, eyebrow base `90`, eyebrows `100`,
implants `110`, blush `120`, eyeliner `130`, and lipstick `140`. Priorities are
spaced by ten so evidence can insert a pass without renumbering the sequence.
Equal-priority scar sources retain their incoming order. Eyelashes remain a
separate face-card binding rather than an atlas layer. Tattoo `comp_head_z`
inputs are not mislabeled as ordinary colourized atlas layers. For an exact
`tattoo/head` source, the GLES proof resolves and retains its
`projection.proj`, projected DDS, selected linear colours, weight, and sparse
order. The older demo was inspected as a guide and uses a complete-atlas route.
Independent shader inspection then disproved the replacement path: mode-1
projection maps a raw decal through the head mesh, while the shipped 2048x1024
DXT5 head-tattoo DDS already contains sparse authored alpha in the complete
head-atlas layout. Applying both is a second placement operation and produced
the persistent vertical error. The GLES adapter now alpha-composites the
shipped atlas directly with identity placement. It retains the projection
definition and selected linear colours in the report, but deliberately records
the colour selection as not applied because the working reference consumes the
authored colour texture. Projection parameters remain available for an engine
that proves it has a raw projector decal. Other projection modes and the wider
corpus remain open; unsupported modes retain every authored field.

Each colourized pass now also reports the retained layer weight, colour-selection
weight, gloss, and specular colours independently. Only the layer weight has a
qualified shader meaning in this adapter today. The other values remain
`retainedNotApplied`: the older prototype retained some of them but did not
consistently consume `specularColors`, and its colour-selection strength
semantics have not been independently proved. Values are not clamped or folded
into one guessed opacity merely to make the fixture look plausible.

The body-diffuse report distinguishes retained contributions whose authored
inputs target another channel or atlas from actual body-diffuse failures. For
example, lipstick remains in the complete contribution inventory and in the
head recipe, but appears under `notApplicable` with
`body-diffuse-channel-not-authored` instead of inflating the body-diffuse
deferred count. `applicableContributionCount` is the denominator for the
body-diffuse proof; `contributionCount` remains the complete retained inventory.
This is reporting only and does not discard or reinterpret any contribution.

Live sampler inspection confirms both authored tattoo inputs use clamp-to-edge;
changing their wrap mode is neither required nor supported by the observed
effect.

Composite normal filenames are target-bearing evidence too. The texture policy
classifies `comp_<target>_tn` as additive twist-normal input and
`comp_<target>_mn` as masked replacement-normal input for both `head` and
`body`; it does not guess the target from the modifier group. Live paper doll
`3019595` reaches a committed render with its scarring twist-normal pass while
retaining its tattoo inputs behind the projection gate. Two other head-heavy
fixtures stop earlier for independent geometry reasons: `3019591` contains a
meshless ragdoll-hair dependent, and `3019593` reports a configured
`Neck_RenamedShape` resolving to `TopTuckingShape`. Those records remain
retained; neither failure is treated as texture evidence or worked around by
dropping the part.

Live paper doll `3000001` now resolves the selected `makeup/eyes` colour name
from the appearance plan and loads that exact retained `.color` definition.
The cropped eye detail is colourized into the complete head diffuse target;
only the exact left/right eyeball meshes with `C_Eyes` receive that composed
diffuse and the independently composed head specular target. Their authored
flat normal, Fresnel controls, and eye-shader material parameters remain
untouched. A controlled `none -> eyes_06` reselection now reports those same
bindings after reconstruction rather than silently falling back to the
authored constant specular map. This is an exact retained-channel experiment;
its visual result remains operator-qualified rather than legacy authority.
Paper doll `3000001` does not select an eyebrow colour. The exact
selected Deteis family preset, `deteisfemaleclothing.prs`, does: it supplies
three authored colours for `makeup/eyebrows/eyebrows_01`. The selected
paper-doll style remains `eyebrows_03`, while its colour now comes from that
retained family preset under
`legacy-opengl-selected-preset-eyebrow-color-v1`; the sibling `default.color`
remains only a labelled fallback when no selected preset can be resolved.
Numeric ancestry and bloodline documents do not expose a direct eyebrow or
family-slug field, so the currently proved route is through the selected
skintone family rather than a guessed ancestry-ID table. The rebuilt prepared
library resolves the eyebrow support geometry independently from the eyebrow
paint. The older GLES reference attached the completed head diffuse, normal,
and specular atlases to that support carrier; the current adapter follows that
bounded renderer contract. The live carrier exposes no authored
`MaterialDiffuseColor`, and neutral diffuse/lighting comparisons did not
materially change the result. The focused eye-region review qualified the
current eyebrow pixels as correct. The same review identified
`Tearducts_GeoShape` / `C_SkinShiny_TearDucts` as the inner-eye wedge carrier.
The selected archetype/cosmetic D/N/S targets made that opaque carrier bright
white. The exact generic-head D/N/S inventory beside the configured topology
removes those white wedges while preserving the authored transform; identity
sampling produces no material visual improvement. This is now the bounded GLES
default and remains explicitly experimental because the Black material leaves
those texture slots empty. The active older reference is only a regression
guide. Eyeballs, eye wetness, and lash cards remain separate contracts.

The rebuilt prepared library also resolves the eyeliner's
weighted `makeup/eyelashes/eyelashes_02###0.4` dependency without dropping the
weight and publishes its exact part source. Binding the cropped 741x1024 detail
directly is visually disproved for this selection: identity UVs produced a grey
lower-only fringe, while applying the inverse retained placement still exposed
the unprocessed mid-grey source. The active comparison instead colourizes the
retained detail with its exact sibling zone and colour records into a
transparent target. Source alpha, rather than detail luminance, owns the
target-wide lash silhouette. The sampled `EyeShadow_GeoShape` footprint is
nevertheless alpha-dense, so the remaining lower rim must not be described as
sparse without carrier-specific evidence. The lash mesh uses identity sampling while the eye-shadow carrier
retains its authored transform. An identity comparison on both carriers did not
materially change the opaque lower-lash sheet and is not promoted as a fix.
Exact geometry inspection instead shows that the lower lash cards are two
components of `Eyelashes_GeoShape`; `EyeShadow_GeoShape` occupies only the
upper lids and cannot own a lower-lid artifact. When the selected paper
doll exposes no lash source, the labelled sex-default `eyelashes_01` input
supplies the same complete data shape; this remains GLES adapter policy rather
than a character-library interpretation. The active older reference uses a
third contract specifically for this carrier: the raw authored lash detail and
the crop-local transform derived from its retained PNG placement metadata.
`?lashUV=raw-direct` reproduces that binding topology and transform without
hiding the carrier or discarding its source. It still uses the selected `_02`
dependency rather than the older editor's hard-coded `_01`, so it is not a
pixel-identical legacy result; its pixels remain operator-unqualified in this
demo.
The current path also
collapses the Black's paired forward/reversed transparent areas to one
two-sided draw so the same translucent card is not blended twice. The live
target is deliberately composed in two passes: an authored RGBA copy preserves
the sparse lash silhouette, then colourization replaces RGB only. The live
report records both retained inputs, both passes, source-alpha evidence,
per-carrier triangle-centroid alpha samples through the effective UV transform,
and one collapsed eyelash card pair. The exact `_02` zone selector is a cropped
372x512 palette map with retained placement; its detail and zone inputs remain
aspect-checked. The separate uniform 16x16 `_02` specular input is not treated
as that zone map. Both
`Eyelashes_GeoShape` and `EyeShadow_GeoShape` receive the explicit lash binding;
leaving the second carrier on its proof diffuse produced opaque white upper-eye
cards. Configured EyeWet, tear-duct, eyelash, and eye-shadow carriers now remain
hidden until their exact face-material binding commits atomically; declared
empty sampler seams are no longer pre-filled with opaque proof textures. An
exact retained lash specular source is bound when one resolves; no invented
normal or specular fallback is installed. The exact dependency weight
`0.4` is retained as telemetry but is not interpreted as a texture-alpha
multiplier. Live comparison showed that scaling source alpha by this graph
weight made the strands disappear against the eye and skin; the appearance
plan does not assign that weight a material meaning. `?lashAlpha=weighted`
retains the earlier comparison, while the default `source` mode preserves the
authored texture alpha. Final colour, crop, and tip length remain unresolved.
The older demo's
`eyelashes_01` is a sex-wide
hard-coded fallback rather than the exact `3000001` dependency. It is a valid
compatible asset, and its raw integrated alpha is close to `_02` after the
authored `0.4` weight, which explains why its presentation strength looked
plausible without making it the exact selected source.
Hair is not part of this proof: the
older demo remains only a fallible guide for hair, where some fixtures were
already known to be incorrect.

The retained hair inventory currently separates renderer cases rather than one
category-wide path. The exact build retains 158 selectable resource rows:
84 female and 74 male. The exhaustive audit classifies 105 as directly
constructible configured parts, 35 as model-bundle selections, 17 as valid
texture-only scalp/implant/lace contributions, and one as a retained unresolved
definition. Prepared model bundles retain each configuration's
decoded geometry relationship plus explicitly labelled terminal LOD and paired
resource-family evidence. The hero demo requests exact LOD 0; a same-LOD
collision is accepted only when one retained model family matches the selected
part-source family. Choosing paths independently, picking a nearest LOD, or
using a hairstyle table remains forbidden. This boundary requires a library
prepared with those model-bundle fields; an older served library continues to
defer the mesh without hiding its candidate inventory. The corrected audit
runner records actual renderer status rather than equating a non-throwing call
with commit. It separately classifies the selected choice as a configured
attachment, an applied atlas-only contribution, or an unresolved source
definition, so successful rendering of the rest of the character cannot make a
missing hairstyle look complete. It also retains compact detailed-hair and rigid-headwear material
projections, including attached card and rigid effects plus hidden/deferred
consumers. In the audit library all 84 female and 74 male rows commit. The
female rows divide into 35 detailed-hair attachments, 41 rigid-headwear
attachments, seven texture-only or unresolved rows, and one rigid
double-linear Aura row currently handled outside those two material paths. The
male rows divide into 14 detailed-hair attachments, 49 rigid-headwear
attachments, and 11 texture-only rows. The materialized-choice audit records
77 configured, six atlas-only, and one unresolved female choice; the male audit
records 63 configured and 11 atlas-only choices. These counts establish transaction and
material-path coverage, not visual completeness; texture-only rows compose
through the shared head report rather than a configured-mesh material report.

The texture-only branch participates in the shared head atlas without
fabricating geometry. Its 17 rows cover colorized scalp, direct implant, and
direct lace contracts. Diffuse and specular compose in the default head-normal
detail mode; retained replacement normals are intentionally withheld there and
are now reported as policy-suppressed. `?headNormal=authored` applies those
masked replacement normals, while a source that has no normal does not gain
one. Four representative contract rows cover the full inventory: sex-specific
stubble, a masked-normal implant, and an exact-version lace overlay.

The GLES adapter now retains visible-hair and scalp/head texture channels as
separate targets. Detailed-hair consumers are partitioned by their decoded
material parameters and authored atlas region: reconstructed private hair
diffuse reaches the hair cards at identity UV. A visible head-shell helper is
classified separately and hidden before any hair-material readiness check. It
remains reported as pending until an alpha-preserving private head target exists;
binding the opaque completed head atlas would recreate the previously observed
face shell. The default binder preserves the authored hair material constants
and two-pass card state. Its RGB blend,
depth, cut, and cull behavior remain authored, while the independent canvas
alpha equation accumulates source-over coverage so soft fringe pixels cannot
erase coverage already written behind them. The default binds the exact
retained hair normal and selected shader colour controls while keeping the
specular texture neutral. The L/Z target owns strand/detail data and alpha;
the detailed-hair shader's selected diffuse colour supplies its final palette.
The retained specular response was the channel that produced the unqualified
pale plate-like result. Attaching the complete retained normal/specular pair is
available through `?hairLighting=authored`; preserving the authored shader
colours instead is available through `?hairMaterial=authored`. The retained
hair-darkness value remains reported but is not applied
because its transfer function is not yet established.

Configured hair can also contain a rigid ornament whose UV island is authored
inside the same retained layer as the cards. When both consumers exist, the
cards receive the selected colorized target while the rigid consumer receives
a second RGBA-preserving copy of the layer at identity UV. This retains
version-authored ornament colour instead of recoloring it as hair. A standalone
rigid hair consumer such as Aura continues to use the selected colorized target;
the split is driven by consumer topology rather than a hairstyle identity.

Rigid headwear uses separate private contracts. Unzoned layer-based variants
copy authored RGBA and apply one selected diffuse/specular colour. Finished-D
cap variants reconstruct D/N/S, neutralize the diagnostic diffuse tint, and
retain their selected specular control. Sparse exact-version D maps alpha-layer
over the retained base D; fully opaque versions produce the same final result
through that rule. Exact reversed areas retain their authored draw and receive
reverse winding after the final fallback effect is installed. Only equivalent
detailed-hair/eyelash card pairs collapse to one no-cull draw. `HairBun02` and
the cap geometry family remain useful old-demo regression outcomes, not runtime
rules or proof that their older material implementation was complete.

The audit also retains incomplete outcomes rather than painting them plausible:
glass siblings and rigid double-linear headwear remain deferred until their
shader contracts are established. Multi-carrier configurations render only
source-backed carriers: a unique in-range authored index may bind an otherwise
unclaimed geometry mesh, while stale out-of-range carriers stay unbound and
diagnosed. This resolves the five ornamented medium-hair transaction failures
without a hairstyle table or mesh-zero fallback.

`?fixture=head-layers` installs one demo-only paper doll named
`demo:synthetic-head-layers`. It clones hydrated `3000001` and adds exact
retained donor selections for `Freckles_03` (`3003877`), the female
`TanktopF01` singlet (`3020292`), eyeshadow (`3003957`), female face
augmentation (`3020032`), `HeroScar03` (`3019595`), female body augmentation
`BodyAugmentationF01_GoldCamo` (`3020068`), the retained female
`TattooFaceG10` resource, and the exact female `Light_01` blemish record.
`TattooFaceG10` is paired with the
retained neutral `default_a` tattoo colour so placement can be reviewed without
the authored `blue_a` ink used by paper doll `3019595`. The singlet replaces
only the base paper doll's
`topmiddle` selection and is itself a retained body-composited garment rather
than invented geometry. The source records are not changed, the fixture is not serialized into
the library, and its identity prevents it being mistaken for a game character.
Eyeshadow, augmentation, and blemish exercise ordinary retained head inputs.
`Freckles_03` contributes two distinct authored overlays rather than one image
copied between atlases: `comp_head_d_4k.png` targets the head atlas and
`comp_body_d_4k.png` targets the body atlas. Both are present in the resolved
plan and both are composed. Their painted alpha regions differ, so the visible
freckle transition at the neck is not evidence that either contribution was
dropped. The remaining mismatch is an unresolved shared-skin/carrier-boundary
problem; this adapter must not duplicate or stretch either authored overlay to
hide it.
The tattoo exercises a separate projection-backed operation. The fixture's
exact `TattooFaceG10` definition resolves its retained projection definition,
authored DDS, neutral selected colour, and priority `60`. Earlier experiments
sent that already positioned atlas through the mode-1 mesh projector, producing
upside-down or vertically displaced results as flip and offset values changed.
The working legacy route and the shipped texture dimensions agree on the safer
interpretation: this input is a complete authored head atlas. The current GLES
proof therefore uses one upright `[0, 0, 1, 1]` alpha overlay and creates no
tattoo-baking render target. The exact projection record remains attached as
provenance rather than being discarded or reinterpreted. Ink presentation
across skin tones and the broader tattoo corpus still require live comparison
against the old editor before parity is claimed.

The selected foundation skin is no longer guessed from the generic head
folder. For paper doll `3000001`, the retained source join is
`skintone=deteis_dark` -> `skintone/basic/deteis.base` ->
`characterselect/deteisfemaleclothing.prs` -> `bodyshapes/cdshape` ->
`female/archetypes/cdshape`. The configured head therefore uses the exact
`cd_female_head_d_4k.png`, `cd_female_head_n_4k.png`, and
`cd_female_head_s_4k.png` set, and the live renderer reports that evidence as
`exact-skintone-prs-archetype-foundation-v1`. The body diffuse composer follows
the same evidence to `cd_female_body_d_4k.png`; it does not retain the former
sex-wide `ccshape` spelling when an exact selected archetype is available.
The same join also retains `deteis_dark.color` and its three authored linear
RGBA values. A shared `base-skin-colours` pass applies those values through the
paired `colorize_head_l/z.png` and `colorize_body_l/z.png` resources before
makeup or clothing. These normalized full-atlas masks are 1024-square while
the selected skin targets are 2048-square; equal aspect, not equal pixel size,
is the compatibility contract, and sampling scales them into the destination.
No gamma conversion or hand-tuned head/body tint is introduced. A controlled
`skinLighting=diffuse` comparison neutralized both carriers' normal and
specular inputs and left the neck discontinuity visible, locating the earlier
seam in diffuse/material realization rather than lighting maps. Inspection of
the ignored older GLES prototype identified its observed parity mechanism:
after composing paired skin inputs it replaces only the configured
`C_Skin_Blinn` head-skin effect with the same generic `skinnedavatar.sm_hi`
shader family used by the body foundation. Its eyes, lashes, teeth, and tongue
remain on their configured effects. Because those `_dev` sources have no
tracked history, this is prototype execution evidence rather than Carbon
authority. The current adapter now reproduces that narrow boundary by changing
the existing authored skin effect's shader path in place, reinitializing it,
and restoring its exact `[0.5, 0, 1, 0.5]` atlas transform. This identity and
transform preservation is required: replacing the effect object caused the
head composer to reject the carrier and skipped makeup, tattoos, eyes, and
eyelashes. Every non-skin face effect remains untouched, and only sampler slots
newly exposed by reinitialization receive neutral defaults. Focused tests and
the live `head-regression-guard-1` fixture prove that route executes and
materially reduces the contract mismatch without dropping the face pipeline.
A subsequent compositor comparison found one concrete new/old divergence: the
new adapter used each base-skin L map as its own alpha mask, while the older
working GLES compositor treated the paired L/Z inputs as colour detail over the
entire selected foundation. Head and body L maps have independently authored
alpha, so masking them leaves different amounts of the two base diffuse maps
visible at their join. Both `base-skin-colours` passes now disable that detail
mask while retaining the same authored colors, L/Z inputs, source-alpha blend,
and full-atlas placement. The live `skin-unmasked-base-2` report proves both
passes use `detailMask: disabled`; focused tests prove the head contract. Final
head/body colour parity remains a human visual qualification gate rather than
an inferred match.
Selected `target=body`, `role=diffuse-overlay` inputs now use the same authored
source-alpha copy operation as their head counterparts; this is routed from
the classified target and role rather than a modifier-name allowlist. The
synthetic `Freckles_03` proof consequently schedules both its retained
`comp_head_d_4k.png` and `comp_body_d_4k.png` inputs. Its authored pixels are
low-alpha, and the currently oversized later tattoo can obscure the central
head mark, so presence in the recipe is not claimed as final visual parity.
`Freckles_03` authors no normal contribution. The exact augmentation, aging,
and implant selections do author `comp_body_tn` maps; the GLES adapter now
adds those retained twist-normal inputs over a neutral body normal target and
binds it to all six split nude body carriers. This is structurally tested and
live-executed; the final relief is not yet visually qualified.
The same strict carrier boundary now has a separate body specular target. It
prefers the exact `bodySpecularPath` retained by a selected skintone/archetype
foundation. When that selection is absent, it derives the generic body
diffuse's archetype family and requires one exact matching skintype specular
record from retained texture metadata. This resolves the reviewed male `cc`
foundation without choosing among the other eleven skintype families or
guessing from a filename token alone. Typed body `specular-overlay`
contributions are then clipped by their own diffuse owner. The live male
bottom-underwear proof applies the exact foundation map followed by the
selected boxer's specular map; configured garments retain independent private
materials. Missing or ambiguous metadata still defers the target. This is a
GLES renderer realization with structural and live execution proof; final
pixel parity remains pending.
The expanded fixture also exercises both scar families rather than treating
their names as aliases. `makeup/scarring` supplies retained twist-normal and
specular contributions, while `scars/head/HeroScar03` independently supplies
diffuse, twist-normal, and specular inputs. Its authored specular control is an
explicit full-normalized 16x16 constant PNG. Full-normalized placement owns
the destination in that case, so the adapter stretches it over the head target
instead of rejecting it solely because its control-map pixel aspect is square.
The same rule covers other explicitly full-normalized low-resolution control
maps without a path-specific scar exception.

The selected body augmentation retains a body colour layer plus plain normal
and specular inputs. It has no zone selector or separate material record because
the selected `.type` chooses an exact authored version: the reviewed `v3` gold
camo `colorize_body_l` is itself an RGBA overlay. The six inspected authored
versions have the same alpha silhouette but different RGB values, corroborating
that version selection owns the baked diffuse appearance. The adapter therefore
admits a lone L map only when exact type/version provenance agrees with the
texture's version segment and no competing zone or material source exists;
generic lone L inputs remain deferred. Its exact specular overlay is admitted
independently to the skin-only body specular target. The plain `comp_body_n`
is a replacement normal input, but its opaque storage alpha is not its coverage.
Normal and specular passes now use the exact same contribution's baked RGBA
layer as their owner mask. This keeps all three channels inside one authored
skin-surface silhouette and avoids rectangular lighting changes outside it.
The rule is contribution- and channel-based and is exercised by both female
and male retained body-augmentation sources; final material intensity remains
a visual review gate.
Body diffuse, normal, and specular now share one explicit category order:
skin-drawn augmentation is applied before underwear, inner layers, and
texture-drawn tops. Garment categories retain their incoming relative order;
the adapter does not infer an outfit-specific stack. Each later lighting pass
is still clipped by that contribution's own diffuse coverage. The reviewed
female fixture also passed an in-place augmentation `on -> off -> on` cycle
without retaining stale normal or specular state. A separate PantsCF01
body-hybrid surface can still cover the belly and remains a bottom-outer
material issue rather than augmentation coverage evidence.
Textureless configured support geometry no longer inherits the shared body's
opaque alpha merely because its retained effect is a body-atlas consumer. When
one requester-owned dependency has no authored diffuse and its exact owner
selection supplies one resolved body diffuse layer, the adapter reconstructs a
private support target from that owner's alpha and the completed body's RGB.
The reviewed TanktopF01 default drape keeps the required lower shirt extension
while its unused lower panels remain transparent; no drape, tank-top, mesh, or
area name participates in the rule. Missing or multiple owner-alpha candidates
remain deferred. This is a structurally tested GLES material policy with one
live reviewed fixture, not appearance-plan or Carbon authority.
Standard drape supports are now additionally rebound to the exact selected top
that owns them. The binder requires one ready support contribution at the
retained standard-drape modifier path, one matching top owner, and one resolved
top material. It copies the selected top's alpha and applies either its exact
colourized L/Z material or its one retained baked diffuse; it never samples an
unrelated garment or chooses by shirt family. This removes the skin-coloured
waist slab seen when the support inherited the completed body atlas. A neutral
baseline sweep attached this owner material for all 21 observed male
`topmiddle` choices and all 31 observed female choices, including the one
version-baked engineering top; missing, ambiguous, shared-effect, or unready
tuples remain deferred. The reviewed male shirt also survived a remove-and-add
cycle without stale bindings.
The reviewed augmentation also carries an exact authored `topunderwear`
occlusion. Its selected bikini top is therefore retained and diagnosed but is
not composed; the explicit body order does not override that source relation.
The selected `makeup/implants/plugs_02` likewise has colourize detail and zone
inputs but no authored paper-doll colour selection. An exact sibling
`default.color` is retained and now appears as a non-applied
`materialCandidatePaths` entry with
`DEFAULT_MATERIAL_POLICY_UNRESOLVED`; the adapter does not promote the filename
`default` into selection evidence. Implant diffuse therefore remains gated
while its independently proved twist-normal and specular inputs continue to
compose.
`makeup/eyebrowbase` is not a selectable part in the reviewed library. The
selected head metadata instead retains one typed `accessories/browbase/cd`
dependency for the selected Deteis archetype. The adapter resolves that exact
part source, attaches its sole retained configuration/geometry pair, and keeps
it outside the selectable garment list. Its authored detail supplies carrier
alpha while the completed head diffuse supplies RGB; the resulting full-atlas
target is bound with identity UVs and alpha test. This proves the dependency
and consumer topology for this fixture, not a universal brow-source rule.
Arm/body tattoo resources and body-enabled projection definitions are indexed,
but no reviewed paper doll selects them. A body tattoo therefore remains an
explicit projection-executor fixture gap, not a missing file or a silently
dropped head-atlas pass.
The older prototype confirms only the useful topology of separate head/body
diffuse, normal, and specular outputs. Its changing numeric layer tables,
lexical makeup ordering, default colours, and projection-strength controls are
reference experiments rather than character-library policy.
The older prototype hard-coded a Civire/CC body base and did not consume paper
doll `3000001`, so it is not authority for the selected source join. It is
useful execution evidence for the shared final skin-shader boundary described
above. The current body still uses its rebuilt fallback material rather than
the exact authored
`basenude.black` material contract, so any remaining head/body brightness
difference is unresolved rather than corrected with a guessed colour or gamma
multiplier. That exact Black is indexed in build `3453885` and the tools-core
resource route on port `5510` returns its validated 1,892-byte object. A live
direct-carrier comparison was visually rejected: the Black produced unrelated
pale torso panels and black sleeve surfaces instead of the rebuilt nude body
used by the old GLES demo, which loaded `basenude.gr2` and rebuilt its areas.
The construction therefore retains the exact Black, geometry and proved CD
diffuse/specular bindings as `retained-not-rendered`; it does not silently drop
them or misrepresent the decoded Black as a qualified body carrier.

The exact `3000001` comparison confirms that hiding the selected lower
garment's decoded tuck support removes the shirt's waist and belly coverage.
The support mesh is therefore required for this selection; deleting it is not
a valid z-fighting fix. The demo now applies an owner-qualified experimental
binding after final resource readiness. It requires one female
`bottomouter`-owned textureless configured support whose decoded material is a
body-atlas consumer and whose area contract is decal-only, one uniquely
resolved body cut mask from that same owner, one uniquely resolved lower
material from that owner, and one independently owned `topmiddle` material.
The binder copies alpha from the selected top, cuts it with the lower owner's
mask, and uses the selected top's colourized RGB. No selected garment,
support, or mask path is used to choose this tuple. Missing or ambiguous
relationships remain deferred without changing fallback attachments or
dismissing retained data.

The white military-skirt comparison exercises the same rule with a different
lower owner and its top-tuck mask. Once that tuck is ready, the independently
selected top's standard drape support is hidden only when its prepared typed
part path identifies the standard drape and every decoded effect is a
body-atlas consumer. This removes the duplicate lower shirt panel visible over
the skirt while retaining the replacement tuck. The suppression is committed
only after the replacement material succeeds, is retained in diagnostics, and
does not apply to another owner or an ambiguous support. A live
skirt-to-pants-to-skirt transition remained committed and restored the same
result without restarting the demo. This is still a derived GLES coordination
policy, not a general recursive dependency rule or a category-wide instruction
to hide the bottom of every top.

stable brown skin-coloured islands were initially misclassified as target RGB
or alpha. Controlled comparisons with the mask disabled, target alpha forced
opaque, the selected material base filled underneath, and source-alpha RGB
blending all retained the same islands. Hiding only the nude body changed the
islands to clear background while leaving the complete dark tuck panel. The
body was therefore winning depth against a valid, nearly coplanar decal
carrier. Disabling depth testing and depth writes initially hid those central
islands, but a later oblique view proved that the tuck then painted over hands
and arms far in front of the waist. That workaround is rejected. The default
again retains authored depth testing; `?tuckDepth=off` exists only to reproduce
the rejected comparison. This remains fixture-bounded GLES evidence, not a
general rule for other shirts, masks, sexes, support meshes, or renderers.
Append `?tuckRgb=pants`
only for the separate rejected same-owner-pants RGB experiment; it changed the
support to grayscale and therefore is not the default. Any missing or ambiguous
identity is deferred without changing the fallback attachment or dropping
retained data.
Geometry inspection also proves that the required tuck support is a genuine
lower-torso carrier close to the monolithic nude body: after the currently
matched morphs, 56 of its 311 vertices remain within 1 mm of that body. The
single GR2 area covers all 490 non-degenerate triangles in two fully
triangulated panels; there is no second effect or interior topology hole that
could produce the islands. The
authored `tuck.black` classifies its only mesh area as `decalAreas`, uses
`SkinnedAvatarBRDFDoubleLinear.fx`, retains `TransformUV0 = [0, 0, 0.5, 1]`,
and sets `CutMaskInfluence = 0`. The shipped GLES effect contributes only an
alpha reference of 192; the decal render mode owns blending. The earlier proof
override (`alpha > 0`, blending off) contradicted that authored classification
and has been removed. The exact tuck proof now preserves the decal-area render
state and reports `authored-decal-area-state-v1`. Because ccpwgl's legacy GLES
path does not provide a qualified authored decal depth-bias contract here.
Triangle deletion, feeding the tuck mask into the foundation cut consumer,
arbitrary polygon offsets, and depth disabling remain unsupported. The
selected-top alpha transfer remains derived policy, and final
depth/coverage ownership remains open.

The default retains authored depth testing and uses the selected top's
colourized RGB for the tuck support, matching the source that owns the
support's alpha and material identity. The completed-body comparison remains
available as `?tuckRgb=body`; it can reproduce the differently coloured belly
when skin-owned layers beneath the selected top leak into the support colour.
The completed tuck texture is attached with a neutral white diffuse multiplier;
the proof fallback's diagnostic tint must not recolour a ready composed
material.
Body normal and specular composition now places the selected top after
skin-drawn augmentation layers, so the garment owns its final lighting channels
without requiring the tuck to sample the completed skin target. Adding
`&morphs=off` still reproduces the earlier
pre-deformation stage without deleting any retained morph request.

The remaining defect is a camera-dependent strip of nude skin at the lateral waist. Exact
GR2 inspection proves that `Tuck_BodyUvShape` is two disconnected open sheets,
one front and one rear, with no triangles joining their side boundaries.
Disabling `tuckmaskmid` and forcing the tuck output alpha opaque both leave the
lateral exposure unchanged, so neither the cut mask nor output alpha owns it.
With the combined `basenude.gr2` foundation, the selected shirt's six authored
left/right lower, middle, and upper hip-pinch targets resolve against mesh 1 of
`pantscf01.gr2` and the exact `tuck.gr2` support, but not against the nude
foundation; the pants shell at mesh 0 is unchanged. Turning off all GPU
morph realization removes the lateral exposure but also leaves the shirt in
front of the belt, so disabling the complete morph contract is rejected.
Turning off only those six lateral targets while retaining `pinchtuckshape`
removes the exposed skin at both front and oblique `cameraYaw=0.7` views and
keeps the shirt behind the belt. Hiding the nude-body foundation in the full
morph control changes the exposed skin to clear background, proving that the
foundation owns the leaking pixels rather than the replacement carrier.
Together these controls establish a deformation/underlay-ownership mismatch,
not another depth-state or atlas-alpha defect. `?morphs=hip-off` is retained as
a diagnostic only: every authored request remains in the construction report
and the six excluded realizations are reported as
`diagnostic-target-skipped`. It is not the default and is not Carbon behavior.
For narrower comparisons, `?morphSkip=TargetA,TargetB` accepts exact target
names through the same reported diagnostic path. It never removes the retained
request from the construction or renderer diagnostics.
Paper doll `3000001` also contains 14 authored sculpt selections while the
current appearance plan reports no sculpt targets, but every referenced
sculpting location is categorized as `faceModifiers`; none owns a body or waist
shape. That missing face stage therefore cannot explain this waist mismatch.
The demo does not invent lateral triangles, delete the foundation, or silently
discard the authored hip targets.

Exact-build index inspection proves that female LOD0 also ships as six split
authored body carriers: `topinner/torso_nude`,
`dependants/sleevesupper/standard`, `dependants/sleeveslower/standard`,
`bottominner/legs_nude`, `hands/hands_nude`, and `feet/feet_nude`, each with
its own `.black` and `.gr2`. The standard sleeve GR2s are the upper- and
lower-arm skin carriers. Garments with authored sleeve dependants replace them;
garments without those dependants retain them as part of the nude foundation.
The live deformation report proves all six hip-pinch targets apply together to
`legs_nude.gr2`, `pantscf01.gr2`, and `tuck.gr2`. With this split LOD0
foundation, all 18 retained morph requests remain enabled and the waist is
clean in front and `cameraYaw=0.7` comparisons. The demo now uses that split
LOD0 layout by default; `?foundation=combined` retains the earlier complete
nude comparison. This is not the old LOD1 split fallback and does not reduce
the authored LOD0 morph inventory. The existing GLES 58-bone right-hand mask
is transferred to the exact split hand carrier.

The active and older GLES demos both load the exact authored
`head/head_generic/head_generic.gr2` head. Their body layouts differ: the older
LOD0 reference paired it with the monolithic `basenude.gr2`, while the active
demo defaults to the six authored split LOD0 carriers above. A small visible
head/neck size discontinuity therefore is not evidence that the active demo
selected a lower-quality or alternate head asset. The retained paper doll has
14 face-sculpt selections, but the current CPU appearance plan does not yet
turn those records into head/body sculpt requests. Until that programmatic
stage exists, the seam remains unresolved; the GLES adapter must not hide it
with an invented head scale or hand-tuned neck transform. The body remains on
the higher-quality selected CD texture/composition path.

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

Garment colour alpha is not a qualified foundation cut mask. A reviewed female
trouser record retains a `bottomtight` occlusion and a sparse colorize-layer
alpha, but applying that alpha as a black-cut body mask removed most of the
body in the live comparison. The relation proves selected-layer suppression;
it does not establish foundation-mask polarity or ownership. Paired leg-tattoo
occlusions likewise do not authorize triangle deletion. The remaining small
skin-like regions around that trouser geometry stay diagnosed and unresolved
until a separate authored mask or support-carrier contract is established.
Other bottoms retain the nude foundation unless their own source-backed
coverage contract is independently qualified.

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

## Current interactive-parts visual qualification

Status: operator-reviewed fixture evidence, 2026-08-15. These observations are
bounded to the current GLES demo and selected female fixture; they are not
Carbon facts or general part-family guarantees. The older GLES editor remains
a comparison guide for capabilities that are not yet realized here.

| Part family | Current review |
| --- | --- |
| `makeup/scarring`, `scars/head`, `makeup/aging`, `makeup/armright`, `makeup/augmentations` | Visually good in the reviewed selections. |
| `makeup/eyeshadow`, `makeup/lipstick` | Visually good in the reviewed selections. |
| `makeup/eyes` | Selected colour and geometry work. A controlled off/on lifecycle now rebinds the composed eye specular channel; final wetness is awaiting review. |
| `makeup/bodyaugmentations` | Diffuse and owner-masked normal are live for both reviewed sexes; owner-masked specular is live when the selected foundation supplies one exact body specular source. Final material intensity remains under visual review. |
| `accessories/glasses` | The five observed female choices now resolve through one source-shaped configured-accessory contract. EyeImp's exact `head` L/Z/N/S tuple and the Citadel/Pilot `acc` tuples reconstruct private targets, bind every fallback effect atomically, and remain separate from garment composition. Full-placement control maps may scale independently of pixel aspect; cropped maps still require exact target-aspect agreement. Focused live renderer checks completed without material deferrals; broader visual qualification remains pending. |
| `hair` | The retained 158-row inventory is audited as configured, model-bundled, texture-only, or unresolved rather than through a style table. Detailed cards bind private L/Z-derived diffuse and retained normal with neutral specular by default; equivalent reverse pairs collapse, while other authored reverse areas keep a reverse-winding draw. Finished and single-colour rigid headwear use independent private targets. Texture-only scalp/head layers compose through the shared head path, with detail-mode replacement normals explicitly reported as withheld. Head-shell helpers, glass, rigid double-linear surfaces, and one unresolved definition remain diagnosed instead of receiving plausible fallback materials. |
| `accessories/nose` | Geometry appears plausible; textures remain unqualified. |
| `bottomouter` | Pants can be correct, but the belly/tuck region can look clamped and stretched. |
| `makeup/eyebrows` | Focused eye-region review qualified the current carrier shape, placement, and colour as visually good. |
| `makeup/eyelashes` | The exact weighted dependency resolves and remains reported. Source alpha now drives the two configured lash carriers because the retained dependency weight has no proved texture-opacity meaning; the earlier weighted-alpha result remains a comparison control. |
| tear ducts | The generic-head support D/N/S material removes the solid white inner-corner wedges in the focused comparison; operator review remains pending. |
| `outer` | Mixed but improved: exact typed removal/occlusion relationships suppress selected pants and footwear contributions before GPU construction. Exploration Suit binds its exact baked D/N/S material. Male Drifter hides its typed torso, leg, and foot carriers; Armor also hides its independently named hand carrier. A standard JacketCM variant now resolves its configuration-authored geometry only after membership in the retained candidate inventory is proved. Other coverage and exception semantics remain unresolved. |

### Automated clothing audit, 2026-08-16

This audit uses the exact-build library, the violent-green HTML proof, and
framebuffer-alpha telemetry at the recorded drawing-buffer dimensions.
`?clothingAudit=1` runs each exact
observed apparel choice after fully releasing the previous audit appearance.
`?clothingAuditLocation=outer` limits a run to one or more comma-separated
modifier keys without changing the default complete apparel sweep. Each result
retains a compact renderer projection for configured parts, garment material
realization, area contracts, retained channel state, and foundation coverage;
live engine objects are not serialized.
That audit release is deliberately non-atomic. Ordinary interactive changes
instead prepare a hidden revision with independent composition targets while
the committed revision remains visible. At handoff, the adapter transfers the
cached-geometry morph and triangle-coverage leases, publishes the replacement,
then releases the prior revision. A failed handoff reacquires the prior leases
and leaves that revision visible. The editor updates the `part.*` URL state
without reloading the page; paper-doll record changes still navigate to a fresh
page. The renderer also fingerprints the source-neutral construction before
preparation. An exact repeat reuses the immutable committed stage without
fetching, composing, or handing off another object. A changed construction is
classified into foundation, geometry, body, head, private-material, morph, and
coverage domains and that dirty-domain record is passed to the adapter. The
current adapter still prepares every dirty revision completely; selective GPU
target reuse remains gated on explicit shared-target lifetime ownership.

The first run was invalidated. It collapsed two distinct resource variations,
routed uncached resources through the removed `/ccp` tools-service target, and
mistook shared live morph-buffer conflicts for apparel failures. The current
catalog keys choices by resource and variation, the demo obtains the exact
`/eve/<build>/resources` root from its tools-service bootstrap, and the audit
lifecycle does not leave the prior doll holding a conflicting geometry lease.

The corrected individual-choice sweep was rerun after typed selection
suppression was realized. The runner now records the renderer transaction
result rather than treating every non-throwing call as a commit:

| Sex / baseline | Exact choices | Committed | Other outcomes |
| --- | ---: | ---: | ---: |
| Female / `3000001` | 146 | 146 | 0 |
| Male / `3003901` | 140 | 140 | 0 |

All female choices committed: `bottominner` 12/12, `bottomouter` 27/27,
`bottomunderwear` 3/3, `feet` 27/27, `outer` 30/30, `topinner` 12/12,
`topmiddle` 31/31, `topouter` 1/1, and `topunderwear` 3/3. All male choices
committed: `bottominner` 12/12, `bottomouter` 30/30, `bottomunderwear` 6/6,
`feet` 29/29, `outer` 37/37, `topmiddle` 21/21, and `topouter` 5/5.
Commit still does not prove that every selected surface and channel was
realized; the configured-material report now distinguishes complete and
partial surface realization.

A later realization-aware rerun distinguishes texture-only inner layers from
missing geometry. All 30 female inner choices applied through the shared body
atlas: 12 `bottominner`, 3 `bottomunderwear`, 12 `topinner`, and 3
`topunderwear`. All 18 observed male inner choices did the same: 12
`bottominner` and 6 `bottomunderwear`. None produced enclosed-alpha or
diagnostic-colour alarms, and representative female top/bottom and male boxer
fixtures were visually coherent. The retained but unobserved male top layer is
still a catalog-coverage fixture rather than an observed-choice result.

A targeted post-fix check explains the five former `topouter` rejections on
baseline `RobeAM01`. The resolver retains each
selection but suppresses its render contribution because the robe has an exact
typed `topouter` occlusion; duplicate torso coverage is therefore never sent to
the adapter. The complete 140-choice male rerun above includes that correction.

`ShirtMilM01_dust` was also checked without the robe. Its retained Black has two
configured material carriers over one GR2 mesh: `TopTuckingShape` exactly names
the sole geometry mesh while `Neck_RenamedShape` carries an out-of-range index.
The adapter admits the unmatched carrier only under that complete bounded
predicate and reports `single-geometry-configured-alias`; it does not adopt the
old demo's general mesh-zero fallback. A retained dependency Black with no
visual meshes is reported as support-only instead of receiving fabricated
geometry. The resulting standalone shirt commits and its reviewed front-view
material and silhouette are coherent.

Commit is only a transaction result. It does not prove texture correctness,
UV placement, D/N/S registration, coverage, clothing rules, tuck fit, or an
artistically correct result. Direct green-background review found:

- `ExplorationSuit_F01` originally attached geometry but remained diagnostic
  grey because the configured-garment path admitted only colorized L/Z inputs.
  It now uses its exact version-baked D/N/S maps without inventing tint colours;
  exact typed location removals are now applied before GPU construction. The
  reviewed front view is coherent; broader coverage and exception semantics
  remain unresolved.
- The male Drifter fixture independently retains typed `topinner`,
  `bottominner`, and `feet` relations. Once its configured suit is ready, the
  adapter hides the corresponding torso, leg, and foot foundation carriers and
  retains head and hands. This is a bounded source-backed result, not a general
  full-body-outerwear rule.
- Male Armor independently retains the same three relations plus an exact
  `hands` relationship. Its reviewed front view applies all four foundation
  roles while retaining the head. The long Lab Coat is the negative control:
  it names upper-body coverage only and does not infer leg, foot, or hand
  coverage from its silhouette.
- JacketCM retains one configuration and three geometry candidates. The
  runtime plan keeps that inventory unresolved; the GLES adapter now accepts
  the single geometry path named by the decoded configuration only when that
  path belongs to the retained candidate set. Missing, conflicting, and
  unretained paths remain rejected rather than falling back by filename or
  candidate order.
- `JacketCF01` and the female `topouter` choice render coherent clothing in the
  reviewed front view. Their green cuff opening is also present on the baseline:
  it is the known anatomical-right-hand compatibility mask required by the
  temporary 58-bone GLES palette, not a garment-specific alpha hole.
- framebuffer alpha is an alarm, not a cause detector. Camera, silhouette,
  authored openings, coverage, and the deliberate right-hand mask all affect
  the counts. The audit records dimensions, thresholds, hashes, and enclosed
  transparent components so flagged cases can be reproduced and viewed.
- the corrected outerwear sweep produced no diagnostic-magenta pixels. The
  largest enclosed-alpha alarms were the two Exploration Suit families and the
  female JacketCF family. Focused front views showed coherent suit materials;
  the female fixture still exposes the known anatomical-right-hand opening.
  These alarms remain useful regression fixtures but are not classified as
  garment-alpha failures from the aggregate count alone.
- configured-garment diagnostics now retain each effect's decoded area fields,
  exact cut-mask influence and sampler declaration, the applied compatibility
  cut policy, plus an RGBA/alpha readback summary of the composed target. A
  fallback effect now retains the exact decoded influence while using the
  explicit neutral-white cut sampler; blend, depth, and final framebuffer-alpha
  ownership remain separate area-contract questions.
- reconstructed private garment targets use identity sampling. Exact geometry
  UV bounds align with the retained 2048-atlas placement for the reviewed
  cropped Jacket source and span the reconstructed private atlas for the
  reviewed full-size suits. Reapplying the Black material's half-width bounds
  would move those samples away from their reconstructed source viewport.
- a genuinely lone version-authored RGBA layer that satisfies the existing
  exact provenance gate is now a complete configured-private diffuse candidate,
  rather than a partial body-atlas result that could reach composition without
  a candidate. This is format-shaped handling and does not name an outfit.
- configured garment reporting no longer labels a diffuse-only attachment as
  complete when retained normal/specular realization is unresolved. Each
  applied part now reports expected, complete, partial, and deferred surface
  counts, and the part status remains explicitly partial until all targeted
  surfaces and required lighting channels are attached.
- the effect parameter API reports whether a value changed, not whether the
  parameter exists. Treating an already-white diffuse tint as an unsupported
  parameter rolled the body/garment hybrid surface back across every reviewed
  configured bottom family. The binder now tests parameter capability
  separately from change reporting. Fresh filtered sweeps attach every expected
  configured surface for all 27 female and all 30 male observed bottom choices.
  This qualifies the attachment contract only: the reviewed `SkirtMilF01`
  silhouette and material appearance remain visually unresolved.
- decoded configured-body ownership takes precedence over the fallback's
  secondary material library. The reviewed two-carrier bottoms contain a
  DoubleLinear body/skin carrier plus a separate Linear cloth carrier. The
  body carrier now stays on the shared body RGB and owner-alpha path; only the
  cloth carrier receives private garment D/N/S. This is an effect-contract
  rule, not a bottom-family exception. The rebuilt attachment is structurally
  qualified, while final skirt colour and silhouette remain operator-review
  items.
- configured garment locations now supply the missing body target for retained
  short-form channel names. A short-form luminance or zone channel is admitted
  only when the exact selected type/version also resolves one retained material
  definition; ordinary unknown luminance files remain unresolved. This lets
  exact military-skirt version channels supersede inherited base diffuse,
  normal, or specular channels by semantic output even when their filename
  stems differ. Each source still retains and applies its own atlas placement.
- the filtered exact outer sweeps now retain material realization rather than
  only transaction status. All 30 female and all 37 male observed outer choices
  report complete configured-garment D/N/S realization. `JacketMilF02` required
  one generic version-overlay correction: an exact-version normal or specular
  channel supersedes an inherited base channel with the same semantic target,
  even when their filename stems differ; unrelated inherited channels such as
  its cut mask remain available.
- one Exploration Suit dependency proves that a retained single geometry
  candidate and its decoded configuration can name different immutable aliases.
  The adapter keeps the retained explicit candidate, reports
  `retained-explicit-config-alias`, and does not extend that outcome into a
  filename or folder rule. Paths outside the retained candidate inventory still
  fail.
- fifteen observed jackets retain distinct opaque and decal effects. Their
  channel attachments are complete and their authored area fields remain
  intact, but this is not promoted into a blanket opaque policy. The wider
  selectable inventory also contains one robe configuration with a distinct
  transparent effect; mixed area partitions remain independently reviewable.

### Inner-clothing qualification, 2026-08-16

The editor now exposes all four realized texture-only inner locations by
default: `bottominner`, `bottomunderwear`, `topinner`, and `topunderwear`.
The observed-choice audits commit 30/30 female choices and 18/18 male choices.
Each family uses retained body L/Z diffuse inputs plus independently placed
normal and specular inputs; the body-lighting planner now composes those N/S
channels and applies the same exact authored-occlusion decision used by diffuse.
An occluded underwear layer is retained in diagnostics and contributes no D/N/S
pixels.

The following isolated review fixtures remove only the exact covering apparel:

- `?paperdoll=3000001&part.25=&part.26=&part.22=` reviews the female legacy-key
  top and bottom underwear.
- `?paperdoll=3019576&part.10=&part.25=&part.26=&part.22=` reviews the current
  female underwear locations.
- `?paperdoll=3003901&part.10=&part.25=&part.22=` and the analogous `3019517`
  URL review the two male bottom-underwear location forms.
- `?fixture=male-top-underwear` exposes retained male resource `16182`, which is
  present in the exact library but is not referenced by an observed paper doll;
  the normal catalog therefore continues not to invent it as an observed choice.
- `?paperdoll=3000001&part.25=&part.22=&part.26=565%400` confirms that an exact
  tank-top occlusion suppresses the underlying female upper underwear while
  leaving bottom underwear active.

The reviewed female and male underwear textures are coherent in front view.
The male split foundation now restores the upper- and lower-arm skin carriers
authored as exact dependencies of `male/topinner/torso_nude`. The join requires
one hydrated dependency target with one self-contained version and one
configuration/geometry pair; absent or ambiguous relations do not fall back to
constructed paths. `?fixture=male-top-underwear` verifies the previously absent
arms without assigning that texture-only garment ownership of the geometry.

The earlier 1,047 synthetic pair figures are not retained as current evidence;
they were produced under the invalid delivery and morph lifecycle. The full
Cartesian product is also not claimed: the five core female selectors alone
describe 9,444,708 mostly unobserved tuples. The next bounded compatibility
gate should use source-observed outfits: first the exact paper-doll tuples, or a
source-observed pair-cover set, followed by targeted synthetic pairs only for
high-risk top/bottom, bottom/feet, and outer/underlayer interactions.

The `skintype` control exposed a concrete region split: its exact retained
`colorize_head_l/z` and `colorize_body_l/z` candidates and material colours
were present, but only the body diffuse planner admitted the selected
contribution. The head planner now places that same selected skintype pass at
order `1`, immediately above the resolved base skintone at `0` and below aging
at `10`. This is a programmatic join over retained group, texture-role, target,
and material records. The older GLES editor corroborates the intended
head/body participation only as reference behavior; final pixel parity still
requires live visual review.

## Checks

These checks do not rebuild ccpwgl:

```powershell
node --test demo/character/test/*.test.mjs
node --check demo/character/server.mjs
node --check demo/character/src/main.mjs
```
