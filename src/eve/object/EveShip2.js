import { meta } from "utils";
import { vec3, vec4, mat4, sph3, box3 } from "math";
import { EveObject } from "eve/object/EveObject";
import { Tw2PerObjectData } from "core/data";
import { Tw2AnimationController } from "core/model";
import { EveTurretSet, EveBanner, EvePlaneSet, EveSpriteSet, EveSpotlightSet, EveCurveLineSet } from "eve/item";
import { EveMeshOverlayEffect } from "eve/effect";
import { EveHazeSet, EveSpriteLineSet } from "unsupported/eve/item";
import { LodLevelPixels } from "constant/ccpwgl";
import { RM_OPAQUE } from "constant";


@meta.type("EveShip2")
@meta.stage(2)
export class EveShip2 extends EveObject
{

    @meta.struct("Tw2Animation")
    @meta.isPrivate
    animation = new Tw2AnimationController();

    @meta.list("EveObjectSet")
    attachments = [];

    @meta.struct("EveBoosterSet2")
    boosters = null;

    @meta.vector3
    @meta.isPrivate
    boundingSphereCenter = vec3.create();

    @meta.float
    @meta.isPrivate
    boundingSphereRadius = 0;

    @meta.list("EveObject")
    children = [];

    @meta.list("EveCustomMask")
    customMasks = [];

    @meta.list("EveSpaceObjectDecal")
    decals = [];

    @meta.string
    dna = "";

    @meta.list("EveLocatorSets")
    locatorSets = [];

    @meta.list("EveLocator2")
    locators = [];

    @meta.struct("Tw2Mesh", "Tw2InstancedMesh", "Tr2MeshLod")
    mesh = null;

    @meta.struct("EveCurve") // Tr2RotationAdapter
    @meta.isPrivate
    rotationCurve = null;

    @meta.struct("Tw2Effect")
    shadowEffect = null;

    @meta.vector3
    @meta.isPrivate
    shapeEllipsoidCenter = vec3.create();

    @meta.vector3
    @meta.isPrivate
    shapeEllipsoidRadius = vec3.create();

    @meta.struct("EveCurve") // Tr2TranslationAdapter
    @meta.isPrivate
    translationCurve = null;

    @meta.uint
    meshIndex = 0;

    /*

        CCPWGL only

     */

    @meta.uint
    killCount = 0;

    @meta.float
    boosterGain = 1;

    @meta.list("EveChild")
    effectChildren = [];

    @meta.plain
    visible = {
        mesh: true,
        banners: true,
        children: true,
        effectChildren: true,
        planeSets: true,
        spotlightSets: true,
        decals: true,
        spriteSets: true,
        hazeSets: true,
        overlayEffects: true,
        lineSets: true,
        killmarks: true,
        customMasks: true,
        turretSets: true,
        boosters: true,
        shadows: true
    };

    @meta.float
    weeksSinceCleaned = 0;

    // Testing...
    _enableCurves = false;
    _pixelSizeAcross = 0;
    _effectScale = 1;

    _spriteScale = 1;
    _parentTransform = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveShip2.perObjectData);

    /**
     * Initializes the ship
     */
    Initialize()
    {
        this.RebuildBoosterSet();
        super.Initialize();
    }

    /**
     * Intersection test
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {Object} [cache]
     * @returns {*}
     */
    Intersect(ray, intersects, cache= {})
    {
        this.RebuildBounds();

        if (!this.display || this._lod < 1 || this._boundsDirty) return;

        const intersect = ray.IntersectBox3(this._boundingBox, this._worldTransform);
        if (!intersect) return false;

        const { root = this } = cache;
        let args = [ ray, intersects, this._worldTransform, cache ];

        if ("Intersect" in this.mesh && !ray.GetOption("mesh", "skip"))
        {
            this.mesh.Intersect(...args).forEach(intersect => intersect.root = root);
        }

        if (this._lod > 1)
        {
            for (let i = 0; i < this.attachments.length; i++)
            {
                let item = this.attachments[i],
                    itemIntersect;

                if (!item.Intersect) continue;

                let type;
                switch (item.constructor)
                {
                    case EveHazeSet:
                        type = "hazeSets";
                        break;

                    case EveBanner:
                        type = "banners";
                        break;

                    case EveTurretSet:
                        type = "turretSets";
                        break;

                    case EveSpotlightSet:
                        type = "spotlightSets";
                        break;

                    case EveSpriteSet:
                        type = "spriteSets";
                        break;

                    case EvePlaneSet:
                        type = "planeSets";
                        break;

                    case EveSpriteLineSet:
                        type = "spriteLineSets";
                        break;

                    case  EveCurveLineSet:
                        type = "lineSets";
                        break;

                    case EveMeshOverlayEffect:
                        type = "overlayEffects";
                        break;

                }

                if (type && this.visible[type] && !ray.GetOption(type, "skip"))
                {
                    itemIntersect = item.Intersect(...args);
                }

                if (itemIntersect)
                {
                    itemIntersect.root = root;
                }
            }
        }

        /*
        if (this.visible.decals)
        {
            for (let i = 0; i < this.decals.length; i++)
            {
                const itemIntersect = this.decals[i].Intersect(...args);
                if (itemIntersect) itemIntersect.root = this;
            }
        }
         */

        if (!ray.GetOption("locators", "skip"))
        {
            for (let i = 0; i < this.locators.length; i++)
            {
                const itemIntersect = this.locators[i].Intersect(...args);
                if (itemIntersect) itemIntersect.root = root;
            }
        }

        if (this.visible.effectChildren && !ray.GetOption("effectChildren", "skip"))
        {
            for (let i = 0; i < this.effectChildren.length; i++)
            {
                if (this.effectChildren[i].Intersect)
                {
                    const itemIntersect = this.effectChildren[i].Intersect(...args);
                    if (itemIntersect) itemIntersect.root = root;
                }
            }
        }

        if (this.visible.children && !ray.GetOption("children", "skip"))
        {
            for (let i = 0; i < this.children.length; i++)
            {
                if (this.children[i].Intersect)
                {
                    const itemIntersect = this.children[i].Intersect(...args);
                    if (itemIntersect) itemIntersect.root = root;
                }
            }
        }

        // Todo: get most specific item
        return intersect;
    }

    /**
     * Fires when bounds need rebuilding
     */
    OnRebuildBounds()
    {

        if (this.animation && this.animation.animations.length)
        {
            console.warn("Rebuilding bounds on animated meshes not yet supported");
        }

        if (!this.mesh || !this.mesh.IsGood())
        {
            this._boundsDirty = true;
            return;
        }

        // TODO: Get from mesh and handle instanced mesh
        this.mesh.geometryResource.GetBoundingBox(this._boundingBox);

        // Children
        const { box3_0, sph3_0 } = EveObject.global;

        const unionFromArrayItems = (array = []) =>
        {
            for (let i = 0; i < array.length; i++)
            {
                let bounds = false;
                if ("GetBoundingBox" in array[i])
                {
                    array[i].GetBoundingBox(box3_0);
                    bounds = true;

                }
                else if ("GetBoundingSphere" in array[i])
                {
                    array[i].GetBoundingSphere(sph3_0);
                    box3.fromSph3(box3_0, sph3_0);
                    bounds = true;
                }

                if (bounds)
                {
                    box3.union(this._boundingBox, this._boundingBox, box3_0);
                }
            }
        };

        unionFromArrayItems(this.attachments);
        unionFromArrayItems(this.effectChildren);
        unionFromArrayItems(this.children);

        sph3.fromBox3(this._boundingSphere, this._boundingBox);
        this._boundsDirty = false;
    }

    /**
     * Finds a turret set by it's locator
     * @param {String} locator
     * @returns {EveTurretSet}
     */
    FindTurretSetByLocatorName(locator)
    {
        for (let i = 0; i < this.attachments.length; i++)
        {
            if (this.attachments[i] instanceof EveTurretSet && this.attachments[i].locatorName === locator)
            {
                return this.attachments[i];
            }
        }
    }

    /**
     * Finds all turret prefixes
     * @param {Array<String>} [out=[]] - Receiving array
     * @returns {Array<String>} out    - Receiving array
     */
    FindTurretPrefixes(out = [])
    {
        function add(match)
        {
            if (!match) return false;
            const name = match[0].substring(0, match[0].length - 1);
            if (!out.includes(name)) out.push(name);
            return true;
        }

        for (let i = 0; i < this.locators.length; i++)
        {
            const name = this.locators[i].name;
            if (!add((/^locator_turret_([0-9]+)[a-z]$/i).exec(name)))
            {
                add((/^locator_xl_([0-9]+)[a-z]$/i).exec(name));
            }
        }

        out.sort();
        return out;
    }

    /**
     * Gets locator count for a specific locator group
     * @param {String} prefix
     * @returns {number}
     */
    GetLocatorCount(prefix)
    {
        const locators = this.FindLocatorsByPrefix(prefix);
        return locators.length;
    }

    /**
     * Finds a locator's joint by name
     * @param {String} name
     * @returns {?mat4}
     */
    FindLocatorJointByName(name)
    {
        const locator = this.FindLocatorBoneByName(name);
        return locator ? locator.worldTransform : null;
    }

    /**
     * Finds a locator's transform by it's name
     * @param {String} name
     * @returns {?mat4}
     */
    FindLocatorTransformByName(name)
    {
        const locator = this.FindLocatorByName(name);
        return locator ? locator.transform : null;
    }

    /**
     * Checks if a locator prefix exists
     * @param {String} prefix
     * @returns {Boolean}
     */
    HasLocatorPrefix(prefix)
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name.indexOf(prefix) === 0)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Finds a locator's bone by it's name
     * @param {String} name
     * @returns {?Tw2Bone} null if not found
     */
    FindLocatorBoneByName(name)
    {
        return this.animation ? this.animation.FindBoneForMesh(name, this.meshIndex) : null;
    }

    /**
     * Finds a locator by name
     * @param {String} name
     * @returns {?EveLocator2}
     */
    FindLocatorByName(name)
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name === name)
            {
                return this.locators[i];
            }
        }
        return null;
    }

    /**
     * Finds locators with a given prefix
     * @param {String} prefix
     * @param {Array} [out=[]}
     * @returns {Array<EveLocator2>}
     */
    FindLocatorsByPrefix(prefix, out = [])
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            if (this.locators[i].name.indexOf(prefix) === 0)
            {
                out.push(this.locators[i]);
            }
        }
        return out;
    }

    /**
     * Updates lod
     * @param {Tw2Frustum} frustum
     */
    UpdateLod(frustum)
    {
        const center = vec3.transformMat4(EveObject.global.vec3_0, this.boundingSphereCenter, this._worldTransform);

        if (frustum.IsSphereVisible(center, this.boundingSphereRadius))
        {
            this._pixelSizeAcross = frustum.GetPixelSizeAcross(center, this.boundingSphereRadius);

            if (this._pixelSizeAcross < LodLevelPixels.ZERO)
            {
                this._lod = 0;
            }
            else if (this._pixelSizeAcross < LodLevelPixels.ONE)
            {
                this._lod = 1;
            }
            else if (this._pixelSizeAcross < LodLevelPixels.TWO)
            {
                this._lod = 2;
            }
            else
            {
                this._lod = 3;
            }
        }
        else
        {
            this._pixelSizeAcross = 0;
            this._lod = 0;
        }

        for (let i = 0; i < this.children.length; i++)
        {
            if (this.children[i].UpdateLod)
            {
                this.children[i].UpdateLod(frustum, this._lod);
            }
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].UpdateLod(frustum, this._lod);
        }
    }

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this._lod = 3;

        for (let i = 0; i < this.children.length; i++)
        {
            if (this.children[i].ResetLod)
            {
                this.children[i].ResetLod();
            }
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].ResetLod();
        }
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        this.PerChild(x =>
        {
            if ("GetResources" in x.struct)
            {
                x.struct.GetResources(out);
            }
        });
        return out;
    }

    /**
     * Rebuilds boosters
     * @return {boolean}
     */
    RebuildBoosterSet()
    {
        if (this.boosters)
        {
            this.boosters.UpdateItemsFromLocators(this.FindLocatorsByPrefix("locator_booster"));
            return true;
        }
        return false;
    }

    /**
     * Gets a turret set by it's locator name
     * @param {String} locatorName
     * @return {null|EveTurretSet}
     */
    GetTurretSetByLocatorName(locatorName)
    {
        return this.attachments.find(x => x instanceof EveTurretSet && x.locatorName === locatorName) || null;
    }

    /**
     * Removes a turret set
     * @param {EveTurretSet} turretSet
     * @returns {Boolean} true if updated
     */
    RemoveTurretSet(turretSet)
    {
        const index = this.attachments.indexOf(turretSet);
        if (index === -1) return false;
        this.attachments.splice(index, 1);
        return true;
    }

    /**
     * Adds a turret set
     * @param {EveTurretSet} turretSet
     * @returns {Boolean} true if updated
     */
    AddTurretSet(turretSet)
    {
        if (!turretSet.locatorName)
        {
            throw new ReferenceError("Turret set must have a locator name");
        }

        const existingTurretSet = this.GetTurretSetByLocatorName(turretSet.locatorName);
        if (existingTurretSet === turretSet) return false;

        this.attachments.splice(this.attachments.indexOf(existingTurretSet), 1);
        this.attachments.push(turretSet);
        this.RebuildTurretSet(turretSet);
        return true;
    }

    /**
     * Rebuilds a turret set
     * @param {EveTurretSet} turretSet
     * @return {boolean}
     */
    RebuildTurretSet(turretSet)
    {
        const
            prefix = turretSet.locatorName,
            count = this.GetLocatorCount(prefix),
            locators = [];

        for (let j = 0; j < count; ++j)
        {
            const
                name = prefix + String.fromCharCode("a".charCodeAt(0) + j),
                locator = this.FindLocatorByName(name);

            if (locator)
            {
                locator.FindBone(this.animation);
                locators.push(locator);
            }
        }

        turretSet.UpdateItemsFromLocators(locators);
        return true;
    }

    /**
     * Rebuilds overlays from a supplied array
     * @param {Array<EveMeshOverlayEffect>} overlays
     * @return {boolean}
     */
    RebuildOverlays(overlays = [])
    {
        let updated = false;
        for (let i = 0; i < this.attachments.length; i++)
        {
            if (this.attachments[i] instanceof EveMeshOverlayEffect)
            {
                updated = true;
                this.attachments.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < overlays.length; i++)
        {
            this.attachments.push(overlays[i]);
            updated = true;
        }

        return updated;
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        if (this._lod < 1 || !this.display)
        {
            return;
        }

        if (this.boosters)
        {
            if (this.boosters._locatorDirty)
            {
                this.RebuildBoosterSet();
            }

            this.boosters.Update(dt, this._worldTransform);

            if (this.boosters._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

        for (let i = 0; i < this.attachments.length; i++)
        {
            // TODO: Normalize
            if (this.attachments[i] instanceof EveTurretSet && this.attachments[i]._locatorDirty)
            {
                this.RebuildTurretSet(this.attachments[i]);
            }

            this.attachments[i].Update(dt, this);

            if (this.attachments[i]._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

        for (let i = 0; i < this.children.length; i++)
        {
            this.children[i].Update(dt, this._worldTransform);

            if (this.children[i]._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].Update(dt, this._worldTransform, this._perObjectData);

            if (this.effectChildren[i]._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

        if (this.animation)
        {
            this.animation.Update(dt);

            // Handle bounds
        }

    }

    /**
     * Gets a shadow batch
     * @param accumulator
     * @return {boolean}
     */
    GetShadowBatch(accumulator)
    {
        if (
            !this.display ||
            !this.visible.shadows ||
            !this.mesh ||
            !this.mesh.IsGood() ||
            !this.shadowEffect ||
            !this.shadowEffect.IsGood()
        ) return false;

        const { mesh } = this;

        for (let i = 0; i < mesh.opaqueAreas.length; i++)
        {
            const area = mesh.opaqueAreas[i];
            if (!area.display) continue;

            const batch = new area.constructor.batchType();
            batch.renderMode = RM_OPAQUE;
            batch.perObjectData = this._perObjectData;
            batch.geometryRes = mesh.geometryResource;
            batch.meshIx = mesh.meshIndex; //area.meshIndex;
            batch.start = area.index;
            batch.count = area.count;
            batch.effect = this.shadowEffect;
            accumulator.Commit(batch);
        }

        return true;
    }

    dirtMultiplier = 10;

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || this._lod < 1) return false;

        const
            c = accumulator.length,
            show = this.visible,
            res = this.mesh && this.mesh.IsGood() ? this.mesh.geometryResource : null;

        const shipData = this._perObjectData.ps.Get("Shipdata");
        shipData[0] = this.boosterGain;
        shipData[2] = 0;
        if (this.weeksSinceCleaned> 0)
        {
            shipData[2] = -(0.7 - 1.0 / (Math.pow(this.weeksSinceCleaned, 0.65) + (1.0 / 2.7))) * this.dirtMultiplier;
        }

        if (show.boosters && this.boosters)
        {
            this._perObjectData.vs.Get("Shipdata")[0] = this.boosterGain;
            this.boosters.GetBatches(mode, accumulator, this._perObjectData);
        }

        if (res)
        {
            // Should this just throw an error?
            if (this.meshIndex > res.meshes.length)
            {
                this.meshIndex = res.meshes.length - 1;
            }
            this.mesh.SetMeshIndex(this.meshIndex);

            if (show.mesh)
            {
                this.mesh.GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        let doFiringEffects = show.firingEffect;

        if (this._lod > 1)
        {

            // TODO: normalize GetBatches for all attachments
            for (let i = 0; i < this.attachments.length; i++)
            {
                const item = this.attachments[i];
                switch (item.constructor)
                {
                    case EveTurretSet:
                        if (show.turretSets)
                        {
                            doFiringEffects = false;
                            item.GetBatches(mode, accumulator, this._perObjectData, show.firingEffect);
                        }
                        break;

                    case EveSpotlightSet:
                        if (show.spotlightSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                        }
                        break;

                    case EvePlaneSet:
                        if (show.planeSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData);
                        }
                        break;

                    case EveSpriteSet:
                        if (show.spriteSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                        }
                        break;

                    case EveSpriteLineSet:
                        if (show.spriteLineSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                        }
                        break;

                    case EveCurveLineSet:
                        if (show.lineSets)
                        {
                            item.GetBatches(mode, accumulator);
                        }
                        break;

                    case EveMeshOverlayEffect:
                        if (show.overlayEffects)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this.mesh);
                        }
                        break;

                    case EveHazeSet:
                        if (show.hazeSets)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData);
                        }
                        break;

                    case EveBanner:
                        if (show.banners)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                        }
                        break;

                    default:
                        if (item.GetBatches)
                        {
                            item.GetBatches(mode, accumulator, this._perObjectData, this._worldTransform);
                        }
                        else
                        {
                            console.log("Attachment not supported");
                        }
                        break;
                }
            }

            if (res)
            {
                if (show.decals)
                {
                    const killMarks = show.killmarks && this._lod > 2 ? this.killCount : 0;
                    for (let i = 0; i < this.decals.length; i++)
                    {
                        this.decals[i].GetBatches(mode, accumulator, this._perObjectData, res, killMarks, this.mesh.GetMeshIndex());
                    }
                }
            }
        }

        if (doFiringEffects)
        {
            for (let i = 0; i < this.attachments.length; i++)
            {
                if (this.attachments[i] instanceof EveTurretSet)
                {
                    this.attachments[i].GetFiringEffectBatches(mode, accumulator, this._perObjectData);
                }
            }
        }

        if (show.children)
        {
            for (let i = 0; i < this.children.length; i++)
            {
                this.children[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        if (show.effectChildren)
        {
            for (let i = 0; i < this.effectChildren.length; i++)
            {
                this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        return accumulator.length !== c;
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Number} dt
     */
    UpdateViewDependentData(parentTransform, dt)
    {
        mat4.copy(this._parentTransform, parentTransform);
        mat4.transpose(this._perObjectData.vs.Get("WorldMatLast"), this._worldTransform);

        this._perObjectData.vs.SetIndex("Unknown0", 3, this._effectScale);

        // Enabling curves overrides rotation and translation
        if (this._enableCurves && this.rotationCurve || this.translationCurve)
        {
            if (this.rotationCurve)
            {
                this.rotationCurve.GetValueAt(dt, this.rotation);
            }

            if (this.translationCurve)
            {
                this.translationCurve.GetValueAt(dt, this.translation);
            }
        }

        this.RebuildTransforms({ force: true, skipUpdate: true });


        const res = this.mesh && this.mesh.IsGood() ? this.mesh.geometryResource : null;


        if (res)
        {
            // Should this just throw an error?
            if (this.meshIndex > res.meshes.length)
            {
                this.meshIndex = res.meshes.length - 1;
            }
            this.mesh.SetMeshIndex(this.meshIndex);

            if (this.animation)
            {
                if (!this.animation.HasGeometryResource(res))
                {
                    this.animation.SetGeometryResource(res);
                    this.animation.OnResPrepared(res);
                }

                if (this.animation.animations.length)
                {
                    this._perObjectData.vs.Set("JointMat", this.animation.GetBoneMatrices(this.meshIndex));
                }

                // Todo: Do bounds check on animations
            }
        }

        // TODO: Replace in Update or ViewDependantUpdate
        const worldScale =  mat4.maxScaleOnAxis(this._worldTransform);
        if (this._spriteScale !== worldScale)
        {
            this._spriteScale = worldScale;

            if (this.boosters)
            {
                this.boosters.SetWorldSpriteScale(this._spriteScale);
            }

            for (let i = 0; i < this.attachments.length; i++)
            {
                if ("SetWorldSpriteScale" in this.attachments[i])
                {
                    this.attachments[i].SetWorldSpriteScale(this._spriteScale);
                }
            }
        }

        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this._worldTransform);
        }

        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._worldTransform);

        const
            center = this._perObjectData.vs.Get("EllipsoidCenter"),
            radii = this._perObjectData.vs.Get("EllipsoidRadii");

        if (this.shapeEllipsoidRadius[0] > 0)
        {
            center[0] = this.shapeEllipsoidCenter[0];
            center[1] = this.shapeEllipsoidCenter[1];
            center[2] = this.shapeEllipsoidCenter[2];
            radii[0] = this.shapeEllipsoidRadius[0];
            radii[1] = this.shapeEllipsoidRadius[1];
            radii[2] = this.shapeEllipsoidRadius[2];
        }
        else if (res)
        {
            const { maxBounds, minBounds } = res;
            vec3.subtract(center, maxBounds, minBounds);
            vec3.scale(center, center, 0.5 * 1.732050807);
            vec3.add(radii, maxBounds, minBounds);
            vec3.scale(radii, radii, 0.5);
        }

        // Is this correct?
        const id = mat4.identity(EveObject.global.mat4_0);
        id[12] = 0;
        id[13] = 0;
        id[14] = 0;

        for (let i = 0; i < this.customMasks.length; ++i)
        {
            this.customMasks[i].UpdatePerObjectData(id, this._perObjectData, i, this.visible.customMasks);
        }

        for (let i = 0; i < this.attachments.length; i++)
        {
            if ("UpdateViewDependentData" in this.attachments[i])
            {
                this.attachments[i].UpdateViewDependentData(this._worldTransform, dt, this._spriteScale, this._perObjectData);
            }
        }

        if (this.boosters)
        {
            this.boosters.UpdateViewDependentData(this._worldTransform);
        }
    }


    /**
     * Per object data
     * @type {{ps: ((string|number[])[]|(string|number)[])[], vs: ((string|number)[]|(string|number[])[])[]}}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "Shipdata", [ 0, 1, 0, -10 ] ],
            [ "Clipdata1", 4 ],                 // Still clip data?
            [ "Unknown_WasEllipsoidRadii", 4 ],
            [ "Unknown_WasEllipsoidCenter", 4 ],
            [ "Unknown0", [
                0,
                1,     // glow brightness
                0,
                1      // effect scale?
            ] ],
            [ "Unknown1", 4 ],
            [ "EllipsoidRadii", 4 ],
            [ "EllipsoidCenter", 4 ],
            [ "CustomMaskMatrix0", mat4.create() ],
            [ "CustomMaskMatrix1", mat4.create() ],
            [ "CustomMaskData0", [ 1, 0, 0, 0 ] ],
            [ "CustomMaskData1", [ 1, 0, 0, 0 ] ],
            [ "JointMat", 696 ]
        ],
        ps: [
            [ "Shipdata", [ 0, 1, 0, 1 ] ],
            [ "Clipdata1", 4 ],
            [ "Clipdata2", 4 ],
            [ "ShLighting", 4 * 7 ],
            [ "CustomMaskMaterialID0", 4 ],
            [ "CustomMaskMaterialID1", 4 ],
            [ "CustomMaskTarget0", 4 ],
            [ "CustomMaskTarget1", 4 ],
            [ "Unknown4", 4 ]
        ]
    };

}
