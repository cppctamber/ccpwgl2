import { mat4 } from "math";
import { Tw2BatchAccumulator } from "core/batch";
import { Tw2ConstructorStore } from "core/store";
import { device, resMan, tw2 } from "global";
import { isString, meta } from "utils";
import { TnyShip } from "./objects/TnyShip";
import { TnyPlanet } from "./objects/TnyPlanet";
import { TnyMoon } from "./objects/TnyMoon";
import { TnyScene } from "./TnyScene";


@meta.define("TnyClient")
export class TnyClient extends meta.Model
{

    options = {};
    services = new Map();
    objects = [];
    cameras = [];
    camera = null;
    scene = null;
    post = null;
    renderer = null;
    accumulator = new Tw2BatchAccumulator();
    constructors = new Tw2ConstructorStore();
    constructor(options = {})
    {
        super();

        const {
            api,
            apiService,
            camera,
            cameras,
            objects,
            scene,
            post,
            renderer,
            clearColor,
            view,
            ...clientOptions
        } = options;

        this.options = { ...clientOptions };

        if (clearColor)
        {
            this.options.clearColor = clearColor;
        }

        if (view)
        {
            this.options.view = view;
        }

        if (api || apiService)
        {
            this.SetApiService(api || apiService);
        }

        if (scene)
        {
            this.SetScene(scene);
        }

        if (renderer)
        {
            this.SetRenderer(renderer);
        }

        if (post)
        {
            this.SetPost(post);
        }

        if (cameras)
        {
            this.AddCamera(cameras);
        }

        if (camera)
        {
            this.SetCamera(camera);
        }

        if (objects)
        {
            this.AddObject(objects);
        }
    }

    /** Direct access to the engine facade owned by this runtime client. */
    get tw2()
    {
        return tw2;
    }

    get dt()
    {
        return device.dt;
    }

    get frame()
    {
        return device.frameCounter;
    }

    get canvas3d()
    {
        return device.canvas;
    }

    get canvas2d()
    {
        return device.canvas2d;
    }

    /**
     * Initializes the engine for this client.
     *
     * `scene` and `camera` accept either a constructed object or the config
     * that describes one - a resource path or options for the scene, camera
     * values for the camera. Both are resolved AFTER the engine comes up,
     * because both need a device: the scene fetches through `tw2.Fetch` and
     * the camera reads the canvas.
     *
     * A caller that has already built them loses nothing; an instance is
     * passed straight through. The config form exists so that the common case
     * - hand the client a nebula path and some camera values - does not make
     * every consumer repeat the same two constructions.
     */
    async Initialize(options = {})
    {
        const {
            client,
            render,
            scene,
            camera,
            cameras,
            objects,
            post,
            renderer,
            ...engineOptions
        } = options;

        if (client)
        {
            this.options = { ...this.options, ...client };
        }
        if (renderer) this.SetRenderer(renderer);
        if (post) this.SetPost(post);
        if (cameras) this.AddCamera(cameras);
        if (objects) this.AddObject(objects);

        // Instances can be set now; config has to wait for the device below.
        if (scene && scene.isScene) this.SetScene(scene);
        if (camera && this.constructor.IsCamera(camera)) this.SetCamera(camera);

        await tw2.Initialize({
            ...engineOptions,
            render: render || (dt => this.Render(dt))
        });

        // Camera before scene: fetching a scene yields to the network, and a
        // frame that ticks in that gap renders nothing without a camera.
        if (camera && !this.constructor.IsCamera(camera))
        {
            this.SetCamera(this.CreateCamera(camera));
        }

        if (scene && !scene.isScene)
        {
            await this.FetchScene(scene);
        }

        return this;
    }

    get api()
    {
        return this.GetApiService();
    }

    set api(service)
    {
        this.SetApiService(service);
    }

    SetService(name, service)
    {
        if (!name)
        {
            throw new TypeError("Invalid service name");
        }

        if (!service)
        {
            this.services.delete(name);
        }
        else
        {
            this.services.set(name, service);
        }

        return this;
    }

    GetService(name)
    {
        return this.services.get(name) || null;
    }

    /** Registers client-owned runtime constructor groups. */
    Register(options = {})
    {
        if (options.constructors)
        {
            this.constructors.Register(options.constructors);
        }
        return this;
    }

    HasClass(name)
    {
        return this.constructors.Has(name);
    }

    /** Resolves a constructor from this client, independently of tw2. */
    GetClass(name)
    {
        return this.constructors.Get(name);
    }

    SetClass(name, Constructor)
    {
        return this.constructors.Set(name, Constructor);
    }

    /**
     * Constructs one of this client's classes and hands it the client.
     *
     * Tools like the gizmos need to know which client they belong to. Being
     * given it here is what lets them stay ignorant of the exported `tny`:
     * a class that imports the client closes a cycle, since this client's
     * module is the one that imports every class in order to register it.
     * @param {String} name - a registered class name
     * @param {...*} args - constructor arguments
     * @returns {*} the constructed instance
     */
    Create(name, ...args)
    {
        const Constructor = this.GetClass(name);
        if (!Constructor)
        {
            throw new TypeError(`Unregistered class: ${name}`);
        }

        const instance = new Constructor(...args);
        if (instance && "client" in instance) instance.client = this;
        return instance;
    }

    SetApiService(service)
    {
        return this.SetService("api", service);
    }

    GetApiService()
    {
        return this.GetService("api");
    }

    SetRenderer(renderer)
    {
        this.renderer = renderer || null;
        return this;
    }

    GetRenderer()
    {
        return this.renderer;
    }

    SetScene(scene)
    {
        this.scene = scene || null;

        // Objects added before the scene arrived move into it, so they are
        // lit like everything added afterwards.
        if (this.scene && this.scene.AddObject && this.objects.length)
        {
            const migrating = this.objects.splice(0);
            for (let i = 0; i < migrating.length; i++) this.scene.AddObject(migrating[i]);
        }

        return this;
    }

    /**
     * Fetches a scene and sets it as the client's scene
     * @param {String|Object|Array} options - see TnyScene.Fetch
     * @returns {Promise<TnyScene>} the fetched scene
     */
    /**
     * Fetches a scene and makes it the client's.
     *
     * `objects` is optional and may name anything the runtime can build -
     * a dna string, a typeID, a SKINR id, or an options object. They are
     * fetched AFTER the scene is set so each one lands in it; fetched
     * before, they would be added to the client's own list and then drawn
     * outside the scene, which means unlit.
     *
     * @param {String|Object} options - res path, or TnyScene.Fetch options
     * @param {Array} [options.objects] - object specs to populate it with
     * @returns {Promise<TnyScene>}
     */
    async FetchScene(options, onProgress)
    {
        let objects = null;
        if (options && !isString(options) && options.objects)
        {
            ({ objects, ...options } = options);
        }

        const scene = await TnyScene.Fetch(options, onProgress);
        this.SetScene(scene);

        if (objects) await this.FetchObjects(objects, onProgress);
        return scene;
    }

    /**
     * Fetches several objects into the scene, in parallel.
     *
     * Each spec may carry a `type` naming a registered class; without one it
     * is a ship, which is what all but a handful of objects are.
     *
     * @param {Array|*} specs
     * @returns {Promise<Array>} the fetched objects
     */
    async FetchObjects(specs, onProgress)
    {
        const list = Array.isArray(specs) ? specs : [ specs ];
        return Promise.all(list.map(spec =>
        {
            if (spec && !isString(spec) && spec.type)
            {
                const { type, ...rest } = spec;
                const Constructor = this.GetClass(type);
                if (!Constructor || !Constructor.Fetch)
                {
                    throw new TypeError(`Unregistered or unfetchable object type: ${type}`);
                }
                return this.FetchInto(Constructor, rest, onProgress);
            }
            return this.FetchShip(spec, onProgress);
        }));
    }

    /**
     * Await an object's resources before it goes into the scene.
     *
     * Carried over from WrappedScene, where it was the same flag with the
     * same name. With it set, a hull is fully built before anything can draw
     * it; without it the object is added straight away and fills in as it
     * loads, which is what makes something appear immediately.
     * @type {Boolean}
     */
    doWatch = false;

    /**
     * Fetches through a runtime class and puts the result in the scene.
     *
     * Signature follows WrappedScene's fetchers - `(options, onProgress,
     * doNotAdd)` - because callers of those already know it and the two mean
     * the same things here.
     *
     * Passing `onProgress` turns watching on for that fetch. Wrapped watched
     * only when `doWatch` was set, so a caller who supplied a callback without
     * it got silence; asking to be told about loading is asking for the load
     * to be waited on.
     *
     * @param {Function} Constructor - a runtime class with a static Fetch
     * @param {String|Number|Object} [options] - see TnySpaceObject.Fetch
     * @param {Function} [onProgress] - resource watcher callback; implies doWatch
     * @param {Boolean} [doNotAdd] - hand it back without adding it
     * @returns {Promise<*>} the fetched object
     */
    async FetchInto(Constructor, options, onProgress, doNotAdd)
    {
        const object = await Constructor.Fetch(options);

        if (this.doWatch || onProgress)
        {
            await this.constructor.WatchQuietly(object, onProgress);
        }

        if (!doNotAdd) this.AddObject(object);
        return object;
    }

    /**
     * Watches an object's resources without letting one bad resource throw.
     *
     * `resMan.Watch` rejects when ANY watched resource errors. The object is
     * built by then, so a failed texture would otherwise discard a usable
     * hull - report it and carry on, which is what TnyScene.Fetch does with
     * a failed nebula.
     *
     * @param {*} object
     * @param {Function} [onProgress]
     * @returns {Promise<*>} the object
     */
    static async WatchQuietly(object, onProgress)
    {
        try
        {
            await resMan.Watch(object, onProgress || undefined);
        }
        catch (err)
        {
            tw2.Debug({
                name: "TnyClient",
                message: "Object loaded with failed resources",
                data: { err }
            });
        }
        return object;
    }

    /**
     * Fetches a ship (dna string, typeID, SKINR id or options object) and
     * adds it to the client's objects
     * @param {String|Number|Object} options - see TnySpaceObject.Fetch
     * @param {Function} [onProgress] - resource watcher callback
     * @param {Boolean} [doNotAdd] - hand it back without adding it
     * @returns {Promise<TnyShip>}
     */
    async FetchShip(options, onProgress, doNotAdd)
    {
        return this.FetchInto(TnyShip, options, onProgress, doNotAdd);
    }

    /**
     * Fetches a planet (or moon) and adds it to the scene
     * @param {Number|Object} options - see TnyPlanet.Fetch
     * @param {Function} [onProgress] - resource watcher callback
     * @param {Boolean} [doNotAdd] - hand it back without adding it
     * @returns {Promise<TnyPlanet>}
     */
    async FetchPlanet(options, onProgress, doNotAdd)
    {
        return this.FetchInto(TnyPlanet, options, onProgress, doNotAdd);
    }

    /**
     * Fetches a moon and adds it to the scene
     * @param {Number|Object} options - see TnyMoon.Fetch
     * @param {Function} [onProgress] - resource watcher callback
     * @param {Boolean} [doNotAdd] - hand it back without adding it
     * @returns {Promise<TnyMoon>}
     */
    async FetchMoon(options, onProgress, doNotAdd)
    {
        return this.FetchInto(TnyMoon, options, onProgress, doNotAdd);
    }

    GetScene()
    {
        return this.scene;
    }

    SetPost(post)
    {
        this.post = post || null;
        return this;
    }

    GetPost()
    {
        return this.post;
    }

    /**
     * True for a constructed camera, false for the config that describes one.
     * The class flag is what the runtime cameras actually carry; the instance
     * getter and the wrapped form are both checked because a camera can arrive
     * as any of the three.
     * @param {*} value
     * @returns {Boolean}
     */
    static IsCamera(value)
    {
        if (!value || typeof value !== "object") return false;
        return !!(value.isCamera ||
            value.constructor && value.constructor.isCamera ||
            value.wrapped && value.wrapped.isCamera);
    }

    /**
     * Builds a camera from config.
     *
     * `type` selects the class and defaults to the only camera the runtime
     * ships. It is a registered-constructor lookup rather than a switch so a
     * consumer can register its own camera and name it here.
     *
     * @param {Object} [options] - camera values, plus an optional `type`
     * @returns {*} the constructed camera
     */
    CreateCamera(options = {})
    {
        const { type = "TnyCameraTest", ...values } = options;
        if (!this.HasClass(type))
        {
            throw new TypeError(`Unregistered camera type: ${type}`);
        }
        return this.Create(type, values);
    }

    SetCamera(camera)
    {
        if (camera)
        {
            this.AddCamera(camera);
        }

        // Only the active camera listens: the outgoing one stops taking input
        // and the incoming one starts, which is what makes a camera swap feel
        // like a swap rather than two cameras fighting over the pointer.
        if (this.camera && this.camera !== camera && this.camera.controller)
        {
            this.camera.controller.enabled = false;
        }

        this.camera = camera || null;
        if (this.camera && this.camera.controller) this.camera.controller.enabled = true;

        return this;
    }

    GetCamera()
    {
        return this.camera || this.cameras[0] || null;
    }

    AddCamera(camera)
    {
        this.constructor.AddItems(this.cameras, camera);
        return this;
    }

    RemoveCamera(camera)
    {
        this.constructor.RemoveItem(this.cameras, camera);
        if (this.camera === camera)
        {
            this.camera = this.cameras[0] || null;
        }
        return this;
    }

    GetCameras(out = [])
    {
        out.push(...this.cameras);
        return out;
    }

    ClearCameras()
    {
        this.cameras.splice(0);
        this.camera = null;
        return this;
    }

    SetObjects(objects)
    {
        this.ClearObjects();
        return this.AddObject(objects);
    }

    /**
     * Adds an object. When a scene is set the object goes into the scene:
     * EveSpaceScene applies per-frame lighting and environment data before
     * collecting batches, so an object rendered beside it comes out unlit.
     * Without a scene the client renders it from its own list.
     * @param {*} object
     * @returns {TnyClient}
     */
    AddObject(object)
    {
        if (this.scene && this.scene.AddObject)
        {
            this.scene.AddObject(object);
            return this;
        }

        this.constructor.AddItems(this.objects, object);
        return this;
    }

    RemoveObject(object)
    {
        if (this.scene && this.scene.RemoveObject) this.scene.RemoveObject(object);
        this.constructor.RemoveItem(this.objects, object);
        return this;
    }

    GetObjects(out = [])
    {
        out.push(...this.objects);
        return out;
    }

    ClearObjects()
    {
        this.objects.splice(0);
        return this;
    }

    Update(dt)
    {
        this.EmitEvent("update", this, dt);

        const camera = this.GetCamera();
        if (camera && camera.Update)
        {
            camera.Update(dt);
        }

        if (camera && camera.GetNearPlane && camera.GetFarPlane)
        {
            device.SetNearFar(camera.GetNearPlane(), camera.GetFarPlane());
        }

        if (this.scene && this.scene.Update)
        {
            this.scene.Update(dt);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            const object = this.objects[i];
            if (object && object.Update)
            {
                object.Update(dt);
            }
        }

        if (this.post && this.post.Update)
        {
            this.post.Update(dt, this);
        }

        return this;
    }

    Render(dt)
    {
        if (this.options.update !== false)
        {
            this.Update(dt);
        }

        if (this.options.render === false)
        {
            return false;
        }

        this.EmitEvent("pre_render", this, dt);

        let rendered = false;

        if (this.renderer)
        {
            rendered = this.constructor.RenderItem(this.renderer, dt, this) || rendered;
        }
        else
        {
            this.PrepareRender();

            if (this.scene)
            {
                this.EmitEvent("pre_scene_render", this, dt);
                rendered = this.constructor.RenderItem(this.scene, dt, this) || rendered;
                this.EmitEvent("post_scene_render", this, dt);
            }

            if (this.objects.length)
            {
                rendered = this.RenderObjects(dt) || rendered;
            }
        }

        if (this.post && this.post.Render)
        {
            rendered = !!this.post.Render(dt, this) || rendered;
        }

        this.EmitEvent("post_render", this, dt);
        return rendered;
    }

    PrepareRender()
    {
        const camera = this.GetCamera();
        if (!camera)
        {
            return false;
        }

        const
            g = this.constructor.global,
            viewport = this.GetViewport(g.viewport),
            width = viewport[2],
            height = viewport[3],
            aspect = height ? width / height : 1;

        tw2
            .SetOpaqueRenderStates()
            .SetProjectionMatrix(camera.GetProjection(g.projection, aspect))
            .SetViewMatrix(camera.GetView(g.view))
            .SetDepth(true, "LEQUAL", 1.0)
            .SetViewport(viewport);

        if (this.options.clearColor)
        {
            tw2.SetClearColor(this.options.clearColor);
        }

        if (this.options.clear !== false)
        {
            tw2.ClearBufferBits(true, true, true);
        }

        return true;
    }

    GetViewport(out = [])
    {
        const view = this.options.view || TnyClient.defaultView;
        out[0] = view[0] * device.viewportWidth;
        out[1] = view[1] * device.viewportHeight;
        out[2] = view[2] * device.viewportWidth - out[0];
        out[3] = view[3] * device.viewportHeight - out[1];
        return out;
    }

    RenderObjects(dt, accumulator = this.accumulator)
    {
        if (!this.objects.length)
        {
            return false;
        }

        accumulator = this.accumulator;
        accumulator.Clear();

        for (let i = 0; i < this.objects.length; i++)
        {
            const object = this.objects[i];
            if (!object || !object.GetBatches) continue;

            object.GetBatches(device.RM_OPAQUE, accumulator);
            object.GetBatches(device.RM_DECAL, accumulator);
            object.GetBatches(device.RM_TRANSPARENT, accumulator);
            object.GetBatches(device.RM_ADDITIVE, accumulator);
        }

        if (!accumulator.length)
        {
            return false;
        }

        accumulator.Render();
        return true;
    }

    static AddItems(target, items)
    {
        if (Array.isArray(items))
        {
            for (let i = 0; i < items.length; i++)
            {
                this.AddItems(target, items[i]);
            }
            return this;
        }

        if (!items)
        {
            throw new TypeError("Invalid runtime item");
        }

        if (!target.includes(items))
        {
            target.push(items);
        }

        return this;
    }

    static RemoveItem(target, item)
    {
        const index = target.indexOf(item);
        if (index !== -1)
        {
            target.splice(index, 1);
        }
    }

    static RenderItem(item, dt, client)
    {
        if (!item)
        {
            return false;
        }

        if (typeof item === "function")
        {
            return !!item(dt, client);
        }

        return item.Render ? !!item.Render(dt, client) : false;
    }

    static defaultView = [ 0, 0, 1, 1 ];

    static global = {
        projection: mat4.create(),
        view: mat4.create(),
        viewport: [ 0, 0, 0, 0 ]
    };

}
