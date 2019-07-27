import {Tw2GeometryBatch} from "../batch";
import {util, Tw2BaseClass} from "../../global";
import {assignIfExists} from "../../global/util";
import {Tw2Effect} from "./Tw2Effect";

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
     * Creates a mesh area from a plain object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {Tw2MeshArea}
     */
    static from(values, options)
    {
        const item = new this();
        assignIfExists(item, options, "index");

        if (values)
        {
            assignIfExists(item, values, [
                "name", "display", "count", "index", "reversed", "useSHLighting"
            ]);

            if (values.effect)
            {
                item.effect = Tw2Effect.from(values.effect);
            }
        }

        return item;
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
