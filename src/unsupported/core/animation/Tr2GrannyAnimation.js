import { meta } from "utils";
import { mat4 } from "math";


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
 * ## What it does so far
 *
 * The mesh-bound case only: an updater serialised with **no `resPath`**, which
 * animates from the geometry its child mesh has already loaded. That is how
 * `dragon_keepstar_fx.black` serialises it — zero properties, the string table
 * running `animationUpdater` → `Tr2GrannyAnimation` → `scaling`.
 *
 * Implemented here: binding to a shared geometry resource, resolving the
 * skeleton, and posing it. **No animation is sampled yet** — the pose is the
 * rest pose, which Carbon also produces for this case (`RebuildCachedData` ends
 * with an immediate `PrePhysicsAnimation`, guarded on the geometry res, so a
 * mesh-bound updater that is never stepped still yields a valid pose; a
 * `resPath` updater that is never stepped yields null transforms).
 *
 * Not implemented: the `resPath_` load path, `boneOffset`, animation sampling,
 * layers, masks and debug rendering.
 *
 * ## Ordering is load-bearing
 *
 * `SetUseMeshBinding(true)` must be called **before** `SetSharedGeometryRes()`.
 * Attaching a resource registers a notification, and an already-prepared
 * resource dispatches **synchronously** — the rebuild reads the flag. Reversed,
 * a warm resource initialises in the wrong mode.
 */
@meta.type("Tr2GrannyAnimation")
@meta.notImplemented
export class Tr2GrannyAnimation extends meta.Model
{

    @meta.string
    name = "";

    /** The granny file holding the animations. `PERSISTONLY` in Carbon. */
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
        return true;
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
            const
                bone = this._bones[i],
                parentIndex = bone.boneRes.parentIndex;

            mat4.copy(bone.localTransform, bone.boneRes.localTransform);

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

}
