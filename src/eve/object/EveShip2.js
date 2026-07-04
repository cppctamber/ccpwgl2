import { isArray, meta } from "utils";
import { vec3, mat4, sph3, box3 } from "math";
import { EveObject } from "eve/object/EveObject";
import { GLESPerObjectDataEveSpaceObject } from "core/data";
import { Tw2AnimationController } from "core/model";
import { EveTurretSet, EveBanner, EvePlaneSet, EveSpriteSet, EveSpotlightSet, EveCurveLineSet } from "eve/item";
import { EveMeshOverlayEffect } from "eve/effect";
import { EveHazeSet, EveSpriteLineSet } from "unsupported/eve/item";
import { LodLevelPixels } from "constant/ccpwgl";
import { tw2 } from "global";


@meta.type("EveShip2")
@meta.define({
    wgl: "EveShip2",
    ccp: true
})
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
        annotations: true,
        banners: true,
        boosters: true,
        children: true,
        customMasks: true,
        decals: true,
        dirt: true,
        effectChildren: true,
        firingEffects: true,
        hazeSets: true,
        killmarks: true,
        lineSets: true,
        mesh: true,
        overlayEffects: true,
        planeSets: true,
        spotlightSets: true,
        spriteSets: true,
        turretSets: true
    };

    @meta.float
    weeksSinceCleaned = 0;

    /**
     * Runtime animation controllers (attached by the space object factory)
     * @type {Array<Tr2Controller>}
     */
    controllers = [];

    _enableCurves = false;
    _pixelSizeAcross = 0;

    _spriteScale = 1;
    _ellipsoidCenter = vec3.create();
    _ellipsoidRadii = vec3.create();
    _jointMatrices = null;
    _parentTransform = mat4.create();
    _perObjectData = new GLESPerObjectDataEveSpaceObject();
    _perObjectDataBagOfStuff = {};
    _worldTransformLast = mat4.create();

    /**
     * Initializes the ship
     */
    Initialize()
    {
        this.RebuildBoosterSet();
        super.Initialize();
    }

    /**
     * Gets the parent bone index of a model's bone index
     * @param {Number} modelIndex
     * @param {Number} boneIndex
     * @returns {number} -1 for none
     */
    GetAnimationBoneIndexParentIndex(modelIndex, boneIndex)
    {
        if (!this.animation || !this.animation.models[modelIndex] || !this.animation.models[modelIndex].bones[boneIndex])
        {
            throw new ReferenceError(`Invalid bone ${boneIndex} for model index ${modelIndex}`);
        }
        return this.animation.models[modelIndex].bones[boneIndex].GetParentBoneIndex();
    }

    /**
     * Gets the model count for the space object
     * @returns {Number}
     */
    GetAnimationModelCount()
    {
        return this.animation ? this.animation.models.length : 0;
    }

    /**
     * Gets the space object's bone count
     * - Note that the root bone will count as one
     * @parameter {Number} modelIndex
     * @returns {Number}
     */
    GetAnimationModelIndexBoneCount(modelIndex)
    {
        if (!this.animation || !this.animation.models[modelIndex])
        {
            throw new ReferenceError(`Invalid model index ${modelIndex}`);
        }
        return this.animation.models[modelIndex].bones.length;
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
     * TODO: Remove this helper function
     * Gets items by color type
     * @param {Number} colorType
     * @param {Array<*>} out
     * @returns {Array<*>}
     */
    GetItemByColorType(colorType, out=[])
    {
        for (let i = 0; i < this.attachments.length; i++)
        {
            if (this.attachments[i].GetItemByColorType)
            {
                this.attachments[i].GetItemByColorType(colorType, out);
            }
        }

        for (let i = 0; i < this.decals.length; i++)
        {
            if (this.decals[i].colorType === colorType && !out.includes(this.decals[i]))
            {
                out.push(this.decals[i]);
            }
        }

        if (this.mesh && this.mesh.GetItemByColorType)
        {
            this.mesh.GetItemByColorType(colorType, out);
        }

        return out;
    }

    /**
     * TODO: Remove this, it is no longer relevant
     * Gets items by group index
     * @param {Number} colorType
     * @param {Array<*>} out
     * @returns {Array<*>}
     */
    GetItemByGroupIndex(groupIndex, out=[])
    {
        for (let i = 0; i < this.attachments.length; i++)
        {
            if (this.attachments[i].GetItemByGroupIndex)
            {
                this.attachments[i].GetItemByGroupIndex(groupIndex, out);
            }
        }

        return out;
    }

    /**
     * Decides if we want to rebuild bounds from child objects
     * @type {boolean}
     */
    rebuildBoundsFromChildren = false;

    /*

        Eve engine doesn't rebuild bounds like we do here
        If we need to rebuild bounds for a hull, for using in something like Intersection tests
        We should be storing it separately to the actual hull's bounds
        This will remove confusion when we're comparing behavior
        TODO: Change all bound calculations to be separate from the base hull bounds

     */

    /**
     * Fires when bounds need rebuilding
     */
    OnRebuildBounds()
    {

        if (this.animation && this.animation.animations.length)
        {
            //console.warn("Rebuilding bounds on animated meshes not yet supported");
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

        if (this.rebuildBoundsFromChildren) unionFromArrayItems(this.effectChildren);
        if (this.rebuildBoundsFromChildren) unionFromArrayItems(this.children);

        sph3.fromBox3(this._boundingSphere, this._boundingBox);
        this._boundsDirty = false;
    }

    /**
     * Finds a turret set by its locator
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
     * Finds a mesh bone by name
     * @param {String} boneName
     * @param {Number} meshIndex
     * @returns {Tw2Bone|null}
     */
    FindMeshBoneByName(boneName, meshIndex)
    {
        return this.animation ? this.animation.FindMeshBoneByName(boneName, meshIndex) : null;
    }

    /**
     * Finds a mesh bone by index
     * @param {Number} boneIndex
     * @param {Number} meshIndex
     * @returns {Tw2Bone|null}
     */
    FindMeshBoneByIndex(boneIndex, meshIndex)
    {
        return this.animation ? this.animation.FindMeshBoneByIndex(boneIndex, meshIndex) : null;
    }

    /**
     * Finds a locator's bone by its name
     * @param {String} name
     * @returns {?Tw2Bone} null if not found
     */
    FindLocatorBoneByName(name)
    {
        return this.FindMeshBoneByName(name, this.meshIndex);
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

        if (existingTurretSet)
        {
            this.attachments.splice(this.attachments.indexOf(existingTurretSet), 1);
        }

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
     * Adds an animation controller
     * @param {Tr2Controller} controller
     */
    AddController(controller)
    {
        if (controller && !this.controllers.includes(controller))
        {
            this.controllers.push(controller);
            if (controller.Initialize) controller.Initialize(this);
        }
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

        const perObjectDataBagOfStuff = this.GetPerObjectDataBagOfStuff(this._perObjectDataBagOfStuff);

        for (let i = 0; i < this.children.length; i++)
        {
            this.children[i].Update(dt, this._worldTransform, perObjectDataBagOfStuff);

            if (this.children[i]._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].Update(dt, this._worldTransform, perObjectDataBagOfStuff);

            if (this.effectChildren[i]._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

        for (let i = 0; i < this.controllers.length; i++)
        {
            this.controllers[i].Update(dt);
        }

        if (this.animation)
        {
            this.animation.Update(dt);

            // Handle bounds
        }

    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} [perObjectData=this._perObjectData]
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData = this._perObjectData)
    {
        if (!this.display || this._lod < 1) return false;
        const hasExternalPerObjectData = perObjectData !== this._perObjectData;
        const previousPerObjectData = this._perObjectData;
        if (hasExternalPerObjectData)
        {
            this._perObjectData = perObjectData;
        }

        const
            c = accumulator.length,
            show = this.visible,
            res = this.mesh && this.mesh.IsGood() ? this.mesh.geometryResource : null;

        if (show.boosters && this.boosters)
        {
            this.boosters.GetBatches(mode, accumulator, this.GetPerObjectDataBagOfStuff(this._perObjectDataBagOfStuff));
        }

        if (res)
        {
            // TODO: Throw an error
            if (this.meshIndex >= res.meshes.length)
            {
                this.meshIndex = res.meshes.length - 1;
            }
            // TODO: Why are we doing this? Must assume the data is correct
            this.mesh.SetMeshIndex(this.meshIndex);

            if (show.mesh)
            {
                this.mesh.GetBatches(mode, accumulator, this._perObjectData);
            }
        }

        const showFiringEffects = show.firingEffect !== undefined ? show.firingEffect : show.firingEffects;
        let doFiringEffects = showFiringEffects;

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
                            item.GetBatches(mode, accumulator, this._perObjectData, showFiringEffects);
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
                            item.GetBatches(mode, accumulator, this._perObjectData);
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
                            item.GetBatches(mode, accumulator, this._perObjectData);
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

        const hasBatches = accumulator.length !== c;

        if (hasExternalPerObjectData)
        {
            this._perObjectData = previousPerObjectData;
        }

        return hasBatches;
    }

    /**
     * Gets per-object data for the batch context
     * @param {Number} mode
     * @param {Object} [context]
     * @returns {Tw2PerObjectData}
     */
    GetPerObjectData(_mode, _context = {})
    {
        return this._perObjectData;
    }

    /**
     * Gets a temporary semantic-ish bag of values used to build per-object data.
     * Values may be references to object/raw arrays; treat the bag as read-only.
     * @param {Object} [out]
     * @returns {Object}
     */
    GetPerObjectDataBagOfStuff(out = {})
    {
        delete out.shipData;
        delete out.clipData;
        delete out.clipData1;
        delete out.worldTransformTranspose;
        delete out.worldTransformLastTranspose;
        delete out.inverseWorldTransformTranspose;
        delete out.shapeEllipsoidCenter;
        delete out.shapeEllipsoidRadius;
        delete out.boundingSphereRadiusSq;
        delete out.clipSphereCenter;
        delete out.clipSphereSignedRadiusSq;
        delete out.customMaskBlending;
        delete out.jointMatrices;

        const
            boosterGain = Math.max(Math.min(this.visible.boosters ? this.boosterGain : 0, 1), 0),
            activationStrength = Math.max(Math.min(this.activationStrength, 1), 0),
            dirtLevel = Math.max(EveShip2.getDirtLevelFromWeeks(this.weeksSinceCleaned, !this.visible.dirt), 0);

        out.source = this;
        out.perObjectData = this._perObjectData;
        out.legacyPerObjectData = this._perObjectData;
        out.worldTransform = this._worldTransform;
        out.worldTransformLast = this._worldTransformLast;
        out.parentTransform = this._parentTransform;
        out.boosterGain = boosterGain;
        out.activationStrength = activationStrength;
        out.dirtLevel = dirtLevel;
        out.weeksSinceCleaned = this.weeksSinceCleaned;
        out.boundingSphereCenter = this.boundingSphereCenter;
        out.boundingSphereRadius = this.boundingSphereRadius;
        out.shapeEllipsoidCenter = this.shapeEllipsoidCenter;
        out.shapeEllipsoidRadius = this.shapeEllipsoidRadius;
        out.ellipsoidCenter = this._ellipsoidCenter;
        out.ellipsoidRadii = this._ellipsoidRadii;
        out.customMasks = this.customMasks;

        if (this._jointMatrices) out.jointMatrices = this._jointMatrices;
        out.jointCount = 0;

        if (out.jointMatrices && this.animation && this.animation.models[this.meshIndex])
        {
            const bones = this.animation.models[this.meshIndex].bones;
            out.jointCount = isArray(bones) ? bones.length : 0;
        }

        return out;
    }

    /**
     * Gets render payload for experimental batch contexts.
     * The legacy per-object data is exposed explicitly as compatibility data;
     * batch.perObjectData remains the final shader upload payload.
     * @param {Number} mode
     * @param {Object} [_context]
     * @returns {Object}
     */
    GetRenderPayload(mode, _context = {})
    {
        const
            mesh = this.mesh && this.mesh.IsGood() ? this.mesh : null,
            geometryRes = mesh ? mesh.geometryResource : null,
            meshIndex = mesh && typeof mesh.GetMeshIndex === "function" ? mesh.GetMeshIndex() : this.meshIndex,
            vs = this._perObjectData && this._perObjectData.vs,
            ps = this._perObjectData && this._perObjectData.ps;

        return {
            source: this,
            mode,
            legacyPerObjectData: this._perObjectData,
            worldTransform: this._worldTransform,
            parentTransform: this._parentTransform,
            mesh,
            geometryRes,
            meshIndex,
            lod: this._lod,
            visible: this.visible,
            boosterGain: this.boosterGain,
            killCount: this.killCount,
            clip: this.clip,
            shipData: vs && vs.Get("Shipdata"),
            jointMatrices: vs && vs.Get("JointMat"),
            pixelShaderData: ps && ps.data
        };
    }

    /**
     * Gets render batches for a mode in the experimental batch context
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} [perObjectData=this._perObjectData]
     * @param {*} [renderReason]
     * @param {*} [renderPacket]
     * @returns {Boolean}
     */
    GetBatchesForMode(mode, accumulator, perObjectData = this._perObjectData, _renderReason, _renderPacket)
    {
        return this.GetBatches(mode, accumulator, perObjectData || this._perObjectData);
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Number} dt
     */
    UpdateViewDependentData(parentTransform, dt)
    {
        mat4.copy(this._parentTransform, parentTransform);
        mat4.copy(this._worldTransformLast, this._worldTransform);


        // Enabling curves overrides rotation and translation
        if (this._enableCurves && (this.rotationCurve || this.translationCurve))
        {
            if (this.rotationCurve)
            {
                this.rotationCurve.GetValueAt(tw2.currentTime, this.rotation);
            }

            if (this.translationCurve)
            {
                this.translationCurve.GetValueAt(tw2.currentTime, this.translation);
            }
        }

        this.RebuildTransforms({ force: true, skipUpdate: true });

        const res = this.mesh && this.mesh.IsGood() ? this.mesh.geometryResource : null;
        if (res)
        {
            // What is this, this doesn't look standard
            // We can probably remove this.
            if (this.meshIndex >= res.meshes.length)
            {
                this.meshIndex = res.meshes.length - 1;
            }
            this.mesh.SetMeshIndex(this.meshIndex);

            // If we have animations, check if they're loaded
            if (this.animation)
            {
                if (!this.animation.HasGeometryResource(res))
                {
                    this.animation.SetGeometryResource(res);
                    this.animation.OnResPrepared(res);
                }

                if (this.animation.animations.length)
                {
                    this._jointMatrices = this.animation.GetBoneMatrices(this.meshIndex);
                }

                // Todo: Do bounds check on animations

                // Update locator bones
                // Todo: Find a way to update this without checking every frame
                for (let i = 0; i < this.locators.length; i++)
                {
                    if (this.locators[i]._parentTransform !== this._worldTransform)
                    {
                        this.locators[i]._parentTransform = this._worldTransform;
                    }

                    if (this.locators[i]._meshIndex !== this.meshIndex)
                    {
                        this.locators[i]._bone = this.animation.FindMeshBoneByName(this.locators[i].name, this.meshIndex);
                        this.locators[i]._meshIndex = this.meshIndex;
                    }
                }
            }
        }

        // Update bounding ellipsoid (Used for some effects and maybe collsions?)
        // - Similar as the clip data, we should only have to update this on first load
        // - and then whenever the bounds get updated
        const
            center = this._ellipsoidCenter,
            radii = this._ellipsoidRadii;

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

        const customMaskBagOfStuff = this.GetPerObjectDataBagOfStuff(this._perObjectDataBagOfStuff);
        for (let i = 0; i < this.customMasks.length; ++i)
        {
            this.customMasks[i].GetPerObjectDataBagOfStuff(id, customMaskBagOfStuff, i, this.visible.customMasks);
        }
        GLESPerObjectDataEveSpaceObject.Pack(customMaskBagOfStuff, this._perObjectData);

        // Custom scaler for sprites
        // - Note that ccp doesn't do this however we want to do this
        // - incase we want to scale the scene down, e.g. for Virtual Reality/ Mixed Reality projections
        this._spriteScale = mat4.maxScaleOnAxis(this._worldTransform);

        // Collect our bones
        let bones = null;
        if (this.animation && this.animation.models[this.meshIndex])
        {
            bones = this.animation.models[this.meshIndex].bones;
            if (!isArray(bones))
            {
                console.dir({ msg: "Invalid bones", bones });
                bones = null;
            }
        }

        for (let i = 0; i < this.children.length; ++i)
        {
            this.children[i].UpdateViewDependentData(this._worldTransform, dt);
        }

        for (let i = 0; i < this.attachments.length; i++)
        {
            if ("UpdateViewDependentData" in this.attachments[i])
            {
                this.attachments[i].UpdateViewDependentData(this._worldTransform, bones, this._spriteScale);
            }
        }

        if (this.boosters)
        {
            this.boosters.UpdateViewDependentData(this._worldTransform, bones, this._spriteScale);
        }

        for (let i = 0; i < this.decals.length; i++)
        {
            this.decals[i].UpdateViewDependentData(this._worldTransform);
        }

    }

    @meta.float
    activationStrength = 1.0;

    /**
     * The level to use when dirt is off
     * @type {number}
     */
    //static DIRT_OFF_LEVEL = 5.0;

    /**
     * Age modifier
     * @type {number}
     */
    //static DIRT_AGE_MODIFIER = 0.01;

    /**
     * Gets dirt level from weeks since cleaned
     * @param {Number} weeks
     * @param {Boolean} [isDisabled]
     * @returns {number}
     */
    static getDirtLevelFromWeeks(weeks, isDisabled)
    {
        //weeks *= this.DIRT_AGE_MODIFIER;
        //if (isDisabled || isNaN(weeks)) return this.DIRT_OFF_LEVEL;
        if (isDisabled || isNaN(weeks)) return 0;
        return (0.7 - 1.0 / (Math.pow(Math.max(weeks, 0.0), 0.65) + (1.0 / 2.7)));
    }

    /**
     * Per object data
     * @type {{ps: ((string|number[])[]|(string|number)[])[], vs: ((string|number)[]|(string|number[])[])[]}}
     */
    static perObjectData = GLESPerObjectDataEveSpaceObject.layout;

}
