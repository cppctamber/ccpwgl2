import { isArray, meta } from "utils";
import { SetControllerVariableOn } from "../../state/controllerVariables";
import { PlayCurveSetOn, StopCurveSetOn, GetRangeDurationOn, GetCurveSetDurationOn } from "../../curve/curveSetOwner";
import { vec3, vec4, mat4, sph3, box3 } from "math";
import { EveObject } from "eve/object/EveObject";
import { GLESPerObjectDataEveSpaceObject } from "core/data";
import { Tw2AnimationController } from "core/model";
import { EveTurretSet, EveBanner, EvePlaneSet, EveSpriteSet, EveSpotlightSet, EveCurveLineSet } from "eve/item";
import { EveMeshOverlayEffect } from "eve/effect";
import { EveHazeSet, EveSpriteLineSet } from "unsupported/eve/item";
import { LodLevelPixels, CustomMaskBlendMode } from "constant/ccpwgl";
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

    /**
     * Custom mask blend mode, for the whole object, as the Carbon permutation
     * value - see {@link BLEND_MODES}.
     *
     * It belongs here rather than on each EveCustomMask because there is only
     * ever one of it: the GLES path has a single CustomMaskBlending register
     * shared by both masks, and the Carbon path a single BLEND_MODE
     * permutation on the effects. Holding a copy per mask meant two sources for
     * one value, and whichever mask was packed last silently won.
     * @type {String}
     */
    @meta.string
    blendMode = "BLEND_MODE_OVERLAY";

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

    @meta.vector3
    clipSphereCenter = vec3.create();

    @meta.float
    clipSphereFactor = 0;

    @meta.float
    clipSphereFactor2 = 0;

    @meta.float
    impactDataOffset = 0;

    @meta.float
    modelScale = 1;

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

    @meta.ui({ group: "Dirt" })
    @meta.float
    weeksSinceCleaned = 0;

    /**
     * Runtime animation controllers (attached by the space object factory)
     * @type {Array<Tr2Controller>}
     */
    controllers = [];

    // Sticky record of every controller variable set on this ship, mirroring
    // Carbon's `m_controllerVariables` (`EveEffectRoot2.cpp:882-890`). Replayed
    // onto effect children whose controllers link later.
    controllerVariables = new Map();

    /**
     * Embedder-set ship speed telemetry (world-velocity magnitude), backing the `ShipSpeed()`
     * controller-expression builtin. CarbonEngine caches this from the Destiny ball's velocity
     * every sync update (`m_speed = Length(GetWorldVelocity())`, `EveShip2.cpp:50-57`,
     * `TriFloat m_speed`, `EveShip2.h:66`); ccpwgl has no physics/ball layer, so derivation is
     * left entirely to the embedder (e.g. `ship.speed = |worldTransform delta| / dt` per frame,
     * or a value pushed straight from game state). Runtime-only: not persisted.
     * @type {Number}
     */

    @meta.ui({ group: "Speed", index: 2 })
    @meta.float
    speed = 0;

    /**
     * Embedder-set maximum ship speed, backing the `ShipMaxSpeed()` builtin. Used by expressions
     * that normalize `speed` into a 0..1 input (e.g. warp-state mixers).
     *
     * This is the hull's maximum speed WITHOUT a propulsion module, so `speed` is not bounded
     * by it: `speed / maxSpeed` reaches 1 at an unmodified hull's top speed and carries on to
     * roughly 2 with a propulsion module fitted, which is where expressions peak. Defaulting
     * maxSpeed to 1 and sweeping `speed` to 2 therefore exercises the whole domain.
     *
     * Both values stand in for the real ship's speed and max speed until an embedder supplies
     * them; these defaults give the correct normalised range in the meantime.
     * Runtime-only: not persisted.
     * @type {Number}
     */
    @meta.ui({ group: "Speed", index: 2 })
    @meta.float
    maxSpeed = 1;

    _enableCurves = false;
    _pixelSizeAcross = 0;

    _spriteScale = 1;
    _dirtyGeometry = true;
    _ellipsoidCenter = vec3.create();
    _ellipsoidRadii = vec3.create();
    _jointMatrices = null;
    _parentTransform = mat4.create();
    _perObjectData = new GLESPerObjectDataEveSpaceObject();
    _perObjectDataBagOfStuff = {};
    _customMaskBlending = vec4.create();
    _worldTransformLast = mat4.create();

    /**
     * Initializes the ship
     */
    Initialize()
    {
        this.InvalidateMeshData();
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

        // The booster set 2 has its own lod: the boosters, the trails and the
        // set's own visibility are three independent gates, and a trail can
        // keep the set on screen after the hull has left it.
        if (this.boosters && this.boosters.UpdateLod)
        {
            this.boosters.UpdateLod(frustum, this._lod);
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
     * Checks whether a mesh animation on the given mask/layer is currently playing.
     * Backs the `IsAnimationPlaying("<layer>")` expression used by controller state-machine
     * transitions (e.g. stances wait on `IsAnimationPlaying("TrackMaskStance")==0`). Without this,
     * the expression falls back to 0 and transition clips are skipped before they finish playing.
     * @param {String} [maskName=""]
     * @returns {Boolean}
     */
    IsAnimationPlaying(maskName = "")
    {
        return this.animation ? this.animation.IsMaskAnimationPlaying(maskName) : false;
    }

    /**
     * Backs the `ShipSpeed()` controller-expression builtin, resolved via
     * `context.owner.ShipSpeed()` (`state/expression/Tr2ExpressionProgram.js:701,779-781`).
     * See the `speed` field doc for the carbon reference and why ccpwgl leaves derivation to the
     * embedder.
     * @returns {Number}
     */
    ShipSpeed()
    {
        return this.speed;
    }

    /**
     * Backs the `ShipMaxSpeed()` controller-expression builtin, resolved via
     * `context.owner.ShipMaxSpeed()` (`state/expression/Tr2ExpressionProgram.js:702,779-781`).
     * @returns {Number}
     */
    ShipMaxSpeed()
    {
        return this.maxSpeed;
    }

    /**
     * Backs the `BoundingSphereRadius()` controller-expression builtin, resolved via
     * `context.owner.BoundingSphereRadius()` (`state/expression/Tr2ExpressionProgram.js:705`).
     * audioshipstandard's "Ship Size" machine buckets this into the emitter
     * prefix (ship_engine_XXS_ .. ship_engine_XXL_).
     * @returns {Number}
     */
    BoundingSphereRadius()
    {
        return this.GetRadius();
    }

    /**
     * Backs the `ShipBoosterIntensity()` controller-expression builtin, resolved via
     * `context.owner.ShipBoosterIntensity()` (`state/expression/Tr2ExpressionProgram.js:703`).
     *
     * Carbon averages every booster renderable's intensity into the ship data's
     * booster glow slot; ccpwgl's booster set carries no per-renderable intensity,
     * so `boosterGain` - the value that already occupies that same slot - stands in.
     * Only negatives clamp: the warp overlay states gate on values above one, so the
     * shader side's upper clamp must not apply here.
     * @returns {Number}
     */
    ShipBoosterIntensity()
    {
        if (!this.boosters) return 0;
        return this.boosterGain > 0 ? this.boosterGain : 0;
    }

    /**
     * Backs the `KillCount()` controller-expression builtin, resolved via
     * `context.owner.KillCount()` (`state/expression/Tr2ExpressionProgram.js:704`).
     * Carbon reads `EveShip2::GetKillCounterValue()`; ccpwgl already carries the
     * same number as the `killCount` field that drives kill-mark decals, so this
     * exposes that rather than introducing a second counter.
     * @returns {Number}
     */
    KillCount()
    {
        return this.killCount;
    }

    /**
     * Backs the `AnimationTime("<name>")` controller-expression builtin, resolved
     * via `context.owner.AnimationTime(name)`.
     * Carbon routes this through
     * `EveSpaceObject2::GetAnimationController()->FindAnimationDurationByName(name)`;
     * ccpwgl's animation controller answers the same question directly.
     * @param {String} [name]
     * @returns {Number} the animation's duration, or 0 when it is not loaded
     */
    AnimationTime(name)
    {
        return this.animation ? this.animation.FindAnimationDurationByName(name) : 0;
    }

    /**
     * Plays a named curve set on this ship and everything below it.
     *
     * Carbon `EveSpaceObject2::PlayCurveSet` (cpp:3385-3415): every match in the
     * object's own list, then recurse into children AND effect children.
     * `Tr2ActionPlayCurveSet` calls this on the controller's owner, so without
     * it a ship-level action could only ever find curve sets on the ship - and
     * the ones that drive VFX are on the effect children.
     *
     * @param {String} name
     * @param {String} [rangeName]
     * @returns {Boolean}
     */
    PlayCurveSet(name, rangeName)
    {
        return PlayCurveSetOn(this, name, rangeName, [ this.children, this.effectChildren ]);
    }

    /**
     * Stops a named curve set on this ship and everything below it.
     * Carbon `EveSpaceObject2::StopCurveSet`.
     * @param {String} name
     * @returns {Boolean}
     */
    StopCurveSet(name)
    {
        return StopCurveSetOn(this, name, [ this.children, this.effectChildren ]);
    }

    /**
     * Duration of a named RANGE of a named curve set, across this ship and
     * everything below it. Carbon `EveSpaceObject2::GetRangeDuration`
     * (cpp:3479-3503).
     *
     * Carbon makes this pure-virtual on `ITr2CurveSetOwner`, so a space object
     * cannot exist without it. ccpwgl had only `PlayCurveSet`/`StopCurveSet`
     * here, and the fallback path in `Tr2ActionPlayCurveSet` scans `curveSets`
     * without recursing - which a ship does not even have. Every hull-level
     * state machine therefore saw a duration of 0, which disarms the
     * `syncToRange` veto AND makes the `CurveSetTime("Set/Range")` expression
     * return 0, so a condition like `StateTime() > CurveSetTime(...)` was true
     * one frame after entry. That walked the whole state ring at a state per
     * frame, replaying a different range every frame, and no curve advanced.
     *
     * @param {String} setName
     * @param {String} rangeName
     * @returns {Number} seconds
     */
    GetRangeDuration(setName, rangeName)
    {
        return GetRangeDurationOn(this, setName, rangeName, [ this.children, this.effectChildren ]);
    }

    /**
     * Longest curve duration of a named curve set across this ship and everything
     * below it. Carbon `EveSpaceObject2::GetCurveSetDuration` (cpp:3451-3477).
     * @param {String} setName
     * @returns {Number} seconds
     */
    GetCurveSetDuration(setName)
    {
        return GetCurveSetDurationOn(this, setName, [ this.children, this.effectChildren ]);
    }

    /**
     * Sets a controller variable across this ship: every controller it owns, and
     * every effect child, recursively.
     *
     * Carbon's `EveEffectRoot2::SetControllerVariable` (cpp:880-899) does three
     * things and all three matter:
     *   - REMEMBERS the value in a name/value record;
     *   - sets it on every controller the object owns, not one chosen controller;
     *   - recurses into every effect child.
     * The record is what makes a late child work: Carbon replays it onto children
     * as they are attached (`EveSpaceObject2.cpp:325,375`), so a variable set
     * before a child's controller exists still reaches it. Without that, a hull
     * whose doors live on a child controller stops responding when the child
     * happens to load after the value was set.
     *
     * Before this, `Tr2ActionSetExternalControllerVariable` fell through to a raw
     * loop over `destination.controllers` - no record, no recursion, so it was
     * doing LESS than Carbon rather than more.
     *
     * @param {String} name
     * @param {Number} value
     */
    SetControllerVariable(name, value)
    {
        SetControllerVariableOn(this, name, value, this.effectChildren);
    }

    /**
     * Every controller variable set on this ship so far, for replaying onto a
     * child whose controllers link after the value was set.
     * @returns {Map<String, Number>}
     */
    GetControllerVariables()
    {
        return this.controllerVariables;
    }

    /**
     * Reads a controller variable owned by one of this ship's effect children,
     * for the `GetExternalControllerVariable(name, default)` expression builtin.
     *
     * Carbon's ITr2ControllerOwner contract (`Controllers/ITr2ControllerOwner.h:15-19`):
     * "external" means a controller hanging off the SAME owning node, matched by
     * variable name - not a scene lookup and not an object reference.
     * `EveSpaceObject2::GetControllerValueByName` (cpp:3797-3809) walks the effect
     * children and recurses into any that own controllers themselves; the sibling
     * walk over a node's own controllers belongs to the container
     * (`EveChildContainer.cpp:1077-1091`), which is why this one only recurses.
     *
     * Carbon's signature is `bool(name, float& out)`; JS returns the value, or
     * undefined when nothing owns that name, which is what the expression's
     * fallback argument keys off.
     *
     * @param {String} name
     * @returns {Number|undefined}
     */
    GetControllerValueByName(name)
    {
        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.GetControllerValueByName)
            {
                const value = child.GetControllerValueByName(name);
                if (value !== undefined) return value;
            }
        }
        return undefined;
    }

    /**
     * Gets the first authored locator set by name
     * @param {String} name
     * @returns {Array<EveLocatorSetItem>|null}
     * @private
     */
    _GetLocatorSetItems(name)
    {
        for (let i = 0; i < this.locatorSets.length; i++)
        {
            if (this.locatorSets[i]?.name === name) return this.locatorSets[i].locators;
        }
        return null;
    }

    /**
     * Gets an authored locator set by name.
     *
     * Carbon's `IEveSpaceObject2::GetLocatorsForSet`. This is the name the rest
     * of the engine calls - distribution placement generators ask a hull for the
     * set they place against (`primaryspotlight_01`, `primaryflare_01` and so
     * on), and Carbon's classes call it directly. It was private here as
     * `_GetLocatorSetItems` only because damage locators were the sole caller.
     *
     * @param {String} name
     * @returns {Array<EveLocatorSetItem>|null} null when the hull has no such set
     */
    GetLocatorsForSet(name)
    {
        return this._GetLocatorSetItems(name);
    }

    /**
     * Builds a locator transform directly from authored values so targeting
     * does not depend on view-dependent update order
     * @param {mat4} out
     * @param {EveLocatorSetItem} locator
     * @param {Boolean} inWorldSpace
     * @returns {mat4}
     * @private
     */
    _GetLocatorSetItemTransform(out, locator, inWorldSpace)
    {
        mat4.fromRotationTranslationScale(out, locator.rotation, locator.position, locator.scaling);
        if (locator._bone) mat4.multiply(out, locator._bone.offsetTransform, out);
        if (inWorldSpace)
        {
            this.GetWorldTransform(EveShip2.global.targetWorldTransform);
            mat4.multiply(out, EveShip2.global.targetWorldTransform, out);
        }
        return out;
    }

    /**
     * Gets a damage locator position for ITriTargetable consumers
     * @param {vec3} out
     * @param {Number} index
     * @param {Boolean} [inWorldSpace=true]
     * @returns {Boolean} true when the locator exists
     */
    GetDamageLocatorPosition(out, index, inWorldSpace = true)
    {
        const locators = this._GetLocatorSetItems("damage");
        if (!locators || !(index >= 0 && index < locators.length))
        {
            if (inWorldSpace) this.GetWorldTranslation(out);
            else vec3.set(out, 0, 0, 0);
            return false;
        }

        const transform = EveShip2.global.targetTransform;
        this._GetLocatorSetItemTransform(transform, locators[index], inWorldSpace);
        mat4.getTranslation(out, transform);
        return true;
    }

    /**
     * Gets a damage locator's +Y direction
     * @param {vec3} out
     * @param {Number} index
     * @param {Boolean} [inWorldSpace=true]
     * @returns {Boolean} true when the locator exists
     */
    GetDamageLocatorDirection(out, index, inWorldSpace = true)
    {
        const locators = this._GetLocatorSetItems("damage");
        if (!locators || !(index >= 0 && index < locators.length))
        {
            vec3.set(out, 0, 1, 0);
            return false;
        }

        const transform = EveShip2.global.targetTransform;
        this._GetLocatorSetItemTransform(transform, locators[index], inWorldSpace);
        vec3.set(out, transform[4], transform[5], transform[6]);
        vec3.normalize(out, out);
        return true;
    }

    /**
     * Gets the closest facing damage locator
     * @param {vec3} position world-space source position
     * @returns {Number}
     */
    GetClosestDamageLocatorIndex(position)
    {
        const locators = this._GetLocatorSetItems("damage");
        if (!locators) return 0;

        const g = EveShip2.global;
        this.GetWorldInverseTransform(g.targetInverse);
        vec3.transformMat4(g.targetSource, position, g.targetInverse);

        let closestIndex = -1;
        let closestDistance = Infinity;
        for (let i = 0; i < locators.length; i++)
        {
            this._GetLocatorSetItemTransform(g.targetTransform, locators[i], false);
            mat4.getTranslation(g.targetPosition, g.targetTransform);
            vec3.set(g.targetDirection, g.targetTransform[4], g.targetTransform[5], g.targetTransform[6]);
            if (!isLocatorFacing(g.targetDirection, g.targetSource)) continue;

            const distance = vec3.squaredDistance(g.targetPosition, g.targetSource);
            if (distance < closestDistance)
            {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        return closestIndex;
    }

    /**
     * Gets Carbon's randomized distance/direction-fit damage locator
     * @param {vec3} position world-space source position
     * @returns {Number}
     */
    GetGoodDamageLocatorIndex(position)
    {
        const locators = this._GetLocatorSetItems("damage");
        if (!locators) return 0;

        const g = EveShip2.global;
        this.GetWorldInverseTransform(g.targetInverse);
        vec3.transformMat4(g.targetSource, position, g.targetInverse);

        let minDistance = Infinity;
        let maxDistance = Number.MIN_VALUE;
        let bestDirectionFit = 0;

        for (let i = 0; i < locators.length; i++)
        {
            this._GetLocatorSetItemTransform(g.targetTransform, locators[i], false);
            mat4.getTranslation(g.targetPosition, g.targetTransform);
            vec3.set(g.targetDirection, g.targetTransform[4], g.targetTransform[5], g.targetTransform[6]);
            if (!isLocatorFacing(g.targetDirection, g.targetSource)) continue;

            vec3.subtract(g.targetOffset, g.targetPosition, g.targetSource);
            const distance = vec3.length(g.targetOffset);
            minDistance = Math.min(minDistance, distance);
            maxDistance = Math.max(maxDistance, distance);
            if (distance) vec3.scale(g.targetOffset, g.targetOffset, 1 / distance);
            bestDirectionFit = Math.max(bestDirectionFit, getDirectionFit(g.targetDirection, g.targetOffset));
        }

        const desiredFit = Math.random() * (0.25 - (1 - bestDirectionFit)) + 0.75;
        let bestFit = 1;
        let bestLocator = -1;
        for (let i = 0; i < locators.length; i++)
        {
            this._GetLocatorSetItemTransform(g.targetTransform, locators[i], false);
            mat4.getTranslation(g.targetPosition, g.targetTransform);
            vec3.set(g.targetDirection, g.targetTransform[4], g.targetTransform[5], g.targetTransform[6]);
            if (!isLocatorFacing(g.targetDirection, g.targetSource)) continue;

            vec3.subtract(g.targetOffset, g.targetPosition, g.targetSource);
            const distance = vec3.length(g.targetOffset);
            const range = maxDistance - minDistance;
            let scale = range > 0 ? 1 - (distance - minDistance) / range : 1;
            let value = 2 * scale - 1;
            value = value < 0 ? 1 - Math.sqrt(Math.abs(value)) : Math.sqrt(Math.abs(value)) + 1;
            value *= 0.5;
            if (distance) vec3.scale(g.targetOffset, g.targetOffset, 1 / distance);
            value *= getDirectionFit(g.targetDirection, g.targetOffset);
            const fit = Math.abs(value - desiredFit);
            if (fit < bestFit)
            {
                bestFit = fit;
                bestLocator = i;
            }
        }

        return bestLocator < 0 ? this.GetClosestDamageLocatorIndex(position) : bestLocator;
    }

    /**
     * Gets the model-scaled target radius
     * @returns {Number}
     */
    GetRadius()
    {
        return this.boundingSphereRadius * this.GetWorldMaxScale();
    }

    /**
     * Computes a miss point just outside the ship silhouette
     * @param {vec3} out
     * @param {vec3} hit
     * @param {vec3} source
     * @returns {vec3}
     */
    GetMissPosition(out, hit, source)
    {
        const g = EveShip2.global;
        this.GetWorldTranslation(out);
        if (this.boundingSphereRadius > 0 && hit && source)
        {
            vec3.subtract(g.targetOffset, hit, out);
            vec3.subtract(g.targetDirection, hit, source);
            const directionLength = vec3.length(g.targetDirection);
            if (directionLength) vec3.scale(g.targetDirection, g.targetDirection, 1 / directionLength);
            vec3.scaleAndAdd(g.targetOffset, g.targetOffset, g.targetDirection, -vec3.dot(g.targetDirection, g.targetOffset));
            const offsetLength = vec3.length(g.targetOffset);
            if (offsetLength) vec3.scale(g.targetOffset, g.targetOffset, 1 / offsetLength);
            vec3.scaleAndAdd(out, out, g.targetOffset, this.GetRadius() * 1.125);
        }
        return out;
    }

    /**
     * ccpwgl has no Carbon impact-overlay object, so damage locators are used
     * @returns {Number}
     */
    GetImpactConfiguration()
    {
        return 0;
    }

    HasImpactConfigurationShield()
    {
        return false;
    }

    /**
     * Resolves a damage-locator collision point
     * @param {vec3} out
     * @param {Number} locator
     * @param {vec3} _positionPrevious
     * @param {vec3} positionNow
     * @param {Number} epsilon squared collision distance
     * @returns {Boolean}
     */
    GetImpactPosition(out, locator, _positionPrevious, positionNow, epsilon)
    {
        this.GetDamageLocatorPosition(out, locator, true);
        return vec3.squaredDistance(positionNow, out) < Number(epsilon);
    }

    CreateImpact()
    {
        return -1;
    }

    UpdateImpact()
    {
        return false;
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

            this.boosters.Update(dt, this._worldTransform, {
                gain: Math.max(Math.min(this.visible.boosters ? this.boosterGain : 0, 1), 0)
            });

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
            // 4th arg: parent space object, so nested EveChildContainer controllers can resolve
            // ShipSpeed()/ShipMaxSpeed() against this ship (carbon parity: EveChildContainer.cpp:603).
            this.children[i].Update(dt, this._worldTransform, perObjectDataBagOfStuff, this);

            if (this.children[i]._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].Update(dt, this._worldTransform, perObjectDataBagOfStuff, this);

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
     * Marks stable mesh-derived shader data dirty.
     */
    InvalidateMeshData()
    {
        this._dirtyGeometry = true;
    }

    /**
     * Rebuilds stable mesh-derived shader data from the current geometry resource.
     * This intentionally does not use `OnRebuildBounds()`, which is a runtime
     * intersection/culling bounds path and may include attachments or children.
     * @param {Boolean} [force=false]
     * @returns {Boolean}
     */
    RebuildMeshData(force = false)
    {
        const
            mesh = this.mesh && this.mesh.IsGood() ? this.mesh : null,
            res = mesh ? mesh.geometryResource : null;

        if (!res)
        {
            this._dirtyGeometry = true;
            return false;
        }

        if (!force && !this._dirtyGeometry)
        {
            return true;
        }

        res.RebuildBounds();

        vec3.copy(this.boundingSphereCenter, res.boundsSpherePosition);
        this.boundingSphereRadius = res.boundsSphereRadius;

        const
            center = this._ellipsoidCenter,
            radii = this._ellipsoidRadii;

        if (this.shapeEllipsoidRadius[0] > 0)
        {
            vec3.copy(center, this.shapeEllipsoidCenter);
            vec3.copy(radii, this.shapeEllipsoidRadius);
        }
        else
        {
            const { maxBounds, minBounds } = res;
            vec3.subtract(center, maxBounds, minBounds);
            vec3.scale(center, center, 0.5 * 1.732050807);
            vec3.add(radii, maxBounds, minBounds);
            vec3.scale(radii, radii, 0.5);
        }

        this._dirtyGeometry = false;
        return true;
    }

    /**
     * Carbon's `g_secondaryLightingRadiusCutoffFactor`
     * (EveSpaceObject2.cpp:52). Scales this hull's bounding radius into the
     * cutoff radius below which a bounce source is too small to matter.
     * @type {Number}
     */
    static SECONDARY_LIGHTING_RADIUS_CUTOFF_FACTOR = 0.3;

    /**
     * Packed SH secondary-lighting coefficients for this hull, seven vec4s.
     * Zero until a scene with an `shLightingManager` updates them.
     * @type {Float32Array}
     */
    _shLightingCoefficients = new Float32Array(28);

    /**
     * Samples the scene's SH manager for this hull's secondary-lighting
     * coefficients, faded in across the low-detail threshold so a hull entering
     * that range does not pop.
     *
     * Mirrors `EveSpaceObject2::UpdateShLighting` (EveSpaceObject2.cpp:1398-1409).
     * The coefficients are cleared first, which is also what leaves the unwritten
     * tail zero on the L1 path.
     *
     * Carbon measures `m_estimatedPixelDiameterWithChildren`; ccpwgl tracks only
     * the hull's own `_pixelSizeAcross`, so a hull whose children extend well past
     * its bounding sphere fades in slightly later here than in the client.
     *
     * @param {Tr2ShLightingManager} manager
     * @param {EveSpaceScene} [scene] - supplies the detail thresholds
     * @returns {Boolean} whether coefficients were written
     */
    UpdateShLighting(manager, scene)
    {
        this._shLightingCoefficients.fill(0);

        const low = scene && scene.lowDetailThreshold !== undefined ? scene.lowDetailThreshold : 100;

        if (!(this._pixelSizeAcross > low) || !manager || typeof manager.GetLighting !== "function")
        {
            return false;
        }

        const
            medium = scene && scene.mediumDetailThreshold !== undefined ? scene.mediumDetailThreshold : 400,
            fadeRadius = (medium - low) * 0.25,
            intensity = Math.min(Math.max((this._pixelSizeAcross - low) / fadeRadius, 0), 1);

        vec3.set(
            EveObject.global.vec3_0,
            this._worldTransform[12],
            this._worldTransform[13],
            this._worldTransform[14]
        );

        manager.GetLighting(
            EveObject.global.vec3_0,
            intensity,
            this.boundingSphereRadius * EveShip2.SECONDARY_LIGHTING_RADIUS_CUTOFF_FACTOR,
            this._shLightingCoefficients
        );

        if (scene) scene._shLightingReceivers = (scene._shLightingReceivers || 0) + 1;
        return true;
    }

    /**
     * Drops this hull's secondary-lighting contribution back to nothing
     *
     * Mirrors `EveSpaceObject2::ClearShLighting` (EveSpaceObject2.cpp:1411-1414).
     */
    ClearShLighting()
    {
        this._shLightingCoefficients.fill(0);
    }

    /**
     * Gets a temporary semantic-ish bag of values used to build per-object data.
     * Values may be references to object/raw arrays; treat the bag as read-only.
     * @param {Object} [out]
     * @returns {Object}
     */
    /**
     * The object's custom mask blend mode, as the Carbon permutation value.
     * @returns {String}
     */
    GetBlendMode()
    {
        return this.blendMode;
    }

    /**
     * Sets the object's custom mask blend mode and applies it.
     *
     * Takes the ACTUAL permutation value - "BLEND_MODE_NESTED" - and nothing
     * else. Anything unrecognised throws.
     *
     * No normalising, no near-miss tolerance, no fallback. The bug this
     * replaces was exactly that: an unrecognised value quietly became OVERLAY,
     * so a wrong blend mode and a correct one looked identical and nothing
     * reported it. Callers holding another vocabulary - SKINR payloads, black
     * data, a UI label - translate before calling.
     * @param {String} value - e.g. "BLEND_MODE_SUBTRACT"
     * @throws {TypeError} on anything not in {@link BLEND_MODES}
     * @returns {EveShip2}
     */
    SetBlendMode(value)
    {
        if (!EveShip2.BLEND_MODES.includes(value))
        {
            throw new TypeError(
                `Invalid blend mode: ${JSON.stringify(value)}. `
                + `Expected one of: ${EveShip2.BLEND_MODES.join(", ")}`
            );
        }

        this.blendMode = value;

        // The masks still carry it for the GLES per-object register, which
        // EveCustomMask packs from a string property. They are followers now,
        // not sources - written here so the two paths cannot disagree.
        const name = value.replace("BLEND_MODE_", "").toLowerCase();
        for (let i = 0; i < this.customMasks.length; i++)
        {
            if (this.customMasks[i]) this.customMasks[i].blendMode = name;
        }

        this.UpdateBlendMode();
        return this;
    }

    /**
     * Applies the current blend mode to every effect declaring the BLEND_MODE
     * permutation.
     *
     * The Carbon path compiles blend mode in rather than reading a register, so
     * without this a dx11 scene never tracked it at all - only a UI setting the
     * option by hand did anything. SetEffectsOption is the graph-wide walk,
     * which already skips effects without the option and remembers it for ones
     * that have not loaded yet.
     * @returns {Array} the effects whose option changed
     */
    UpdateBlendMode()
    {
        return this.SetEffectsOption("BLEND_MODE", this.blendMode);
    }

    /**
     * The values Carbon's BLEND_MODE axis declares, read from the shipped quad
     * packages. Note there are five: CustomMaskBlendMode carries nine, and the
     * other four have no permutation, so they cannot be expressed on dx11.
     * @type {Array<String>}
     */
    static BLEND_MODES = [
        "BLEND_MODE_OVERLAY",
        "BLEND_MODE_SUBTRACT",
        "BLEND_MODE_EXCLUSION",
        "BLEND_MODE_NESTED",
        "BLEND_MODE_NESTED_INVERTED"
    ];

    /**
     * The numeric value the GLES CustomMaskBlending register carries for a
     * permutation value. OVERLAY is Carbon's name for no blending, which the
     * shaders read as 0.
     * @param {String} value
     * @returns {Number}
     */
    static GetBlendModeValue(value)
    {
        const key = String(value).replace("BLEND_MODE_", "");
        return key === "OVERLAY" ? CustomMaskBlendMode.NONE : CustomMaskBlendMode[key] ?? CustomMaskBlendMode.NONE;
    }

    GetPerObjectDataBagOfStuff(out = {})
    {
        this.RebuildMeshData();

        delete out.shipData;
        delete out.clipData;
        delete out.clipData1;
        delete out.miscData;
        delete out.clipRadius2Sq;
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
            dirtLevel = Math.max(EveShip2.getDirtLevelFromWeeks(this.weeksSinceCleaned, !this.visible.dirt), 0),
            modelScale = this.modelScale === 0 ? 1 : this.modelScale,
            clipOffset = vec3.length(this.clipSphereCenter),
            normalizedBoundingRadius = this.boundingSphereRadius / modelScale + clipOffset,
            insideSpherePercentage = normalizedBoundingRadius > 0
                ? Math.min(1, clipOffset / normalizedBoundingRadius)
                : 0,
            clipScale = normalizedBoundingRadius * (1 + insideSpherePercentage),
            dissolveRadius = this.clipSphereFactor * clipScale,
            dissolveRadius2 = this.clipSphereFactor2 * clipScale,
            clipRadiusSq = Math.sign(dissolveRadius) * dissolveRadius * dissolveRadius,
            clipRadius2Sq = Math.sign(dissolveRadius2) * dissolveRadius2 * dissolveRadius2,
            clipCenter = [
                this.boundingSphereCenter[0] + this.clipSphereCenter[0],
                this.boundingSphereCenter[1] + this.clipSphereCenter[1],
                this.boundingSphereCenter[2] + this.clipSphereCenter[2],
                clipRadiusSq
            ];

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
        out.shipData = [ boosterGain, activationStrength, dirtLevel, this.boundingSphereRadius ];
        out.clipData = clipCenter;
        out.clipSphereCenter = clipCenter;
        out.clipSphereSignedRadiusSq = clipRadiusSq;
        out.miscData = [ clipRadius2Sq, this.impactDataOffset, this.clipSphereFactor2, this.clipSphereFactor ];
        out.sphericalHarmonicLighting = this._shLightingCoefficients;
        out.clipRadius2Sq = clipRadius2Sq;
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
            this.RebuildMeshData();

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

        // Packed here, after the masks, because the blend mode belongs to the
        // object and not to either mask. CustomMaskBlending is a SINGLE
        // register shared by both, so letting each mask write it made the last
        // one packed the winner - two masks with different modes meant one of
        // them silently decided for the pair.
        //
        // .x is the blend mode, .y the swapped flag; .zw are unused.
        //
        // Swapped stays on the masks and is aggregated here. It is per mask,
        // and it is NOT in Carbon yet - it is intended to become a permutation
        // there, like blend mode did, once that can be added upstream. So this
        // lane is a ccpwgl-only stand-in: do not treat it as the Carbon shape,
        // and note one lane cannot express a per-mask flag for two masks.
        const blending = this._customMaskBlending;
        blending[0] = EveShip2.GetBlendModeValue(this.blendMode);
        blending[1] = this.customMasks.some(mask => mask && mask.customMasksSwapped) ? 1 : 0;
        blending[2] = 0;
        blending[3] = 0;
        customMaskBagOfStuff.customMaskBlending = blending;

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

        for (let i = 0; i < this.locatorSets.length; i++)
        {
            this.locatorSets[i].UpdateViewDependentData(this._worldTransform, bones);
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

    static global = {
        ...EveObject.global,
        targetTransform: mat4.create(),
        targetWorldTransform: mat4.create(),
        targetInverse: mat4.create(),
        targetSource: vec3.create(),
        targetPosition: vec3.create(),
        targetDirection: vec3.create(),
        targetOffset: vec3.create()
    };

}


function isLocatorFacing(locatorDirection, sourcePosition)
{
    const moved = EveShip2.global.targetOffset;
    vec3.subtract(moved, sourcePosition, locatorDirection);
    return vec3.squaredLength(moved) < vec3.squaredLength(sourcePosition);
}


function getDirectionFit(a, b)
{
    const direction = -vec3.dot(a, b);
    return direction < 0
        ? (1 - Math.sqrt(Math.abs(direction))) * 0.5
        : (Math.sqrt(Math.abs(direction)) + 1) * 0.5;
}
