# Tny Runtime Scaffold

`src/runtime` is a provisional `Tny`-prefixed runtime facade for ccpwgl.
It is intended to become the demo/base-template layer users can keep, replace, or copy when building an application on top of the core graphics library.

This folder is not a finished public API yet. It is not exported from `src/index.js`, not wired as a package entrypoint, and not currently built as a separate bundle.

## Purpose

- Keep application-facing convenience classes separate from core reader/runtime classes.
- Provide a small client/service/render shape through `TnyClient`, `TnyApiService`, and `TnyResService`.
- Wrap existing reader-resolved objects with simpler `TnySpaceObject`, `TnyShip`, `TnyPlanet`, `TnyLensflare`, and `TnyStrategicCruiser` controls.
- Keep the only currently proven camera candidate in `TnyCameraTest`.
- Register `Tny` constructors through `RegisterTnyConstructors(...)` when a runtime chooses to use them.

## Boundaries

The core ccpwgl graphics path should consume graphics facts, usually SOF DNA, direct `.red`/object resources, or direct resource paths.
Type IDs, graphic IDs, human-readable ship/object names, ship-and-skin names, and skin IDs are catalog/resolution inputs.
Those can be resolved by ESI, SDE/static data, or a future unified runtime server, but the graphics library must still work without them.

`Tny` wrappers are not a translation layer for black/object-reader class names.
They should wrap existing reader-resolved objects until a concrete translation need is proven.

## Current Status

- `TnyClient` has a minimal object/camera/render workflow, with client-owned objects, camera selection, optional scene/post/renderer hooks, and batch rendering for objects that expose `GetBatches(...)`.
- `api/` contains provisional ESI and SDE/static-data-shaped provider adapters.
- `providers/TnyResService.js` is a placeholder provider boundary for future resource/path/fact services.
- `objects/` contains provisional front-facing object wrappers over existing EVE objects.
- `cameras/TnyCameraTest.js` wraps `WrappedTestCamera`; other wrapped camera experiments are not promoted here.

Not yet implemented:

- Multiple views, scissor rendering, and offscreen target orchestration.
- Front-facing slot/turret/launcher/overlay helpers comparable to the temporary `src/wrapped` slot workflow.

Expect these classes to move, split, or gain stricter contracts before this folder is treated as stable.
