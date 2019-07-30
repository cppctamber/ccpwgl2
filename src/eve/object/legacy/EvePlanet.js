import {util, device, resMan} from "../../../global/index";
import {Tw2Effect, Tw2RenderTarget, Tw2TextureParameter, Tw2FloatParameter} from "../../../core/index";
import {EveTransform} from "../EveTransform";
import {EveObject} from "./EveObject";
import {mat4} from "gl-matrix";

/**
 * EvePlanet
 * TODO: Implement LOD
 *
 * @property {String} name
 * @property {Boolean} display
 * @property {EveTransform} highDetail
 * @property {Tw2Effect} effectHeight
 * @property {Tw2RenderTarget} heightMap
 * @property {*} zOnlyModel
 * @property {number} itemID
 * @property {String} heightMapResPath1
 * @property {String} heightMapResPath2
 * @property {Boolean} heightDirty
 * @property {Array} lockedResources
 * @property {Array.<Tw2Resource>} watchedResources
 * @class
 */
export class EvePlanet extends EveObject
{

    highDetail = new EveTransform();
    effectHeight = new Tw2Effect();
    heightMap = new Tw2RenderTarget();
    zOnlyModel = null;
    itemID = 0;
    heightMapResPath1 = "";
    heightMapResPath2 = "";
    heightDirty = false;
    lockedResources = [];
    watchedResources = [];

    _atmosphere = null;
    _planet = null;

    /**
     * Sets the object's local transform
     * @param {mat4} m
     */
    SetLocalTransform(m)
    {
        this.highDetail.SetLocalTransform(m);
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
     * Creates the planet from an options object
     * @param {{}} options={}                   - an object containing the planet's options
     * @param {number} options.itemID           - the item id is used for randomization
     * @param {String} options.planetPath       - .red file for a planet, or planet template
     * @param {String} [options.atmospherePath] - optional .red file for a planet's atmosphere
     * @param {String} options.heightMap1       - the planet's first height map
     * @param {String} options.heightMap2       - the planet's second height map
     * @param {function} [onLoaded]             - an optional callback which is fired when the planet has loaded
     */
    Create(options = {}, onLoaded)
    {
        const {itemID = 0, planetPath, atmospherePath, heightMap1, heightMap2} = options;

        this.itemID = itemID;
        this.heightMapResPath1 = heightMap1;
        this.heightMapResPath2 = heightMap2;
        this.highDetail.children = [];
        this.heightDirty = true;

        let loadingParts = 1;
        if (planetPath) loadingParts++;
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

        if (planetPath)
        {
            resMan.GetObject(planetPath, obj =>
            {
                this._planet = obj;
                EvePlanet.MeshLoaded(this, obj);
                onPartLoaded();
            });
        }

        if (atmospherePath)
        {
            resMan.GetObject(atmospherePath, obj =>
            {
                this._atmosphere = obj;
                this.highDetail.children.push(obj);
                onPartLoaded();
            });
        }

        resMan.GetObject("res:/dx9/model/worldobject/planet/planetzonly.red", obj =>
        {
            this.zOnlyModel = obj;
            onPartLoaded();
        });
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

        if (obj && !util.isUndefined(obj["doNotPurge"]))
        {
            result.push(obj);
            return;
        }

        for (let prop in obj)
        {
            if (obj.hasOwnProperty(prop))
            {
                if (util.isObjectLike(obj[prop]))
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
        this.highDetail.Update(dt);
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this.heightDirty && this.watchedResources.length && this.heightMapResPath1 !== "")
        {
            for (let i = 0; i < this.watchedResources.length; ++i)
            {
                if (this.watchedResources[i] && !this.watchedResources[i].IsGood()) return;
            }

            this.watchedResources = [];

            this.heightMap.Set();
            device.SetStandardStates(device.RM_FULLSCREEN);
            device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            device.gl.clear(device.gl.COLOR_BUFFER_BIT);
            device.RenderFullScreenQuad(this.effectHeight);
            this.heightMap.Unset();

            this.heightDirty = false;
            for (let i = 0; i < this.lockedResources.length; ++i)
            {
                this.lockedResources[i].doNotPurge--;
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
                originalEffect.resources["HeightMap"].textureRes = this.heightMap.texture;
            }
        }

        if (this.display)
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
        if (this.display && this.zOnlyModel)
        {
            this.zOnlyModel.GetBatches(mode, accumulator);
        }
    }

    /**
     * Copies parameters from one effect to another
     * @param {Tw2Effect} target
     * @param {Tw2Effect} source
     * @param {Array} [watched]
     */
    static CopyEffectParameters(target, source, watched)
    {
        // Copy parameters
        for (let name in source.parameters)
        {
            if (source.parameters.hasOwnProperty(name))
            {
                target.parameters[name] = source.parameters[name];
            }
        }

        // Copy textures
        for (let name in source.resources)
        {
            if (source.resources.hasOwnProperty(name))
            {
                const texture = source.resources[name];
                target.resources[name] = texture;

                if (texture.textureRes && watched)
                {
                    watched.push(texture.textureRes);
                }
            }
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
        planet.lockedResources = [];
        planet.GetPlanetResources(planet.highDetail, [], planet.lockedResources);
        planet.watchedResources = [];

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

        EvePlanet.CopyEffectParameters(planet.effectHeight, originalEffect, planet.watchedResources);

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

            EvePlanet.CopyEffectParameters(planet.effectHeight, originalEffect, planet.watchedResources);
        }

        const NormalHeight1 = new Tw2TextureParameter("NormalHeight1", planet.heightMapResPath1);
        NormalHeight1.Initialize();
        planet.watchedResources.push(NormalHeight1.textureRes);
        planet.lockedResources.push(NormalHeight1.textureRes);
        planet.effectHeight.resources.NormalHeight1 = NormalHeight1;

        const NormalHeight2 = new Tw2TextureParameter("NormalHeight2", planet.heightMapResPath2);
        NormalHeight2.Initialize();
        planet.watchedResources.push(NormalHeight2.textureRes);
        planet.lockedResources.push(NormalHeight2.textureRes);
        planet.effectHeight.resources.NormalHeight2 = NormalHeight2;

        planet.effectHeight.parameters.Random = new Tw2FloatParameter("Random", planet.itemID % 100);
        planet.effectHeight.parameters.TargetTextureHeight = new Tw2FloatParameter("TargetTextureHeight", 1024);

        planet.effectHeight.effectFilePath = resPath;
        planet.effectHeight.Initialize();
        planet.heightDirty = true;
        planet.heightMap.Create(2048, 1024, false);
        planet.watchedResources.push(planet.effectHeight.effectRes);

        for (let i = 0; i < planet.lockedResources.length; ++i)
        {
            planet.lockedResources[i].doNotPurge++;
            if (planet.lockedResources[i].IsPurged())
            {
                planet.lockedResources[i].Reload();
            }
        }
    }

}
