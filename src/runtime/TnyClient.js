import { mat4 } from "math";
import { Tw2BatchAccumulator } from "core/batch";
import { device, tw2 } from "global";
import { meta } from "utils";
import { TnyShip } from "./objects/TnyShip";
import { TnyPlanet } from "./objects/TnyPlanet";
import { TnyMoon } from "./objects/TnyMoon";
import { TnyScene } from "./TnyScene";


@meta.tny.type("TnyClient")
@meta.tny.define("TnyClient")
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
    constructor(options = {})
    {
        super();

        const {
            api,
            apiService,
            resource,
            resourceService,
            res,
            resService,
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

        if (resource || resourceService || res || resService)
        {
            this.SetResourceService(resource || resourceService || res || resService);
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

    get api()
    {
        return this.GetApiService();
    }

    set api(service)
    {
        this.SetApiService(service);
    }

    get resource()
    {
        return this.GetResourceService();
    }

    set resource(service)
    {
        this.SetResourceService(service);
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

    SetResourceService(service)
    {
        return this.SetService("resource", service);
    }

    GetResourceService()
    {
        return this.GetService("resource");
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
    async FetchScene(options)
    {
        const scene = await TnyScene.Fetch(options);
        this.SetScene(scene);
        return scene;
    }

    /**
     * Fetches a ship (dna string, typeID or options object) and adds it to
     * the client's objects
     * @param {String|Number|Object} options - see TnySpaceObject.Fetch
     * @returns {Promise<TnyShip>}
     */
    async FetchShip(options)
    {
        const ship = await TnyShip.Fetch(options);
        this.AddObject(ship);
        return ship;
    }

    /**
     * Fetches a planet (or moon) and adds it to the scene
     * @param {Number|Object} options - see TnyPlanet.Fetch
     * @returns {Promise<TnyPlanet>}
     */
    async FetchPlanet(options)
    {
        const planet = await TnyPlanet.Fetch(options);
        this.AddObject(planet);
        return planet;
    }

    /**
     * Fetches a moon and adds it to the scene
     * @param {Number|Object} options - see TnyMoon.Fetch
     * @returns {Promise<TnyMoon>}
     */
    async FetchMoon(options)
    {
        const moon = await TnyMoon.Fetch(options);
        this.AddObject(moon);
        return moon;
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
