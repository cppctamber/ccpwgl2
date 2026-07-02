import { mat4 } from "math";
import { Tw2BatchAccumulator } from "core/batch";
import { device, tw2 } from "global";
import { meta } from "utils";


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
        return this;
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

        this.camera = camera || null;
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

    AddObject(object)
    {
        this.constructor.AddItems(this.objects, object);
        return this;
    }

    RemoveObject(object)
    {
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
