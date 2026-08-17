import "core-js/stable";
import "regenerator-runtime/runtime";
import "reflect-metadata";

// UNSUPPORTED, NOT REGISTERED: smart lights and distribution methods.
//
// `src/eve/smartLights/**`, `src/eve/distribution/**`, `src/eve/lights/**` and
// their dependencies (EveEntity, EveComponentTypes, EveChildTransform,
// PlacementDataWithIdentifier, EveChildUpdateParams) are ported, lint clean and
// committed, but they are NOT exported from `src/eve/index.js`, so they never
// reach `tw2.Register` and nothing can hydrate them. That is deliberate. What is
// missing, in the order it has to be solved:
//
//  1. `EveSmartLightPointLight.GetLights` was transcribed faithfully from
//     runtime-trinity and still speaks Carbon's contract - it pushes a
//     `Tr2LightManager::PerLightData` record through `lightManager.AddLight`.
//     ccpwgl's sink is `Tw2CarbonLightCollector.Collect(rows)`, reached as
//     `GetLights(collector, parentContext)`, with a different row shape and no
//     direction / innerAngle / outerAngle / light-profile fields. Bridging that
//     is what makes a smart light actually emit light; it needs a decision about
//     whether the collector row grows or an adapter sits between.
//  2. Nothing calls `RegisterSecondaryLightSource`, so placements exist but no
//     object offers itself as a bounce source.
//  3. `EveSmartLightQuad` is on disk but excluded even from its own barrel: it
//     needs `Tr2Effect` (ccpwgl has the different `Tw2Effect`),
//     `EveChildQuad.GetQuadDefinition()`, and a quad renderer
//     (`TriBatchType`/`RegisterEffect`/`AddQuads`) that ccpwgl has no analogue
//     for. `EveSmartLightMesh` was never ported - upstream has only a generated
//     shell, so it needs a fresh Carbon port.
//
// Registering them early would be worse than skipping them: a `.black` carrying
// smart lights would construct classes that cannot render, where today the
// reader skips the branch cleanly. See NOTES-shlighting-2026-08-17.md.
import { config } from "./config";
import { tw2 } from "./global";
import * as runtime from "./runtime";
import { shaders as deprecatedShaders } from "./toDeprecate/shaders";

tw2.runtime = runtime;
tw2.Register(config);
tw2.Register({ shaders: deprecatedShaders });

export { tiny } from "./wrapped";
export { tny } from "./runtime";
export { EveSOFDataHandler } from "./sof/EveSOFDataHandler";
export { deprecatedShaders };
export { tw2, tw2 as CCPWGL };

// Carbon (translated DX11 shader path) support modules — exposed for the
// upload layer's consumers and the hlslreader parity harness.
export { Tw2CarbonLightList } from "./core/carbon/Tw2CarbonLightList";
export { Tw2CarbonLightCuller } from "./core/carbon/Tw2CarbonLightCuller";
export { Tw2CarbonResourceBinder } from "./core/carbon/Tw2CarbonResourceBinder";
export * as Tw2CarbonData from "./core/carbon/Tw2CarbonData";

