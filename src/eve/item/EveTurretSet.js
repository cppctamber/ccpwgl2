import { meta } from "utils";
import { tw2, device } from "global";
import { vec3, vec4, quat, mat4, box3 } from "math";
import {
    GLESPerObjectDataEveSpaceObject,
    Tw2PerObjectData,
    Tw2VertexElement,
    Tw2AnimationController,
    Tw2ForwardingRenderBatch
} from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";
import { EveTurretTarget } from "../EveTurretTarget";
import { AudEventKey } from "../../unsupported/curve/curve/AudEventCurve";


/**
 * Temporary class for audio key
 * Probably should be an audio curve with one key
 */
class AudEvent
{
    static blackStruct(reader)
    {
        return AudEventKey.from({
            value: reader.ReadU16(),
            time: reader.ReadF32()
        });
    }
}

/**
 * Todo: update with bone offset?
 */
@meta.type("EveTurretSetItem")
@meta.define({
    wgl: "EveTurretSetItem",
    ccp: true
})
export class EveTurretSetItem extends EveObjectSetItem
{

    @meta.string
    locatorName = null;

    @meta.boolean
    updateFromLocator = false;

    @meta.boolean
    canFireWhenHidden = false;

    @meta.translation
    position = vec3.create();

    @meta.rotation
    rotation = quat.create();

    _bone = null;
    _isClosest = false;
    _localTransform = mat4.create();
    _localRotation = quat.create();

    /**
     * Checks if the item is skinned
     * @returns {boolean}
     */
    get isSkinned()
    {
        return this._bone !== null;
    }

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
    OnValueChanged(opt)
    {
        this._dirty = true;
        this.UpdateTransforms();
        if (this._parent)
        {
            this._parent.OnItemModified(this, opt);
        }
    }

    /**
     * Updates the turret's transforms
     */
    UpdateTransforms()
    {
        if (this._bone)
        {
            mat4.getRotation(this.rotation, this._bone.worldTransform);
            mat4.getTranslation(this.position, this._bone.worldTransform);
        }

        mat4.fromRotationTranslation(this._localTransform, this.rotation, this.position);
        quat.copy(this._localRotation, this.rotation);
    }

    /**
     * Gets the item's local transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        return mat4.copy(m, this._localTransform);
    }

    /**
     * Gets the item's bounding box
     * @param {box3} out
     * @returns {box3} out
     */
    GetBoundingBox(out)
    {
        return box3.fromTransform(out, this._localTransform);
    }

}


@meta.type("EveTurretSet", true)
@meta.define({
    wgl: "EveTurretSet",
    ccp: true
})
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

    @meta.boolean
    chooseRandomLocator = true;

    @meta.uint
    cyclingFireGroupCount = 1;

    @meta.path
    firingEffectResPath = "";

    @meta.path
    geometryResPath = "";

    @meta.struct(AudEvent)
    idleToTargetingMovementAudioEvent = null;

    @meta.uint
    impactBehaviour = 0;

    @meta.float
    impactSize = 0;

    @meta.boolean
    laserMissBehaviour = false;

    @meta.string
    locatorName = "";

    @meta.uint
    maxCyclingFirePos = 1;

    @meta.notImplemented
    @meta.struct()
    turretMovementObserver = null;

    @meta.boolean
    projectileMissBehaviour = false;

    @meta.float
    sysBoneHeight = 1;

    @meta.float
    sysBonePitch01Offset = 0;

    @meta.float
    sysBonePitch01Factor = 1;

    @meta.float
    sysBonePitch02Offset = 0;

    @meta.float
    sysBonePitch02Factor = 1;

    @meta.float
    sysBonePitch03Offset = 0;

    @meta.float
    sysBonePitch03Factor = 1;

    @meta.float
    sysBonePitchFactor = 1;

    @meta.float
    sysBonePitchMax = 90;

    @meta.float
    sysBonePitchMin = 0;

    @meta.float
    sysBonePitchOffset = 0;

    @meta.struct("Tw2Effect")
    turretEffect = null;

    @meta.boolean
    updatePitchPose = false;

    @meta.notImplemented
    @meta.boolean
    useDynamicBounds = false;

    @meta.boolean
    useRandomFiringDelay = true;

    @meta.struct()
    firingEffect = null;

    @meta.struct("EveTurretTarget")
    target = new EveTurretTarget();

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
    _inactiveAnimation = new Tw2AnimationController();
    _locatorDirty = true;
    _parentTransform = mat4.create();
    _parentPerObjectData = new GLESPerObjectDataEveSpaceObject();
    _perObjectDataActive = Tw2PerObjectData.from(EveTurretSet.perObjectData);
    _perObjectDataInactive = Tw2PerObjectData.from(EveTurretSet.perObjectData);
    _pendingFiring = false;
    _state = EveTurretSet.State.IDLE;
    _targetPosition = vec3.create();
    _trackingInfluence = 0;
    _trackingScratch = null;
    _recheckTimeLeft = 0;
    _randomFiringDelay = 0;


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
        if (!this.target) this.target = new EveTurretTarget();
        this.target.SetBehaviour(
            this.laserMissBehaviour,
            this.projectileMissBehaviour,
            this.impactSize,
            this.impactBehaviour
        );

        if (this.turretEffect && this.geometryResPath !== "")
        {
            this.geometryResource = tw2.GetResource(this.geometryResPath, res => this.OnResPrepared(res));
            this._activeAnimation.SetGeometryResource(this.geometryResource);
            this._inactiveAnimation.SetGeometryResource(this.geometryResource);
        }

        if (this.firingEffectResPath !== "")
        {
            tw2.Fetch(this.firingEffectResPath).then(object =>
            {
                this.firingEffect = object;
                this.SetTargetScale();
            });
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
        if (!this.target) this.target = new EveTurretTarget();
        this.target.SetTargetPosition(v);
        vec3.copy(this._targetPosition, v);
    }

    /**
     * Sets a live targetable scene object
     * @param {Object|null} object
     * @returns {Boolean}
     */
    SetTargetObject(object)
    {
        if (!this.target) this.target = new EveTurretTarget();
        const accepted = this.target.SetTargetable(object);
        if (accepted) this.SetTargetScale();
        return accepted;
    }

    /**
     * Gets the live target object
     * @returns {Object|null}
     */
    GetTargetObject()
    {
        return this.target?.GetTargetable() ?? null;
    }

    SetTargetScale()
    {
        this.firingEffect?.SetScaleByRadius?.(this.target?.GetRadius?.() ?? -1);
    }

    SetShotMissed(missed, timestamp)
    {
        this.target?.SetShotMissed(missed, timestamp);
    }

    GetLastShotTime()
    {
        return this.target?.GetLastShotTime() ?? 0;
    }

    MissQueueSize()
    {
        return this.target?.MissQueueSize() ?? 0;
    }

    GetShotTimeVariance()
    {
        return 0.6;
    }

    /**
     * Gets a system bone's configured pitch factor
     * @param {Number} systemBone
     * @returns {Number}
     */
    GetBonePitchFactor(systemBone)
    {
        switch (systemBone)
        {
            case EveTurretSet.SystemBone.PITCH:
            case EveTurretSet.SystemBone.PITCH1:
            case EveTurretSet.SystemBone.PITCH2:
                return this.sysBonePitchFactor;

            case EveTurretSet.SystemBone.SCALED_PITCH01:
                return this.sysBonePitch01Factor;

            case EveTurretSet.SystemBone.SCALED_PITCH02:
                return this.sysBonePitch02Factor;

            case EveTurretSet.SystemBone.SCALED_PITCH03:
                return this.sysBonePitch03Factor;

            default:
                return 1;
        }
    }

    /**
     * Gets a system bone's configured pitch offset in degrees
     * @param {Number} systemBone
     * @returns {Number}
     */
    GetBonePitchOffset(systemBone)
    {
        switch (systemBone)
        {
            case EveTurretSet.SystemBone.PITCH:
            case EveTurretSet.SystemBone.PITCH1:
            case EveTurretSet.SystemBone.PITCH2:
                return this.sysBonePitchOffset;

            case EveTurretSet.SystemBone.SCALED_PITCH01:
                return this.sysBonePitch01Offset;

            case EveTurretSet.SystemBone.SCALED_PITCH02:
                return this.sysBonePitch02Offset;

            case EveTurretSet.SystemBone.SCALED_PITCH03:
                return this.sysBonePitch03Offset;

            default:
                return 0;
        }
    }

    /**
     * Applies Carbon's target tracking rule to a system bone's sampled local transform
     * @param {Number} systemBone
     * @param {vec3} target - Target position in turret space
     * @param {mat4} localTransform - Sampled bone transform to modify
     * @param {?mat4} worldTransform - Current bone world transform for pitch-pose correction
     * @param {Number} influence
     * @param {*} scratch
     */
    ModifySystemBoneTransform(systemBone, target, localTransform, worldTransform, influence, scratch)
    {
        switch (systemBone)
        {
            case EveTurretSet.SystemBone.ROTATION:
            case EveTurretSet.SystemBone.ROTATION01:
            case EveTurretSet.SystemBone.ROTATION02:
                mat4.rotateY(localTransform, localTransform, Math.atan2(target[0], target[2]) * influence);
                break;

            case EveTurretSet.SystemBone.COUNTER_ROTATION:
                mat4.rotateY(localTransform, localTransform, -Math.atan2(target[0], target[2]) * influence);
                break;

            case EveTurretSet.SystemBone.PITCH:
            case EveTurretSet.SystemBone.PITCH1:
            case EveTurretSet.SystemBone.PITCH2:
                this.ApplyPitchBoneTransform(
                    systemBone,
                    target,
                    localTransform,
                    worldTransform,
                    this.sysBonePitchMin * EveTurretSet.DEG_TO_RAD,
                    this.sysBonePitchMax * EveTurretSet.DEG_TO_RAD,
                    influence,
                    scratch
                );
                break;

            case EveTurretSet.SystemBone.SCALED_HEIGHT:
            {
                const direction = scratch.targetDirection;
                vec3.normalize(direction, target);
                localTransform[13] += Math.max(0, Math.min(1, direction[1])) * this.sysBoneHeight * influence;
                break;
            }

            case EveTurretSet.SystemBone.SCALED_PITCH01:
            case EveTurretSet.SystemBone.SCALED_PITCH02:
            case EveTurretSet.SystemBone.SCALED_PITCH03:
            case EveTurretSet.SystemBone.SCALED_PITCH04:
            case EveTurretSet.SystemBone.SCALED_PITCH05:
            case EveTurretSet.SystemBone.SCALED_PITCH06:
                this.ApplyPitchBoneTransform(
                    systemBone,
                    target,
                    localTransform,
                    null,
                    0,
                    this.sysBonePitchMax * EveTurretSet.DEG_TO_RAD,
                    influence,
                    scratch
                );
                break;
        }
    }

    /**
     * Applies Carbon's pitch calculation to a sampled local bone transform
     * @param {Number} systemBone
     * @param {vec3} target
     * @param {mat4} localTransform
     * @param {?mat4} worldTransform
     * @param {Number} minPitch
     * @param {Number} maxPitch
     * @param {Number} influence
     * @param {*} scratch
     */
    ApplyPitchBoneTransform(systemBone, target, localTransform, worldTransform, minPitch, maxPitch, influence, scratch)
    {
        const
            bonePosition = scratch.bonePosition,
            relativeTarget = scratch.relativeTarget,
            direction = scratch.targetDirection;

        if (worldTransform)
        {
            mat4.getTranslation(bonePosition, worldTransform);
        }
        else
        {
            vec3.set(bonePosition, 0, 0, 0);
        }

        vec3.subtract(relativeTarget, target, bonePosition);
        if (vec3.squaredLength(relativeTarget) <= EveTurretSet.TRACKING_EPSILON) return;

        vec3.normalize(direction, relativeTarget);
        let radians = Math.asin(Math.max(-1, Math.min(1, direction[1])));

        if (worldTransform)
        {
            const boneLength = vec3.length(bonePosition);
            if (boneLength > EveTurretSet.TRACKING_EPSILON)
            {
                vec3.scale(scratch.boneDirection, bonePosition, 1 / boneLength);
                if (vec3.dot(scratch.boneDirection, target) < boneLength)
                {
                    radians = Math.sign(relativeTarget[1]) * Math.PI - radians;
                }
            }
        }

        let alpha = Math.max(minPitch, Math.min(maxPitch, radians));
        alpha = this.GetBonePitchFactor(systemBone) * alpha;
        alpha += this.GetBonePitchOffset(systemBone) * EveTurretSet.DEG_TO_RAD;
        mat4.rotateX(localTransform, localTransform, -alpha * influence);
    }

    /**
     * Computes model-space bone transforms from sampled local transforms
     * @param {Array<Tw2Bone>} bones
     * @param {Array<mat4>} localTransforms
     * @param {Array<mat4>} worldTransforms
     */
    ComputeTrackingWorldTransforms(bones, localTransforms, worldTransforms)
    {
        for (let i = 0; i < bones.length; ++i)
        {
            const parentIndex = bones[i].boneRes.parentIndex;
            if (parentIndex !== -1)
            {
                mat4.multiply(worldTransforms[i], worldTransforms[parentIndex], localTransforms[i]);
            }
            else
            {
                mat4.copy(worldTransforms[i], localTransforms[i]);
            }
        }
    }

    /**
     * Builds a target-tracked pose for one turret without mutating its shared animation controller
     * @param {Tw2AnimationController} controller
     * @param {EveTurretSetItem} item
     * @param {?Float32Array} [baseTransforms]
     * @returns {?Object}
     */
    UpdateTrackingPose(controller, item, baseTransforms)
    {
        if (!controller || !controller.models.length || !item) return null;

        const
            model = controller.models[0],
            bones = model.bones;
        if (!bones.length) return null;

        if (!this._trackingScratch)
        {
            this._trackingScratch = {
                localTransforms: [],
                worldTransforms: [],
                bindingTransforms: new Float32Array(0),
                turretWorldTransform: mat4.create(),
                inverseTurretWorldTransform: mat4.create(),
                offsetTransform: mat4.create(),
                targetPosition: vec3.create(),
                targetDirection: vec3.create(),
                bonePosition: vec3.create(),
                boneDirection: vec3.create(),
                relativeTarget: vec3.create()
            };
        }

        const scratch = this._trackingScratch;
        while (scratch.localTransforms.length < bones.length)
        {
            scratch.localTransforms.push(mat4.create());
            scratch.worldTransforms.push(mat4.create());
        }

        for (let i = 0; i < bones.length; ++i)
        {
            mat4.copy(scratch.localTransforms[i], bones[i].localTransform);
        }

        const influence = this._trackingInfluence;
        mat4.multiply(scratch.turretWorldTransform, this._parentTransform, item._localTransform);
        const inverse = mat4.invert(scratch.inverseTurretWorldTransform, scratch.turretWorldTransform);

        if (influence && inverse)
        {
            vec3.transformMat4(scratch.targetPosition, this._targetPosition, inverse);
            if (vec3.squaredLength(scratch.targetPosition) > EveTurretSet.TRACKING_EPSILON)
            {
                for (let systemBone = EveTurretSet.SystemBone.ROTATION; systemBone < EveTurretSet.SystemBone.MAX; ++systemBone)
                {
                    const bone = model.bonesByName[EveTurretSet.systemBoneSkeletonNames[systemBone]];
                    if (!bone) continue;

                    const boneIndex = bone._skeletonIndex !== -1 ? bone._skeletonIndex : bones.indexOf(bone);
                    if (boneIndex === -1) continue;

                    let worldTransform = null;
                    if (this.updatePitchPose &&
                        systemBone >= EveTurretSet.SystemBone.PITCH &&
                        systemBone <= EveTurretSet.SystemBone.PITCH2)
                    {
                        this.ComputeTrackingWorldTransforms(bones, scratch.localTransforms, scratch.worldTransforms);
                        worldTransform = scratch.worldTransforms[boneIndex];
                    }

                    this.ModifySystemBoneTransform(
                        systemBone,
                        scratch.targetPosition,
                        scratch.localTransforms[boneIndex],
                        worldTransform,
                        influence,
                        scratch
                    );
                }
            }
        }

        this.ComputeTrackingWorldTransforms(bones, scratch.localTransforms, scratch.worldTransforms);

        if (baseTransforms)
        {
            if (scratch.bindingTransforms.length !== baseTransforms.length)
            {
                scratch.bindingTransforms = new Float32Array(baseTransforms.length);
            }
            scratch.bindingTransforms.set(baseTransforms);

            for (let i = 0; i < bones.length; ++i)
            {
                const bone = bones[i];
                mat4.multiply(scratch.offsetTransform, scratch.worldTransforms[i], bone.boneRes.worldTransformInv);

                for (let j = 0; j < bone.bindingArrays.length; ++j)
                {
                    const binding = bone.bindingArrays[j];
                    if (binding.array !== baseTransforms) continue;
                    EveTurretSet.mat4ToMat3x4(scratch.offsetTransform, scratch.bindingTransforms, binding.offset);
                }
            }
        }

        return scratch;
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

        for (let i = 0; i < this.items.length; i++)
        {
            this.items[i]._isClosest = i === closestTurret;
        }

        return closestTurret;
    }

    /**
     * Animation helper function for deactivating a turret set
     */
    EnterStateDeactive()
    {
        if (this._state === EveTurretSet.State.INACTIVE || this._state === EveTurretSet.State.PACKING) return;
        this._pendingFiring = false;

        if (this.turretEffect)
        {
            let percent = 0;

            if (this._state === EveTurretSet.State.UNPACKING)
            {
                const deployAnimation = this._activeAnimation.GetAnimation("Deploy");
                percent = deployAnimation.percent;
            }

            this._activeAnimation.StopAllAnimations();
            this._inactiveAnimation.StopAllAnimations();

            this._activeAnimation.PlayAnimation("Pack", {
                cycle: false,
                percent,
                callback: () =>
                {
                    this._state = EveTurretSet.State.INACTIVE;
                    this._activeAnimation.PlayAnimation("Inactive", { cycle: true });
                }
            });

            this._inactiveAnimation.PlayAnimation("Pack", {
                cycle: false,
                percent,
                callback: () =>
                {
                    this._state = EveTurretSet.State.INACTIVE;
                    this._inactiveAnimation.PlayAnimation("Inactive", { cycle: true });
                }
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
        if (this._state === EveTurretSet.State.IDLE)
        {
            this._pendingFiring = false;
            return;
        }

        if (this._state === EveTurretSet.State.UNPACKING)
        {
            this._pendingFiring = false;
            this._activeTurret = -1;
            this.DoStopFiring();
            return;
        }

        this._pendingFiring = false;

        if (this.turretEffect)
        {
            let percent = 0;

            if (this._state === EveTurretSet.State.PACKING)
            {
                const packAnimation = this._activeAnimation.GetAnimation("Pack");
                percent = packAnimation.percent;
            }

            this._activeAnimation.StopAllAnimations();
            this._inactiveAnimation.StopAllAnimations();

            if (this._state === EveTurretSet.State.FIRING || this._state === EveTurretSet.State.TARGETING)
            {
                this._activeAnimation.PlayAnimation("Active", { cycle: true });
                this._inactiveAnimation.PlayAnimation("Active", { cycle: true });
                this._state = EveTurretSet.State.IDLE;
            }
            else
            {
                this._activeAnimation.PlayAnimation("Deploy", {
                    cycle: false,
                    percent,
                    callback: () =>
                    {
                        console.log("Active turret active...");
                        this._state = EveTurretSet.State.IDLE;
                        this._activeAnimation.PlayAnimation("Active", { cycle: true });
                    }
                });

                this._inactiveAnimation.PlayAnimation("Deploy", {
                    cycle: false,
                    percent,
                    callback: () =>
                    {
                        console.log("Inactive turret active...");
                        this._state = EveTurretSet.State.IDLE;
                        this._inactiveAnimation.PlayAnimation("Active", { cycle: true });
                    }
                });

                this._state = EveTurretSet.State.UNPACKING;
            }
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
        if (!this.turretEffect)
        {
            this.DoStartFiring();
            return;
        }

        if (this._state === EveTurretSet.State.FIRING)
        {
            this.DoStartFiring();
            this.PlayFireAnimation();
            return;
        }

        if (this._pendingFiring || this._state === EveTurretSet.State.TARGETING) return;

        this._activeAnimation.StopAllAnimations();
        this._inactiveAnimation.StopAllAnimations();
        if (this._state === EveTurretSet.State.INACTIVE)
        {
            this._pendingFiring = true;
            this._activeAnimation.PlayAnimation("Deploy", {
                cycle: false,
                callback: () =>
                {
                    if (this._pendingFiring)
                    {
                        this.BeginStateTargeting(false);
                    }
                    else
                    {
                        this._state = EveTurretSet.State.IDLE;
                        this._activeAnimation.PlayAnimation("Active", { cycle: true });
                    }
                }
            });

            this._inactiveAnimation.PlayAnimation("Deploy", {
                cycle: false,
                callback: () =>
                {
                    this._inactiveAnimation.PlayAnimation("Active", { cycle: true });
                }
            });
            this._state = EveTurretSet.State.UNPACKING;
        }
        else
        {
            this.BeginStateTargeting();
        }
    }

    /**
     * Begins the initial aiming phase before the first shot
     * @param {Boolean} [activateInactive=true] whether to start the inactive loop immediately
     */
    BeginStateTargeting(activateInactive = true)
    {
        this._pendingFiring = true;
        this._state = EveTurretSet.State.TARGETING;
        this._activeTurret = -1;
        this._activeAnimation.PlayAnimation("Active", { cycle: true });
        if (activateInactive)
        {
            this._inactiveAnimation.PlayAnimation("Active", { cycle: true });
        }
        this.StartPendingFiring();
    }

    /**
     * Starts a pending first shot once the tracking pose has reached its target
     * @returns {Boolean} true when firing started
     */
    StartPendingFiring()
    {
        if (!this._pendingFiring ||
            this._state !== EveTurretSet.State.TARGETING ||
            this._trackingInfluence < 1)
        {
            return false;
        }

        this._pendingFiring = false;
        this.DoStartFiring();
        this.PlayFireAnimation();
        return true;
    }

    /**
     * Plays the active turret's firing clip and returns it to the active loop
     */
    PlayFireAnimation()
    {
        this._activeAnimation.PlayAnimation("Fire", {
            cycle: false,
            callback: () =>
            {
                this._activeAnimation.PlayAnimation("Active", { cycle: true });
            }
        });
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
                active.PlayAnimation("Inactive", { cycle: true });
                inactive.PlayAnimation("Inactive", { cycle: true });
                break;

            case EveTurretSet.State.IDLE:
                active.PlayAnimation("Active", { cycle: true });
                inactive.PlayAnimation("Active", { cycle: true });
                break;

            case EveTurretSet.State.FIRING:
                active.PlayAnimation("Fire", {
                    cycle: false,
                    callback: () =>
                    {
                        active.PlayAnimation("Active", { cycle: true });
                    }
                });
                inactive.PlayAnimation("Active", { cycle: true });
                break;

            case EveTurretSet.State.TARGETING:
                active.PlayAnimation("Active", { cycle: true });
                inactive.PlayAnimation("Active", { cycle: true });
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
     * @param {Array<Tw2Bone>} bones
     */
    UpdateViewDependentData(parentTransform, bones)
    {
        if (this.firingEffect)
        {
            this.firingEffect.UpdateViewDependentData(parentTransform);
        }

        super.UpdateViewDependentData(parentTransform, bones);
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

        const source = EveTurretSet.global.vec3_1;
        vec3.set(source, this._parentTransform[12], this._parentTransform[13], this._parentTransform[14]);
        if (this.target)
        {
            this.target.Update(dt, source);
            this.target.GetTrackingPosition(this._targetPosition);
        }

        this.UpdateTrackingInfluence(dt);
        this.StartPendingFiring();

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
                    const
                        model = this._activeAnimation.models[0],
                        bones = model.bonesByName,
                        trackedPose = this.UpdateTrackingPose(this._activeAnimation, activeTurret);

                    for (let i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        const
                            bone = bones[EveTurretSet.positionBoneSkeletonNames[i]],
                            out = this.firingEffect.GetMuzzleTransform(i);

                        mat4.copy(out, activeTurret._localTransform);
                        if (bone)
                        {
                            const transform = trackedPose ?
                                trackedPose.worldTransforms[bone._skeletonIndex] :
                                bone.worldTransform;
                            mat4.multiply(out, out, transform);
                        }
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

            this.firingEffect.SetEndPosition(this.target?.GetTargetPosition() ?? this._targetPosition);
            this.firingEffect.SetDisplayDestObject?.(this.target?.ShowDestObject() ?? true);
            this.firingEffect.Update(dt);
        }
    }

    /**
     * Fades Carbon's tracking influence between the sampled idle pose and target tracking
     * @param {Number} dt - Delta time in seconds
     * @returns {Number} current tracking influence
     */
    UpdateTrackingInfluence(dt)
    {
        const target = this._state === EveTurretSet.State.FIRING ||
            this._state === EveTurretSet.State.TARGETING ? 1 : 0;
        if (!(dt > 0) || this._trackingInfluence === target) return this._trackingInfluence;

        const step = dt / EveTurretSet.TRACKING_FADE_TIME;
        if (this._trackingInfluence < target)
        {
            this._trackingInfluence = Math.min(target, this._trackingInfluence + step);
        }
        else
        {
            this._trackingInfluence = Math.max(target, this._trackingInfluence - step);
        }
        return this._trackingInfluence;
    }

    /**
     * Gets parent per object data
     * @param {*} parentData
     * @returns {Tw2PerObjectData|null}
     */
    GetParentPerObjectData(parentData)
    {
        if (!parentData) return null;
        if (parentData.vs && parentData.ps) return parentData;
        if (parentData.perObjectData) return parentData.perObjectData;
        if (parentData.legacyPerObjectData) return parentData.legacyPerObjectData;
        return GLESPerObjectDataEveSpaceObject.Pack(parentData, this._parentPerObjectData);
    }

    /**
     * Gets turret set render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Boolean} [showFiringEffect]
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData, showFiringEffect)
    {
        if (!this.turretEffect || !this.geometryResource || !this.display || !this._visibleItems.length) return false;
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (!perObjectData) return false;

        const
            c = accumulator.length,
            parentPerObjectData = this.GetParentPerObjectData(perObjectData);
        if (!parentPerObjectData) return false;

        if (mode === device.RM_OPAQUE && this.visible.turrets)
        {
            const transforms = this._inactiveAnimation.GetBoneMatrices(0);
            if (transforms.length !== 0)
            {
                this.UpdatePerObjectData(this._perObjectDataInactive.vs, transforms, false, this._inactiveAnimation);
                this._perObjectDataInactive.ps = parentPerObjectData.ps;

                const batch = new Tw2ForwardingRenderBatch();
                batch.renderMode = mode;
                batch.renderActive = false;
                batch.perObjectData = this._perObjectDataInactive;
                batch.geometryProvider = this;
                batch.effect = this.turretEffect;
                accumulator.Commit(batch);

                if (this._state === EveTurretSet.State.FIRING)
                {
                    const transforms = this._activeAnimation.GetBoneMatrices(0);
                    if (transforms.length !== 0)
                    {
                        this.UpdatePerObjectData(this._perObjectDataActive.vs, transforms, true, this._activeAnimation);
                        this._perObjectDataActive.ps = parentPerObjectData.ps;

                        const batch = new Tw2ForwardingRenderBatch();
                        batch.renderActive = true;
                        batch.perObjectData = this._perObjectDataActive;
                        batch.geometryProvider = this;
                        batch.effect = this.turretEffect;
                        accumulator.Commit(batch);
                    }
                }
            }
        }

        if (showFiringEffect && this.firingEffect && this.visible.firingEffects)
        {
            this.firingEffect.GetBatches(mode, accumulator, parentPerObjectData);
        }

        return accumulator.length !== c;
    }

    /**
     * Gets turret firing effect batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetFiringEffectBatches(mode, accumulator, perObjectData)
    {
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (this.firingEffect && this.display && this._visibleItems.length && this.visible.firingEffects)
        {
            this.firingEffect.GetBatches(mode, accumulator, this.GetParentPerObjectData(perObjectData));
            return true;
        }
        return false;
    }

    /**
     * Renders the turret set
     * @param batch
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if rendered
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
                    message: "Could not find usage TEXCOORD usage 1"
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
                    if (this.geometryResource.RenderAreas(0, 0, 1, this.turretEffect, technique))
                    {
                        rendered++;
                    }
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
     * @param {?Tw2AnimationController} [animationController]
     */
    UpdatePerObjectData(perObjectData, transforms, skipBoneCalculations, animationController)
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

            if (item._bone && !skipBoneCalculations)
            {
                item.UpdateTransforms();
            }

            const
                trackedPose = this.UpdateTrackingPose(animationController, item, transforms),
                itemTransforms = trackedPose ? trackedPose.bindingTransforms : transforms;

            for (let j = 0; j < transformCount; ++j)
            {
                pose[(i * transformCount + j) * 2 * 4] = itemTransforms[j * 12 + 3];
                pose[(i * transformCount + j) * 2 * 4 + 1] = itemTransforms[j * 12 + 7];
                pose[(i * transformCount + j) * 2 * 4 + 2] = itemTransforms[j * 12 + 11];
                pose[(i * transformCount + j) * 2 * 4 + 3] = 1;
                EveTurretSet.mat3x4toquat(itemTransforms, j, pose, (i * transformCount + j) * 2 + 1);
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
        if (this.maxCyclingFirePos > 1)
        {
            this._currentCyclingFiresPos += this.cyclingFireGroupCount;
            if (this._currentCyclingFiresPos >= this.maxCyclingFirePos * this.cyclingFireGroupCount)
            {
                this._currentCyclingFiresPos = 0;
            }
        }

        this._activeTurret = this.GetClosestTurret();

        const g = EveTurretSet.global;
        vec3.set(g.vec3_1, this._parentTransform[12], this._parentTransform[13], this._parentTransform[14]);
        let locator = -1;
        if (this._activeTurret !== -1 && this.target?.GetTargetable())
        {
            const item = this.items[this._activeTurret];
            vec3.set(g.vec3_2, item._localTransform[12], item._localTransform[13], item._localTransform[14]);
            vec3.transformMat4(g.vec3_2, g.vec3_2, this._parentTransform);
            locator = this.chooseRandomLocator
                ? this.target.FindRandomValidLocator(g.vec3_2, g.vec3_3)
                : this.target.FindClosestLocator(g.vec3_2, g.vec3_3);
        }

        this._randomFiringDelay = this.firingEffect && this.useRandomFiringDelay
            ? this.GetShotTimeVariance() * Math.random()
            : 0;

        if (this.firingEffect)
        {
            this.firingEffect.PrepareFiring(
                this._randomFiringDelay,
                this.maxCyclingFirePos > 1 ? this._currentCyclingFiresPos : -1,
                this.maxCyclingFirePos > 1 ? this.cyclingFireGroupCount : -1
            );
            this.firingEffect.SetImpactConfiguration?.(this.target?.GetImpactConfiguration?.() ?? 0);
        }

        const duration = Number(this.firingEffect?.GetFiringDuration?.() ?? 0);
        const peak = Number(this.firingEffect?.GetFiringPeakTime?.() ?? 0);
        this.target?.StartFireAtLocator(locator, this._randomFiringDelay + peak, Math.max(duration - peak, 0), g.vec3_1);

        this._state = EveTurretSet.State.FIRING;
        this._recheckTimeLeft = 2;

        this._fireCallbackPending = true;
    }

    /**
     * Animation helper function for stopping a turret firing
     */
    DoStopFiring()
    {
        this.target?.StopFireAtLocator();
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
     * @type {{INACTIVE: number, IDLE: number, FIRING: number, PACKING: number, UNPACKING: number, TARGETING: number}}
     */
    static State = {
        INACTIVE: 0,
        IDLE: 1,
        FIRING: 2,
        PACKING: 3,
        UNPACKING: 4,
        TARGETING: 5
    };

    /**
     * Carbon turret system bone identifiers
     * @type {Object}
     */
    static SystemBone = {
        INVALID: 0,
        ROTATION: 1,
        ROTATION01: 2,
        ROTATION02: 3,
        COUNTER_ROTATION: 4,
        PITCH: 5,
        PITCH1: 6,
        PITCH2: 7,
        SCALED_HEIGHT: 8,
        SCALED_PITCH01: 9,
        SCALED_PITCH02: 10,
        SCALED_PITCH03: 11,
        SCALED_PITCH04: 12,
        SCALED_PITCH05: 13,
        SCALED_PITCH06: 14,
        MAX: 15
    };

    /**
     * Carbon turret system bone names, indexed by SystemBone
     * @type {Array<?String>}
     */
    static systemBoneSkeletonNames = [
        null,
        "Sys_Rotation_Arm",
        "Sys_Rotation_Arm01",
        "Sys_Rotation_Arm02",
        "Sys_CounterRotation",
        "Sys_Pitch_Barrel",
        "Sys_Pitch_Barrel1",
        "Sys_Pitch_Barrel2",
        "Sys_Height",
        "Sys_Pitch_Arm01",
        "Sys_Pitch_Arm02",
        "Sys_Pitch_Arm03",
        "Sys_Pitch_Arm04",
        "Sys_Pitch_Arm05",
        "Sys_Pitch_Arm06"
    ];

    static DEG_TO_RAD = Math.PI / 180;
    static TRACKING_FADE_TIME = 1;
    static TRACKING_EPSILON = 1e-12;

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

    static global = {
        ...EveObjectSet.global,
        vec3_3: vec3.create()
    };

    /**
     * Writes a mat4 to the animation controller's row-packed mat3x4 layout
     * @param {mat4} transform
     * @param {Float32Array} out
     * @param {Number} offset
     */
    static mat4ToMat3x4(transform, out, offset)
    {
        out[offset] = transform[0];
        out[offset + 1] = transform[4];
        out[offset + 2] = transform[8];
        out[offset + 3] = transform[12];

        out[offset + 4] = transform[1];
        out[offset + 5] = transform[5];
        out[offset + 6] = transform[9];
        out[offset + 7] = transform[13];

        out[offset + 8] = transform[2];
        out[offset + 9] = transform[6];
        out[offset + 10] = transform[10];
        out[offset + 11] = transform[14];
    }

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

