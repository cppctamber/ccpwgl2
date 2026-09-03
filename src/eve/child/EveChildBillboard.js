import { meta } from "utils";
import { device } from "global";
import { vec3, quat, mat4 } from "math";
import { Tw2PerObjectData } from "core";
import { EveChild } from "./EveChild";


@meta.define("EveChildBillboard", true)
@meta.todo("Deprecated?")
export class EveChildBillboard extends EveChild
{

    @meta.boolean
    display = true;

    @meta.matrix4
    localTransform = mat4.create();

    @meta.uint
    lowestLodVisible = 2;

    @meta.struct([ "Tw2Mesh", "Tw2InstancedMesh" ])
    mesh = null;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    translation = vec3.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.boolean
    staticTransform = false;

    @meta.boolean
    useSRT = true;


    _perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);
    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();


    /**
     * Intersects this child.
     *
     * The incoming `worldTransform` is the PARENT's, and is deliberately not
     * used: `_worldTransform` is rebuilt every frame by Update and already
     * carries the parent, the bone and every transform modifier. Composing
     * the parent again would apply it twice, and re-deriving from
     * `localTransform` would answer the bind pose for anything animated -
     * which is exactly the case a hit test on a moving part has to get right.
     *
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} [_worldTransform] - the parent's, unused; see above
     * @param {Object} [cache]
     * @returns {?Object} the intersection, if any
     */
    Intersect(ray, intersects, _worldTransform, cache)
    {
        if (!this.display || this.lodLevel < this.lowestLodVisible || ray.IsMasked(this)) return null;
        if (ray.GetOption("effectChildren", "skip")) return null;

        const target = this.mesh;
        if (!target || !target.Intersect) return null;

        const before = intersects.length;
        target.Intersect(ray, intersects, this._worldTransform, cache);

        // Name the child rather than the mesh: a caller picking in a scene
        // wants the thing it can select, and the mesh is an implementation
        // detail of it.
        for (let i = before; i < intersects.length; i++)
        {
            if (!intersects[i].item) intersects[i].item = this;
            if (!intersects[i].name) intersects[i].name = this.name || "";
        }

        // No segment of its own: a parent names its children, because only
        // the parent knows which property they hang off. This is a leaf.
        return intersects.length > before ? intersects[before] : null;
    }

    /**
     * Gets the child's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>} out
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
     */
    Update(dt, parentTransform)
    {
        mat4.copy(this._worldTransformLast, this._worldTransform);
        this.PrepareLod(parentTransform);
    }

    /** Rebuilds the current camera-facing transform before logical LOD. */
    PrepareLod(parentTransform)
    {
        if (this.useSRT)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);

        const
            viewInverse = EveChild.global.mat4_0,
            finalScale = EveChild.global.vec3_0;

        mat4.lookAt(viewInverse, device.eyePosition, this._worldTransform.subarray(12), [ 0, 1, 0 ]);
        mat4.transpose(viewInverse, viewInverse);
        mat4.getScaling(finalScale, parentTransform);
        vec3.multiply(finalScale, finalScale, this.scaling);

        this._worldTransform[0] = viewInverse[0] * finalScale[0];
        this._worldTransform[1] = viewInverse[1] * finalScale[0];
        this._worldTransform[2] = viewInverse[2] * finalScale[0];
        this._worldTransform[4] = viewInverse[4] * finalScale[1];
        this._worldTransform[5] = viewInverse[5] * finalScale[1];
        this._worldTransform[6] = viewInverse[6] * finalScale[1];
        this._worldTransform[8] = viewInverse[8] * finalScale[2];
        this._worldTransform[9] = viewInverse[9] * finalScale[2];
        this._worldTransform[10] = viewInverse[10] * finalScale[2];
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || !this.mesh || !this.mesh.IsGood() || this.lodLevel < this.lowestLodVisible)
        {
            return false;
        }

        mat4.transpose(this._perObjectData.ffe.Get("world"), this._worldTransform);
        mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this._worldTransform);
        return this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

}
