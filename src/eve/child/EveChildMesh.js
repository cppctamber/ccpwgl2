import { meta } from "utils";
import { vec3, quat, mat4 } from "math";
import { GLESPerObjectDataEveSpaceObject, Tw2PerObjectData, Tw2RawData } from "core";
import { EveChild } from "./EveChild";


@meta.type("EveChildMesh", true)
@meta.define({
    wgl: "EveChildMesh",
    ccp: true
})
export class EveChildMesh extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    castShadow = false;

    @meta.list()
    lights = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.notImplemented
    @meta.uint
    lowestLodVisible = 2;

    @meta.struct([ "Tw2Mesh", "Tw2InstancedMesh" ])
    mesh = null;

    /**
     * Granny animation exposure — Carbon's `Tr2GrannyAnimationPtr
     * m_animationUpdater` (`EveChildMesh.h:231`, mapped at
     * `EveChildMesh_Blue.cpp:34-38`), which `Tr2InteriorAnimationController`
     * already answers to.
     *
     * Declared so the container can be READ. Without it the reader refuses the
     * whole file — `dragon_keepstar_fx.black` fails on this property and takes
     * every child object in it down, so an animation nobody drives cost the
     * entire effect.
     *
     * Bound and posed from {@link Update}, mirroring Carbon
     * (`EveChildMesh.cpp:211-222`). No animation is sampled yet, so this
     * supplies the rest pose — which is still the right palette to send, since
     * the alternative is inheriting the parent's and indexing it with this
     * mesh's own bones.
     */
    @meta.struct("Tr2GrannyAnimation")
    animationUpdater = null;

    @meta.notImplemented
    @meta.float
    minScreenSize = 0;

    @meta.notImplemented
    @meta.uint
    reflectionType = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.notImplemented
    @meta.float
    sortValueOffset = 0;

    @meta.notImplemented
    @meta.boolean
    staticTransform = false;

    @meta.notImplemented
    @meta.list("EveChildModifier")
    transformModifiers = [];

    @meta.vector3
    translation = vec3.create();

    @meta.boolean
    updateAnimation = true;

    @meta.boolean
    useSRT = true;

    @meta.boolean
    useSpaceObjectData = true;

    @meta.uint
    @meta.notImplemented
    reflectionMode = 3;

    _hasBone = false;
    _boneTransform = null;
    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = null;
    _perObjectDataBagOfStuff = {};
    _usesFfe = false;


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);
        return out;
    }


    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData|} perObjectData
     */
    Update(dt, parentTransform, perObjectData)
    {
        mat4.copy(this._worldTransformLast, this._worldTransform);

        if (this.useSRT)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        this.UpdateAnimation(dt);

        // The object or a modifier can set a bone
        this._hasBone = false;

        // Get bone transform
        // This may be unnecessary if there is a bone modifier
        if (this.boneIndex > -1)
        {
            const
                bones = EveChild.GetJointMatrices(perObjectData),
                offset = this.boneIndex;

            if (bones && (bones[offset] || bones[offset + 4] || bones[offset + 8]))
            {
                if (!this._boneTransform) this._boneTransform = mat4.create();
                mat4.fromJointMatIndex(this._boneTransform, bones, offset);
                this._hasBone = true;
            }
        }

        // Two passes, matching Carbon's ordering. See EveChildContainer.Update for
        // the full reasoning: Carbon applies transform modifiers to the WORLD
        // transform (EveChildContainer.cpp:555-558), and every `ApplyTransform`
        // modifier is camera or world relative, so running them against
        // `localTransform` compared a world-space eye position with a local
        // translation and camera-facing children did not face the camera.
        //
        // `Modify` modifiers mutate local or bone state and must still run first.
        let updatedWorld = false;
        for (let i = 0; i < this.transformModifiers.length; i++)
        {
            const modifier = this.transformModifiers[i];

            if (!("ApplyTransform" in modifier) && "Modify" in modifier)
            {
                if (modifier.Modify(this, perObjectData, parentTransform))
                {
                    updatedWorld = true;
                }
            }
        }

        if (!this._hasBone) this._boneTransform = null;

        if (!updatedWorld)
        {
            if (this._hasBone)
            {
                mat4.multiply(this._worldTransform, this._boneTransform, this.localTransform);
                mat4.multiply(this._worldTransform, parentTransform, this._worldTransform);
            }
            else
            {
                mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
            }
        }

        for (let i = 0; i < this.transformModifiers.length; i++)
        {
            const modifier = this.transformModifiers[i];

            if ("ApplyTransform" in modifier)
            {
                modifier.ApplyTransform(this._worldTransform);
            }
        }
    }

    /**
     * Binds the animation updater to the geometry this mesh has already loaded,
     * and steps it.
     *
     * Binding happens here rather than at construction because the resource is
     * fetched asynchronously — the first tick it is good is the earliest it can
     * be bound, and rebinding the same resource is a no-op.
     *
     * Only the mesh-bound case is handled: an updater carrying a `resPath` loads
     * its own geometry, which is not ported.
     * @param {Number} dt
     */
    UpdateAnimation(dt)
    {
        const updater = this.animationUpdater;
        if (!updater || !this.updateAnimation || updater.resPath_) return;

        const res = this.mesh ? this.mesh.geometryResource : null;
        if (!res) return;

        // The flag must be set before the resource is attached — a prepared
        // resource dispatches its notification synchronously and the rebuild
        // reads the flag on the way past.
        updater.SetUseMeshBinding(true);
        updater.SetSharedGeometryRes(res);

        if (updater.Update) updater.Update(dt);
    }

    /**
     * Gets the animation updater, which is what `Tr2ActionPlayMeshAnimation`
     * resolves its destination to.
     *
     * The updater has no `PlayAnimation` yet, so the action declines rather than
     * playing — this is the seam, not the playback.
     * @returns {Tr2GrannyAnimation|null}
     */
    GetAnimationController()
    {
        return this.animationUpdater;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh || this._lod < this.lowestLodVisible) return false;
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (!perObjectData) return false;

        if (this.useSpaceObjectData)
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new GLESPerObjectDataEveSpaceObject();
            }

            GLESPerObjectDataEveSpaceObject.Pack(
                this.GetPerObjectDataBagOfStuff(perObjectData, this._perObjectDataBagOfStuff),
                this._perObjectData
            );

            // On the LEGACY (non-Carbon) bind path only, the space-object layout
            // feeds cb3 while the ffe block feeds cb5. The measured gles2
            // `ubershader.sm_hi` declares `uniform vec4 cb5[4]` - one matrix - and
            // reads no cb3, and ffe used to exist solely on the
            // `useSpaceObjectData === false` branch, so an ubershader child on
            // that path rendered with no world transform of its own.
            //
            // Scope: this says nothing about the Carbon/dx11 path, which does not
            // consult ffe at all - the whole block in Tw2Effect that uploads it is
            // behind `!rp.isCarbon`. It also claims nothing about other members of
            // the ubershader family; only ubershader.sm_hi was read.
            //
            // So the block is supplied only to a mesh whose shader ACTUALLY
            // declares cb5, asked of the linked program rather than assumed.
            // Supplying it everywhere would be nearly free - Tw2Effect uploads
            // cb5 only when the program declares it - but "nearly free" is not
            // the same as "known correct", and this way the answer is a fact
            // about the shader instead of a default nobody can check.
            //
            // ONLY the world matrix is written here. ubershader.sm_hi declares
            // cb5[4] - four registers, one matrix - and another shader's
            // PerObjectVS may hold something else from register 4 onward, which
            // worldInverseTranspose would stamp over. The
            // `useSpaceObjectData === false` branch below still writes both,
            // because that is its long-standing behaviour and the shaders taking
            // that path expect it.
            if (this.UsesFixedFunctionData())
            {
                this._EnsureFixedFunctionTransforms(false);
            }
            else if (this._perObjectData.ffe)
            {
                // Drop it so a changed answer takes effect on the next frame:
                // Tw2Effect uploads cb5 whenever `pod.ffe` merely EXISTS, so a
                // populated block left behind would keep feeding it.
                this._perObjectData.ffe = null;
            }
        }
        else
        {
            if (!this._perObjectData)
            {
                this._perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);
            }

            this._EnsureFixedFunctionTransforms();
        }

        return this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

    /**
     * The constant buffer register the fixed function emulation block feeds on
     * the legacy bind path (`Tw2Effect` uploads `pod.ffe` to `cbh[5]`)
     * @type {Number}
     */
    static FFE_REGISTER = 5;

    /**
     * Forces the ffe block on or off regardless of what the shader declares.
     * `null` asks the shader, which is what should normally happen; `true` or
     * `false` override it, which exists so an unrelated rendering regression can
     * be ruled in or out from the console without a rebuild.
     * @type {Boolean|null}
     */
    static FORCE_FFE = null;

    /**
     * Whether this mesh's effects read the fixed function emulation block.
     *
     * Answered from the linked programs, so it is false while the effects are
     * still loading and settles once they are good - hence the re-query rather
     * than a permanent cache. It is cached per mesh only while the answer is
     * true, because a true answer cannot become false for the same effects, and
     * a false one may still be pending.
     * @returns {Boolean}
     */
    UsesFixedFunctionData()
    {
        if (EveChildMesh.FORCE_FFE !== null) return EveChildMesh.FORCE_FFE;
        if (this._usesFfe) return true;
        if (!this.mesh) return false;

        for (let i = 0; i < EveChildMesh.MESH_AREA_TYPES.length; i++)
        {
            const areas = this.mesh[EveChildMesh.MESH_AREA_TYPES[i]];

            if (!areas) continue;

            for (let j = 0; j < areas.length; j++)
            {
                const effect = areas[j] && areas[j].effect;

                if (effect && effect.UsesConstantBuffer && effect.UsesConstantBuffer(EveChildMesh.FFE_REGISTER))
                {
                    this._usesFfe = true;
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * The mesh area lists to search for effects. Tw2Mesh has no accessor that
     * enumerates every area, so the names are listed rather than discovered.
     * @type {Array<String>}
     */
    static MESH_AREA_TYPES = [
        "additiveAreas",
        "decalAreas",
        "depthAreas",
        "depthNormalAreas",
        "distortionAreas",
        "opaqueAreas",
        "opaquePrepassAreas",
        "pickableAreas",
        "transparentAreas"
    ];

    /**
     * Fills the fixed function emulation block with this child's own world
     * transform, creating it if the per-object data does not carry one yet.
     *
     * On the legacy bind path this block is the only source for cb5, which is
     * where the measured gles2 `ubershader.sm_hi` keeps its PerObjectVS matrix.
     * The Carbon path never reads it.
     *
     * @param {Boolean} [withInverse=true] - also write worldInverseTranspose,
     *  which occupies cb5 registers 4-7. Pass false when the shader's cb5 block
     *  is only known to hold the world matrix, so nothing is stamped over the
     *  registers past it.
     * @private
     */
    _EnsureFixedFunctionTransforms(withInverse = true)
    {
        if (!this._perObjectData.ffe)
        {
            this._perObjectData.ffe = Tw2RawData.from(EveChild.perObjectData.ffe);
        }

        mat4.transpose(this._perObjectData.ffe.Get("world"), this._worldTransform);

        if (withInverse)
        {
            mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this._worldTransform);
        }
    }

    /**
     * Gets the child mesh's temporary semantic-ish per-object values.
     * Parent values are read as references and then this child overrides its own transforms.
     * @param {Tw2PerObjectData} perObjectData
     * @param {Object} [out]
     * @returns {Object}
     */
    GetPerObjectDataBagOfStuff(perObjectData, out = {})
    {
        GLESPerObjectDataEveSpaceObject.Unpack(perObjectData, out);

        if (out.boundingSphereRadius === undefined && out.boundingSphereRadiusSq !== undefined)
        {
            out.boundingSphereRadius = Math.sqrt(Math.abs(out.boundingSphereRadiusSq));
        }

        if (!out.boundingSphereCenter && out.clipSphereCenter)
        {
            out.boundingSphereCenter = out.clipSphereCenter;
        }

        delete out.shipData;
        delete out.clipData;
        delete out.clipData1;
        delete out.boundingSphereRadiusSq;
        delete out.clipSphereCenter;
        delete out.clipSphereSignedRadiusSq;

        // Unpack has just copied the parent's bone palette in. If this mesh has
        // its own skeleton, that palette is the wrong one — its bones are the
        // parent's, indexed by this mesh's bindings. Override it.
        //
        // One write covers both backends: the GLES packer puts it in the
        // "JointMat" vs slot, and the Carbon binder reads that same slot when no
        // explicit palette is supplied (Tw2Effect.js:1319-1322).
        if (this.animationUpdater && this.animationUpdater.GetBoneMatrices)
        {
            const
                meshIndex = this.mesh ? this.mesh.meshIndex : 0,
                jointMatrices = this.animationUpdater.GetBoneMatrices(meshIndex);

            if (jointMatrices && jointMatrices.length)
            {
                out.jointMatrices = jointMatrices;
                out.jointCount = this.animationUpdater.GetBoneCount(meshIndex);
            }
        }

        out.source = this;
        out.parentPerObjectData = perObjectData;
        out.perObjectData = this._perObjectData;
        out.legacyPerObjectData = this._perObjectData;
        out.worldTransform = this._worldTransform;
        out.worldTransformLast = this._worldTransformLast;
        out.inverseWorldTransform = null;
        out.inverseWorldTransformTranspose = null;

        return out;
    }

}
