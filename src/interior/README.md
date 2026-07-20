# Interior graphics staging

This tree is ccpwgl's supported graphics proving ground for interior scenes and
characters while the CarbonEngineJS runtime path is completed.

It owns the browser-facing compatibility implementation needed to test pixels:

- interior scenes, placeables, and lights;
- skinned character models and the interior animation controller;
- legacy GLES per-object data;
- converted-shader `cb3`/`cb4` packing and the 69-joint palette carrier.

The implementation was promoted atomically from `src/unsupported/interior`.
The old path is intentionally absent, and active source-inspection tests target
this tree directly.

This is not an authority for Carbon class behavior. Source-backed runtime
contracts remain in CarbonEngineJS; ccpwgl may carry explicit compatibility
adapters and rendering experiments needed for visual validation.

Run the focused checks from the repository root:

```powershell
npm run test:interior-additive-animation
npm run test:interior-animation-lifecycle
npm run test:interior-per-object-data
npm run test:interior-skeleton-resource
npm run test:cewg-interior-per-object-data
```

The live character renderers remain under `_dev/character` and
`_dev/character2`. They consume the registered interior constructors from the
normal bundle rather than maintaining another copy of the runtime classes.
