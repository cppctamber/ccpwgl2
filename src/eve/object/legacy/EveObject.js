/* eslint no-unused-vars:0 */
import {mat4, util, vec3, Tw2BaseClass} from "../../../global";
import {ErrAbstractClassMethod} from "../../../core";

export function EveObject()
{
    Tw2BaseClass.defineID(this);
    this.name = "";
    this.display = true;
}

EveObject.prototype = Object.assign(Object.create(Tw2BaseClass.prototype), {

    constructor: EveObject,

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        throw new ErrAbstractClassMethod();
    },

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        throw new ErrAbstractClassMethod();
    },

    /**
     * Accumulates batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        throw new ErrAbstractClassMethod();
    }

});

/**
 * Global and scratch variables
 * @type {*}
 */
EveObject.global = {
    vec3_0: vec3.create(),
    vec3_1: vec3.create(),
    vec3_2: vec3.create(),
    vec3_3: vec3.create(),
    vec3_4: vec3.create(),
    vec3_5: vec3.create(),
    vec3_6: vec3.create(),
    vec3_7: vec3.create(),
    mat4_0: mat4.create(),
    mat4_1: mat4.create(),
    mat4_2: mat4.create()
};

