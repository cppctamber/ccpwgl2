/* eslint no-unused-vars:0 */
import { meta, vec3, mat4, Tw2BaseClass } from "global";


export class EveChild extends Tw2BaseClass
{

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    @meta.abstract
    Update(dt, parentTransform)
    {

    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    @meta.abstract
    GetResources(out = [])
    {

    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    @meta.abstract
    GetBatches(mode, accumulator, perObjectData)
    {

    }

    /**
     * Class globals and scratch variables
     * @type {Object}
     */
    static global = {
        mat4_0: mat4.create(),
        vec3_0: vec3.create()
    };

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
