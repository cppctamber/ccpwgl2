import { meta } from "utils";
import { curve, mat3, mat4, quat } from "math";
import {
    Tw2Animation,
    Tw2AnimationController,
    Tw2BoneBinding,
    Tw2GeometryMeshBinding,
    Tw2MeshBinding,
    Tw2Track,
    Tw2TrackGroup
} from "core";
import { Tr2InteriorBoneOffset } from "./Tr2InteriorBoneOffset";
import {
    composeInteriorAdditivePose,
    getInteriorMaskWeight,
    sampleInteriorDegreeOneCurve
} from "./Tr2InteriorAdditiveAnimation";


@meta.type("Tr2InteriorAnimationController")
@meta.ccp.define("Tr2GrannyAnimation")
export class Tr2InteriorAnimationController extends Tw2AnimationController
{

    @meta.struct("Tr2InteriorBoneOffset")
    boneOffset = new Tr2InteriorBoneOffset();

    @meta.boolean
    additiveBlendMode = false;

    @meta.plain
    layerWeights = {};

    @meta.plain
    additiveMasks = {};

    @meta.plain
    referenceClips = {};

    _rebuiltResources = new Set();

    /**
     * Replaces the controller's resources and resets interior rebuild state.
     * @param {*} geometryResource
     */
    SetGeometryResource(geometryResource)
    {
        super.SetGeometryResource(geometryResource);
        this._rebuiltResources.clear();
    }

    /**
     * Adds a resource and starts a new load-completion cycle.
     * @param {*} geometryResource
     */
    AddGeometryResource(geometryResource)
    {
        if (!this.geometryResources.includes(geometryResource))
        {
            this._isLoaded = false;
            super.AddGeometryResource(geometryResource);
        }
    }

    /**
     * Plays an animation by layer name, Carbon-style
     * @param {String} layerName
     * @param {String} animationName
     * @param {Object} [options]
     */
    PlayLayerAnimation(layerName, animationName, options = {})
    {
        return this.PlayAnimation(animationName, {
            ...options,
            mask: layerName,
            layerName
        });
    }

    /**
     * Plays an animation and records interior layer state
     * @param {String} name
     * @param {Object} [options]
     */
    PlayAnimation(name, options = {})
    {
        const animation = this.GetAnimation(name);
        if (!animation)
        {
            if (!this._isLoaded)
            {
                this._pendingCommands.push({
                    func: this.PlayAnimation,
                    args: [ name, options ]
                });
            }
            return null;
        }

        super.PlayAnimation(name, options);
        if (animation)
        {
            const layerName = options.layerName || options.layer || options.mask || "";
            animation._interiorLayerName = layerName;
            animation._interiorAdditive = options.additive !== undefined ? !!options.additive : !!this.additiveBlendMode;
            animation._interiorAmount = options.amount !== undefined
                ? options.amount
                : options.weight !== undefined
                    ? options.weight
                    : this.GetLayerWeight(layerName);
            animation._interiorLayerWeight = animation._interiorAmount;
            animation._interiorMaskSource = options.additiveMask !== undefined ? options.additiveMask : options.mask;
            animation._interiorMaskSpecified = animation._interiorMaskSource !== undefined &&
                animation._interiorMaskSource !== null && animation._interiorMaskSource !== "";
            animation._interiorReferenceSource = options.base !== undefined
                ? options.base
                : options.referenceClip;
            animation._interiorUseRestReference = animation._interiorAdditive &&
                animation._interiorReferenceSource === undefined;
            animation._interiorInto = options.into !== undefined ? options.into : null;
        }

        return animation;
    }

    /**
     * Plays the semantic projection of a GSF additive node. Into is optional
     * and means "play this ordinary base clip first"; an omitted Into uses the
     * controller's current base pose.
     *
     * @param {{Into:*,Base:*,Delta:*,Mask:*,Amount:Number}} projection
     * @param {Object} [options]
     * @returns {?Tw2Animation}
     */
    PlayAdditiveAnimation(projection, options = {})
    {
        if (!projection) throw new TypeError("Additive animation projection is required");

        const
            {
                intoOptions = {},
                deltaOptions = {},
                layerName: requestedLayerName,
                ...playbackOptions
            } = options,
            intoSource = projection.Into !== undefined ? projection.Into : projection.into,
            baseSource = projection.Base !== undefined ? projection.Base : projection.base,
            deltaSource = projection.Delta !== undefined ? projection.Delta : projection.delta,
            maskSource = projection.Mask !== undefined ? projection.Mask : projection.mask,
            amount = projection.Amount !== undefined ? projection.Amount : projection.amount,
            into = this.ResolveReferenceClip(intoSource),
            delta = this.ResolveReferenceClip(deltaSource);

        if (into && into !== Tr2InteriorAnimationController.IDENTITY_REFERENCE && into !== Tr2InteriorAnimationController.CURRENT_POSE)
        {
            const intoClip = into.clip || into;
            if (intoClip.name)
            {
                this.PlayAnimation(intoClip.name, {
                    ...intoOptions,
                    additive: false
                });
            }
        }

        const deltaClip = delta && (delta.clip || delta);
        if (!deltaClip || !deltaClip.name)
        {
            throw new Error(`Unable to resolve additive Delta clip: ${String(deltaSource)}`);
        }

        const layerName = requestedLayerName ||
            (typeof maskSource === "string" && maskSource ? maskSource : `__interior_additive__${deltaClip.name}`);

        return this.PlayAnimation(deltaClip.name, {
            ...playbackOptions,
            ...deltaOptions,
            additive: true,
            additiveMask: maskSource,
            amount: amount !== undefined ? amount : 1,
            base: baseSource !== undefined ? baseSource : "Identity",
            into: intoSource !== undefined ? intoSource : Tr2InteriorAnimationController.CURRENT_POSE,
            layerName,
            mask: layerName
        });
    }

    /** Alias matching format-gr2's GSF semantic-projection terminology. */
    ApplyAdditiveProjection(projection, options = {})
    {
        return this.PlayAdditiveAnimation(projection, options);
    }

    /**
     * Registers a named additive bone mask.
     * @param {String} name
     * @param {ArrayLike<Number>|Map|Object} mask
     */
    RegisterMask(name, mask)
    {
        if (!name) throw new TypeError("Mask name is required");
        if (!mask) throw new TypeError(`Mask '${name}' requires weights`);
        this.additiveMasks[name] = mask;
        return mask;
    }

    /**
     * Resolves a mask registered here or supplied by skeleton extended data.
     * @param {String|ArrayLike<Number>|Map|Object} mask
     * @returns {*}
     */
    ResolveMask(mask)
    {
        if (!mask || typeof mask !== "string") return mask || null;
        if (Object.prototype.hasOwnProperty.call(this.additiveMasks, mask)) return this.additiveMasks[mask];
        return super.ResolveTrackMask(mask);
    }

    /** Keeps ordinary named mask playback compatible with the generic API. */
    ResolveTrackMask(name)
    {
        return this.ResolveMask(name);
    }

    /**
     * Registers a reference clip by animation name, animation object, or a
     * descriptor such as `{ clip, time, cycle }`.
     * @param {String} name
     * @param {*} clip
     */
    RegisterReferenceClip(name, clip)
    {
        if (!name) throw new TypeError("Reference clip name is required");
        if (!clip) throw new TypeError(`Reference clip '${name}' is required`);
        this.referenceClips[name] = clip;
        return clip;
    }

    /**
     * Resolves a registered reference or a loaded animation.
     * @param {*} source
     * @returns {*}
     */
    ResolveReferenceClip(source)
    {
        if (source === undefined || source === null || source === "") return null;
        if (source === Tr2InteriorAnimationController.CURRENT_POSE || source === "CurrentPose")
        {
            return Tr2InteriorAnimationController.CURRENT_POSE;
        }
        if (source === Tr2InteriorAnimationController.IDENTITY_REFERENCE || source === "Identity")
        {
            return Tr2InteriorAnimationController.IDENTITY_REFERENCE;
        }
        if (typeof source !== "string") return source;

        const seen = new Set();
        let current = source;
        while (typeof current === "string" && !seen.has(current))
        {
            seen.add(current);
            if (current === "Identity") return Tr2InteriorAnimationController.IDENTITY_REFERENCE;
            if (current === "CurrentPose") return Tr2InteriorAnimationController.CURRENT_POSE;
            if (!Object.prototype.hasOwnProperty.call(this.referenceClips, current))
            {
                return this.GetAnimation(current);
            }
            current = this.referenceClips[current];
        }
        return typeof current === "string" ? null : current;
    }

    /**
     * Sets a layer's blend weight
     * @param {String} layerName
     * @param {Number} weight
     */
    SetLayerWeight(layerName, weight)
    {
        this.layerWeights[layerName || ""] = weight;

        for (let i = 0; i < this.animations.length; i++)
        {
            const animation = this.animations[i];
            if ((animation._interiorLayerName || animation.trackMaskName || "") === (layerName || ""))
            {
                animation._interiorLayerWeight = weight;
                animation._interiorAmount = weight;
            }
        }
    }

    /**
     * Gets a layer's blend weight
     * @param {String} layerName
     * @returns {Number}
     */
    GetLayerWeight(layerName = "")
    {
        return this.layerWeights[layerName] !== undefined ? this.layerWeights[layerName] : 1;
    }

    /** Sets the semantic additive Amount for a layer. */
    SetLayerAmount(layerName, amount)
    {
        this.SetLayerWeight(layerName, amount);
    }

    /** Gets the semantic additive Amount for a layer. */
    GetLayerAmount(layerName = "")
    {
        return this.GetLayerWeight(layerName);
    }

    /**
     * Sets whether newly played layers use additive blend mode
     * @param {Boolean} additive
     */
    SetAdditiveBlendMode(additive)
    {
        this.additiveBlendMode = !!additive;
    }

    /**
     * Gets additive blend mode
     * @returns {Boolean}
     */
    GetAdditiveBlendMode()
    {
        return this.additiveBlendMode;
    }

    /**
     * Rebuilds interior character resources when async geometry prepares.
     * @param {*} res
     */
    OnResPrepared(res)
    {
        res.UnregisterNotification(this);
        if (!this.geometryResources.includes(res)) return;
        this.RebuildCachedData();
    }

    /**
     * Rebuilds each prepared resource once, then completes the load cycle.
     * @returns {Boolean}
     */
    RebuildCachedData()
    {
        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            const resource = this.geometryResources[i];
            if (!resource || !resource.IsGood || !resource.IsGood()) return false;
        }

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            const resource = this.geometryResources[i];
            if (!this._rebuiltResources.has(resource))
            {
                this.constructor.DoRebuildCachedData(this, resource);
                this._rebuiltResources.add(resource);
            }
        }

        if (!this._isLoaded)
        {
            this.CompleteRebuildCachedData();
        }
        return true;
    }

    /**
     * Completes one resource load cycle and drains queued commands once.
     */
    CompleteRebuildCachedData()
    {
        this._isLoaded = true;
        this.EmitEvent("loaded", { controller: this });

        const pending = this._pendingCommands.splice(0);
        for (let i = 0; i < pending.length; i++)
        {
            const command = pending[i];
            if (command.args)
            {
                command.func.apply(this, command.args);
            }
            else
            {
                command.func.apply(this);
            }
        }
    }

    /**
     * Internal render/update function
     * @param {Number} dt
     */
    Update(dt)
    {
        super.Update(dt);
        this.ApplyAdditiveAnimations();
        this.ApplyBoneOffsets();
    }

    /**
     * Applies additive clips after ordinary base and masked playback has built
     * the Into pose. This makes composition independent of animation order.
     */
    ApplyAdditiveAnimations()
    {
        if (!this.update || !this.models) return;

        const g = Tr2InteriorAnimationController.global;
        let changed = false;

        for (let i = 0; i < this.animations.length; i++)
        {
            const animation = this.animations[i];
            if (!animation._interiorAdditive) continue;

            const
                animationWeight = Number.isFinite(animation.weight) ? animation.weight : 1,
                layerAmount = Number.isFinite(animation._interiorAmount) ? animation._interiorAmount : 1,
                mask = this.ResolveMask(animation._interiorMaskSource),
                reference = animation._interiorUseRestReference
                    ? Tr2InteriorAnimationController.REST_REFERENCE
                    : this.ResolveReferenceClip(animation._interiorReferenceSource);

            if (animationWeight === 0 || layerAmount === 0) continue;
            if (animation._interiorMaskSpecified && !mask) continue;
            if (!animation._interiorUseRestReference && !reference) continue;

            for (let j = 0; j < animation.trackGroups.length; j++)
            {
                const tracks = animation.trackGroups[j].transformTracks;
                for (let k = 0; k < tracks.length; k++)
                {
                    const
                        track = tracks[k],
                        bone = track.bone,
                        boneIndex = bone._skeletonIndex,
                        maskWeight = animation._interiorMaskSpecified
                            ? Tr2InteriorAnimationController.GetMaskWeight(mask, bone, boneIndex)
                            : 1,
                        amount = animationWeight * layerAmount * maskWeight;

                    if (amount === 0) continue;

                    Tr2InteriorAnimationController.SampleTrack(
                        animation,
                        track,
                        g.position_1,
                        g.quat_1,
                        g.mat3_1,
                        animation.animationRes.duration
                    );
                    Tr2InteriorAnimationController.SampleReferencePose(
                        reference,
                        animation,
                        track,
                        bone,
                        g.position_0,
                        g.quat_0,
                        g.mat3_0
                    );

                    composeInteriorAdditivePose(
                        bone._blendPosition,
                        bone._blendRotation,
                        bone._blendScaleShear,
                        bone._blendPosition,
                        bone._blendRotation,
                        bone._blendScaleShear,
                        g.position_0,
                        g.quat_0,
                        g.mat3_0,
                        g.position_1,
                        g.quat_1,
                        g.mat3_1,
                        amount
                    );
                    changed = true;
                }
            }
        }

        if (!changed) return;

        for (let i = 0; i < this.models.length; i++)
        {
            const bones = this.models[i].bones;
            for (let j = 0; j < bones.length; j++)
            {
                Tr2InteriorAnimationController.ComposeBoneLocalTransform(bones[j]);
            }
            Tr2InteriorAnimationController.RebuildModelBonePalettes(this.models[i]);
        }
    }

    /**
     * Applies Carbon-style bone offsets and rewrites bound bone palettes
     */
    ApplyBoneOffsets()
    {
        if (!this.boneOffset || !this.boneOffset.HaveTransforms()) return;

        for (let i = 0; i < this.models.length; i++)
        {
            const model = this.models[i];
            let changed = false;

            for (let j = 0; j < model.bones.length; j++)
            {
                changed = this.boneOffset.ApplyToBone(model.bones[j], j, model) || changed;
            }

            if (changed)
            {
                Tr2InteriorAnimationController.RebuildModelBonePalettes(model);
            }
        }
    }

    /**
     * Blends a single animation pose into accumulators
     * @param {Tw2Animation} animation
     * @param {vec3} position
     * @param {quat} orientation
     * @param {mat3} scale
     */
    BlendAnimationPose(animation, position, orientation, scale)
    {
        // super.Update still advances additive clips, but their pose is applied
        // only after all ordinary clips have produced the Into accumulators.
        if (animation._interiorAdditive) return;

        const
            res = animation.animationRes,
            mask = animation.trackMask,
            layerWeight = animation._interiorLayerWeight !== undefined
                ? animation._interiorLayerWeight
                : this.GetLayerWeight(animation._interiorLayerName || animation.trackMaskName || ""),
            weight = animation.weight * layerWeight;

        if (weight <= 0) return;

        for (let j = 0; j < animation.trackGroups.length; ++j)
        {
            const tracks = animation.trackGroups[j].transformTracks;
            for (let k = 0; k < tracks.length; ++k)
            {
                const track = tracks[k];
                const bone = track.bone;

                let bw = weight;
                if (mask)
                {
                    const bi = bone._skeletonIndex;
                    bw *= bi >= 0 && bi < mask.length ? mask[bi] : 0;
                }
                if (bw <= 0) continue;

                Tr2InteriorAnimationController.SampleTrack(animation, track, position, orientation, scale, res.duration);

                Tr2InteriorAnimationController.BlendAnimationPose(bone, position, orientation, scale, bw);
            }
        }
    }

    /**
     * Samples a transform track
     * @param {Tw2Animation} animation
     * @param {Tw2Track} track
     * @param {vec3} position
     * @param {quat} orientation
     * @param {mat3} scale
     * @param {Number} duration
     */
    static SampleTrack(animation, track, position, orientation, scale, duration)
    {
        if (track.trackRes.position)
        {
            Tr2InteriorAnimationController.SampleCurve(
                track.trackRes.position,
                animation.time,
                position,
                animation.cycle,
                duration
            );
        }
        else
        {
            position[0] = position[1] = position[2] = 0;
        }

        if (track.trackRes.orientation)
        {
            Tr2InteriorAnimationController.SampleCurve(
                track.trackRes.orientation,
                animation.time,
                orientation,
                animation.cycle,
                duration,
                true
            );
            quat.normalize(orientation, orientation);
        }
        else
        {
            quat.identity(orientation);
        }

        if (track.trackRes.scaleShear)
        {
            Tr2InteriorAnimationController.SampleCurve(
                track.trackRes.scaleShear,
                animation.time,
                scale,
                animation.cycle,
                duration
            );
        }
        else
        {
            mat3.identity(scale);
        }
    }

    /**
     * Uses the corrected local degree-one sampler while preserving the generic
     * evaluator for every other curve degree.
     */
    static SampleCurve(data, time, out, cycle, duration, quaternionCurve = false)
    {
        if (data.degree === 1)
        {
            return sampleInteriorDegreeOneCurve(out, data, time, cycle, duration, quaternionCurve);
        }
        curve.evaluate(data, time, out, cycle, duration);
        return out;
    }

    /** Samples the Base side of an additive operation for one bone. */
    static SampleReferencePose(reference, deltaAnimation, deltaTrack, bone, position, orientation, scale)
    {
        if (reference === Tr2InteriorAnimationController.IDENTITY_REFERENCE)
        {
            Tr2InteriorAnimationController.SetIdentityPose(position, orientation, scale);
            return;
        }
        if (reference === Tr2InteriorAnimationController.CURRENT_POSE)
        {
            Tr2InteriorAnimationController.CopyBonePose(bone, position, orientation, scale);
            return;
        }
        if (reference === Tr2InteriorAnimationController.REST_REFERENCE)
        {
            Tr2InteriorAnimationController.CopyRestPose(bone, position, orientation, scale);
            return;
        }

        const
            descriptor = reference && reference.clip ? reference : null,
            clip = descriptor ? descriptor.clip : reference,
            track = Tr2InteriorAnimationController.FindReferenceTrack(clip, deltaTrack, bone);

        if (!track)
        {
            Tr2InteriorAnimationController.CopyRestPose(bone, position, orientation, scale);
            return;
        }

        const
            clipRes = clip.animationRes || clip,
            deltaDuration = deltaAnimation.animationRes.duration,
            referenceDuration = clipRes.duration || 0,
            phase = deltaDuration > 0 ? deltaAnimation.time / deltaDuration : 0,
            time = descriptor && Number.isFinite(descriptor.time)
                ? descriptor.time
                : referenceDuration * phase,
            cycle = descriptor && descriptor.cycle !== undefined
                ? !!descriptor.cycle
                : clip.cycle !== undefined
                    ? !!clip.cycle
                    : !!deltaAnimation.cycle;

        Tr2InteriorAnimationController.SampleTrack(
            { time, cycle },
            track,
            position,
            orientation,
            scale,
            referenceDuration
        );
    }

    /** Finds a runtime or resource transform track matching the Delta bone. */
    static FindReferenceTrack(clip, deltaTrack, bone)
    {
        if (!clip) return null;

        const
            targetName = deltaTrack.trackRes.name || (bone.boneRes && bone.boneRes.name),
            groups = clip.trackGroups || (clip.animationRes && clip.animationRes.trackGroups) || [];

        for (let i = 0; i < groups.length; i++)
        {
            const tracks = groups[i].transformTracks || [];
            for (let j = 0; j < tracks.length; j++)
            {
                const
                    candidate = tracks[j],
                    trackRes = candidate.trackRes || candidate,
                    candidateName = trackRes.name ||
                        (candidate.bone && candidate.bone.boneRes && candidate.bone.boneRes.name);
                if (candidateName === targetName)
                {
                    return candidate.trackRes ? candidate : { trackRes };
                }
            }
        }
        return null;
    }

    static SetIdentityPose(position, orientation, scale)
    {
        position[0] = position[1] = position[2] = 0;
        quat.identity(orientation);
        mat3.identity(scale);
    }

    static CopyRestPose(bone, position, orientation, scale)
    {
        const rest = bone.boneRes;
        for (let i = 0; i < 3; i++) position[i] = rest.position[i];
        for (let i = 0; i < 4; i++) orientation[i] = rest.orientation[i];
        for (let i = 0; i < 9; i++) scale[i] = rest.scaleShear[i];
    }

    static CopyBonePose(bone, position, orientation, scale)
    {
        for (let i = 0; i < 3; i++) position[i] = bone._blendPosition[i];
        for (let i = 0; i < 4; i++) orientation[i] = bone._blendRotation[i];
        for (let i = 0; i < 9; i++) scale[i] = bone._blendScaleShear[i];
    }

    static GetMaskWeight(mask, bone, index)
    {
        const name = bone.boneRes && bone.boneRes.name;
        return getInteriorMaskWeight(mask, name, index);
    }

    static ComposeBoneLocalTransform(bone)
    {
        const rotation = mat4.fromQuat(Tr2InteriorAnimationController.global.mat4_0, bone._blendRotation);
        mat4.fromMat3(bone.localTransform, bone._blendScaleShear);
        mat4.multiply(bone.localTransform, bone.localTransform, rotation);
        bone.localTransform[12] = bone._blendPosition[0];
        bone.localTransform[13] = bone._blendPosition[1];
        bone.localTransform[14] = bone._blendPosition[2];
    }

    /**
     * Blends a pose toward sampled pose
     * @param {Tw2Bone} bone
     * @param {vec3} position
     * @param {quat} orientation
     * @param {mat3} scale
     * @param {Number} weight
     */
    static BlendAnimationPose(bone, position, orientation, scale, weight)
    {
        const
            bp = bone._blendPosition,
            bq = bone._blendRotation,
            bs = bone._blendScaleShear;

        if (weight >= 0.999999)
        {
            bp[0] = position[0]; bp[1] = position[1]; bp[2] = position[2];
            bq[0] = orientation[0]; bq[1] = orientation[1]; bq[2] = orientation[2]; bq[3] = orientation[3];
            for (let m = 0; m < 9; m++) bs[m] = scale[m];
        }
        else
        {
            bp[0] += (position[0] - bp[0]) * weight;
            bp[1] += (position[1] - bp[1]) * weight;
            bp[2] += (position[2] - bp[2]) * weight;

            let ax = bq[0], ay = bq[1], az = bq[2], aw = bq[3];
            let ox = orientation[0], oy = orientation[1], oz = orientation[2], ow = orientation[3];
            if (ax * ox + ay * oy + az * oz + aw * ow < 0)
            {
                ox = -ox; oy = -oy; oz = -oz; ow = -ow;
            }

            const
                qx = ax + (ox - ax) * weight,
                qy = ay + (oy - ay) * weight,
                qz = az + (oz - az) * weight,
                qw = aw + (ow - aw) * weight,
                len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw) || 1;

            bq[0] = qx / len;
            bq[1] = qy / len;
            bq[2] = qz / len;
            bq[3] = qw / len;

            for (let m = 0; m < 9; m++)
            {
                bs[m] += (scale[m] - bs[m]) * weight;
            }
        }
    }

    /**
     * Adds animations without the base controller's duplicate-index bug.
     * Kept local to the interior controller so shared animation behaviour is
     * unchanged while late character resources can safely attach track groups.
     * @param {Tr2InteriorAnimationController} controller
     * @param {*} resource
     */
    static AddAnimationsFromRes(controller, resource)
    {
        for (let i = 0; i < resource.animations.length; ++i)
        {
            let animation = null;
            let added = false;

            for (let j = 0; j < controller.animations.length; ++j)
            {
                if (controller.animations[j].animationRes === resource.animations[i])
                {
                    animation = controller.animations[j];
                    break;
                }
            }

            if (!animation)
            {
                animation = new Tw2Animation(controller);
                animation.animationRes = resource.animations[i];
                controller.animations.push(animation);
                added = true;
            }

            for (let j = 0; j < animation.animationRes.trackGroups.length; ++j)
            {
                const trackGroupRes = animation.animationRes.trackGroups[j];
                if (animation.trackGroups.some(group => group.trackGroupRes === trackGroupRes)) continue;

                const model = controller.models.find(item => item.modelRes.name === trackGroupRes.name);
                if (!model) continue;

                const group = new Tw2TrackGroup();
                group.trackGroupRes = trackGroupRes;
                for (let k = 0; k < trackGroupRes.transformTracks.length; ++k)
                {
                    const trackRes = trackGroupRes.transformTracks[k];
                    const bone = model.bones.find(item => item.boneRes.name === trackRes.name);
                    if (!bone) continue;

                    const track = new Tw2Track();
                    track.trackRes = trackRes;
                    track.bone = bone;
                    group.transformTracks.push(track);
                }
                animation.trackGroups.push(group);
            }

            if (added)
            {
                controller.EmitEvent("added", { controller, animation });
            }
        }
    }

    /**
     * Rebuilds cached animation data and binds mesh-only character parts to the
     * first skeleton resource owned by the controller.
     * @param {Tr2InteriorAnimationController} controller
     * @param {*} resource
     */
    static DoRebuildCachedData(controller, resource)
    {
        for (let i = 0; i < resource.models.length; ++i)
        {
            this.AddModel(controller, resource.models[i]);
        }

        for (let i = 0; i < controller.geometryResources.length; ++i)
        {
            this.AddAnimationsFromRes(controller, controller.geometryResources[i]);
        }

        if (resource.models.length === 0)
        {
            const skeletonModel = controller.geometryResources[0]?.models?.[0];
            if (skeletonModel)
            {
                const model = {
                    name: skeletonModel.name,
                    meshBindings: []
                };

                for (let i = 0; i < resource.meshes.length; ++i)
                {
                    const binding = this.BindInteriorMeshToModel(resource.meshes[i], skeletonModel, resource);
                    if (binding) model.meshBindings.push(binding);
                }

                if (model.meshBindings.length)
                {
                    resource.models.push(model);
                }
            }
        }

        for (let i = 0; i < resource.models.length; ++i)
        {
            let model = null;
            for (let j = 0; j < controller.models.length; ++j)
            {
                if (controller.models[j].modelRes.name === resource.models[i].name)
                {
                    model = controller.models[j];
                    break;
                }
            }

            if (model === null)
            {
                continue;
            }

            for (let j = 0; j < resource.models[i].meshBindings.length; ++j)
            {
                const meshIx = resource.meshes.indexOf(resource.models[i].meshBindings[j].mesh);
                if (meshIx === -1) continue;

                let meshBindings = Tw2AnimationController.FindMeshBindings(controller, resource);

                if (meshBindings === null)
                {
                    meshBindings = new Tw2MeshBinding();
                    meshBindings.resource = resource;
                    controller.meshBindings.push(meshBindings);
                }

                meshBindings.meshIndex[meshIx] = new Float32Array(resource.models[i].meshBindings[j].bones.length * 12);
                for (let k = 0; k < resource.models[i].meshBindings[j].bones.length; ++k)
                {
                    const boneRes = resource.models[i].meshBindings[j].bones[k];
                    if (!boneRes) continue;

                    for (let n = 0; n < model.bones.length; ++n)
                    {
                        if (model.bones[n].boneRes.name === boneRes.name)
                        {
                            const boneBinding = new Tw2BoneBinding();
                            boneBinding.array = meshBindings.meshIndex[meshIx];
                            boneBinding.offset = k * 12;
                            model.bones[n].bindingArrays.push(boneBinding);
                            model.bones[n].index = k;
                            break;
                        }
                    }
                }
            }
        }

        if (resource.meshes.length && resource.models.length)
        {
            controller.ResetBoneTransforms();
        }
    }

    /**
     * Binds a mesh part to a skeleton model for interior characters.
     * @param {*} mesh
     * @param {*} model
     * @param {*} res
     * @returns {Tw2GeometryMeshBinding|null}
     */
    static BindInteriorMeshToModel(mesh, model, res)
    {
        if (!mesh || !mesh.boneBindings || !mesh.boneBindings.length) return null;

        const
            binding = new Tw2GeometryMeshBinding(),
            fallbackBone = model.FindBoneByName("Root") || model.skeleton?.bones?.[0] || null;

        if (!fallbackBone) return null;

        binding.mesh = mesh;
        for (let i = 0; i < mesh.boneBindings.length; i++)
        {
            const name = mesh.boneBindings[i];
            const bone = model.FindBoneByName(name) || fallbackBone;
            binding.bones.push(bone);
            if (bone && mesh.FindBoneBoundsByName)
            {
                bone.boundingBox = mesh.FindBoneBoundsByName(name);
            }
        }

        return binding;
    }

    /**
     * Rebuilds model world transforms and bound bone palettes
     * @param {Tw2Model} model
     */
    static RebuildModelBonePalettes(model)
    {
        for (let i = 0; i < model.bones.length; i++)
        {
            const bone = model.bones[i];
            if (bone.boneRes.parentIndex !== -1)
            {
                mat4.multiply(bone.worldTransform, model.bones[bone.boneRes.parentIndex].worldTransform, bone.localTransform);
            }
            else
            {
                mat4.copy(bone.worldTransform, bone.localTransform);
            }
            mat4.multiply(bone.offsetTransform, bone.worldTransform, bone.boneRes.worldTransformInv);

            for (let a = 0; a < bone.bindingArrays.length; a++)
            {
                const
                    ba = bone.bindingArrays[a],
                    tr = bone.offsetTransform;

                ba.array[ba.offset + 0] = tr[0];
                ba.array[ba.offset + 1] = tr[4];
                ba.array[ba.offset + 2] = tr[8];
                ba.array[ba.offset + 3] = tr[12];

                ba.array[ba.offset + 4] = tr[1];
                ba.array[ba.offset + 5] = tr[5];
                ba.array[ba.offset + 6] = tr[9];
                ba.array[ba.offset + 7] = tr[13];

                ba.array[ba.offset + 8] = tr[2];
                ba.array[ba.offset + 9] = tr[6];
                ba.array[ba.offset + 10] = tr[10];
                ba.array[ba.offset + 11] = tr[14];
            }
        }
    }

    static IDENTITY_REFERENCE = Object.freeze({ kind: "identity" });
    static REST_REFERENCE = Object.freeze({ kind: "rest" });
    static CURRENT_POSE = Object.freeze({ kind: "current" });

    static global = {
        position_0: new Float32Array(3),
        position_1: new Float32Array(3),
        quat_0: new Float32Array(4),
        quat_1: new Float32Array(4),
        mat3_0: new Float32Array(9),
        mat3_1: new Float32Array(9),
        mat4_0: mat4.create()
    };

}
