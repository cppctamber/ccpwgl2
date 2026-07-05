/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { vec3, mat4 } from "math";

export class EveChild extends meta.Model
{

    _lod = 3;

    @meta.boolean 
    updateOnDisplay = false;

    get isEffectChild()
    {
        return true;
    }

    /**
     * Updates LOD
     * @param {Tw2Frustum} frustum
     * @param {Number} parentLod
     */
    UpdateLod(frustum, parentLod)
    {
        this._lod = parentLod;
    }

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this._lod = 3;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} [perObjectData]
     */
    // @meta.abstract
    Update(dt, parentTransform, perObjectData)
    {

    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    //@meta.abstract
    GetResources(out = [])
    {
        return out;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Boolean} Returns true if batches accumulated
     */
    //@meta.abstract
    GetBatches(mode, accumulator, perObjectData)
    {
        return false;
    }

    /**
     * Class globals and scratch variables
     * @type {Object}
     */
    static global = {
        mat4_0: mat4.create(),
        vec3_0: vec3.create(),
        mat4_1: mat4.create()
    };

    /**
     * Gets joint matrices from temporary child update data or legacy packed per-object data.
     * Prefer root bag/update params (`jointMatrices`) over packed GLES data (`vs.JointMat`).
     * @param {Object|Tw2PerObjectData} parentData
     * @returns {Float32Array|Array|null}
     */
    static GetJointMatrices(parentData)
    {
        if (!parentData) return null;
        if (parentData.jointMatrices) return parentData.jointMatrices;
        if (parentData.perObjectData) return this.GetJointMatrices(parentData.perObjectData);

        const vs = parentData.vs;
        if (vs && typeof vs.Has === "function" && vs.Has("JointMat"))
        {
            return vs.Get("JointMat");
        }

        return null;
    }

    /**
     * Per object data
     * @type {{ffe: *[]}}
     */
    static perObjectData = {
        ffe: [
            [ "world", 16 ],
            [ "worldInverseTranspose", 16 ]
        ]
    };

    /**
     * Identifies that the class is a child effect
     * @returns {boolean}
     */
    static __isEffectChild = true;

}
