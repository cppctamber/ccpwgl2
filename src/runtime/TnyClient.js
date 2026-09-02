import { mat4 } from "math";
import { Tw2ConstructorStore } from "core/store";
import { getApiService } from "./api";
import { device, tw2 } from "global";
import { isString, meta } from "utils";
import { TnyScene } from "./TnyScene";


/**
 * The runtime client: whichever scene is active, the cameras, the render loop,
 * the viewport, and the services those need.
 *
 * It does NOT own objects. A client holds the active scene; it does not get to
 * assume that the active one is the right home for an object somebody is
 * building. Objects belong to a scene, and the scene is what fetches them -
 * see `TnyScene.FetchInto` and friends. A consumer with more than one scene
 * alive would otherwise have every fetch land wherever the last swap left the
 * client, and every removal aimed at the same moving target.
 */
@meta.define("TnyClient")
export class TnyClient extends meta.Model
{

    options = {};
    services = new Map();
    cameras = [];
    camera = null;
    scene = null;
    post = null;
    renderer = null;
    constructor(options = {})
    {
        super();

        const {
            api,
            apiService,
            camera,
            cameras,
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

        // Instances can be set now; config has to wait for the device below.
        if (scene && scene.isScene) this.SetScene(scene);
        if (camera && this.constructor.isCamera(camera)) this.SetCamera(camera);

        await tw2.Initialize({
            ...engineOptions,
            render: render || (dt => this.Render(dt))
        });

        // Camera before scene: fetching a scene yields to the network, and a
        // frame that ticks in that gap renders nothing without a camera.
        if (camera && !this.constructor.isCamera(camera))
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

    /**
     * The runtime's constructor store, reached through the instance helpers
     * below or through `TnyClient` directly.
     *
     * Class-level because there is one client at a time, and because a scene
     * fetches its own objects: `FetchObjects([{ type: "TnyShip" }])` has to
     * turn a name into a constructor, and a scene is reachable without a
     * client to ask. `TnyClient.getClass(...)` answers without one.
     *
     * Separate from `tw2`'s: Tny wrappers resolve here, the engine classes
     * they wrap through `tw2.GetClass()`.
     * @type {Tw2ConstructorStore}
     */
    static constructors = new Tw2ConstructorStore();

    /** Registers runtime constructor groups. */
    static register(options = {})
    {
        if (options.constructors)
        {
            this.constructors.Register(options.constructors);
        }
        return this;
    }

    static hasClass(name)
    {
        return this.constructors.Has(name);
    }

    /** Resolves a constructor, independently of tw2. */
    static getClass(name)
    {
        return this.constructors.Get(name);
    }

    static setClass(name, Constructor)
    {
        return this.constructors.Set(name, Constructor);
    }

    /** The store, so `client.constructors` still reads. */
    get constructors()
    {
        return this.constructor.constructors;
    }

    Register(options = {})
    {
        this.constructor.register(options);
        return this;
    }

    HasClass(name)
    {
        return this.constructor.hasClass(name);
    }

    GetClass(name)
    {
        return this.constructor.getClass(name);
    }

    SetClass(name, Constructor)
    {
        return this.constructor.setClass(name, Constructor);
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

    /**
     * Gets the api service.
     *
     * Falls back to the module default, which is what
     * `tw2.runtime.setApiService` writes and what the retired WrappedClient
     * returned outright. Without the fallback a consumer that registers its
     * service the documented way - on the runtime - gets null back from the
     * client, and every call through it fails somewhere far away, as a null
     * dereference on whatever it was about to ask for.
     *
     * A service set on THIS client still wins, so a second client can run
     * against a different service without disturbing the default.
     *
     * @returns {*} the api service, or null if none has been set anywhere
     */
    GetApiService()
    {
        return this.GetService("api") || getApiService() || null;
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

    /**
     * Sets the active scene.
     *
     * Nothing migrates. The scene that is leaving keeps its own objects,
     * because they are its objects - a client swapping backdrops is choosing
     * what to draw, not rehoming everything in the outgoing scene. Swap back
     * and the previous scene is still furnished.
     *
     * @param {?TnyScene} scene
     * @returns {TnyClient}
     */
    SetScene(scene)
    {
        if (scene === this.scene) return this;

        const previous = this.scene;
        this.scene = scene || null;
        this.EmitEvent("scene_changed", this, this.scene, previous);
        return this;
    }

    /**
     * Fetches a scene and makes it the active one.
     *
     * `objects` is optional and may name anything the runtime can build - a
     * dna string, a typeID, a SKINR id, or an options object. They are fetched
     * through the SCENE, and before it is installed: the scene owns its
     * contents, so populating it does not depend on it being the active one,
     * and a caller can build a furnished scene to swap in later.
     *
     * @param {String|Object} options - res path, or TnyScene.Fetch options
     * @param {Array} [options.objects] - object specs to populate it with
     * @param {Function} [onProgress]
     * @returns {Promise<TnyScene>}
     */
    async FetchScene(options, onProgress)
    {
        let objects = null;
        if (options && !isString(options) && options.objects)
        {
            ({ objects, ...options } = options);
        }

        const scene = await TnyScene.fetch(options, onProgress);
        if (objects) await scene.Fetch(objects, onProgress);

        this.SetScene(scene);
        return scene;
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
    static isCamera(value)
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
        this.constructor.addItems(this.cameras, camera);
        return this;
    }

    RemoveCamera(camera)
    {
        this.constructor.removeItem(this.cameras, camera);
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
            rendered = this.constructor.renderItem(this.renderer, dt, this) || rendered;
        }
        else
        {
            this.PrepareRender();

            if (this.scene)
            {
                this.EmitEvent("pre_scene_render", this, dt);
                rendered = this.constructor.renderItem(this.scene, dt, this) || rendered;
                this.EmitEvent("post_scene_render", this, dt);
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

    static addItems(target, items)
    {
        if (Array.isArray(items))
        {
            for (let i = 0; i < items.length; i++)
            {
                this.addItems(target, items[i]);
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

    static removeItem(target, item)
    {
        const index = target.indexOf(item);
        if (index !== -1)
        {
            target.splice(index, 1);
        }
    }

    static renderItem(item, dt, client)
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
