import { getPathExtension, meta } from "utils";
import { device, tw2 } from "global";
import { vec3, mat4, box3, sph3 } from "math";
import { Tw2Effect, Tw2PerObjectData, Tw2RenderTarget, Tw2Resource } from "core";
import { EveTransform } from "./EveTransform";
import { EveObject } from "./EveObject";
import { EveShip2 } from "eve";

// TODO: Add "OnValueChanged" handler
// TODO: Handle height map resolution size

@meta.type("EvePlanet")
export class EvePlanet extends EveObject
{

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.struct("EveTransform")
    highDetail = new EveTransform();

    @meta.struct("Tw2Effect")
    effectHeight = new Tw2Effect();

    @meta.struct("Tw2RenderTarget")
    heightMap = new Tw2RenderTarget();

    @meta.struct("EveTransform")
    zOnlyModel = null;

    @meta.uint
    resolution=EvePlanet.DEFAULT_HEIGHT_MAP_RESOLUTION;

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

    @meta.uint
    @meta.notImplemented
    minScreenSize = 0;

    @meta.uint
    @meta.notImplemented
    estimatedPixelDiameter = 0;

    _parentTransform = mat4.create();
    _pendingLoad = null;
    _atmosphere = null;
    _planet = null;

    _perObjectData = Tw2PerObjectData.from(EveShip2.perObjectData);

    /**
     * Intersection test
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     */
    Intersect(ray, intersects)
    {
        if (!this.display || this._lod < 1 || ray.IsMasked(this)) return;

        this.RebuildBounds();
        const intersect = ray.IntersectSph3(this._boundingSphere, this._worldTransform);
        if (intersect)
        {
            intersect.name = this.name;
            intersect.item = this;
            intersects.push(intersect);
            return intersect;
        }
    }

    /**
     * Rebuilds transforms
     * @param opt
     * @return {boolean}
     */
    RebuildTransforms(opt)
    {
        if (super.RebuildTransforms(opt))
        {
            const radius = (this.scaling[0] + this.scaling[1] + this.scaling[2]) / 6;
            if (Math.round(this.radius) !== Math.round(radius))
            {
                this.radius = radius;
                this._boundsDirty = true;
            }
            return true;
        }
        return false;
    }

    /**
     * Fires when rebuilding bounds
     */
    OnRebuildBounds()
    {
        sph3.fromMat4(this._boundingSphere, this._localTransform);
        box3.fromSph3(this._boundingBox, this._boundingSphere);
        this._boundsDirty = false;
    }

    /**
     * Fetches planet async
     * @param {Object} options
     * @return {Promise<EvePlanet>}
     */
    async Fetch(options = {})
    {
        const { name = "", itemID = 0, resPath = "", atmospherePath = "", heightMap1 = "", heightMap2 = "", radius = 0 } = options;

        this.name = name;
        this.itemID = itemID;
        this.heightMapResPath1 = heightMap1;
        this.heightMapResPath2 = heightMap2;
        this.highDetail.children.splice(0);
        this.radius = radius;

        const d = radius * 2;
        vec3.set(this.highDetail.scaling, d, d, d);

        const [ zOnly, planet, atmosphere ] = await tw2.FetchAll([
            EvePlanet.zOnlyModelPath,
            resPath,
            [ atmospherePath, true ]
        ]);

        this._planet = planet;
        this._atmosphere = atmosphere;
        this.zOnlyModel = zOnly;

        this.highDetail.children[0] = planet;
        if (atmosphere) this.highDetail.children[1] = atmosphere;

        return this.Rebuild();
    }

    /**
     * Sync alias for Fetch
     * @param {Object} options
     * @param {Function} [onLoaded]
     */
    Create(options, onLoaded = x => x)
    {
        this.Fetch(options).then(onLoaded);
    }

    /**
     * Updates LOD
     * TODO: Implement LOD
     * @param {Tw2Frustum}frustum
     */
    UpdateLod(frustum)
    {
        this._lod = 3; //!frustum.IsSphereVisible(this.translation, this.radius) ? 0 : 3;
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
     * Updates view dependent data
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        mat4.copy(this._parentTransform, parentTransform);

        mat4.transpose(this._perObjectData.vs.Get("WorldMatLast"), this._worldTransform);
        this.RebuildTransforms({ force: true, skipUpdate: true });
        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._worldTransform);

        // vs.EllipsoidCenter
        // vs.EllipsoidRadii

        this.highDetail.SetTransform(this._localTransform);
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
        if (!this.display) return;

        this.highDetail.Update(dt);

        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].Update(dt, this._worldTransform, this._perObjectData);

            if (this.effectChildren[i]._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || !this._lod || !this._planet) return false;

        const c = accumulator.length;

        this.highDetail.GetBatches(mode, accumulator);

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
        }

        return accumulator.length !== c;
    }

    /**
     * Gets z buffer only batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Boolean} true if has batches
     */
    GetZOnlyBatches(mode, accumulator)
    {
        if (!this.display || !this._lod || !this.zOnlyModel) return false;
        return this.zOnlyModel.GetBatches(mode, accumulator);
    }

    /**
     * Internal helper function that fires when a planet's mesh has loaded
     * @return {Promise<EvePlanet|null>}
     */
    async Rebuild()
    {
        const { effectHeight, heightMap } = this;

        this._boundsDirty = true;

        function getMainEffect(t)
        {
            const a = t.mesh ? t.mesh.transparentAreas[0] || t.mesh.opaqueAreas[0] : null;
            return a ? a.effect : null;
        }

        function copyParameters(target, source)
        {
            const { parameters } = source;
            for (const key in parameters)
            {
                if (parameters.hasOwnProperty(key))
                {
                    target.parameters[key] = parameters[key];
                }
            }
        }

        let originalEffect = getMainEffect(this.highDetail.children[0]),
            resPath = "cdn:/Graphics/Effect/Managed/Space/Planet/EarthlikePlanet.fx";

        if (originalEffect)
        {
            resPath = originalEffect.effectFilePath;
            copyParameters(effectHeight, originalEffect);
        }

        for (let i = 0; i < this.highDetail.children[0].children.length; ++i)
        {
            let effect = getMainEffect(this.highDetail.children[0].children[i]);
            if (effect) copyParameters(effectHeight, originalEffect);
        }

        effectHeight.SetParameters({
            Random: this.itemID % 100,
            TargetTextureHeight: this.resolution,
            NormalHeight1: this.heightMapResPath1,
            NormalHeight2: this.heightMapResPath2
        });

        // Replace standard effect with blit height effect
        const ext = "." + getPathExtension(resPath);
        resPath = resPath.replace(ext, `BlitHeight${ext}`);
        effectHeight.SetValue(resPath);

        // If already watching, any updates will be caught
        if (this._pendingLoad)
        {
            return this._pendingLoad;
        }

        // Wait until everything is loaded
        return this._pendingLoad = tw2.Watch(this).then(() =>
        {
            this.heightMap.Create(this.resolution * 2, this.resolution, false);
            this.heightMap.Set();
            device.SetStandardStates(device.RM_FULLSCREEN);
            device.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            device.gl.clear(device.gl.COLOR_BUFFER_BIT);
            device.RenderFullScreenQuad(this.effectHeight);
            this.heightMap.Unset();

            if (originalEffect)
            {
                originalEffect.SetTextures({ HeightMap: "" });
                originalEffect.parameters["HeightMap"].AttachTextureRes(heightMap.texture);
            }

            this._pendingLoad = null;
            this.EmitEvent("rebuilt", this);
            return this;
        });

    }

    /**
     * Planet z only model
     * @type {string}
     */
    static zOnlyModelPath = "cdn:/dx9/model/worldObject/planet/planetZOnly.black";

    /**
     * The generated height map's resolution
     */
    static DEFAULT_HEIGHT_MAP_RESOLUTION = 1024 * 4;

}
