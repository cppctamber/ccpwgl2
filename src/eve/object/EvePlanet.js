import { meta, isObjectLike } from "utils";
import { device, tw2 } from "global";
import { vec3, mat4 } from "math";
import { Tw2Effect, Tw2RenderTarget, Tw2TextureParameter, Tw2FloatParameter, Tw2Resource } from "core";
import { EveTransform } from "./EveTransform";
import { EveObject } from "./EveObject";

// TODO: Add "OnValueChanged" handler

@meta.type("EvePlanet")
export class EvePlanet extends EveObject
{

    @meta.struct("EveTransform")
    highDetail = new EveTransform();

    @meta.struct("Tw2Effect")
    effectHeight = new Tw2Effect();

    @meta.struct("Tw2RenderTarget")
    heightMap = new Tw2RenderTarget();

    @meta.struct("EveTransform")
    zOnlyModel = null;

    @meta.uint
    @meta.isPrivate
    itemID = 0;

    @meta.path
    @meta.isPrivate
    heightMapResPath1 = "";

    @meta.path
    @meta.isPrivate
    heightMapResPath2 = "";

    @meta.list("EveChild")
    @meta.notImplemented
    effectChildren = [];

    @meta.float
    radius = 0;

    _heightDirty = false;
    _lockedResources = [];
    _watchedResources = [];
    _lod = 3;
    _useLOD = true;
    _atmosphere = null;
    _planet = null;

    /**
     * Constructor
     * @return {number}
     */
    constructor()
    {
        super();

        Object.defineProperty(this, "radius", {
            get()
            {
                const s = this.highDetail.scaling;
                return Math.max(s[0], s[1], s[2]) / 2;
            },
            set(radius)
            {
                const s = this.highDetail.scaling;
                s[0] = s[1] = s[2] = radius * 2;
                this.highDetail.UpdateValues();
            }
        });

    }

    /**
     * Rebuilds the planet
     */
    Rebuild()
    {
        if (this._planet)
        {
            this._heightDirty = true;
            EvePlanet.MeshLoaded(this, this._planet);
        }
    }

    /**
     * Fetches planet async
     * @param {Object} options
     * @return {Promise<EvePlanet>}
     */
    async Fetch(options={})
    {
        const { name="", itemID=0, resPath="", atmospherePath="", heightMap1="", heightMap2="",  radius=0 } = options;

        this.name = name;
        this.itemID = itemID;
        this.heightMapResPath1 = heightMap1;
        this.heightMapResPath2 = heightMap2;
        this.highDetail.children.splice(0);
        this.radius = radius;

        const [ zOnly, planet, atmosphere ] = await Promise.all([
            EvePlanet.ZOnlyModelPath,
            resPath,
            atmospherePath
        ]);

        this._planet = planet;
        this._atmosphere = atmosphere;
        this.zOnlyModel = zOnly;

        EvePlanet.MeshLoaded(this, this._planet);
        return this;
    }

    /**
     * Planet z only model
     * @type {string}
     */
    static ZOnlyModelPath = "res:/dx9/model/worldobject/planet/planetzonly.red";

    /**
     * Creates the planet from an options object
     * @param {{}} options={}                   - an object containing the planet's options
     * @param {String} options.name             - the planet's name
     * @param {number} options.itemID           - the item id is used for randomization
     * @param {String} options.resPath          - .red file for a planet, or planet template
     * @param {String} [options.atmospherePath] - optional .red file for a planet's atmosphere
     * @param {String} options.heightMap1       - the planet's first height map
     * @param {String} options.heightMap2       - the planet's second height map
     * @param {function} [onLoaded]             - an optional callback which is fired when the planet has loaded
     */
    Create(options = {}, onLoaded)
    {
        const { name = "", itemID = 0, resPath, atmospherePath, heightMap1, heightMap2, radius=0 } = options;

        this.name = name;
        this.itemID = itemID;
        this.heightMapResPath1 = heightMap1;
        this.heightMapResPath2 = heightMap2;
        this.highDetail.children.splice(0);
        this.radius = radius;
        this._heightDirty = true;
        this._planet = null;
        this._atmosphere = null;
        this._heightDirty = true;
        this.radius = radius;

        let loadingParts = 1;
        if (resPath) loadingParts++;
        if (atmospherePath) loadingParts++;

        /**
         * Handles the optional onLoaded callback which is fired when all parts have loaded
         */
        function onPartLoaded()
        {
            loadingParts--;
            if (loadingParts < 1 && onLoaded)
            {
                onLoaded();
            }
        }

        if (resPath)
        {
            tw2.Fetch(resPath).then(obj =>
            {
                obj.resPath = resPath;
                this._planet = obj;
                EvePlanet.MeshLoaded(this, obj);
                onPartLoaded();
            });
        }

        if (atmospherePath)
        {
            tw2.Fetch(atmospherePath).then(obj =>
            {
                obj.resPath = atmospherePath;
                this._atmosphere = obj;
                this.highDetail.children.push(obj);
                onPartLoaded();
            });
        }

        tw2.Fetch(EvePlanet.ZOnlyModelPath).then(obj =>
        {
            this.zOnlyModel = obj;
            onPartLoaded();
        });
    }

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this._lod = 3;
    }

    /**
     * Updates LOD
     * @param {Tw2Frustum}frustum
     */
    UpdateLod(frustum)
    {
        const { scaling, translation } = this.highDetail;
        this._lod = !this._useLOD || !frustum.IsSphereVisible(translation, scaling[0]) ? 0 : 3;
    }

    /**
     * Toggles LOD calculations
     * @param {Boolean} bool
     */
    UseLOD(bool)
    {
        this._useLOD = bool;
    }

    /**
     * Sets the object's local transform
     * @param {mat4} m
     */
    SetTransform(m)
    {
        this.highDetail.SetTransform(m);
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.highDetail) this.highDetail.GetResources(out);
        if (this.effectHeight) this.effectHeight.GetResources(out);
        return out;
    }

    /**
     * GetPlanetResources
     * Todo: Replace this, using this.GetResources();
     * @param obj
     * @param visited
     * @param result
     */
    GetPlanetResources(obj, visited, result)
    {
        if (visited.includes(obj)) return;
        visited.push(obj);

        if (obj && obj instanceof Tw2Resource)
        {
            result.push(obj);
            return;
        }

        for (let prop in obj)
        {
            if (obj.hasOwnProperty(prop))
            {
                if (isObjectLike(obj[prop]))
                {
                    this.GetPlanetResources(obj[prop], visited, result);
                }
            }
        }
    }

    /**
     * Updates view dependent data
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        this.highDetail.UpdateViewDependentData(parentTransform);
        if (this.zOnlyModel)
        {
            this.zOnlyModel.translation = this.highDetail.translation;
            this.zOnlyModel.scaling = this.highDetail.scaling;
            this.zOnlyModel.UpdateViewDependentData(parentTransform);
        }
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        if (this.display && this._useLOD)
        {
            this.highDetail.Update(dt);
        }
    }

    /**
     * Creates the planet's height map
     * TODO: Figure out why this doesn't always work
     */
    CreateHeightMap()
    {
        this.heightMap.Set();
        device.SetStandardStates(device.RM_FULLSCREEN);
        device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        device.gl.clear(device.gl.COLOR_BUFFER_BIT);
        device.RenderFullScreenQuad(this.effectHeight);
        this.heightMap.Unset();
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this._heightDirty && this._watchedResources.length && this.heightMapResPath1 !== "")
        {
            for (let i = 0; i < this._watchedResources.length; ++i)
            {
                if (this._watchedResources[i] && !this._watchedResources[i].IsGood()) return;
            }

            this._watchedResources = [];
            this.CreateHeightMap();

            this._heightDirty = false;
            for (let i = 0; i < this._lockedResources.length; ++i)
            {
                if (!this._lockedResources[i]) continue;
                this._lockedResources[i].doNotPurge--;
            }

            const mainMesh = this.highDetail.children[0].mesh;
            let originalEffect = null;

            if (mainMesh.transparentAreas.length)
            {
                originalEffect = mainMesh.transparentAreas[0].effect;
            }
            else if (mainMesh.opaqueAreas.length)
            {
                originalEffect = mainMesh.opaqueAreas[0].effect;
            }

            if (originalEffect)
            {
                originalEffect.parameters["HeightMap"].textureRes = this.heightMap.texture;
            }
        }

        if (this.display && this._lod)
        {
            this.highDetail.GetBatches(mode, accumulator);
        }
    }

    /**
     * Gets z buffer only batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetZOnlyBatches(mode, accumulator)
    {
        if (this.display && this._lod && this.zOnlyModel)
        {
            this.zOnlyModel.GetBatches(mode, accumulator);
        }
    }

    /**
     * Internal helper function that fires when a planet's mesh has loaded
     * @property {EvePlanet} planet
     * @property {*} obj
     */
    static MeshLoaded(planet, obj)
    {
        planet.highDetail.children.unshift(obj);
        planet._lockedResources.splice(0);
        planet.GetPlanetResources(planet.highDetail, [], planet._lockedResources);

        let mainMesh = planet.highDetail.children[0].mesh,
            originalEffect = null,
            resPath;

        if (mainMesh.transparentAreas.length)
        {
            originalEffect = mainMesh.transparentAreas[0].effect;
            resPath = originalEffect.effectFilePath;
        }
        else if (mainMesh.opaqueAreas.length)
        {
            originalEffect = mainMesh.opaqueAreas[0].effect;
            resPath = originalEffect.effectFilePath;
        }
        else
        {
            resPath = "res:/Graphics/Effect/Managed/Space/Planet/EarthlikePlanet.fx";
        }
        resPath = resPath.replace(".fx", "BlitHeight.fx");

        planet._watchedResources.splice(0);
        for (let param in originalEffect.parameters)
        {
            if (originalEffect.parameters.hasOwnProperty(param))
            {
                planet.effectHeight.parameters[param] = originalEffect.parameters[param];
                if ("textureRes" in originalEffect.parameters[param])
                {
                    planet._watchedResources.push(originalEffect.parameters[param].textureRes);
                }
            }
        }

        for (let i = 0; i < planet.highDetail.children[0].children.length; ++i)
        {
            mainMesh = planet.highDetail.children[0].children[i].mesh;
            if (!mainMesh) continue;

            originalEffect = null;
            if (mainMesh.transparentAreas.length)
            {
                originalEffect = mainMesh.transparentAreas[0].effect;
            }
            else if (mainMesh.opaqueAreas.length)
            {
                originalEffect = mainMesh.opaqueAreas[0].effect;
            }
            else
            {
                continue;
            }

            for (let param in originalEffect.parameters)
            {
                if (originalEffect.parameters.hasOwnProperty(param))
                {
                    planet.effectHeight.parameters[param] = originalEffect.parameters[param];
                    if ("textureRes" in originalEffect.parameters[param])
                    {
                        planet._watchedResources.push(originalEffect.parameters[param].textureRes);
                    }
                }
            }
        }

        const NormalHeight1 = new Tw2TextureParameter("NormalHeight1", planet.heightMapResPath1);
        NormalHeight1.Initialize();
        planet._watchedResources.push(NormalHeight1.textureRes);
        planet._lockedResources.push(NormalHeight1.textureRes);
        planet.effectHeight.parameters.NormalHeight1 = NormalHeight1;

        const NormalHeight2 = new Tw2TextureParameter("NormalHeight2", planet.heightMapResPath2);
        NormalHeight2.Initialize();
        planet._watchedResources.push(NormalHeight2.textureRes);
        planet._lockedResources.push(NormalHeight2.textureRes);
        planet.effectHeight.parameters.NormalHeight2 = NormalHeight2;

        planet.effectHeight.parameters.Random = new Tw2FloatParameter("Random", planet.itemID % 100);
        planet.effectHeight.parameters.TargetTextureHeight = new Tw2FloatParameter("TargetTextureHeight", 1024);

        planet.effectHeight.effectFilePath = resPath;
        planet.effectHeight.Initialize();
        planet._heightDirty = true;
        planet.heightMap.Create(2048, 1024, false);
        planet._watchedResources.push(planet.effectHeight.effectRes);

        for (let i = 0; i < planet._lockedResources.length; ++i)
        {
            if (!planet._lockedResources[i]) continue;

            planet._lockedResources[i].doNotPurge++;
            if (planet._lockedResources[i].IsPurged())
            {
                planet._lockedResources[i].Reload();
            }
        }
    }

}
