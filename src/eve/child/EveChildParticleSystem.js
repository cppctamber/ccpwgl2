import { meta } from "utils";
import { mat4, quat, sph3, vec3 } from "math";
import { Tw2PerObjectData } from "core";
import { Tr2Lod } from "constant/ccpwgl";
import { EveChild } from "./EveChild";
import { Tw2GpuParticleRenderer } from "particle/gpu/Tw2GpuParticleRenderer";


@meta.define("EveChildParticleSystem", true)
@meta.stage(1)
export class EveChildParticleSystem extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.matrix4
    localTransform = mat4.create();

    @meta.float
    lodSphereRadius = 0;

    @meta.uint
    lodClampLow = 5;

    @meta.float
    lodFactorLow = 0.125;

    @meta.float
    lodFactorMedium = 0.25;

    @meta.struct("Tw2InstancedMesh")
    mesh = null;

    @meta.float
    minScreenSize = 0;

    @meta.float
    currentScreenSize = -1;

    @meta.list("Tw2ParticleEmitter")
    particleEmitters = [];

    @meta.list([ "Tw2ParticleSystem", "Tr2GpuParticleSystem" ])
    particleSystems = [];

    @meta.uint
    reflectionMode = 3;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    @meta.list()
    transformModifiers = [];

    @meta.boolean
    useDynamicLod = false;

    @meta.boolean
    staticTransform = false;

    @meta.boolean
    useSRT = true;


    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);
    _lodSphere = sph3.create();
    _isVisible = true;
    _hasUpdated = false;


    /** Refreshes the authored particle LOD sphere in world space. */
    PrepareLod(parentTransform)
    {
        if (parentTransform)
        {
            mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
        }

        if (this.lodSphereRadius > 0)
        {
            sph3.set(this._lodSphere, 0, 0, 0, this.lodSphereRadius);
            sph3.transformMat4(this._lodSphere, this._lodSphere, this._worldTransform);
        }
    }

    /**
     * Particle geometry bounds are not available from Tw2InstancedMesh yet.
     * The authored LOD sphere controls screen-size policy only; it is not a
     * substitute for Carbon's separate mesh-derived bounding sphere.
     */
    GetBoundingSphere(_out)
    {
        return null;
    }


    /**
     * Updates lod
     * @param {EveUpdateContext} updateContext
     * @param {Number} parentLodLevel
     * @param {mat4} [parentTransform]
     */
    UpdateLod(updateContext, parentLodLevel, parentTransform)
    {
        super.UpdateLod(updateContext, parentLodLevel, parentTransform);

        this.PrepareLod(parentTransform);

        this._isVisible = this.display && this._hasUpdated;
        this.currentScreenSize = -1;

        // Carbon frustum-tests a separate mesh-derived bounding sphere, which
        // Tw2InstancedMesh cannot provide yet. Fail open for frustum visibility
        // and use the authored LOD sphere only for projected-size policy.
        if (this._isVisible && this.lodSphereRadius > 0)
        {
            const frustum = updateContext.GetFrustum();
            this.currentScreenSize = frustum.GetPixelSizeAcrossEst(this._lodSphere, this._lodSphere[3]);
            this._isVisible = this.currentScreenSize >= this.minScreenSize * updateContext.GetLodFactor();
        }

        if (this._isVisible)
        {
            for (let i = 0; i < this.particleSystems.length; i++)
            {
                this.particleSystems[i].UpdateViewDependentData();
            }
        }
    }

    /** Applies Carbon's dynamic CPU/GPU particle budget for the logical tier. */
    ChangeLOD(lodLevel)
    {
        super.ChangeLOD(lodLevel);
        if (!this.useDynamicLod) return;

        for (let i = 0; i < this.particleSystems.length; i++)
        {
            const
                system = this.particleSystems[i],
                original = system.GetOriginalMaxParticles();

            let particleCount = original;
            if (lodLevel === Tr2Lod.TR2_LOD_LOW)
            {
                particleCount = Math.min(this.lodClampLow, Math.trunc(original * this.lodFactorLow));
            }
            else if (lodLevel === Tr2Lod.TR2_LOD_MEDIUM)
            {
                particleCount = Math.trunc(original * this.lodFactorMedium);
            }

            system.SetMaxParticleCount(particleCount);
        }
    }

    /** Restores the default visible state. */
    ResetLod()
    {
        this.ChangeLOD(Tr2Lod.TR2_LOD_HIGH);
        this._isVisible = true;
        this.currentScreenSize = -1;
    }

    /**
     * Intersects the emitter's mesh.
     *
     * The MESH only, never the particles. A particle is transient by
     * definition - it exists for a few frames and is gone - so a hit on one
     * names something that will not be there when the caller acts on it, and
     * a selection that dies on its own is worse than no selection. What is
     * pickable here is the emitter.
     *
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} [_worldTransform] - the parent's, unused; see EveChildMesh
     * @param {Object} [cache]
     * @returns {?Object} the intersection, if any
     */
    Intersect(ray, intersects, _worldTransform, cache)
    {
        if (!this.display || !this._isVisible || ray.IsMasked(this)) return null;
        if (ray.GetOption("effectChildren", "skip")) return null;
        if (!this.mesh || !this.mesh.Intersect) return null;

        const before = intersects.length;
        this.mesh.Intersect(ray, intersects, this._worldTransform, cache);

        for (let i = before; i < intersects.length; i++)
        {
            if (!intersects[i].item) intersects[i].item = this;
            if (!intersects[i].name) intersects[i].name = this.name || "";
        }

        return intersects.length > before ? intersects[before] : null;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);

        for (let i = 0; i < this.particleEmitters.length; i++)
        {
            this.particleEmitters[i].GetResources(out);
        }

        for (let i = 0; i < this.particleSystems.length; i++)
        {
            this.particleSystems[i].GetResources(out);
        }

        return out;
    }


    /**
     * Scratch for the GPU emitter arguments.
     *
     * Reused: the emitter reads it during the call and retains nothing, so one
     * object serves every emitter in the scene rather than allocating per
     * emitter per frame.
     * @type {Object}
     */
    static global = {
        emitArguments: { system: null, time: 0, parentTransform: null }
    };

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform = EveChild.IDENTITY)
    {
        if (this.useSRT)
        {
            quat.normalize(this.rotation, this.rotation);
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        mat4.copy(this._worldTransformLast, this._worldTransform);
        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);

        for (let i = 0; i < this.particleSystems.length; ++i)
        {
            if (this.particleSystems[i].UpdateTransform)
            {
                this.particleSystems[i].UpdateTransform(this._worldTransform);
            }
        }

        for (let i = 0; i < this.particleEmitters.length; ++i)
        {
            const emitter = this.particleEmitters[i];

            // TWO KINDS OF EMITTER SHARE THIS LIST, and they take different
            // arguments. A CPU emitter takes `dt`; a GPU emitter takes an
            // arguments object, because it needs the system to hand its batch
            // to and the transform that places it in the world.
            //
            // It cannot get the system from here: this holder's own
            // `particleSystems` list is EMPTY for GPU emitters in the shipped
            // data - checked across `res:/fisfx/**` - which matches Carbon,
            // where the system belongs to the scene. So it comes from the one
            // renderer. See Tw2GpuParticleRenderer for why there is one.
            if (emitter.isGpuEmitter)
            {
                emitter.Update(Tw2GpuParticleRenderer.Get().GetEmitArguments(
                    EveChildParticleSystem.global.emitArguments,
                    this._worldTransform
                ));
            }
            else
            {
                emitter.Update(dt);
            }
        }

        for (let i = 0; i < this.particleSystems.length; ++i)
        {
            this.particleSystems[i].Update(dt);
        }

        this._hasUpdated = true;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || !this._isVisible || !this.mesh) return false;
        mat4.transpose(this._perObjectData.ffe.Get("world"), this._worldTransform);
        mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this._worldTransform);
        return this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

}
