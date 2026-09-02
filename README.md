CCP WebGL Library
======
A webgl implementation of CCP Game's Eve Online graphics engine.

This version of the library can load every ship and read client resources. Resources can now be loaded from a server, as long as that server supplies the CORS headers WebGL requires (CCP's own servers do not). Translated DX11 shaders load directly from Carbon effect containers, which `Tw2EffectRes` detects and translates at load time.

The original library can be found here: https://github.com/ccpgames/ccpwgl


Getting started
------

`tny` is the runtime you talk to, and the name is the point. **Tny is tiny.** It
is a small wrapper over the engine to get you started, not a complete API. It
covers the common path; anything past that is `tw2` and the engine classes
underneath, which every Tny object keeps a handle to as `wrapped`.

The bundle is UMD. Loaded with a `<script>` tag it puts everything it exports on
`globalThis`, so `tny` and `tw2` are just there, no import needed. Loaded as a
module it is the named export `CCPWGL2`.

### Requirements

Three things have to be supplied before any of this draws.

**Resources.** A server that serves `res:/` paths with the CORS headers WebGL
requires. CCP's own servers do not.

**Shaders.** Client resources do not include OpenGL shaders, so you either
supply them or let ccpwgl translate the DX11 effect containers at load time.
Which one is a device setting:

```js
await tny.Initialize({
    canvas: "canvas3d",
    camera: {},
    device: {
        // GLES2 and WEBGL2 both expect GLSL you already have.
        // DX11 reads Carbon containers and translates them at load time.
        effectProfile: youHaveOpenGLShaders
            ? tw2.const.DeviceEffectProfile.GLES2
            : tw2.const.DeviceEffectProfile.DX11,

        shaderQuality: tw2.const.DeviceShaderQuality.MEDIUM
    }
});
```

Use the constants rather than the raw values. `shaderQuality` in particular is
really the `.sm_` suffix on the shader path, so `HIGH` is `"depth"` and
`MEDIUM` is `"hi"`, which does not read the way you would expect written out.

`effect.dx11` needs no shaders of your own, but the translation is still in
alpha and costs real time on a large effect, because it is a build step running
at runtime.

**Id resolution.** Fetching by typeID, SKINR design, graphicID or `planetID`
means asking a service what that id refers to, so those need an API service
supplied. `TnyApiService` and its providers define what has to be answerable.
Dna strings and resource paths need only the first two.

### A ship on screen

```html
<script src="dist/ccpwgl2_int.js"></script>
```

```js
await tny.Initialize({ canvas: "canvas3d", camera: {} });
const scene = await tny.FetchScene("res:/dx9/scene/universe/a01_cube.black");
await scene.Fetch("ab1_t1:amarrbase:amarr"); // Apocalypse
```

The split is worth knowing up front, because everything else follows from it:

- **The client** (`tny`) owns the active scene, the cameras, and the render loop.
- **The scene** owns the objects in it, and fetches them.

So objects are always fetched *through a scene*, never through the client. A
client only ever holds whichever scene is active, and an app can have several
alive at once (a preview beside a stage, a backdrop being swapped), so it is
never the thing that decides where a new object lands.

### Fetching

`scene.Fetch` takes whatever you have. It works out what you meant, builds it,
and adds it to that scene:

```js
await scene.Fetch("ab1_t1:amarrbase:amarr");         // sof dna
await scene.Fetch(587);                              // a typeID
await scene.Fetch("a1b2c3d4-...");                   // a SKINR design
await scene.Fetch({ graphicID: 1234 });              // a graphicID
await scene.Fetch("res:/dx9/model/.../thing.black"); // a resource path
await scene.Fetch([ dnaA, dnaB ]);                   // an array in, an array out
```

The class you get back is whatever the thing turned out to be: a `TnyShip`, a
`TnyStationary`, a `TnyPlanet`. You do not have to know in advance.

Pass `doNotAdd` to build something without putting it anywhere:

```js
const ship = await scene.Fetch(dna, null, true);
scene.AddObject(ship);   // when you decide
```

A scene can be furnished as it loads:

```js
const scene = await tny.FetchScene({
    resPath: "res:/dx9/scene/universe/a01_cube.black",
    objects: [ "ab1_t1:amarrbase:amarr", { graphicID: 1234 } ]
});
```

Or the whole thing in one call:

```js
await tny.Initialize({
    canvas: "canvas3d",
    camera: {},
    scene: { resPath: "res:/dx9/scene/universe/a01_cube.black", objects: [ dna ] }
});
```

### Waiting for resources

A fetch resolves as soon as the object is built, and its textures and geometry
keep streaming in afterwards, which is what makes a hull appear straight away
and fill in. Pass a progress callback to wait for the whole thing instead:

```js
const ship = await scene.Fetch(dna, ({ percent, pending, total }) => {
    console.log(`${percent}%, ${pending} of ${total} outstanding`);
});
```

The fetch now resolves once nothing is outstanding. Set `scene.doWatch = true`
to wait on every fetch without passing a callback each time.

A resource that fails is reported and skipped rather than thrown, so one
missing texture never costs you the ship.

### Moving things

Everything you fetch is a transform, so position, rotation and scale are on the
object itself:

```js
const ship = await scene.Fetch(dna);

ship
    .SetTranslationFromValues(0, 0, -5000)
    .SetRotationFromEulerDegreeValues(0, 90, 0)
    .SetScaleUniform(2)
    .UpdateValues();
```

The setters chain. `UpdateValues` at the end is what applies them: it rebuilds
the transform and tells anything listening that the object changed.

`SetValues` does the same in one call, and updates for you:

```js
ship.SetValues({ translation: [ 0, 0, -5000 ], scaling: [ 2, 2, 2 ] });
```

`rotation` there is a quaternion, so the euler setters above are usually easier.

Or set them as it is built:

```js
await scene.Fetch({ dna, position: [ 0, 0, -5000 ] });
```

Celestials and lensflares do not arrive through `Fetch`, because they are
assembled from several resources rather than loaded from one:

```js
await scene.FetchPlanet({ planetID });
await scene.FetchLensflare("res:/dx9/scene/lensflare/...");
```

> **Note**
> Planets are currently broken while they are moved over to the newer style.
> `FetchPlanet` is documented here because the shape is settled, but do not
> expect it to draw yet.


