import { meta } from "utils";
import { mat3, mat4, quat, vec3 } from "math";
import { sampleDegreeOneCurve } from "core/geometry/sampleDegreeOneCurve.js";


/**
 * Carbon's granny animation updater, as a read-only definition.
 *
 * This is the general class every `animationUpdater` names — a ship's child
 * mesh, a station's, anything Carbon hands an `ITr2AnimationUpdater`. It is
 * declared so those containers can be READ; nothing here plays an animation.
 *
 * ## Why it is not `Tr2InteriorAnimationController`
 *
 * That class claimed this ccp name and is not this class. It is the character
 * editor's animation controller — additive blend modes, layer weights, additive
 * masks, reference clips — and it extends `Tw2AnimationController`. Of Carbon's
 * four persisted attributes it has exactly one, `boneOffset`, and none of
 * `resPath_`, `grannyRes` or `model_`.
 *
 * So a ship reading `animationUpdater` was constructing the character editor's
 * controller: the wrong type, missing three of the four properties the wire
 * actually carries. The interior controller keeps its own name, which is what
 * `Tr2IntSkinnedObject` already references it by.
 *
 * ## What is here
 *
 * Only the persisted attributes, from `Tr2GrannyAnimation_Blue.cpp:22-25`:
 *
 * - `resPath_` and `model_` are `PERSISTONLY` — they exist on the wire and are
 *   read back through the `resPath` / `model` properties, which is why the
 *   trailing underscore is part of the name rather than a typo.
 * - `grannyRes` is `READ`: Carbon resolves it from `resPath` rather than
 *   storing it, so it appears in a document only as an already-loaded handle.
 *
 * `debugRenderSkeleton`, `debugRenderJointNames` and `animationEnabled` are
 * `READWRITE` without `PERSIST`, so they are runtime state and never on the
 * wire. They are deliberately absent rather than declared and ignored.
 *
 * ## What it does
 *
 * The mesh-bound case: an updater serialised with **no `resPath`**, which
 * animates from the geometry its child mesh has already loaded. That is how
 * `dragon_keepstar_fx.black` serialises it — zero properties, the string table
 * running `animationUpdater` → `Tr2GrannyAnimation` → `scaling`.
 *
 * It binds to the shared resource, resolves the skeleton, poses it, plays one
 * clip at a time and emits the bone palette. Before anything is played the pose
 * is the rest pose, which Carbon also produces for this case
 * (`RebuildCachedData` ends with an immediate `PrePhysicsAnimation`, guarded on
 * the geometry res, so a mesh-bound updater that is never stepped still yields a
 * valid pose; a `resPath` updater that is never stepped yields null transforms).
 *
 * Nothing here starts a clip. The container's own controller graph does, through
 * `Tr2ActionPlayMeshAnimation`.
 *
 * Not implemented: the `resPath_` load path, `boneOffset`, animation layers,
 * masks, crossfades and debug rendering.
 *
 * ## Ordering is load-bearing
 *
 * `SetUseMeshBinding(true)` must be called **before** `SetSharedGeometryRes()`.
 * Attaching a resource registers a notification, and an already-prepared
 * resource dispatches **synchronously** — the rebuild reads the flag. Reversed,
 * a warm resource initialises in the wrong mode.
 */
@meta.type("Tr2GrannyAnimation")
export class Tr2GrannyAnimation extends meta.Model
{

    @meta.string
    name = "";

    /**
     * The granny file holding the animations. `PERSISTONLY` in Carbon.
     *
     * Marked because an updater carrying one loads its own geometry, and that
     * path is not ported — `EveChildMesh` leaves such an updater alone rather
     * than binding it to the wrong resource.
     */
    @meta.notImplemented
    @meta.path
    resPath_ = "";

    /** The model within that file. `PERSISTONLY` in Carbon. */
    @meta.string
    model_ = "";

    /** Resolved from `resPath` rather than stored; `READ` in Carbon. */
    @meta.notImplemented
    @meta.struct()
    grannyRes = null;

    /** Per-bone post-animation offsets. */
    @meta.notImplemented
    @meta.struct()
    boneOffset = null;


    // Runtime state. Not `@meta` — none of this is on the wire.

    _useMeshBinding = false;
    _geometryRes = null;
    _modelIndex = 0;

    /**
     * Skeleton-space bone state, one entry per `model.skeleton.bones` entry.
     * @type {Array<{ boneRes: Tw2GeometryBone, localTransform: mat4, worldTransform: mat4, offsetTransform: mat4 }>}
     */
    _bones = [];

    /**
     * Mesh-space palettes, keyed by the mesh's index in `res.meshes`. Each holds
     * the skeleton indices its mesh bones resolve to, and the flat array handed
     * to the GPU: 12 floats per mesh bone, three `float4` rows of a transposed
     * 4x3.
     * @type {Map<Number, { indices: Int32Array, array: Float32Array }>}
     */
    _palettes = new Map();

    /** The resource `_bones` and `_palettes` were built from, so a re-notify is cheap. */
    _rebuiltFrom = null;

    /**
     * The clip being played, or null. One at a time: Carbon's layers, masks and
     * crossfades are not ported, and nothing on the ship path asks for them.
     * @type {?{ res: Tw2GeometryAnimation, name: String, duration: Number, time: Number, cycle: Boolean, timeScale: Number, playing: Boolean, callback: ?Function, tracks: Array }}
     */
    _player = null;

    /** A clip asked for before the geometry arrived, replayed once it does. */
    _pending = null;


    /**
     * Sets whether the updater poses the geometry its mesh already owns, rather
     * than loading its own from `resPath`.
     *
     * Must be set before {@link SetSharedGeometryRes}.
     * @param {Boolean} bool
     */
    SetUseMeshBinding(bool)
    {
        this._useMeshBinding = !!bool;
    }

    /**
     * Attaches the geometry resource the child mesh has loaded.
     *
     * The resource is shared and path-cached — it belongs to the mesh, not to
     * this updater, so it is never loaded or purged here.
     * @param {Tw2GeometryRes} res
     */
    SetSharedGeometryRes(res)
    {
        if (this._geometryRes === res) return;

        if (this._geometryRes)
        {
            this._geometryRes.UnregisterNotification(this);
        }

        this._geometryRes = res || null;
        this._rebuiltFrom = null;
        this._bones = [];
        this._palettes.clear();

        // Registering dispatches immediately for an already-prepared resource,
        // which is why the mesh binding flag has to be set by now.
        if (this._geometryRes) this._geometryRes.RegisterNotification(this);
    }

    /**
     * Resource notification
     * @param {Tw2GeometryRes} res
     */
    OnResPrepared(res)
    {
        if (res === this._geometryRes) this.RebuildCachedData();
    }

    /**
     * Builds the skeleton state and the per-mesh palettes, then poses them.
     *
     * Idempotent per resource: a second notification for the same prepared
     * resource is a no-op.
     * @returns {Boolean} true if cached data is built
     */
    RebuildCachedData()
    {
        const res = this._geometryRes;
        if (!res || !res.IsGood()) return false;
        if (this._rebuiltFrom === res) return true;
        if (!this._useMeshBinding) return false;

        const model = res.models[this._modelIndex];
        const bones = model && model.skeleton ? model.skeleton.bones : null;
        if (!bones || !bones.length) return false;

        this._bones = bones.map(boneRes => ({
            boneRes,
            localTransform: mat4.create(),
            worldTransform: mat4.create(),
            offsetTransform: mat4.create()
        }));

        this._palettes.clear();

        for (let i = 0; i < model.meshBindings.length; i++)
        {
            const
                binding = model.meshBindings[i],
                meshIndex = res.meshes.indexOf(binding.mesh);

            if (meshIndex === -1) continue;

            // `binding.bones` is already the mesh -> skeleton map: the reader
            // resolves it by bone name at load, substituting a fallback bone
            // rather than leaving a hole, so there is no unmatched index here.
            const indices = new Int32Array(binding.bones.length);
            for (let b = 0; b < binding.bones.length; b++)
            {
                indices[b] = bones.indexOf(binding.bones[b]);
            }

            this._palettes.set(meshIndex, {
                indices,
                array: new Float32Array(binding.bones.length * 12)
            });
        }

        this._rebuiltFrom = res;
        this.ResetBoneTransforms();
        this.UpdateBoneMatrices();

        // A clip asked for before the geometry arrived. The controller graph
        // starts on its owner's first update, which is routinely earlier than
        // the resource being good, so this is the normal path rather than a
        // corner case.
        if (this._pending)
        {
            const pending = this._pending;
            this._pending = null;
            this.PlayAnimation(pending.name, pending.options);
        }

        return true;
    }

    /**
     * Gets the clips the geometry carries.
     * @returns {Array<Tw2GeometryAnimation>}
     */
    GetAnimations()
    {
        const res = this._geometryRes;
        return res && res.animations ? res.animations : [];
    }

    /**
     * Finds a clip by name.
     * @param {String} name
     * @returns {?Tw2GeometryAnimation}
     */
    GetAnimation(name)
    {
        return this.GetAnimations().find(animation => animation.name === name) || null;
    }

    /**
     * @returns {Boolean} true while a clip is advancing
     */
    IsPlaying()
    {
        return !!(this._player && this._player.playing);
    }

    /**
     * Plays a clip carried by the mesh's geometry.
     *
     * Called by `Tr2ActionPlayMeshAnimation` when the container's state machine
     * enters the state that owns the action, which happens on its own — nothing
     * here or in `EveChildMesh` starts a clip.
     * @param {String} name
     * @param {Object} [options]
     * @param {Boolean} [options.cycle]
     * @param {Number} [options.timeScale=1]
     * @param {Function} [options.callback] - fired once a non-cycling clip ends
     * @returns {Boolean} true if the clip is now playing
     */
    PlayAnimation(name, options = {})
    {
        if (!this._rebuiltFrom && !this.RebuildCachedData())
        {
            // Queue rather than refuse: the resource is simply not here yet.
            this._pending = { name, options };
            return false;
        }

        const res = this.GetAnimation(name);
        if (!res) return false;

        const tracks = this.BuildTrackBindings(res);
        this._player = {
            res,
            name,
            duration: res.duration || 0,
            time: 0,
            cycle: !!options.cycle,
            timeScale: Number.isFinite(options.timeScale) ? options.timeScale : 1,
            callback: typeof options.callback === "function" ? options.callback : null,
            playing: true,
            tracks
        };

        return true;
    }

    /**
     * Stops the current clip, leaving the pose where it stopped.
     *
     * Carbon holds the last sampled frame rather than snapping back to rest, and
     * so does this.
     * @param {String} [name] - only stops if it matches the playing clip
     * @returns {Boolean} true if a clip was stopped
     */
    StopAnimation(name)
    {
        if (!this._player) return false;
        if (name !== undefined && this._player.name !== name) return false;

        this._player.playing = false;
        return true;
    }

    /**
     * Binds a clip's transform tracks to skeleton bone indices.
     *
     * A clip carries a track group per model; only the group naming this
     * updater's model applies, and within it only tracks whose name matches a
     * bone. Anything unmatched is dropped here rather than tested per frame.
     * @param {Tw2GeometryAnimation} animation
     * @returns {Array<{ index: Number, track: Tw2GeometryTransformTrack }>}
     */
    BuildTrackBindings(animation)
    {
        const
            model = this._geometryRes.models[this._modelIndex],
            bones = this._bones,
            out = [];

        for (let g = 0; g < animation.trackGroups.length; g++)
        {
            const group = animation.trackGroups[g];
            if (group.model && group.model !== model) continue;
            if (!group.model && group.name && model.name && group.name !== model.name) continue;

            for (let t = 0; t < group.transformTracks.length; t++)
            {
                const
                    track = group.transformTracks[t],
                    index = bones.findIndex(bone => bone.boneRes.name === track.name);

                if (index !== -1) out.push({ index, track });
            }
        }

        return out;
    }

    /**
     * Advances the current clip and re-poses the skeleton.
     *
     * With nothing playing this is inert — the pose persists, which is what
     * Carbon does too.
     * @param {Number} dt
     */
    Update(dt)
    {
        const player = this._player;
        if (!player || !player.playing) return;

        player.time += (Number.isFinite(dt) ? dt : 0) * player.timeScale;

        if (player.duration > 0)
        {
            if (player.cycle)
            {
                player.time = ((player.time % player.duration) + player.duration) % player.duration;
            }
            else if (player.time >= player.duration)
            {
                player.time = player.duration;
                player.playing = false;
            }
        }

        this.SampleBoneTransforms(player);
        this.UpdateWorldTransforms();
        this.UpdateBoneMatrices();

        if (!player.playing && player.callback)
        {
            const callback = player.callback;
            player.callback = null;
            callback(this, player.name);
        }
    }

    /**
     * Writes a clip's sampled pose into the bone local transforms.
     *
     * Every bone starts from its rest local, because a clip animates only the
     * bones it carries tracks for and the rest must not drift.
     * @param {Object} player
     */
    SampleBoneTransforms(player)
    {
        for (let i = 0; i < this._bones.length; i++)
        {
            mat4.copy(this._bones[i].localTransform, this._bones[i].boneRes.localTransform);
        }

        const { position, orientation, scaleShear, rotation } = Tr2GrannyAnimation.global;

        for (let i = 0; i < player.tracks.length; i++)
        {
            const
                { index, track } = player.tracks[i],
                bone = this._bones[index],
                rest = bone.boneRes;

            vec3.copy(position, rest.position);
            quat.copy(orientation, rest.orientation);
            for (let m = 0; m < 9; m++) scaleShear[m] = rest.scaleShear[m];

            if (track.position)
            {
                sampleDegreeOneCurve(position, track.position, player.time, player.cycle, player.duration);
            }

            if (track.orientation)
            {
                sampleDegreeOneCurve(orientation, track.orientation, player.time, player.cycle, player.duration, true);
            }

            if (track.scaleShear)
            {
                sampleDegreeOneCurve(scaleShear, track.scaleShear, player.time, player.cycle, player.duration);
            }

            // Same composition as Tw2GeometryBone.UpdateTransform: scale/shear,
            // then rotation, then translation written into the fourth row.
            mat4.fromMat3(bone.localTransform, scaleShear);
            mat4.multiply(bone.localTransform, bone.localTransform, mat4.fromQuat(rotation, orientation));
            bone.localTransform[12] = position[0];
            bone.localTransform[13] = position[1];
            bone.localTransform[14] = position[2];
        }
    }

    /**
     * Poses every bone at rest and recomputes its offset transform.
     *
     * Composition is `child * parent` in Carbon's row-vector convention, which
     * is `mat4.multiply(out, parent, local)` here because ccpwgl's `mat4` is
     * stock gl-matrix. The skin matrix is `invBind * world`, likewise operands
     * swapped.
     */
    ResetBoneTransforms()
    {
        for (let i = 0; i < this._bones.length; i++)
        {
            mat4.copy(this._bones[i].localTransform, this._bones[i].boneRes.localTransform);
        }

        this.UpdateWorldTransforms();
    }

    /**
     * Recomputes world and offset transforms from the current bone locals.
     *
     * Bones are in parent-before-child order, so one pass suffices.
     */
    UpdateWorldTransforms()
    {
        for (let i = 0; i < this._bones.length; i++)
        {
            const
                bone = this._bones[i],
                parentIndex = bone.boneRes.parentIndex;

            if (parentIndex !== -1 && this._bones[parentIndex])
            {
                mat4.multiply(bone.worldTransform, this._bones[parentIndex].worldTransform, bone.localTransform);
            }
            else
            {
                mat4.copy(bone.worldTransform, bone.localTransform);
            }

            mat4.multiply(bone.offsetTransform, bone.worldTransform, bone.boneRes.worldTransformInv);
        }
    }

    /**
     * Writes the current pose into every mesh palette.
     */
    UpdateBoneMatrices()
    {
        for (const palette of this._palettes.values())
        {
            const { indices, array } = palette;

            for (let b = 0; b < indices.length; b++)
            {
                const
                    bone = this._bones[indices[b]],
                    offset = b * 12;

                if (!bone)
                {
                    // Identity rather than left uninitialised, which is what
                    // Carbon does here.
                    array[offset + 0] = array[offset + 5] = array[offset + 10] = 1;
                    continue;
                }

                const tr = bone.offsetTransform;

                array[offset + 0] = tr[0];
                array[offset + 1] = tr[4];
                array[offset + 2] = tr[8];
                array[offset + 3] = tr[12];

                array[offset + 4] = tr[1];
                array[offset + 5] = tr[5];
                array[offset + 6] = tr[9];
                array[offset + 7] = tr[13];

                array[offset + 8] = tr[2];
                array[offset + 9] = tr[6];
                array[offset + 10] = tr[10];
                array[offset + 11] = tr[14];
            }
        }
    }

    /**
     * Gets a mesh's bone palette.
     * @param {Number} [meshIndex=0]
     * @returns {Float32Array} empty until the geometry resource is prepared
     */
    GetBoneMatrices(meshIndex = 0)
    {
        const palette = this._palettes.get(meshIndex);
        return palette ? palette.array : Tr2GrannyAnimation.EMPTY;
    }

    /**
     * Gets the number of bones in a mesh's palette.
     * @param {Number} [meshIndex=0]
     * @returns {Number}
     */
    GetBoneCount(meshIndex = 0)
    {
        const palette = this._palettes.get(meshIndex);
        return palette ? palette.indices.length : 0;
    }

    static EMPTY = new Float32Array(0);

    static global = {
        position: vec3.create(),
        orientation: quat.create(),
        scaleShear: mat3.create(),
        rotation: mat4.create()
    };

}
