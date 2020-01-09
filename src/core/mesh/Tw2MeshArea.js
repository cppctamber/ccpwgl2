import { Tw2GeometryBatch } from "../batch";
import { util, Tw2BaseClass, meta } from "global";
import { Tw2Effect } from "./Tw2Effect";


@meta.type("Tw2MeshArea", "Tr2MeshArea")
@meta.stage(1)
export class Tw2MeshArea extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.boolean
    display = true;

    @meta.black.uint
    count = 1;

    @meta.black.objectOf("Tw2Effect")
    effect = null;

    @meta.black.uint
    index = 0;

    @meta.notImplemented
    @meta.black.boolean
    reversed = false;

    @meta.notImplemented
    @meta.black.boolean
    useSHLighting = false;


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
     * Finds an effect parameter by it's name
     * @param {String} name
     * @returns {Tw2Parameter|null}
     */
    FindParameter(name)
    {
        return this.effect ? this.effect.FindParameter(name) : null;
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
        util.assignIfExists(item, options, "index");

        if (values)
        {
            util.assignIfExists(item, values, [
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

}
