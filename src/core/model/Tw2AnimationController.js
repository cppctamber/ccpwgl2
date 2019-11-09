import { vec3, quat, mat3, mat4, curve, util, Tw2BaseClass } from "global";
import { Tw2GeometryRes } from "../resource";
import { Tw2Animation } from "./Tw2Animation";
import { Tw2Bone } from "./Tw2Bone";
import { Tw2BoneBinding } from "./Tw2BoneBinding";
import { Tw2Model } from "./Tw2Model";
import { Tw2Track } from "./Tw2Track";
import { Tw2TrackGroup } from "./Tw2TrackGroup";
import { Tw2MeshBinding } from "./Tw2MeshBinding";

/**
 * Tw2AnimationController
 * TODO: Handle bounds in the update function
 *
 * @property {Array.<Tw2GeometryRes>} geometryResources
 * @property {Array.<Tw2Model>} models
 * @property {Array.<Tw2Animation>} animations
 * @property {Array.<Tw2MeshBinding>} meshBindings
 * @property {Boolean} update
 * @property {Boolean} _isLoaded
 * @property {Boolean} _isPlaying
 * @property {Boolean} _boundsDirty
 * @property {Array} _pendingCommands
 */
export class Tw2AnimationController extends Tw2BaseClass
{

    geometryResources = [];
    models = [];
    animations = [];
    meshBindings = [];
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
            return;
        }

        const animation = this.GetAnimation(name);
        if (animation)
        {
            animation.Play(options);
        }
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
                "args": names
            });
            return;
        }

        names = util.toArray(names);

        for (let i = 0; i < this.animations.length; ++i)
        {
            if (names.includes(this.animations[i].name))
            {
                this.animations[i].Stop();
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
                "args": names
            });
            return;
        }

        names = util.toArray(names);

        for (let i = 0; i < this.animations.length; ++i)
        {
            if (!names.includes(this.animations[i].name))
            {
                this.animations[i].Stop();
            }
        }
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
            this.emit("removed", { animation, controller: this });
            animation.OnDestroy();
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
     * Finds a bone for a mesh by it's name
     * @param {String} name
     * @param {Number} meshIndex
     * @returns {null|Tw2Bone}
     */
    FindBoneForMesh(name, meshIndex)
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

        //var updateBones = false;
        for (let i = 0; i < this.animations.length; ++i)
        {
            const animation = this.animations[i];
            if (animation.Update(dt))
            {
                this._isPlaying = true;
                const res = animation.animationRes;

                for (let j = 0; j < animation.trackGroups.length; ++j)
                {
                    for (let k = 0; k < animation.trackGroups[j].transformTracks.length; ++k)
                    {
                        const track = animation.trackGroups[j].transformTracks[k];
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

                        mat4.fromMat3(track.bone.localTransform, scale);
                        mat4.multiply(track.bone.localTransform, track.bone.localTransform, mat4.fromQuat(rotationMat, orientation));
                        track.bone.localTransform[12] = position[0];
                        track.bone.localTransform[13] = position[1];
                        track.bone.localTransform[14] = position[2];
                    }
                }
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
                controller.emit("added", { controller, animation });
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
                Tw2AnimationController.AddModel(controller, resource.models[i]);
            }
        }

        for (let i = 0; i < controller.geometryResources.length; ++i)
        {
            this.AddAnimationsFromRes(controller, controller.geometryResources[i]);
        }

        if (resource.models.length === 0)
        {
            for (let i = 0; i < resource.meshes.length; ++i)
            {
                Tw2GeometryRes.BindMeshToModel(resource.meshes[i], controller.geometryResources[0].models[0], resource);
            }
            resource.models.push(controller.geometryResources[0].models[0]);
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
        controller.emit("loaded", { controller });

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
                        controller._pendingCommands[i].func.apply(controller, controller._pendingCommands[i].args);
                    }
                }
            }
            controller._pendingCommands.splice(0);
        }
    }

    /**
     * Global and Scratch variables
     */
    static global = {
        vec3_0: vec3.create(),
        quat_0: quat.create(),
        mat3_0: mat3.create(),
        mat4_0: mat4.create()
    };

    /**
     * Editable class keys
     * @type {{primary: [string]}}
     * @private
     */
    static keys = {
        primary: [ "update" ]
    };

}

