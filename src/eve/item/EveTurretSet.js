import { meta } from "utils";
import { tw2, device } from "global";
import { vec3, vec4, quat, mat4 } from "math";
import {
    Tw2PerObjectData,
    Tw2VertexElement,
    Tw2AnimationController,
    Tw2ForwardingRenderBatch
} from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";


@meta.type("EveTurretSetItem")
export class EveTurretSetItem extends EveObjectSetItem
{

    @meta.string
    locatorName = null;

    @meta.boolean
    updateFromLocator = false;

    @meta.boolean
    canFireWhenHidden = false;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();


    _bone = null;
    _localTransform = mat4.create();
    _localRotation = quat.create();


    /**
     * Fires on initialization
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
        this.UpdateTransforms();
    }

    /**
     * Updates the turret's transforms
     */
    UpdateTransforms()
    {
        mat4.fromRotationTranslation(this._localTransform, this.rotation, this.position);

        if (this._bone)
        {
            mat4.multiply(this._localTransform, this._bone.offsetTransform, this._localTransform);
            mat4.getRotation(this._localRotation, this._localTransform);
        }
        else
        {
            quat.copy(this._localRotation, this.rotation);
        }
    }

}


@meta.type("EveTurretSet", true)
@meta.stage(1)
export class EveTurretSet extends EveObjectSet
{

    @meta.string
    name = "";

    @meta.notImplemented
    @meta.float
    bottomClipHeight = 0;

    @meta.vector4
    boundingSphere = vec4.create();

    @meta.notImplemented
    @meta.boolean
    chooseRandomLocator = false;

    @meta.notImplemented
    @meta.uint
    cyclingFireGroupCount = 0;

    @meta.path
    firingEffectResPath = "";

    @meta.path
    geometryResPath = "";

    @meta.notImplemented
    @meta.float
    impactSize = 0;

    @meta.notImplemented
    @meta.boolean
    laserMissBehaviour = false;

    @meta.string
    locatorName = "";

    @meta.notImplemented
    @meta.uint
    maxCyclingFirePos = 0;

    @meta.notImplemented
    @meta.boolean
    projectileMissBehaviour = false;

    @meta.notImplemented
    @meta.float
    sysBoneHeight = 0;

    @meta.notImplemented
    @meta.float
    sysBonePitch01Factor = 0;

    @meta.notImplemented
    @meta.float
    sysBonePitch02Factor = 0;

    @meta.notImplemented
    @meta.float
    sysBonePitchFactor = 0;

    @meta.notImplemented
    @meta.float
    sysBonePitchMax = 0;

    @meta.notImplemented
    @meta.float
    sysBonePitchMin = 0;

    @meta.notImplemented
    @meta.float
    sysBonePitchOffset = 0;

    @meta.struct("Tw2Effect")
    turretEffect = null;

    @meta.notImplemented
    @meta.boolean
    updatePitchPose = false;

    @meta.notImplemented
    @meta.boolean
    useDynamicBounds = false;

    @meta.notImplemented
    @meta.boolean
    useRandomFiringDelay = false;

    @meta.struct()
    firingEffect = null;

    @meta.struct("Tw2GeometryResource")
    @meta.todo("Make private")
    geometryResource = null;

    @meta.plain
    visible = {
        turrets: true,
        firingEffects: true
    };


    _activeAnimation = new Tw2AnimationController();
    _activeTurret = -1;
    _currentCyclingFiresPos = 0;
    _fireCallback = null;
    _fireCallbackPending = false;
    _hasCyclingFiringPos = false;
    _inactiveAnimation = new Tw2AnimationController();
    _locatorDirty = true;
    _parentTransform = mat4.create();
    _perObjectDataActive = Tw2PerObjectData.from(EveTurretSet.perObjectData);
    _perObjectDataInactive = Tw2PerObjectData.from(EveTurretSet.perObjectData);
    _state = EveTurretSet.State.IDLE;
    _targetPosition = vec3.create();
    _recheckTimeLeft = 0;


    /**
     * Alias for this.items
     * @returns {Array}
     */
    @meta.todo("Update parent class and replace with direct value")
    get turrets()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set turrets(arr)
    {
        this.items = arr;
    }

    /**
     * Initializes the Turret Set
     */
    Initialize()
    {
        if (this.turretEffect && this.geometryResPath !== "")
        {
            this.geometryResource = tw2.GetResource(this.geometryResPath, res => this.OnResPrepared(res));
            this._activeAnimation.SetGeometryResource(this.geometryResource);
            this._inactiveAnimation.SetGeometryResource(this.geometryResource);
        }

        if (this.firingEffectResPath !== "")
        {
            tw2.Fetch(this.firingEffectResPath).then(object => this.firingEffect = object);
        }

        this.Rebuild();
    }

    /**
     * Initializes turret set's firing effect
     */
    InitializeFiringEffect()
    {
        if (!this.firingEffect) return;

        if (this.geometryResource && this.geometryResource.models.length)
        {
            const model = this.geometryResource.models[0];
            for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
            {
                this.firingEffect.SetMuzzleBoneID(i, model.FindBoneByName(EveTurretSet.positionBoneSkeletonNames[i]));
            }
        }
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.turretEffect) this.turretEffect.GetResources(out);
        if (this.firingEffect) this.firingEffect.GetResources(out);
        if (this.geometryResource && !out.includes(this.geometryResource))
        {
            out.push(this.geometryResource);
        }
        return out;
    }

    /**
     * Sets a callback which is called when the turret set fires
     * TODO: Replace with events
     * @param {Function} func
     */
    OnTurretFired(func)
    {
        this._fireCallback = func;
    }

    /**
     * Sets the target position
     * @param {vec3} v
     */
    SetTargetPosition(v)
    {
        vec3.copy(this._targetPosition, v);
    }

    /**
     * Helper function for finding out what turret should be firing
     * @returns {Number}
     */
    GetClosestTurret()
    {
        let closestTurret = -1,
            closestAngle = -2;

        const
            g = EveTurretSet.global,
            nrmToTarget = g.vec3_0,
            nrmUp = g.vec4_0,
            turretPosition = g.vec4_1;

        for (let i = 0; i < this.items.length; ++i)
        {
            const item = this.items[i];
            if (!item.display && !item.canFireWhenHidden) continue;

            turretPosition[0] = item._localTransform[12];
            turretPosition[1] = item._localTransform[13];
            turretPosition[2] = item._localTransform[14];
            turretPosition[3] = 1;
            vec4.transformMat4(turretPosition, turretPosition, this._parentTransform);
            vec3.subtract(nrmToTarget, this._targetPosition, turretPosition);
            vec3.normalize(nrmToTarget, nrmToTarget);
            vec4.set(nrmUp, 0, 1, 0, 0);
            vec4.transformMat4(nrmUp, nrmUp, item._localTransform);
            vec4.transformMat4(nrmUp, nrmUp, this._parentTransform);
            const angle = vec3.dot(nrmUp, nrmToTarget);
            if (angle > closestAngle)
            {
                closestTurret = this.items.indexOf(item);
                closestAngle = angle;
            }
        }

        return closestTurret;
    }

    /**
     * Animation helper function for deactivating a turret set
     */
    EnterStateDeactive()
    {
        if (this._state === EveTurretSet.State.INACTIVE || this._state === EveTurretSet.State.PACKING) return;

        if (this.turretEffect)
        {
            this._activeAnimation.StopAllAnimations();
            this._inactiveAnimation.StopAllAnimations();

            this._activeAnimation.PlayAnimation("Pack", false, () =>
            {
                this._state = EveTurretSet.State.INACTIVE;
                this._activeAnimation.PlayAnimation("Inactive", true);
            });

            this._inactiveAnimation.PlayAnimation("Pack", false, () =>
            {
                this._state = EveTurretSet.State.INACTIVE;
                this._inactiveAnimation.PlayAnimation("Inactive", true);
            });

            this._state = EveTurretSet.State.PACKING;
        }
        else
        {
            this._state = EveTurretSet.State.INACTIVE;
        }

        this._activeTurret = -1;
        this.DoStopFiring();
    }

    /**
     * Animation helper function for putting a turret set into idle state
     */
    EnterStateIdle()
    {
        if (this._state === EveTurretSet.State.IDLE || this._state === EveTurretSet.State.UNPACKING) return;

        if (this.turretEffect)
        {
            this._activeAnimation.StopAllAnimations();
            this._inactiveAnimation.StopAllAnimations();

            if (this._state === EveTurretSet.State.FIRING)
            {
                this._activeAnimation.PlayAnimation("Active", true);
                this._inactiveAnimation.PlayAnimation("Active", true);
            }
            else
            {
                this._activeAnimation.PlayAnimation("Deploy", false, () =>
                {
                    this._state = EveTurretSet.State.IDLE;
                    this._activeAnimation.PlayAnimation("Active", true);
                });

                this._inactiveAnimation.PlayAnimation("Deploy", false, () =>
                {
                    this._state = EveTurretSet.State.IDLE;
                    this._inactiveAnimation.PlayAnimation("Active", true);
                });
            }

            this._state = EveTurretSet.State.UNPACKING;
        }
        else
        {
            this._state = EveTurretSet.State.IDLE;
        }

        this._activeTurret = -1;
        this.DoStopFiring();
    }

    /**
     * Animation helper function for putting a turret set into a firing state
     */
    EnterStateFiring()
    {
        if (!this.turretEffect || this._state === EveTurretSet.State.FIRING)
        {
            this.DoStartFiring();
            if (this.turretEffect)
            {
                this._activeAnimation.PlayAnimation("Fire", false, () =>
                {
                    this._activeAnimation.PlayAnimation("Active", true);
                });
            }
            return;
        }

        this._activeAnimation.StopAllAnimations();
        this._inactiveAnimation.StopAllAnimations();
        if (this._state === EveTurretSet.State.INACTIVE)
        {
            this._activeAnimation.PlayAnimation("Deploy", false, () =>
            {
                this.DoStartFiring();
                this._activeAnimation.PlayAnimation("Fire", false, () =>
                {
                    this._activeAnimation.PlayAnimation("Active", true);
                });
            });

            this._inactiveAnimation.PlayAnimation("Deploy", false, () =>
            {
                this._inactiveAnimation.PlayAnimation("Active", true);
            });
            this._state = EveTurretSet.State.UNPACKING;
        }
        else
        {
            this.DoStartFiring();
            this._activeAnimation.PlayAnimation("Fire", false, () =>
            {
                this._activeAnimation.PlayAnimation("Active", true);
            });

            this._inactiveAnimation.PlayAnimation("Active", true);
        }
    }

    /**
     * Rebuilds the turret sets cached data
     */
    OnResPrepared(res)
    {
        this.geometryResource = res;

        const
            instancedElement = Tw2VertexElement.from({
                usage: "TEXCOORD",
                usageIndex: 1,
                elements: 2
            }),
            meshes = this.geometryResource.meshes,
            active = this._activeAnimation,
            inactive = this._inactiveAnimation;

        for (let i = 0; i < meshes.length; ++i)
        {
            meshes[i].declaration.elements.push(instancedElement);
            meshes[i].declaration.RebuildHash();
        }

        switch (this._state)
        {
            case EveTurretSet.State.INACTIVE:
                active.PlayAnimation("Inactive", true);
                inactive.PlayAnimation("Inactive", true);
                break;

            case EveTurretSet.State.IDLE:
                active.PlayAnimation("Active", true);
                inactive.PlayAnimation("Active", true);
                break;

            case EveTurretSet.State.FIRING:
                active.PlayAnimation("Fire", false, () => active.PlayAnimation("Active", true));
                inactive.PlayAnimation("Active", true);
                break;

            case EveTurretSet.State.PACKING:
                this.EnterStateIdle();
                break;

            case EveTurretSet.State.UNPACKING:
                this.EnterStateDeactive();
                break;
        }
        //return true;
    }

    /**
     * Finds a turret item by name
     * @param {String} name
     * @returns {?EveTurretSetItem}
     */
    FindItemByLocatorName(name)
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].locatorName === name)
            {
                return this.items[i];
            }
        }
        return null;
    }

    /**
     * Updates the turret set's items that were created from locators
     * - Turrets without locator names are ignored
     * @param {Array<EveLocator2>} locators
     */
    UpdateItemsFromLocators(locators)
    {
        const
            g = EveTurretSet.global,
            toRemove = Array.from(this.items),
            norm = g.mat4_0;

        for (let i = 0; i < locators.length; i++)
        {
            const { name, transform, bone = null } = locators[i];

            let item = this.FindItemByLocatorName(name);
            if (!item)
            {
                item = this.CreateItem({
                    name: name,
                    locatorName: name,
                    updateFromLocator: true,
                });
            }
            else
            {
                toRemove.splice(toRemove.indexOf(item), 1);
            }

            if (item.updateFromLocator)
            {
                item._bone = bone;
                mat4.copy(norm, transform);
                vec3.normalize(norm.subarray(0, 3), norm.subarray(0, 3));
                vec3.normalize(norm.subarray(4, 7), norm.subarray(4, 7));
                vec3.normalize(norm.subarray(8, 11), norm.subarray(8, 11));
                mat4.getRotation(item.rotation, norm);
                mat4.getTranslation(item.position, norm);
                item.UpdateValues();
            }
        }

        for (let i = 0; i < toRemove.length; i++)
        {
            if (toRemove[i].locatorName)
            {
                this.RemoveItem(toRemove[i]);
                i--;
            }
        }

        this.RebuildItemsFromLocators();
        // TODO: Leave this for next frame?
        if (this._dirty) this.Rebuild();
    }

    /**
     * Rebuilds the turret set's items from it's parent's locators
     */
    RebuildItemsFromLocators()
    {
        this._locatorDirty = true;
    }

    /**
     * Updates view dependent data
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        mat4.copy(this._parentTransform, parentTransform);

        if (this.firingEffect)
        {
            this.firingEffect.UpdateViewDependentData(parentTransform);
        }
    }

    /**
     * Rebuilds the turret set
     * Todo: Move all rebuild methods here
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        this.RebuildItems(opt);
        this._dirty = false;
        super.Rebuild(opt);
    }

    /**
     * Per frame update
     * @param {Number} dt - Delta Time
     */
    Update(dt)
    {
        super.Update(dt);

        if (this.turretEffect)
        {
            this._activeAnimation.Update(dt);
            this._inactiveAnimation.Update(dt);
        }

        if (this.firingEffect && this._visibleItems.length)
        {
            if (this._activeTurret !== -1)
            {
                if (this.firingEffect.isLoopFiring)
                {
                    if (this._state === EveTurretSet.State.FIRING)
                    {
                        this._recheckTimeLeft -= dt;
                        if (this._recheckTimeLeft <= 0)
                        {
                            this.DoStartFiring();
                        }
                    }
                }

                const activeTurret = this.items[this._activeTurret];

                if (this._activeAnimation.models.length)
                {
                    const bones = this._activeAnimation.models[0].bonesByName;
                    for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        const
                            transform = bones[EveTurretSet.positionBoneSkeletonNames[i]].worldTransform,
                            out = this.firingEffect.GetMuzzleTransform(i);

                        mat4.multiply(out, activeTurret._localTransform, transform);
                        mat4.multiply(out, this._parentTransform, out);
                    }
                }
                else
                {
                    for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        mat4.multiply(this.firingEffect.GetMuzzleTransform(i), this._parentTransform, activeTurret._localTransform);
                    }
                }

                if (this._fireCallbackPending)
                {
                    if (this._fireCallback)
                    {
                        const transforms = [];
                        for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                        {
                            transforms.push(this.firingEffect.GetMuzzleTransform(i));
                        }
                        this._fireCallback(this, transforms, activeTurret);
                    }
                    this._fireCallbackPending = false;

                    this.EmitEvent("fired", { turretSet: this, turret: activeTurret });
                }
            }

            this.firingEffect.SetEndPosition(this._targetPosition);
            this.firingEffect.Update(dt);
        }
    }

    /**
     * Gets turret set render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Boolean} [showFiringEffect]
     */
    GetBatches(mode, accumulator, perObjectData, showFiringEffect)
    {
        if (!this.turretEffect || !this.geometryResource || !this.display || !this._visibleItems.length) return;

        if (mode === device.RM_OPAQUE && this.visible.turrets)
        {
            const transforms = this._inactiveAnimation.GetBoneMatrices(0);
            if (transforms.length !== 0)
            {
                this.UpdatePerObjectData(this._perObjectDataInactive.vs, transforms);
                this._perObjectDataInactive.ps = perObjectData.ps;

                const batch = new Tw2ForwardingRenderBatch();
                batch.renderMode = mode;
                batch.renderActive = false;
                batch.perObjectData = this._perObjectDataInactive;
                batch.geometryProvider = this;
                accumulator.Commit(batch);

                if (this._state === EveTurretSet.State.FIRING)
                {
                    const transforms = this._activeAnimation.GetBoneMatrices(0);
                    if (transforms.length !== 0)
                    {
                        this.UpdatePerObjectData(this._perObjectDataActive.vs, transforms, true);
                        this._perObjectDataActive.ps = perObjectData.ps;

                        const batch = new Tw2ForwardingRenderBatch();
                        batch.renderActive = true;
                        batch.perObjectData = this._perObjectDataActive;
                        batch.geometryProvider = this;
                        accumulator.Commit(batch);
                    }
                }
            }
        }

        if (showFiringEffect && this.firingEffect && this.visible.firingEffects)
        {
            this.firingEffect.GetBatches(mode, accumulator, perObjectData);
        }
    }

    /**
     * Gets turret firing effect batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetFiringEffectBatches(mode, accumulator, perObjectData)
    {
        if (this.firingEffect && this.display && this._visibleItems.length && this.visible.firingEffects)
        {
            this.firingEffect.GetBatches(mode, accumulator, perObjectData);
        }
    }

    /**
     * Renders the turret set
     * @param batch
     * @param {String} technique - technique name
     * @returns {Boolean}
     */
    Render(batch, technique)
    {
        if (!this.turretEffect || !this.turretEffect.IsGood() || !this._visibleItems.length) return false;

        let index = 0;
        const customSetter = function(el)
        {
            device.gl.disableVertexAttribArray(el.location);
            device.gl.vertexAttrib2f(el.location, index, index);
        };

        for (let i = 0; i < this.geometryResource.meshes.length; ++i)
        {
            const
                decl = this.geometryResource.meshes[i].declaration,
                found = decl.FindUsage(Tw2VertexElement.Type.TEXCOORD, 1);

            if (found)
            {
                found.customSetter = customSetter;
            }
            else
            {
                tw2.Debug({
                    name: "EveTurretSet",
                    message: `Could not find usage TEXCOORD usage 1`
                });
            }
        }

        let rendered = 0;
        for (; index < this.items.length; ++index)
        {
            if (this.items[index].display)
            {
                const isActive = this._state === EveTurretSet.State.FIRING && index === this._activeTurret;
                if (batch.renderActive === isActive)
                {
                    this.geometryResource.RenderAreas(0, 0, 1, this.turretEffect, technique);
                    rendered++;
                }
            }
        }

        return !!rendered;
    }

    /**
     * Updates per object data
     * @param {Tw2RawData} perObjectData
     * @param transforms
     * @param {Boolean} [skipBoneCalculations]
     */
    UpdatePerObjectData(perObjectData, transforms, skipBoneCalculations)
    {
        mat4.transpose(perObjectData.Get("shipMatrix"), this._parentTransform);
        const transformCount = transforms.length / 12;
        perObjectData.Get("turretSetData")[0] = transformCount;
        perObjectData.Get("baseCutoffData")[0] = this.bottomClipHeight;

        const
            translation = perObjectData.Get("turretTranslation"),
            rotation = perObjectData.Get("turretRotation"),
            pose = perObjectData.Get("turretPoseTransAndRot");

        for (let i = 0; i < this._visibleItems.length; ++i)
        {
            const item = this._visibleItems[i];

            for (let j = 0; j < transformCount; ++j)
            {
                pose[(i * transformCount + j) * 2 * 4] = transforms[j * 12 + 3];
                pose[(i * transformCount + j) * 2 * 4 + 1] = transforms[j * 12 + 7];
                pose[(i * transformCount + j) * 2 * 4 + 2] = transforms[j * 12 + 11];
                pose[(i * transformCount + j) * 2 * 4 + 3] = 1;
                EveTurretSet.mat3x4toquat(transforms, j, pose, (i * transformCount + j) * 2 + 1);
            }

            if (item._bone && !skipBoneCalculations)
            {
                item.UpdateTransforms();
            }

            translation[i * 4] = item._localTransform[12];
            translation[i * 4 + 1] = item._localTransform[13];
            translation[i * 4 + 2] = item._localTransform[14];
            translation[i * 4 + 3] = 1;

            rotation[i * 4] = item.rotation[0];
            rotation[i * 4 + 1] = item.rotation[1];
            rotation[i * 4 + 2] = item.rotation[2];
            rotation[i * 4 + 3] = item.rotation[3];
        }
    }

    /**
     * Animation helper function for turret firing
     */
    DoStartFiring()
    {
        if (this._hasCyclingFiringPos)
        {
            this._currentCyclingFiresPos = 1 - this._currentCyclingFiresPos;
        }

        if (this.firingEffect)
        {
            this.firingEffect.PrepareFiring(0, this._hasCyclingFiringPos ? this._currentCyclingFiresPos : -1);
        }

        this._activeTurret = this.GetClosestTurret();
        this._state = EveTurretSet.State.FIRING;
        this._recheckTimeLeft = 2;

        this._fireCallbackPending = true;
    }

    /**
     * Animation helper function for stopping a turret firing
     */
    DoStopFiring()
    {
        if (this.firingEffect)
        {
            this.firingEffect.StopFiring();
        }
    }

    /**
     * The eve turret set's item constructor
     * @type {EveTurretSetItem}
     */
    static Item = EveTurretSetItem;

    /**
     * Turret states
     * @type {{INACTIVE: number, IDLE: number, FIRING: number, PACKING: number, UNPACKING: number}}
     */
    static State = {
        INACTIVE: 0,
        IDLE: 1,
        FIRING: 2,
        PACKING: 2,
        UNPACKING: 4
    };

    /**
     * World turret bone names
     * @type {String[]}
     */
    static worldNames = [
        "turretWorld0",
        "turretWorld1",
        "turretWorld2"
    ];

    /**
     * Bone Skeleton Names
     * @type {String[]}
     */
    static positionBoneSkeletonNames = [
        "Pos_Fire01",
        "Pos_Fire02",
        "Pos_Fire03",
        "Pos_Fire04",
        "Pos_Fire05", // Still valid?
        "Pos_Fire06", // Still valid?
        "Pos_Fire07", // Still valid?
        "Pos_Fire08"  // Still valid?
    ];

    /**
     * Per object data
     * @type {{vs: *[]}}
     */
    static perObjectData = {
        vs: [
            [ "baseCutoffData", 4 ],
            [ "turretSetData", 4 ],
            [ "shipMatrix", 16 ],
            [ "turretTranslation", 4 * 24 ],
            [ "turretRotation", 4 * 24 ],
            [ "turretPoseTransAndRot", 2 * 4 * 72 ]
        ]
    };

    /**
     * mat3x4 to quat
     */
    static mat3x4toquat = (function()
    {
        let m, q;

        return function(mm, index, out, outIndex)
        {
            if (!m)
            {
                m = mat4.create();
                q = quat.create();
            }

            index *= 12;
            outIndex *= 4;

            m[0] = mm[index];
            m[1] = mm[index + 4];
            m[2] = mm[index + 8];
            m[3] = 0;
            m[4] = mm[index + 1];
            m[5] = mm[index + 5];
            m[6] = mm[index + 9];
            m[7] = 0;
            m[8] = mm[index + 2];
            m[9] = mm[index + 6];
            m[10] = mm[index + 10];
            m[11] = 0;
            m[12] = mm[index + 3];
            m[13] = mm[index + 7];
            m[14] = mm[index + 11];
            m[15] = 1;

            mat4.getRotation(q, m);
            out[outIndex] = q[0];
            out[outIndex + 1] = q[1];
            out[outIndex + 2] = q[2];
            out[outIndex + 3] = q[3];
        };
    })();

}

