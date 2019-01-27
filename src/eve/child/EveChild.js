/* eslint no-unused-vars:0 */
import {vec3, quat, mat4, util, Tw2BaseClass} from "../../global";
import {ErrAbstractClassMethod} from "../../core";

/**
 * EveChild base class
 * TODO: Implement LOD
 *
 * @property {Boolean} _isEffectChild
 */
export class EveChild extends Tw2BaseClass
{
    /**
     * Identifies that the class is a child effect
     * @returns {boolean}
     */
    get _isEffectChild()
    {
        return true;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        throw new ErrAbstractClassMethod();
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
            ["world", 16],
            ["worldInverseTranspose", 16]
        ]
    };

}

Tw2BaseClass.define(EveChild, Type =>
{
    return {
        type: "EveChild",
        category: "ObjectChild",
        isAbstract: true
    };
});

