import { resMan, tw2 } from "global";
import { isString, isVector, meta } from "utils";
import { EveSpaceScene } from "eve/EveSpaceScene";
import { WrappedGenericObject } from "./WrappedGenericObject";
import { WrappedSpaceObject } from "./WrappedSpaceObject";
import { WrappedShip } from "./WrappedShip";
import { WrappedLensflare } from "./WrappedLensflare";
import { WrappedPlanet } from "./WrappedPlanet";
import { WrappedClient } from "./WrappedClient";



@meta.type("WrappedScene")
export class WrappedScene extends WrappedGenericObject
{

    @meta.list()
    objects = [];

    _watched = [];
    _maxWatchedFrames = 2000;

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
            throw new ReferenceError("Invalid space object");
        }
        this.wrapped = wrapped;
        if (values) this.SetValues(values);
    }

    /**
     * Gets the index of a watched object
     * @param {WrappedGenericObject} obj
     * @return {number}
     */
    _GetWatchedIndex(obj)
    {
        for (let i  = 0; i < this._watched.length; i++)
        {
            if (this._watched[i][0] === obj)
            {
                return i;
            }
        }
        return -1;
    }

    /**
     * Checks if an objects resources are is completely loaded
     * @param {WrappedGenericObject} obj
     * @return {boolean}
     */
    _IsWatchedComplete(obj)
    {
        // Maybe not, but can't tell
        if (!obj.GetResources) return true;
        const res = obj.GetResources();
        let completed = 0;
        res.forEach(resource =>
        {
            if (resource.HasCompleted()) completed ++;
        });
        return completed === res.length;
    }

    /**
     * Checks watched objects
     */
    _CheckWatched()
    {
        if (!this._watched.length) return;

        const currentFrame = tw2.frame;

        for (let i = 0; i < this._watched.length; i++)
        {
            const [ obj, onUnWatched, startWatchFrame ] = this._watched[i];
            let remove = false;

            // Check for time outs
            if (currentFrame - startWatchFrame >= this._maxWatchedFrames)
            {
                onUnWatched(obj, false);
                remove = true;
            }
            else if (this._IsWatchedComplete(obj))
            {
                onUnWatched(obj, true);
                remove = true;
            }

            if (remove)
            {
                this._watched.splice(i, 1);
                i--;
            }
        }
    }

    /**
     * Watches an object's resources and fires a function when done or timed out
     * @param {WrappedGenericObject} obj
     * @param {Function} onUnWatched
     * @return {boolean}
     */
    Watch(obj, onUnWatched)
    {
        const index = this._GetWatchedIndex(obj);
        if (index === -1)
        {
            if (this._IsWatchedComplete(obj))
            {
                onUnWatched(obj, true);
            }
            else
            {
                this._watched.push([ obj, onUnWatched, tw2.frame ]);
            }
            return true;
        }
        return false;
    }

    /**
     * Unwatches an object's resources
     * @param {WrappedGenericObject} obj
     * @return {boolean}
     */
    UnWatch(obj)
    {
        const index =  this._GetWatchedIndex(obj);
        if (index !== -1)
        {
            this._watched.splice(index, 1);
            return true;
        }
        return false;
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
        this._CheckWatched();
    }

    /**
     *
     * @param dt
     */
    Render(dt)
    {
        this.EmitEvent("render", dt);
        this.wrapped.Render(dt);
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

        for (let i = 0; i < this.objects.length; i++)
        {
            if (this.objects[i] instanceof WrappedPlanet) // && !this.options.treatPlanetsAsObjects)
            {
                planets.push(this.objects[i].wrapped);
            }
            else if (this.objects[i] instanceof WrappedLensflare)
            {
                lensflares[0] = this.objects[i].wrapped;
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
            this.objects.push(object);
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
    RemoveObject(object)
    {
        const index = this.objects.indexOf(object);
        if (index !== -1)
        {
            this.objects.splice(index, 1);
            this.EmitEvent("object_removed", object);
            this.Rebuild();
            return true;
        }
        return false;
    }

    /**
     * Fetches a lensflare
     * @param {Object} options
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedLensflare>}
     */
    async FetchLensflare(options, doNotAdd)
    {
        const lensflare = WrappedLensflare.fetch(options);
        if (!doNotAdd) this.AddObject(lensflare);
        return lensflare;
    }

    /**
     * Creates a watch promise
     * @param {WrappedGenericObject} obj
     * @return {Promise<unknown>}
     */
    _CreateWatchPromise(obj)
    {
        return new Promise((res, rej) =>
        {
            this.Watch(obj, res);
        });
    }

    /**
     *
     * @param {Object} options
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedShip>}
     */
    async FetchShip(options = {}, doNotAdd)
    {
        const eveSof = await WrappedClient.fetchEveSOF();
        const ship = await WrappedShip.fetch(options, eveSof);
        await this._CreateWatchPromise(ship);
        if (!doNotAdd) this.AddObject(ship);
        return ship;
    }

    /**
     * Fetches a space object
     * @param {Object} options
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedSpaceObject>}
     */
    async FetchObject(options = {}, doNotAdd)
    {
        const eveSof = await WrappedClient.fetchEveSOF();
        const spaceObject = await WrappedSpaceObject.fetch(options, eveSof);
        await this._CreateWatchPromise(spaceObject);
        if (!doNotAdd) this.AddObject(spaceObject);
        return spaceObject;
    }

    /**
     * Fetches a planet
     * @param {Object} options
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedPlanet>}
     */
    async FetchPlanet(options = {}, doNotAdd)
    {
        const planet = await WrappedPlanet.fetch(options);
        await this._CreateWatchPromise(planet);
        if (!doNotAdd) this.AddObject(planet);
        return planet;
    }

    /**
     * Fetches a scene async
     * @param {Object} options
     * @return {Promise<WrappedScene>}
     */
    static async fetch(options = {})
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
                wrapped.clearColor[3] = 3 in background ? background[3] : 1;
            }
            else
            {
                throw new TypeError("Invalid background value");
            }
        }

        return new this(wrapped, values);
    }

    /**
     *  Star field effect
     * @type {string}
     */
    static StarFieldResPath = "res:/dx9/scene/starfield/starfieldNebula.red";

}
