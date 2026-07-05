import { meta, toArray } from "utils";
import { vec3, quat, mat3, mat4, box3, curve } from "math";
import { Tw2GeometryRes } from "../resource";
import { Tw2Animation } from "./Tw2Animation";
import { Tw2Bone } from "./Tw2Bone";
import { Tw2BoneBinding } from "./Tw2BoneBinding";
import { Tw2Model } from "./Tw2Model";
import { Tw2Track } from "./Tw2Track";
import { Tw2TrackGroup } from "./Tw2TrackGroup";
import { Tw2MeshBinding } from "./Tw2MeshBinding";


@meta.type("Tw2AnimationController")
@meta.wgl.define("Tw2AnimationController")
@meta.todo("Handle rebuilding bounds in update function")
export class Tw2AnimationController extends meta.Model
{

    @meta.list("Tw2GeometryRes")
    @meta.isPrivate
    geometryResources = [];

    @meta.list("Tw2Model")
    @meta.isPrivate
    models = [];

    @meta.list("Tw2Animation")
    @meta.isPrivate
    animations = [];

    @meta.list("Tw2MeshBinding")
    @meta.isPrivate
    meshBindings = [];

    @meta.boolean
    update = true;


    _isLoaded = false;
    _isPlaying = false;
    _boundsDirty = false;
    _pendingCommands = [];


    /**
     * Constructor
     * @param {Tw2GeometryRes} [geometryResource]
     */
    constructor(geometryResource)
    {
        super();

        if (geometryResource)
        {
            this.SetGeometryResource(geometryResource);
        }
    }

    /**
     * Fires a listener on an event
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @param {Boolean} [once]
     * @returns {Tw2AnimationController}
     */
    OnEvent(eventName, listener, context, once)
    {

        // Ensure "loaded" event is handled if called after the controller has already loaded
        if (eventName === "loaded" && this.IsLoaded())
        {
            listener.call(context, { controller: this });
            if (once) return this;
        }

        return super.OnEvent(eventName, listener, context, once);
    }

    /**
     * Checks if the animation is good
     * @returns {boolean}
     */
    IsGood()
    {
        let isGood = this.geometryResources.length > 0;

        // Cycle through geometry to keep alive
        for (let i = 0; i < this.geometryResources.length; i++)
        {
            if (!this.geometryResources[i] || !this.geometryResources[i].IsGood())
            {
                isGood = false;
            }
        }

        if (!isGood || !this.animations.length) return false;

        for (let i = 0; i < this.animations.length; i++)
        {
            if (!this.animations[i].IsGood())
            {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if any animations are playing
     * @returns {boolean}
     */
    IsPlaying()
    {
        return this._isPlaying;
    }

    /**
     * Checks if the animations are loaded
     * @returns {boolean}
     */
    IsLoaded()
    {
        return this._isLoaded;
    }

    /**
     * Gets a loaded Tw2Animation by it's name
     * @param {Object} [out={}]
     * @returns {?{String:Tw2Animation}} an object containing animation names and animations, or null if not loaded
     */
    GetAnimationsByName(out = {})
    {
        if (!this.IsLoaded()) return null;

        for (let i = 0; i < this.animations.length; i++)
        {
            out[this.animations[i].name] = this.animations[i];
        }

        return out;
    }

    /**
     * Gets a loaded Tw2Animation by it's name
     * @param {String} name
     * @returns {?Tw2Animation} Returns the animation if found
     */
    GetAnimation(name)
    {
        for (let i = 0; i < this.animations.length; i++)
        {
            if (this.animations[i].name === name)
            {
                return this.animations[i];
            }
        }
        return null;
    }

    /**
     * Checks if an animation exists
     * @param name
     * @returns {boolean}
     * @constructor
     */
    HasAnimation(name)
    {
        for (let i = 0; i < this.animations.length; i++)
        {
            if (this.animations[i].name === name)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Plays a specific animation by it's name
     * @param {String} name - Animation's Name
     * @param {Object} options
     * @param {Boolean} [options.cycle]
     * @param {Number} [options.time]
     * @param {Function} [options.callback]
     * @param {Object} [options.events]
     */
    PlayAnimation(name, options)
    {
        if (this.animations.length === 0)
        {
            this._pendingCommands.push({
                "func": this.PlayAnimation,
                "args": [ name, options ]
            });
            console.log("Pending command added...");
            return;
        }

        const animation = this.GetAnimation(name);
        if (animation)
        {
            const maskName = options && options.mask ? options.mask : "";

            // One animation per layer: the new clip replaces whatever else is on this layer. Stop
            // anything still playing and clear its (held) weight so it stops contributing — the new
            // clip takes over cleanly with no overlap, and the outgoing held pose hands straight off.
            for (let i = 0; i < this.animations.length; i++)
            {
                const other = this.animations[i];
                if (other !== animation && other.trackMaskName === maskName)
                {
                    if (other.IsPlaying()) other.Stop();
                    other.weight = 0;
                }
            }

            animation.trackMaskName = maskName;
            // Unknown/absent masks resolve to null weights → full-body override (legacy behaviour);
            // the layer name still drives sequencing and IsAnimationPlaying regardless.
            animation.trackMask = maskName ? this.ResolveTrackMask(maskName) : null;
            animation.Play(options);
        }
    }

    /**
     * Checks whether any animation on the given mask/layer is currently playing. Backs the
     * IsAnimationPlaying(layer) expression used by state-machine transition conditions.
     * @param {String} [maskName=""]
     * @returns {Boolean}
     */
    IsMaskAnimationPlaying(maskName = "")
    {
        for (let i = 0; i < this.animations.length; i++)
        {
            const animation = this.animations[i];
            if (animation.trackMaskName === maskName && animation.IsPlaying())
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Resolves a named track mask to its per-bone weight array (Float32Array, one weight per
     * model bone, aligned with Tw2Bone._skeletonIndex). Returns null when the mask is unknown
     * (e.g. geometry exported without ExtendedData).
     * @param {String} maskName
     * @returns {Float32Array|null}
     */
    ResolveTrackMask(maskName)
    {
        if (!maskName) return null;

        for (let i = 0; i < this.models.length; i++)
        {
            const skeleton = this.models[i].modelRes && this.models[i].modelRes.skeleton;
            if (skeleton && skeleton.trackMasks && skeleton.trackMasks[maskName])
            {
                return skeleton.trackMasks[maskName];
            }
        }
        return null;
    }

    /**
     * Gets an array of all the currently playing animations by name
     * @returns {Array}
     */
    GetPlayingAnimations()
    {
        const result = [];
        for (let i = 0; i < this.animations.length; i++)
        {
            if (this.animations[i].IsPlaying())
            {
                result.push(this.animations[i].name);
            }
        }
        return result;
    }

    /**
     * Stops an animation or an array of animations from playing
     * @param {String| Array.<string>} names - Animation Name, or Array of Animation Names
     */
    StopAnimation(names)
    {
        if (this.animations.length === 0)
        {
            this._pendingCommands.push({
                "func": this.StopAnimation,
                "args": [ names ]
            });
            return;
        }

        names = toArray(names);

        for (let i = 0; i < this.animations.length; ++i)
        {
            if (names.includes(this.animations[i].name))
            {
                this.animations[i].Stop();
                this.animations[i].weight = 0;
            }
        }
    }

    /**
     * Stops all animations from playing
     */
    StopAllAnimations()
    {
        if (this.animations.length === 0)
        {
            this._pendingCommands.push({
                "func": this.StopAllAnimations,
                "args": null
            });
            return;
        }

        for (let i = 0; i < this.animations.length; ++i)
        {
            this.animations[i].Stop();
            this.animations[i].weight = 0;
        }
    }

    /**
     * Stops all but the supplied list of animations
     * @param {String| Array.<string>} names - Animation Names
     */
    StopAllAnimationsExcept(names)
    {
        if (this.animations.length === 0)
        {
            this._pendingCommands.push({
                "func": this.StopAllAnimationsExcept,
                "args": [ names ]
            });
            return;
        }

        names = toArray(names);

        for (let i = 0; i < this.animations.length; ++i)
        {
            if (!names.includes(this.animations[i].name))
            {
                this.animations[i].Stop();
                this.animations[i].weight = 0;
            }
        }
    }

    /**
     * Checks if the animation has a geometry resource
     * @param {Tw2GeometryRes} geometryResource
     * @returns {boolean}
     */
    HasGeometryResource(geometryResource)
    {
        return this.geometryResources.indexOf(geometryResource) !== -1;
    }

    /**
     * Clears any existing resources and loads the supplied geometry resource
     * @param {Tw2GeometryRes} geometryResource
     */
    SetGeometryResource(geometryResource)
    {
        this.models.splice(0);

        for (let i = 0; i < this.animations.length; i++)
        {
            const animation = this.animations[i];
            this.animations.splice(i, 1);
            i--;

            /**
             * Fires when an animation has been removed
             * @event Tw2AnimationController#removed
             * @type {Object}
             * @property {Tw2Animation} animation
             * @property {Tw2AnimationController} controller
             */
            this.EmitEvent("removed", { animation, controller: this });
            animation.Destroy();
        }

        this.meshBindings.splice(0);

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            this.geometryResources[i].UnregisterNotification(this);
        }

        this._isLoaded = false;
        this.geometryResources.splice(0);

        if (geometryResource)
        {
            this.geometryResources.push(geometryResource);
            geometryResource.RegisterNotification(this);
        }
    }

    /**
     * Adds a Geometry Resource
     * @param {Tw2GeometryRes} geometryResource
     */
    AddGeometryResource(geometryResource)
    {
        if (!this.geometryResources.includes(geometryResource))
        {
            this.geometryResources.push(geometryResource);
            geometryResource.RegisterNotification(this);
        }
    }

    /**
     * Resets the bone transforms
     */
    ResetBoneTransforms()
    {
        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].bones.length; ++j)
            {
                const
                    bone = this.models[i].bones[j],
                    boneRes = bone.boneRes;

                mat4.copy(bone.localTransform, boneRes.localTransform);

                if (boneRes.parentIndex !== -1)
                {
                    mat4.multiply(bone.worldTransform, bone.localTransform, this.models[i].bones[bone.boneRes.parentIndex].worldTransform);
                }
                else
                {
                    mat4.set(bone.worldTransform, bone.localTransform);
                }
                mat4.identity(bone.offsetTransform);
            }
        }

        const id = mat4.identity(Tw2AnimationController.global.mat4_0);
        for (let i = 0; i < this.meshBindings.length; ++i)
        {
            for (let j = 0; j < this.meshBindings[i].meshIndex.length; ++j)
            {
                for (let k = 0; k * 16 < this.meshBindings[i].meshIndex[j].length; ++k)
                {
                    for (let m = 0; m < 16; ++m)
                    {
                        this.meshBindings[i].meshIndex[j][k * 16 + m] = id[m];
                    }
                }
            }
        }
    }

    /**
     * GetBoneMatrices
     * @param {Number} meshIndex
     * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
     * @returns {Float32Array}
     */
    GetBoneMatrices(meshIndex, geometryResource)
    {
        if (this.geometryResources.length === 0)
        {
            return new Float32Array();
        }

        if (!geometryResource)
        {
            geometryResource = this.geometryResources[0];
        }

        const meshBindings = Tw2AnimationController.FindMeshBindings(this, geometryResource);
        if (meshBindings && meshBindings.meshIndex[meshIndex] !== undefined)
        {
            return meshBindings.meshIndex[meshIndex];
        }
        return new Float32Array();
    }

    /**
     * Finds a bone for a mesh by its name
     * @param {String} name
     * @param {Number} meshIndex
     * @returns {null|Tw2Bone}
     */
    FindMeshBoneByName(name, meshIndex)
    {
        const model = this.FindModelForMesh(meshIndex);
        if (model)
        {
            for (let i = 0; i < model.bones.length; i++)
            {
                if (model.bones[i].boneRes.name === name)
                {
                    return model.bones[i];
                }
            }
        }
        return null;
    }

    /**
     * Finds a bone by its index
     * @param {Number} boneIndex
     * @param {Number} meshIndex
     * @returns {null|Tw2Bone}
     */
    FindMeshBoneByIndex(boneIndex, meshIndex)
    {
        if (!this.models[meshIndex] || boneIndex === -1) return null;
        return this.models[meshIndex].bones.find(bone => bone.index === boneIndex) || null;
    }

    /**
     * FindModelForMesh
     * @param {Number} meshIndex
     * @param {Tw2GeometryRes} [geometryResource=this.geometryResources[0]]
     * @returns {Tw2Model|null} Returns the Tw2Model for the mesh if found and is good, else returns null
     */
    FindModelForMesh(meshIndex, geometryResource)
    {
        if (this.geometryResources.length === 0)
        {
            return null;
        }

        if (!geometryResource)
        {
            geometryResource = this.geometryResources[0];
        }

        if (!geometryResource.IsGood())
        {
            return null;
        }

        const mesh = geometryResource.meshes[meshIndex];
        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].modelRes.meshBindings.length; ++i)
            {
                if (this.models[i].modelRes.meshBindings[j].mesh === mesh)
                {
                    return this.models[i];
                }
            }
        }
        return null;
    }

    /**
     * Gets all animation controller res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */

    GetResources(out = [])
    {
        for (let i = 0; i < this.geometryResources.length; i++)
        {
            if (!out.includes(this.geometryResources[i]))
            {
                out.push(this.geometryResources[i]);
            }
        }
        return out;
    }

    /**
     * Rebuilds the cached data for a resource (unless it doesn't exist or is already good)
     * @param {Tw2GeometryRes} res
     */
    OnResPrepared(res)
    {
        res.UnregisterNotification(this);
        let found = this.geometryResources.includes(res);

        // Unknown resource ignore
        if (!found)
        {
            return;
        }

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            if (!this.geometryResources[i].IsGood())
            {
                return;
            }
        }

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            Tw2AnimationController.DoRebuildCachedData(this, this.geometryResources[i]);
        }
    }

    /**
     * Internal render/update function which is called every frame
     * @param {Number} dt - Delta Time
     */
    Update(dt)
    {
        let wasPlaying = this._isPlaying;
        this._isPlaying = false;

        if (!this.models || !this.update)
        {
            return;
        }

        for (let i = 0; i < this.geometryResources.length; ++i)
        {
            this.geometryResources[i].KeepAlive();
        }

        const
            g = Tw2AnimationController.global,
            rotationMat = g.mat4_0,
            orientation = g.quat_0,
            position = g.vec3_0,
            scale = g.mat3_0;

        // Reset every bone to its rest TRS, then blend in each playing/fading animation.
        // Unmasked animations (base layer) override fully; masked animations (e.g. stances)
        // blend only their masked bones over the result. Weights are eased for crossfades, so
        // at weight 1 with no track mask this reproduces the legacy direct-write behaviour.
        for (let i = 0; i < this.models.length; ++i)
        {
            const bones = this.models[i].bones;
            for (let j = 0; j < bones.length; ++j)
            {
                const bone = bones[j], rest = bone.boneRes;
                const bp = bone._blendPosition, bq = bone._blendRotation, bs = bone._blendScaleShear;
                bp[0] = rest.position[0]; bp[1] = rest.position[1]; bp[2] = rest.position[2];
                bq[0] = rest.orientation[0]; bq[1] = rest.orientation[1]; bq[2] = rest.orientation[2]; bq[3] = rest.orientation[3];
                for (let m = 0; m < 9; m++) bs[m] = rest.scaleShear[m];
            }
        }

        const fadeIn = Tw2AnimationController.FADE_IN_TIME > 0 ? dt / Tw2AnimationController.FADE_IN_TIME : 1;

        for (let i = 0; i < this.animations.length; ++i)
        {
            const animation = this.animations[i];
            const playing = animation.Update(dt);
            if (playing) this._isPlaying = true;

            if (playing || animation.IsPaused())
            {
                // Ease up to full contribution while active (snaps when fade is disabled).
                animation.weight = fadeIn >= 1 ? 1 : Math.min(1, animation.weight + fadeIn);
            }
            // Otherwise HOLD the current weight. A naturally-finished clip keeps contributing its
            // held end pose until another clip replaces it on its layer (or it is explicitly cleared
            // below). This closes the one-frame gap where masked bones would otherwise snap back to
            // the base pose between a transition finishing and the next state's clip starting.
        }

        for (let i = 0; i < this.animations.length; ++i)
        {
            const animation = this.animations[i];
            if (!animation.trackMask && animation.weight > 0) this.BlendAnimationPose(animation, position, orientation, scale);
        }
        for (let i = 0; i < this.animations.length; ++i)
        {
            const animation = this.animations[i];
            if (animation.trackMask && animation.weight > 0) this.BlendAnimationPose(animation, position, orientation, scale);
        }

        // Compose each bone's local transform from its blended TRS accumulator.
        for (let i = 0; i < this.models.length; ++i)
        {
            const bones = this.models[i].bones;
            for (let j = 0; j < bones.length; ++j)
            {
                const bone = bones[j];
                mat4.fromMat3(bone.localTransform, bone._blendScaleShear);
                mat4.multiply(bone.localTransform, bone.localTransform, mat4.fromQuat(rotationMat, bone._blendRotation));
                bone.localTransform[12] = bone._blendPosition[0];
                bone.localTransform[13] = bone._blendPosition[1];
                bone.localTransform[14] = bone._blendPosition[2];
            }
        }

        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].bones.length; ++j)
            {
                const bone = this.models[i].bones[j];
                if (bone.boneRes.parentIndex !== -1)
                {
                    mat4.multiply(bone.worldTransform, this.models[i].bones[bone.boneRes.parentIndex].worldTransform, bone.localTransform);
                }
                else
                {
                    mat4.copy(bone.worldTransform, bone.localTransform);
                }
                mat4.multiply(bone.offsetTransform, bone.worldTransform, bone.boneRes.worldTransformInv);

                for (let a = 0; a < bone.bindingArrays.length; ++a)
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

        if (this._isPlaying || this._isPlaying !== wasPlaying)
        {
            this._boundsDirty = true;
        }
    }

    /**
     * Blends a single animation's sampled pose into the per-bone TRS accumulators, scaled by the
     * animation's current weight and (optionally) its per-bone track mask. At weight 1 with no mask
     * this is a plain override (identical to the legacy direct write); otherwise it lerps the bone
     * toward the sampled pose, giving weighted crossfades and masked (layered) overlays.
     * @param {Tw2Animation} animation
     * @param {vec3} position    - scratch
     * @param {quat} orientation - scratch
     * @param {mat3} scale       - scratch
     */
    BlendAnimationPose(animation, position, orientation, scale)
    {
        const
            res = animation.animationRes,
            mask = animation.trackMask,
            weight = animation.weight;

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

                if (track.trackRes.position)
                {
                    curve.evaluate(track.trackRes.position, animation.time, position, animation.cycle, res.duration);
                }
                else
                {
                    position[0] = position[1] = position[2] = 0;
                }

                if (track.trackRes.orientation)
                {
                    curve.evaluate(track.trackRes.orientation, animation.time, orientation, animation.cycle, res.duration);
                    quat.normalize(orientation, orientation);
                }
                else
                {
                    quat.identity(orientation);
                }

                if (track.trackRes.scaleShear)
                {
                    curve.evaluate(track.trackRes.scaleShear, animation.time, scale, animation.cycle, res.duration);
                }
                else
                {
                    mat3.identity(scale);
                }

                const bp = bone._blendPosition, bq = bone._blendRotation, bs = bone._blendScaleShear;

                if (bw >= 0.999999)
                {
                    bp[0] = position[0]; bp[1] = position[1]; bp[2] = position[2];
                    bq[0] = orientation[0]; bq[1] = orientation[1]; bq[2] = orientation[2]; bq[3] = orientation[3];
                    for (let m = 0; m < 9; m++) bs[m] = scale[m];
                }
                else
                {
                    bp[0] += (position[0] - bp[0]) * bw;
                    bp[1] += (position[1] - bp[1]) * bw;
                    bp[2] += (position[2] - bp[2]) * bw;

                    // hemisphere-corrected nlerp (adequate for the short crossfade window)
                    let ax = bq[0], ay = bq[1], az = bq[2], aw = bq[3];
                    let ox = orientation[0], oy = orientation[1], oz = orientation[2], ow = orientation[3];
                    if (ax * ox + ay * oy + az * oz + aw * ow < 0) { ox = -ox; oy = -oy; oz = -oz; ow = -ow; }
                    const
                        qx = ax + (ox - ax) * bw,
                        qy = ay + (oy - ay) * bw,
                        qz = az + (oz - az) * bw,
                        qw = aw + (ow - aw) * bw,
                        len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw) || 1;
                    bq[0] = qx / len; bq[1] = qy / len; bq[2] = qz / len; bq[3] = qw / len;

                    for (let m = 0; m < 9; m++) bs[m] += (scale[m] - bs[m]) * bw;
                }
            }
        }
    }

    /**
     * RenderDebugInfo
     * TODO: Fix commented out code
     * @param {function} debugHelper
     */
    RenderDebugInfo(debugHelper)
    {
        /*for (var i = 0; i < this.geometryResources.length; ++i)
         {
         this.geometryResources[i].RenderDebugInfo(debugHelper);
         }*/
        for (let i = 0; i < this.models.length; ++i)
        {
            for (let j = 0; j < this.models[i].bones.length; ++j)
            {
                const b0 = this.models[i].bones[j];
                if (b0.boneRes.parentIndex >= 0)
                {
                    const b1 = this.models[i].bones[b0.boneRes.parentIndex];
                    debugHelper["AddLine"](
                        [ b0.worldTransform[12], b0.worldTransform[13], b0.worldTransform[14] ],
                        [ b1.worldTransform[12], b1.worldTransform[13], b1.worldTransform[14] ]);
                }
            }
        }
    }

    /**
     * Adds animations from a resource
     * @param {Tw2AnimationController} controller
     * @param {Tw2GeometryRes} resource
     */
    static AddAnimationsFromRes(controller, resource)
    {
        for (let i = 0; i < resource.animations.length; ++i)
        {
            let animation = null;
            let added;

            for (let j = 0; j < controller.animations.length; ++j)
            {
                if (controller.animations[j].animationRes === resource.animations[i])
                {
                    animation = controller.animations[i];
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
                let found = false;
                for (let k = 0; k < animation.trackGroups.length; ++k)
                {
                    if (animation.trackGroups[k].trackGroupRes === animation.animationRes.trackGroups[j])
                    {
                        found = true;
                        break;
                    }
                }

                if (found)
                {
                    continue;
                }

                let model = null;
                for (let k = 0; k < controller.models.length; ++k)
                {
                    if (controller.models[k].modelRes.name === animation.animationRes.trackGroups[j].name)
                    {
                        model = controller.models[k];
                        break;
                    }
                }

                if (model !== null)
                {
                    const group = new Tw2TrackGroup();
                    group.trackGroupRes = animation.animationRes.trackGroups[j];
                    for (let k = 0; k < group.trackGroupRes.transformTracks.length; ++k)
                    {
                        for (let m = 0; m < model.bones.length; ++m)
                        {
                            if (model.bones[m].boneRes.name === group.trackGroupRes.transformTracks[k].name)
                            {
                                const track = new Tw2Track();
                                track.trackRes = group.trackGroupRes.transformTracks[k];
                                track.bone = model.bones[m];
                                group.transformTracks.push(track);
                                break;
                            }
                        }
                    }
                    animation.trackGroups.push(group);
                }
            }

            if (added)
            {
                /**
                 * Fires when an animation is added
                 * @event Tw2AnimationController#added
                 * @type {Object}
                 * @property {Tw2Animation} animation
                 * @property {Tw2AnimationController} controller
                 */
                controller.EmitEvent("added", { controller, animation });
            }
        }
    }

    /**
     * Adds a model resource to an animation controller
     * @param {Tw2AnimationController} controller
     * @param {Tw2GeometryModel} modelRes
     * @returns {null|Tw2Model} Returns a newly created Tw2Model if the model resource doesn't already exist, and null if it does
     */
    static AddModel(controller, modelRes)
    {
        for (let i = 0; i < controller.models.length; ++i)
        {
            if (controller.models[i].modelRes.name === modelRes.name)
            {
                return null;
            }
        }

        const model = new Tw2Model();
        model.modelRes = modelRes;
        const skeleton = modelRes.skeleton;
        if (skeleton !== null)
        {
            for (let j = 0; j < skeleton.bones.length; ++j)
            {
                const bone = new Tw2Bone();
                bone.boneRes = skeleton.bones[j];
                bone._skeletonIndex = j;
                model.bones.push(bone);
                model.bonesByName[bone.boneRes.name] = bone;
            }
        }
        controller.models.push(model);
        return model;
    }

    /**
     * Finds a mesh binding for a supplied resource
     * @param {Tw2AnimationController} controller
     * @param {Tw2GeometryRes} resource
     * @returns {Object|null} Returns the mesh binding of a resource if it exists, null if it doesn't
     * @private
     */
    static FindMeshBindings(controller, resource)
    {
        for (let i = 0; i < controller.meshBindings.length; ++i)
        {
            if (controller.meshBindings[i].resource === resource)
            {
                return controller.meshBindings[i];
            }
        }
        return null;
    }

    /**
     * DoRebuildCachedData
     * @param {Tw2AnimationController} controller
     * @param {Tw2GeometryRes} resource
     */
    static DoRebuildCachedData(controller, resource)
    {
        if (resource.meshes.length)
        {
            for (let i = 0; i < resource.models.length; ++i)
            {
                this.AddModel(controller, resource.models[i]);
            }
        }

        for (let i = 0; i < controller.geometryResources.length; ++i)
        {
            this.AddAnimationsFromRes(controller, controller.geometryResources[i]);
        }

        if (resource.models.length === 0)
        {
            if (controller.geometryResources[0].models[0])
            {
                for (let i = 0; i < resource.meshes.length; ++i)
                {
                    Tw2GeometryRes.BindMeshToModel(resource.meshes[i], controller.geometryResources[0].models[0], resource);
                }
                resource.models.push(controller.geometryResources[0].models[0]);
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
                    for (let n = 0; n < model.bones.length; ++n)
                    {
                        if (model.bones[n].boneRes.name === resource.models[i].meshBindings[j].bones[k].name)
                        {
                            const boneBinding = new Tw2BoneBinding();
                            boneBinding.array = meshBindings.meshIndex[meshIx];
                            boneBinding.offset = k * 12;
                            model.bones[n].bindingArrays.push(boneBinding);
                            model.bones[n].index = k;
                            //meshBindings.meshIndex[meshIx][k] = model.bones[n].offsetTransform;
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

        controller._isLoaded = true;

        /**
         * Fires when the animation controller has loaded
         * @event Tw2AnimationController#loaded
         * @type {Object}
         * @property {Tw2Animation} animation
         * @property {Tw2AnimationController} controller
         */
        controller.EmitEvent("loaded", { controller });

        if (controller.animations.length)
        {
            if (controller._pendingCommands.length)
            {
                for (let i = 0; i < controller._pendingCommands.length; ++i)
                {
                    if (!controller._pendingCommands[i].args)
                    {
                        controller._pendingCommands[i].func.apply(controller);
                    }
                    else
                    {
                        console.log("Executing command with args");
                        console.dir(controller._pendingCommands[i].args);
                        controller._pendingCommands[i].func.apply(controller, controller._pendingCommands[i].args);
                    }
                }
            }
            controller._pendingCommands.splice(0);
        }
    }

    /**
     * Crossfade durations (seconds) for easing animation blend weights in/out. 0 = disabled
     * (weights snap): clips play cleanly one after another with no blend/morph between them, which
     * is the correct behaviour for stance deploy/retract animations. Kept as tunable constants in
     * case a specific layer ever wants a short blend, but stances must NOT crossfade.
     */
    static FADE_IN_TIME = 0;
    static FADE_OUT_TIME = 0;

    /**
     * Global and Scratch variables
     */
    static global = {
        vec3_0: vec3.create(),
        quat_0: quat.create(),
        mat3_0: mat3.create(),
        mat4_0: mat4.create(),
        box3_0: box3.create()
    };

}

