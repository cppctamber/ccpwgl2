import {Tw2GeometryBatch} from "../batch";
import {util, Tw2BaseClass} from "../../global";

/**
 * Tw2MeshArea
 * TODO: Implement "reversed" - in RenderBatch or Mesh?
 * TODO: Implement "useSHLighting" - in RenderBatch or Mesh?
 * @ccp Tr2MeshArea
 *
 * @property {String} name           -
 * @property {Number} count          -
 * @property {Tr2Effect} effect      -
 * @property {Number} index          -
 * @property {Boolean} reversed      -
 * @property {Boolean} useSHLighting -
 */
export class Tw2MeshArea extends Tw2BaseClass
{

    name = "";
    count = 1;
    effect = null;
    index = 0;
    reversed = false;
    useSHLighting = false;

    // ccpwgl
    display = true;

    /**
     * Alias for index
     * @returns {Number}
     */
    get meshIndex()
    {
        return this.index;
    }

    /**
     * Alias for index
     * @param {Number} val
     */
    set meshIndex(val)
    {
        this.index = val;
    }


    /**
     * Render Batch Constructor
     * @type {Tw2RenderBatch}
     */
    static batchType = Tw2GeometryBatch;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["count", r.uint],
            ["effect", r.object],
            ["index", r.uint],
            ["name", r.string],
            ["reversed", r.boolean],
            ["useSHLighting", r.boolean],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 1;

}
