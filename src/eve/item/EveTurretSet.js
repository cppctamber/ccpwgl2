import {vec3, vec4, quat, mat4, util, resMan, device} from "../../global";
import {
    Tw2PerObjectData,
    Tw2VertexElement,
    Tw2AnimationController,
    Tw2ForwardingRenderBatch
} from "../../core";
import {EveObjectSet, EveObjectSetItem} from "./EveObjectSet";


/**
 * EveTurretSetItem
 * @ccp N/A
 *
 * @property {?Tw2Bone} bone                - The bone the turret is on
 * @property {Boolean} isJoint              - Identifies if the turret is on a joint
 * @property {?String} locatorName          - The item's locator name
 * @property {Boolean} updateFromLocator    - Allows the turret to be updated from a locator's transforms
 * @property {Boolean} canFireWhenHidden    - Enables firing effects when hidden
 * @property {vec3} position                - The turret's position
 * @property {quat} rotation                - The turret's rotation
 * @property {mat4} _localTransform         - The turret's local transform
 * @property {quat} _localRotation          - the turret's local rotation
 */
export class EveTurretSetItem extends EveObjectSetItem
{

    // ccpwgl
    bone = null;
    locatorName = null;
    updateFromLocator = false;
    canFireWhenHidden = false;
    position = vec3.create();
    rotation = quat.create();
    _localTransform = mat4.create();
    _localRotation = quat.create();

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
        this.UpdateTransforms();
        if (this._parent)
        {
            this._parent.OnChildValueChanged(this);
        }
    }

    /**
     * Updates the turret's transforms
     */
    UpdateTransforms()
    {
        mat4.fromRotationTranslation(this._localTransform, this.rotation, this.position);

        if (this.bone)
        {
            mat4.multiply(this._localTransform, this.bone.offsetTransform, this._localTransform);
            mat4.getRotation(this._localRotation, this._localTransform);
        }
        else
        {
            quat.copy(this._localRotation, this.rotation);
        }
    }

    /**
     * Creates a turret item from an object
     * @param {*} [opt={}]
     * @returns {EveTurretSetItem}
     */
    static from(opt = {})
    {
        const item = new this();
        util.assignIfExists(item, opt, [
            "name", "display", "locatorName", "updateFromLocator", "position", "rotation", "bone", "canFireWhenHidden"
        ]);
        item.UpdateValues();
        return item;
    }

}

EveObjectSetItem.define(EveTurretSetItem, Type =>
{
    return {
        type: "EveTurretSetItem",
        props: {
            bone: Type.REF,
            locatorName: Type.STRING,
            updateFromLocator: Type.BOOLEAN,
            canFireWhenHidden: Type.BOOLEAN,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION
        }
    };
});


/**
 * EveTurretSet
 * Todo: Implement
 * @ccp EveTurretSet
 *
 * @property {Number} bottomClipHeight                  -
 * @property {vec4} boundingSphere                      -
 * @property {Boolean} chooseRandomLocator              -
 * @property {Number} cyclingFireGroupCount             -
 * @property {String} firingEffectResPath               -
 * @property {String} geometryResPath                   -
 * @property {Number} impactSize                        -
 * @property {Boolean} laserMissBehaviour               -
 * @property {String} locatorName                       -
 * @property {Number} maxCyclingFirePos                 -
 * @property {Boolean} projectileMissBehaviour          -
 * @property {Number} sysBoneHeight                     -
 * @property {Number} sysBonePitch01Factor              -
 * @property {Number} sysBonePitch02Factor              -
 * @property {Number} sysBonePitchFactor                -
 * @property {Number} sysBonePitchMax                   -
 * @property {Number} sysBonePitchMin                   -
 * @property {Number} sysBonePitchOffset                -
 * @property {Tr2Effect} turretEffect                   -
 * @property {Boolean} updatePitchPose                  -
 * @property {Boolean} useDynamicBounds                 -
 * @property {Boolean} useRandomFiringDelay             -
 * @property {Tw2AnimationController} _activeAnimation  -
 * @property {Tw2GeometryRes} geometryResource          -
 * @property {?Function} _fireCallback                   -
 * @property {?Function} _fireCallbackPending            -
 * @property {Boolean} _hasCyclingFiringPos              -
 * @property {Tw2AnimationController} _inactiveAnimation -
 * @property {mat4} _parentMatrix                        -
 * @property {Number} _state                             -
 * @property {vec3} _targetPosition                      -
 * @property {Object} visible                           -
 * @property {Boolean} visible.turrets                  -
 * @property {Boolean} visible.firingEffects            -
 * @property {Number} _activeTurret                     -
 * @property {Number} _currentCyclingFiresPos           -
 * @property {Boolean} _locatorDirty           -
 * @property {Tw2PerObjectData} _perObjectDataActive    -
 * @property {Tw2PerObjectData} _perObjectDataInactive  -
 * @property {Number} _recheckTimeLeft                  -
 */
export class EveTurretSet extends EveObjectSet
{
    // ccp
    bottomClipHeight = 0;
    boundingSphere = vec4.create();
    chooseRandomLocator = false;
    cyclingFireGroupCount = 0;
    firingEffectResPath = "";
    geometryResPath = "";
    impactSize = 0;
    laserMissBehaviour = false;
    locatorName = "";
    maxCyclingFirePos = 0;
    projectileMissBehaviour = false;
    sysBoneHeight = 0;
    sysBonePitch01Factor = 0;
    sysBonePitch02Factor = 0;
    sysBonePitchFactor = 0;
    sysBonePitchMax = 0;
    sysBonePitchMin = 0;
    sysBonePitchOffset = 0;
    turretEffect = null;
    updatePitchPose = false;
    useDynamicBounds = false;
    useRandomFiringDelay = false;

    // ccpwgl
    firingEffect = null;
    geometryResource = null;
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
    _parentMatrix = mat4.create();
    _perObjectDataActive = Tw2PerObjectData.from(EveTurretSet.perObjectData);
    _perObjectDataInactive = Tw2PerObjectData.from(EveTurretSet.perObjectData);
    _state = EveTurretSet.State.IDLE;
    _targetPosition = vec3.create();
    _recheckTimeLeft = 0;

    /**
     * Alias for this.items
     * @returns {Array}
     */
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
            this.geometryResource = resMan.GetResource(this.geometryResPath);
            this._activeAnimation.SetGeometryResource(this.geometryResource);
            this._inactiveAnimation.SetGeometryResource(this.geometryResource);
            if (this.geometryResource) this.geometryResource.RegisterNotification(this);
        }

        if (this.firingEffectResPath !== "")
        {
            resMan.GetObject(this.firingEffectResPath, object => this.firingEffect = object);
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
     * Sets a callback which is called when the turret set fires
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
            vec4.transformMat4(turretPosition, turretPosition, this._parentMatrix);
            vec3.subtract(nrmToTarget, this._targetPosition, turretPosition);
            vec3.normalize(nrmToTarget, nrmToTarget);
            vec4.set(nrmUp, 0, 1, 0, 0);
            vec4.transformMat4(nrmUp, nrmUp, item._localTransform);
            vec4.transformMat4(nrmUp, nrmUp, this._parentMatrix);
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
    RebuildCachedData()
    {
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
            const {name, transform, bone = null} = locators[i];

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
                item.bone = bone;
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

        this._locatorDirty = false;
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
     */
    UpdateViewDependentData()
    {
        if (this.firingEffect)
        {
            this.firingEffect.UpdateViewDependentData();
        }
    }

    /**
     * Rebuilds the turret set
     * Todo: Move all rebuild methods here
     */
    Rebuild()
    {
        this.RebuildItems();
        this._dirty = false;
    }

    /**
     * Per frame update
     * @param {Number} dt - Delta Time
     * @param {mat4} parentMatrix
     */
    Update(dt, parentMatrix)
    {
        if (this._dirty)
        {
            this.Rebuild();
        }

        if (this.turretEffect)
        {
            this._activeAnimation.Update(dt);
            this._inactiveAnimation.Update(dt);
        }

        mat4.copy(this._parentMatrix, parentMatrix);

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
                        mat4.multiply(out, out, parentMatrix);
                    }
                }
                else
                {
                    for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        mat4.multiply(this.firingEffect.GetMuzzleTransform(i), parentMatrix, activeTurret._localTransform);
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
     * @param {Boolean} [hideFiringEffect]
     */
    GetBatches(mode, accumulator, perObjectData, hideFiringEffect)
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

        this.GetFiringEffectBatches(mode, accumulator, perObjectData, hideFiringEffect);
    }

    /**
     * Gets turret firing effect batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Boolean} [hideFiringEffect]
     */
    GetFiringEffectBatches(mode, accumulator, perObjectData, hideFiringEffect)
    {
        if (this.firingEffect && this.display && this._visibleItems.length && this.visible.firingEffects && !hideFiringEffect)
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
        const customSetter = function (el)
        {
            device.gl.disableVertexAttribArray(el.location);
            device.gl.vertexAttrib2f(el.location, index, index);
        };

        for (let i = 0; i < this.geometryResource.meshes.length; ++i)
        {
            const decl = this.geometryResource.meshes[i].declaration;
            decl.FindUsage(Tw2VertexElement.Type.TEXCOORD, 1).customSetter = customSetter;
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
        mat4.transpose(perObjectData.Get("shipMatrix"), this._parentMatrix);
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

            if (item.bone && !skipBoneCalculations)
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
     * @returns {EveTurretSetItem} the closest turret
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

        if (this._fireCallback)
        {
            this._fireCallbackPending = true;
        }
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
            ["baseCutoffData", 4],
            ["turretSetData", 4],
            ["shipMatrix", 16],
            ["turretTranslation", 4 * 24],
            ["turretRotation", 4 * 24],
            ["turretPoseTransAndRot", 2 * 4 * 72]
        ]
    };

    /**
     * mat3x4 to quat
     */
    static mat3x4toquat = (function ()
    {
        let m, q;

        return function (mm, index, out, outIndex)
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

EveObjectSet.define(EveTurretSet, Type =>
{
    return {
        isStaging: true,
        type: "EveTurretSet",
        props: {
            bottomClipHeight: Type.NUMBER,
            boundingSphere: Type.VECTOR4,
            chooseRandomLocator: Type.BOOLEAN,
            cyclingFireGroupCount: Type.NUMBER,
            firingEffectResPath: Type.PATH,
            geometryResPath: Type.PATH,
            geometryResource: ["Tw2GeometryRes"],
            impactSize: Type.NUMBER,
            laserMissBehaviour: Type.BOOLEAN,
            locatorName: Type.STRING,
            maxCyclingFirePos: Type.NUMBER,
            projectileMissBehaviour: Type.BOOLEAN,
            sysBoneHeight: Type.NUMBER,
            sysBonePitch01Factor: Type.NUMBER,
            sysBonePitch02Factor: Type.NUMBER,
            sysBonePitchFactor: Type.NUMBER,
            sysBonePitchMax: Type.NUMBER,
            sysBonePitchMin: Type.NUMBER,
            sysBonePitchOffset: Type.NUMBER,
            turretEffect: ["Tr2Effect"],
            updatePitchPose: Type.BOOLEAN,
            useDynamicBounds: Type.BOOLEAN,
            useRandomFiringDelay: Type.BOOLEAN
        },
        notImplemented: [
            "bottomClipHeight",
            "chooseRandomLocator",
            "cyclingFireGroupCount",
            "impactSize",
            "laserMissBehaviour",
            "maxCyclingFirePos",
            "projectileMissBehaviour",
            "sysBoneHeight",
            "sysBonePitch01Factor",
            "sysBonePitch02Factor",
            "sysBonePitchFactor",
            "sysBonePitchMax",
            "sysBonePitchMin",
            "sysBonePitchOffset",
            "updatePitchPose",
            "useDynamicBounds",
            "useRandomFiringDelay"
        ]
    };
});

