# Core Engine

The engine folder contains the small set of runtime services that hold the rest of CCPWGL together. These classes are not scene objects or EVE domain models; they are the shared infrastructure that creates the browser runtime, resolves resources, tracks global state, and coordinates initialization.

Most code should enter through `Tw2Library` (`tw2` from `global/tw2.js`). Lower-level classes are available for advanced or internal use, but `Tw2Library` owns the normal lifecycle.

## Main Pieces

### `Tw2Library`

`Tw2Library` is the engine facade and singleton. It owns the major stores and managers:

- `device`: the WebGL device and frame state.
- `resMan`: resource loading, resource lifetime, watches, and raw fetch helpers.
- `capabilities`: registered capability providers and their latest reports.
- `logger`: engine logging.
- `constructors`, `extensions`, `paths`, `variables`, `shaders`: runtime stores used by readers, resources, and scene objects.

The usual initialization flow is:

```text
tw2.Register(config)
tw2.Initialize(...)
    Register user/options
    Create WebGL context
    Process capabilities
    Optionally start render tick
    Load SOF bootstrap data
```

`tw2.Fetch(value)` is the high-level fetch helper. It handles SOF/DNA values, then delegates normal resource paths to `resMan.Fetch(path)`.

### `Tw2Device`

`Tw2Device` owns the WebGL context, canvas state, frame timing, viewport matrices, and render/device events.

It is created during `Tw2Library.Initialize()`:

```text
tw2.device.Create(...)
```

After creation it emits `context_created`, and every frame `Tw2Library.StartFrame()` calls:

```text
device.Tick()
resMan.Tick()
audMan.Tick() if present
```

WebGL object creation and upload work must stay on the main thread.

### `Tw2ResMan`

`Tw2ResMan` owns engine resources and loading objects. Its job is resource lifecycle, not EVE domain decisions.

Main entry points:

```text
resMan.Fetch(path)
    Resource/object aware fetch.
    Decides between FetchObject and FetchResource.

resMan.FetchRaw(url, responseType)
    Direct raw data fetch for JSON/text/blob/arraybuffer and API-style calls.

resMan.GetResource(path)
    Immediate resource object retrieval.

resMan.FetchResource(path)
    Promise wrapper around GetResource.

resMan.GetObject(path)
    Loading-object path for .red/.black object construction.

resMan.FetchObject(path)
    Promise wrapper around GetObject.
```

Resource/object fetch flow:

```text
resMan.Fetch(path)
    -> FetchResource(path) or FetchObject(path)
    -> LoadResource(res)
    -> QueueLoad(res, url, responseType)
    -> Tw2LoadingObject.StartRawLoad()
    -> active loader Fetch(...)
    -> res.OnLoaded()
    -> Queue(res, response)
    -> resMan.Tick()
    -> res.Prepare(...)
    -> res.OnPrepared()
```

`FetchRaw` intentionally bypasses the resource lifecycle. Use it for direct data requests and wrapper/API code.

### Resource Loaders

`Tw2ResMan` delegates queued raw resource loading through a loader object.

`Tw2ResManMainThreadLoader` is the default loader. It calls:

```text
resMan.FetchRaw(url, responseType)
```

`Tw2ResManWorkerLoader` is optional and data-only. It uses one Web Worker instance to fetch cloneable raw data:

```text
arraybuffer
text
json
blob
```

Enable it with:

```js
tw2.resMan.UseWorkerLoading(true);
```

The worker path only fetches raw data. It does not construct resources, create textures, access WebGL, or touch DOM state. Preparation still happens on the main thread.

`resMan.maxConcurrentLoads` controls how many queued load tasks can be active. The worker loader currently uses one worker, but multiple async fetches can be in flight through it.

### `Tw2MotherLode`

`Tw2MotherLode` is the resource registry/cache used by `Tw2ResMan`.

It tracks:

- loaded resources by path
- resource errors
- watched objects/resources
- purge/unload behavior

`Tw2ResMan` owns the motherlode and should be the usual access point.

### `Tw2CapabilityStore`

The capability store lives under `core/store`, but `Tw2Library` owns an instance as:

```js
tw2.capabilities
```

Capability providers register inert metadata and a resolver:

```js
tw2.capabilities.Register({
    key: "texture.formats",
    category: "texture",
    label: "Texture formats",
    resolve: async ({ tw2 }, opt) =>
    {
        return /* report data */;
    }
});
```

Providers must not run probes on their own. `Tw2Library` controls when capability providers run:

```js
await tw2.ProcessCapabilities();
```

`Initialize()` processes capabilities by default after the WebGL context is created. This can be configured:

```js
capabilities: true
capabilities: false
capabilities: { keys: "texture.formats" }
capabilities: { keys: [ "texture.formats" ] }
```

Capability phase events:

```text
pre_capability_process
post_capability_process
```

The store records and formats reports; it does not decide policy. Systems report facts such as declared, constructed, verified, fallback, and reason. Configuration/policy decisions should happen above the provider.

### `Tw2Logger`

`Tw2Logger` handles engine log entries, console display, history, visibility, and throttling. `Tw2Library` exposes convenience methods such as `Log`, `Info`, `Warning`, and `Error`.

### `Tw2AudMan`

`Tw2AudMan` is the audio manager. It belongs in the engine layer because audio resources and runtime audio state are engine-level concerns. It is not fully wired as a default singleton yet.

## Boundaries

The engine layer should own:

- WebGL context and frame state
- resource paths/extensions/lifetime
- resource loading and preparation
- capability collection and reporting
- logging
- audio runtime state

The engine layer should not own:

- ESI or app-specific API wrappers
- UI input abstractions
- camera controls
- WebXR application glue
- policy-heavy decisions that belong to wrapper/runtime configuration

Those belong in a runtime/wrapper layer above the engine.

## Naming Notes

`Tw2*` names are engine contracts or CCP-style runtime concepts.

`Tw2ResMan*` names are implementation pieces owned by `Tw2ResMan`.

Browser/application glue should generally avoid `Tw2*` naming unless it becomes a core engine contract.

## Register contract

In this codebase, `Register(...)` is the bootstrap/configuration entrypoint for engine classes.

- It is intentionally a **partial assignment** API: only properties present in the input are applied.
- It may include validation and side effects (for example, mode switches or loader creation).
- Some classes have properties that are only valid before initialization, while others can be updated at runtime.

Current status:

- We are tracking potential unsafe-at-runtime options by convention inside each class implementation.
- A future step is to add optional decorator/metadata annotations to declare register keys that are **not** safe to change after initialization.
- Any such metadata would remain opt-in and only needed for non-default cases.

## Library goals / follow-ups

- Enforce required `out` parameter contract for new/updated numeric-write APIs that fill typed arrays or typed-array-like values.
- Set a naming convention for optional-out helpers (`opt`) only if it is not already used for options-style inputs; otherwise prefer explicit names.
- Review all configuration parameters in public docs/code and migrate to `options` when the value is a generic options bag to avoid confusion with optional output helpers.
