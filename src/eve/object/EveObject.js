/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { mat4, vec3, sph3, box3 } from "math";
import { Tw2Transform } from "core/Tw2Transform";
import { EvePlaneSet } from "eve";
import { Tw2TextureParameter, Tw2VideoRes } from "core";


export class EveObject extends Tw2Transform
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    _lod = 3;

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this._lod = 3;
    }

    /**
     * Updates LOD
     * @param {Tw2Frustum} frustum
     */
    UpdateLod(frustum)
    {
        this._lod = 3;
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
     * @returns {Boolean} true if batches accumulated
     */
    @meta.abstract
    GetBatches(mode, accumulator)
    {
        return false;
    }

    /**
     * Finds planeSets with names that include billboard
     * @param out
     * @returns {*[]}
     * @constructor
     */
    FindPlaneSetsWithVideos(out=[])
    {
        let arr = "attachments" in this ? this.attachments : this.planeSets;
        if (arr)
        {
            for (let i = 0; i < arr.length; i++)
            {
                if (arr[i] instanceof EvePlaneSet && arr[i].effect)
                {
                    const { parameters } = arr[i].effect;
                    for (const key in parameters)
                    {
                        if (
                            parameters.hasOwnProperty(key) &&
                            parameters[key] instanceof Tw2TextureParameter &&
                            parameters[key].textureRes instanceof Tw2VideoRes &&
                            !out.includes(parameters[key])
                        )
                        {
                            out.push(arr[i]);
                            break;
                        }
                    }
                }
            }
        }

        if ("children" in this)
        {
            for (let i = 0; i < this.children.length; i++)
            {
                if ("FindPlaneSetsWithVideos" in this.children[i])
                {
                    this.children[i].FindPlaneSetsWithVideos(out);
                }
            }
        }

        return out;
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
        mat4_ID: mat4.create(),
        box3_0: box3.create(),
        sph3_0: sph3.create()
    };

}

