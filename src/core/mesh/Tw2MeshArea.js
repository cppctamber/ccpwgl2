import {Tw2GeometryBatch} from "../batch";
import {util, Tw2BaseClass} from "../../global";

/**
 * Tw2MeshArea
 * TODO: Implement "reversed" - in RenderBatch or Mesh?
 * TODO: Implement "useSHLighting" - in RenderBatch or Mesh?
 * @ccp Tr2MeshArea
 *
 * @property {Number} count          -
 * @property {Tr2Effect} effect      -
 * @property {Number} index          -
 * @property {Boolean} reversed      -
 * @property {Boolean} useSHLighting -
 */
export class Tw2MeshArea extends Tw2BaseClass
{

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

}

Tw2BaseClass.define(Tw2MeshArea, Type =>
{
    return {
        isStaging: true,
        type: "Tw2MeshArea",
        category: "MeshArea",
        props: {
            count: Type.NUMBER,
            display: Type.BOOLEAN,
            effect: ["Tw2Effect"],
            index: Type.NUMBER,
            reversed: Type.BOOLEAN,
            useSHLighting: Type.BOOLEAN
        },
        notImplemented: [
            "reversed",
            "useSHLighting"
        ]
    };
});

