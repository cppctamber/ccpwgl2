import "core-js/stable";
import "regenerator-runtime/runtime";
import "reflect-metadata";

// SMART LIGHTS: geometry works, emitters do not.
//
// `src/eve/smartLights/**`, `src/eve/distribution/**` and `src/eve/lights/**`
// are ported, exported from `src/eve/index.js` and registered. As of
// 2026-08-22 `EveChildSmartLightSet` hydrates for real - it used to discard
// `distribution` and `lightGroups` through `skippedObject`, so a hull carrying
// smart lights parsed cleanly and built nothing - and `EveSmartLightQuad`
// renders, de-instanced onto its own buffer the way `EveChildQuad` already
// does. What is still missing, in the order it has to be solved:
//
//  1. `EveSmartLightMesh` has never been ported, here or upstream. Carbon's
//     extends `EveChildInstanceMeshRenderer`, so it needs that base first.
//  2. `EveSmartLightPointLight.GetLights` was transcribed faithfully from
//     runtime-trinity and still speaks Carbon's contract - it pushes a
//     `Tr2LightManager::PerLightData` record through `lightManager.AddLight`.
//     ccpwgl's sink is `Tw2CarbonLightCollector.Collect(rows)`, reached as
//     `GetLights(collector, parentContext)`, with a different row shape. That
//     bridge is what makes a smart light actually EMIT light, and it is
//     deliberately second - operator direction is geometry first.
//  3. Nothing calls `RegisterSecondaryLightSource`, so placements exist but no
//     object offers itself as a bounce source.
//
// See NOTES-shlighting-2026-08-17.md and
// AGENT-HANDOVER-smart-lights-2026-08-22.md.
import { config } from "./config";
import { tw2 } from "./global";
import * as runtime from "./runtime";
import { shaders as deprecatedShaders } from "./toDeprecate/shaders";
import { pickingShaders } from "./picking";
import { Tw2GpuParticleShaders } from "./unsupported/particle/shaders";

tw2.runtime = runtime;
tw2.Register(config);
tw2.Register({ shaders: deprecatedShaders });

// Standalone material-picking shaders. None of them `replaces` anything, so
// registering them cannot change how a ship ordinarily draws.
tw2.Register({ shaders: pickingShaders });

// Hand written GPU particle shaders. The shipped set for this profile does not
// compile and the DX11 set is compute; neither is reachable here.
tw2.Register({ shaders: Tw2GpuParticleShaders.All });

export { tny } from "./runtime";
export { EveSOFDataHandler } from "./sof/EveSOFDataHandler";
export { deprecatedShaders };
export { Tw2MaterialPicker, Tw2MaterialPickResult } from "./picking";

// GPU particle state. Exported so it can be exercised directly - the arithmetic
// is unit tested, but whether four rgba32f targets are real is a device
// question and only a device can answer it.
export { Tw2GpuParticleState } from "./unsupported/particle/Tw2GpuParticleState";
export { Tw2MultiRenderTarget } from "./core/Tw2MultiRenderTarget";
export { Tw2GpuParticleEmitPass } from "./unsupported/particle/Tw2GpuParticleEmitPass";
export { Tw2GpuParticleParams } from "./unsupported/particle/Tw2GpuParticleParams";

// The material class itself. Anything driving a MANUAL shader - a picking pass,
// a particle pass, a tool - has to build an effect around it, and until now the
// only way to get one was to borrow it off a hull that happened to be loaded.
export { Tw2Effect } from "./core/mesh/Tw2Effect";
export { tw2, tw2 as CCPWGL };

// Carbon (translated DX11 shader path) support modules — exposed for the
// upload layer's consumers and the hlslreader parity harness.
export { Tw2CarbonLightList } from "./core/carbon/Tw2CarbonLightList";
export { Tw2CarbonLightCuller } from "./core/carbon/Tw2CarbonLightCuller";
export { Tw2CarbonResourceBinder } from "./core/carbon/Tw2CarbonResourceBinder";
export * as Tw2CarbonData from "./core/carbon/Tw2CarbonData";

