/* eslint no-unused-vars:0 */
import { meta, mat4, vec3, Tw2BaseClass, WrappedType } from "global";


@meta.abstract
@meta.type("EveObject")
export class EveObject extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;


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
     * Per frame update
     * @param {number} dt - delta time
     */
    @meta.abstract
    Update(dt)
    {

    }

    /**
     * Accumulates batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    @meta.abstract
    GetBatches(mode, accumulator)
    {

    }

    /**
     * Identifies the object's wrapped type'
     * @type {Number}
     */
    static wrappedType = WrappedType.SPACE_OBJECT;

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
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
        mat4_2: mat4.create(),
        mat4_ID: mat4.create()
    };

}

