import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { Tw2PerObjectData } from "core";
import { EveChild } from "./EveChild";


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

    @meta.notImplemented
    @meta.float
    lodSphereRadius = 0;

    @meta.struct("Tw2InstancedMesh")
    mesh = null;

    @meta.notImplemented
    @meta.float
    minScreenSize = 0;

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

    @meta.notImplemented
    @meta.boolean
    useDynamicLod = false;

    @meta.boolean
    useSRT = true;


    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);


    /**
     * Updates lod
     * @param {Tw2Frustum} frustum
     * @param {Number} parentLod
     */
    UpdateLod(frustum, parentLod)
    {
        this._lod = !frustum.IsSphereVisible(this.translation, this.lodSphereRadius) ? 0 : 3;
        //this._lod = Math.min(this._lod, parentLod);
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
        if (!this.display || ray.IsMasked(this)) return null;
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
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
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
            this.particleEmitters[i].Update(dt);
        }

        for (let i = 0; i < this.particleSystems.length; ++i)
        {
            this.particleSystems[i].Update(dt);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || !this.mesh) return false;
        mat4.transpose(this._perObjectData.ffe.Get("world"), this._worldTransform);
        mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this._worldTransform);
        return this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

}
