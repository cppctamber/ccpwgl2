/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { mat4, vec3 } from "math";


export class EveObject extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    /**
     * Finds structs
     * @param {Function} func
     * @param {Array} [out=[]]
     * @return {Array} out
     */
    FindStruct(func, out=[])
    {
        this.Traverse(({ struct }) =>
        {
            if (func(struct) && !out.includes(struct))
            {
                out.push(struct);
            }
        });

        return out;
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

