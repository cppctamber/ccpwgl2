import { resMan, tw2 } from "global";
import { isString, isVector, meta } from "utils";
import { EveSpaceScene } from "eve/EveSpaceScene";
import { WrappedGenericObject } from "./WrappedGenericObject";
import { WrappedSpaceObject } from "./WrappedSpaceObject";
import { WrappedShip } from "./WrappedShip";
import { WrappedLensflare } from "./WrappedLensflare";
import { WrappedPlanet } from "./WrappedPlanet";
import { WrappedClient } from "./WrappedClient";
import { Tw2Picker, Tw2RayCaster } from "core";


@meta.type("WrappedScene")
export class WrappedScene extends WrappedGenericObject
{

    @meta.list()
    objects = [];

    @meta.boolean
    doWatch = false;

    @meta.list()
    lensflares = [];

    @meta.list()
    cameras = [];

    /**
     * Ray caster
     * @type {Tw2RayCaster}
     * @private
     */
    _rayCaster = new Tw2RayCaster();

    /**
     * Picker
     * @type {Tw2Picker}
     * @private
     */
    _picker = new Tw2Picker();

    /**
     * Gets background objects
     * @returns {[]}
     */
    get backgroundObjects()
    {
        return this.wrapped.backgroundObjects;
    }

    /**
     * Constructor
     * @param {EveSpaceScene} wrapped
     * @param {Object} [values]
     */
    constructor(wrapped, values)
    {
        super();
        if (!(wrapped instanceof EveSpaceScene))
        {
            tw2.Debug({
                name: "WrappedScene",
                message: `Invalid space object: ${wrapped.constructor.name}`
            });
            console.dir(wrapped);
            wrapped = new EveSpaceScene();
            //throw new ReferenceError("Invalid space object");
        }
        this.wrapped = wrapped;
        if (values) this.SetValues(values);
    }

    /**
     * Fires on transform updates
     * @param {mat4} world
     */
    _OnTransformUpdated(world)
    {
        this.wrapped.SetEnvironmentTransform(world);
    }

    /**
     * Serializes a scene
     * @param a
     * @param out
     * @param opt
     * @return {Object}
     */
    static get(a, out, opt)
    {
        const result = super.get(a, out, opt);

        // Todo: Handle in EveSpaceScene with an optional parameter
        // Remove unwrapped objects
        Reflect.deleteProperty(result, "objects");
        Reflect.deleteProperty(result, "planets");
        Reflect.deleteProperty(result, "lensflares");

        return Object.assign(out, result);
    }

    /**
     * Picks specific objects from an event
     * @param objects
     * @param event
     * @param [element]
     * @returns {*}
     */
    PickObjectsFromEvent(objects, event, element)
    {
        const result = this._picker.PickFromEvent(objects, event, element);
        if (result)
        {
            // Update if any wrapped objects were passed
            const root = this.objects.find(x=>x.wrapped===result.root);
            if (root)
            {
                result.wrapped = result.root;
                result.root = root;
            }
        }
        return result;
    }

    Intersect(options)
    {

    }

    /**
     * Intersects all objects from an event
     * TODO: Update to support views
     * @param {MouseEvent} event
     * @param {HTMLElement} [element]
     * @param {Object} [options]
     */
    IntersectFromEvent(event, element, options)
    {
        const { altKey, ctrlKey, shiftKey, clientX, clientY } = event;
        const keys = { altKey, ctrlKey, shiftKey };

        const intersected = [];
        this._rayCaster.UpdateFromEvent(event, element, options);
        this.EmitEvent("intersecting", this, undefined, keys);
        this._rayCaster.IntersectObjects(this.objects, intersected);

        if (intersected.length)
        {
            this.EmitEvent("intersected_objects", this, intersected, keys);
            this.EmitEvent("intersected_closest", this, intersected[0], keys);
        }
        else
        {
            this.EmitEvent("intersected_none", this, undefined, keys);
        }

        return intersected;
    }

    /**
     * Adds a camera
     * @param camera
     */
    AddCamera(camera)
    {
        if (this.cameras.indexOf(camera) === -1)
        {
            this.cameras.push(camera);
            this.EmitEvent("rebuilt", this);
        }
    }

    /**
     * Removes a camera
     * @param camera
     */
    RemoveCamera(camera)
    {
        const index = this.cameras.indexOf(camera);
        if (index !== -1)
        {
            this.cameras.splice(index);
            this.EmitEvent("rebuilt", this);
        }
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        this.EmitEvent("update", dt);
        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].Update(dt);
        }
        this.wrapped.Update(dt);
    }

    /**
     *
     * @param dt
     */
    Render(dt)
    {
        this.EmitEvent("render", dt);
        this.wrapped.Render(dt);
        
        if (this.pickEveryFrame)
        {
            this._picker.PreparePicking(this.objects);
        }
        
    }

    /**
     * Rebuilds the scene
     */
    Rebuild()
    {
        const { planets, objects, lensflares } = this.wrapped;

        planets.splice(0);
        objects.splice(0);
        lensflares.splice(0);

        for (let i = 0; i < this.lensflares.length; i++)
        {
            lensflares.push(this.lensflares[i].wrapped);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            if (this.objects[i].isPlanet) // && !this.options.treatPlanetsAsObjects)
            {
                planets.push(this.objects[i].wrapped);
            }
            else
            {
                objects.push(this.objects[i].wrapped);
            }
        }

        this.EmitEvent("rebuilt");
    }

    /**
     * Adds an object
     * @param {*} object
     * @return {boolean}
     */
    AddObject(object)
    {
        if (!this.objects.includes(object))
        {
            if (object.isLensflare)
            {
                this.lensflares.push(object);
            }
            else
            {
                this.objects.push(object);
            }
            this.EmitEvent("object_added", object);
            this.Rebuild();
            return true;
        }
        return false;
    }

    /**
     * Removes an object
     * @param {*} object
     * @return {boolean}
     */
    RemoveObject(object, opt)
    {
        const index = this.objects.indexOf(object);
        if (index !== -1)
        {
            this.objects.splice(index, 1);
            if (!opt || !opt.skipEvent) this.EmitEvent("object_removed", object);
            if (!opt || !opt.skipRebuild) this.Rebuild();
            return true;
        }
        return false;
    }

    /**
     * Removes all objects
     * @param spaceObjects
     * @param planets
     */
    RemoveAllObjects(spaceObjects, planets)
    {
        let rebuild = false;
        for (let i = 0; i < this.objects.length; i++)
        {
            let remove;
            if (this.objects[i].isPlanet)
            {
                remove = planets;
            }
            else if (spaceObjects)
            {
                remove = true;
            }

            if (remove)
            {
                rebuild = true;
                this.RemoveObject(this.objects[i], { skipRebuild: true });
                i--;
            }
        }
        if (rebuild) this.Rebuild();
    }

    /**
     * Fetches a lensflare
     * @param {Object} options
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedLensflare>}
     */
    async FetchLensflare(options, onProgress, doNotAdd)
    {
        const lensflare = await WrappedLensflare.fetch(options);
        if (this.doWatch) await resMan.Watch(lensflare, onProgress);
        if (!doNotAdd) this.AddObject(lensflare);
        return lensflare;
    }

    /**
     *
     * @param {Object} options
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedShip>}
     */
    async FetchShip(options = {}, onProgress, doNotAdd)
    {
        const eveSof = await WrappedClient.fetchEveSOF();
        const ship = await WrappedShip.fetch(options, eveSof);
        if (this.doWatch) await resMan.Watch(ship, onProgress);
        if (!doNotAdd) this.AddObject(ship);
        return ship;
    }

    /**
     * Fetches a space object
     * @param {Object} options
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedSpaceObject>}
     */
    async FetchObject(options = {}, onProgress, doNotAdd)
    {
        const eveSof = await WrappedClient.fetchEveSOF();
        const spaceObject = await WrappedSpaceObject.fetch(options, eveSof);
        if (this.doWatch) await resMan.Watch(spaceObject, onProgress);
        if (!doNotAdd) this.AddObject(spaceObject);
        return spaceObject;
    }

    /**
     * Fetches a planet
     * @param {Object} options
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedPlanet>}
     */
    async FetchPlanet(options = {}, onProgress, doNotAdd)
    {
        if (options.itemID)
        {
            //options.planetID = options.itemID;
        }

        const planet = await WrappedPlanet.fetch(options);
        if (this.doWatch) await resMan.Watch(planet, onProgress);
        if (!doNotAdd) this.AddObject(planet);
        return planet;
    }

    /**
     * Fetches a planet
     * @param {Object} options
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedPlanet>}
     */
    async FetchMoon(options = {}, onProgress, doNotAdd)
    {
        if (options.itemID)
        {
            options.moonID = options.itemID;
        }

        const moon = await WrappedPlanet.fetch(options);
        if (this.doWatch) await resMan.Watch(moon, onProgress);
        if (!doNotAdd) this.AddObject(moon);
        return moon;
    }

    /**
     * Fetches a scene async
     * @param {Object} options
     * @return {Promise<WrappedScene>}
     */
    static async fetch(options = {}, onProgress)
    {
        if (isString(options))
        {
            options = { resPath: options };
        }
        else if (isVector(options))
        {
            options = { background: options };
        }

        const { resPath, background, ...values } = options;

        let wrapped;

        if (resPath)
        {
            wrapped = await resMan.FetchObject(resPath);
            wrapped._resPath = resPath;
        }
        else
        {
            wrapped = new EveSpaceScene();
        }

        if (background)
        {
            if (isString(background))
            {
                const effect = await resMan.FetchObject(WrappedScene.StarFieldResPath);
                effect.SetTextures({ NebulaMap: background });
                wrapped.backgroundEffect = wrapped;
            }
            else if (isVector(background))
            {
                wrapped.clearColor[0] = background[0];
                wrapped.clearColor[1] = background[1];
                wrapped.clearColor[2] = background[2];
                wrapped.clearColor[3] = background[3] !== undefined ? background[3] : 1;
            }
            else
            {
                throw new TypeError("Invalid background value");
            }
        }

        const scene = new this(wrapped, values);
        await resMan.Watch(scene, onProgress);
        return scene;
    }

    /**
     *  Star field effect
     * @type {string}
     */
    static StarFieldResPath = "cdn:/dx9/scene/starfield/starfieldNebula.black";

}
