# Carbon Converted Shader Test Plugin

This folder contains side-loaded Carbon shader experiments. It is intentionally
outside the normal ccpwgl source bootstrap.

## Load

From a page served by VS Code Live Server at the repository root:

```js
const carbon = await import("/public/carbon/index.js");
carbon.RegisterCarbonShaders(tw2);
```

The plugin registers:

- `.sm_converted_hi` -> `CarbonConvertedEffectRes`
- `SSAOMap` as a white texture after the WebGL context exists
- `tw2.carbon` helpers

## QuadV5 Test

```js
await tiny.scene.FetchShip("ab1_t1:amarrbase:amarr");

const ship = w[0];
const effect = ship.mesh.opaqueAreas[0].effect;

effect.SetValues({
  effectFilePath: tw2.carbon.quadV5Path,
  autoParameter: true,
  options: {
    SPACE_OBJECT_TRANSPARENCY: "SOT_OPAQUE"
  }
});

const adapter = tw2.carbon.InstallQuadV5EveShip2Adapter(ship, effect, {
  glowScale: 1
});
```

The adapter uses `Tw2Effect`'s generic adapter lifecycle and does not mutate
`EveShip2`.

## AB Hull Shader Set

`RegisterCarbonShaders(tw2)` exposes:

- `tw2.carbon.shaderPaths`
- `tw2.carbon.shaderManifestPath`

The AB test set was generated from DX11 inputs under
`E:/shaderDiscovery/res/graphics/effect.dx11`; ccpwgl only stores the converted
CEWG test packages.

WebGL2 validation passed for:

- `quadv5`
- `quadheatv5`
- `skinned_quadv5`
- `skinned_quadheatv5`
- `shadowdepth`
- `unpacked_fxbannerv5`
- `blinkinglightspool`
- `decalv5`
- `decalcounterv5`
- `decalglowv5`

Known incomplete packages:

- `boostervolumetric` and `planeglow` translate but fail WebGL2 linking because
  HLSLcc emits mismatched `ConstantBuffer0` uniform block array sizes between
  vertex and pixel stages.
- `skinned_fxdirectionalv5` and `skinned_fxdistortionv5` were packaged before
  the HLSLcc stripped-structured-buffer fix and are not in the default
  replacement map yet; regenerate them before testing those area types.
- `shadowdepth` is a provisional DX11 mapping for the GLES2
  `spaceobject/shadow` `shadow.sm_hi` / `skinned_shadow.sm_hi` paths.
- Skinned QuadV5 packages lower `BoneTransforms` structured-buffer reads to the
  existing ccpwgl `JointMat` constant-buffer layout at `cb3[26..199]`.

## Notes

- The converted package includes Carbon pass metadata. The plugin applies
  `manifest.passes[].states` to each generated `Tw2ShaderPass`.
- QuadV5 `Main` has no explicit Carbon pass-state overrides; opaque depth/write
  behavior comes from the normal ccpwgl opaque batch mode.
