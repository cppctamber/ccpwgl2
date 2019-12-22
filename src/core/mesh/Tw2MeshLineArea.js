import { meta } from "global";
import { Tw2GeometryLineBatch } from "../batch";
import { Tw2MeshArea } from "./Tw2MeshArea";


@meta.type("Tw2MeshLineArea")
@meta.stage(1)
export class Tw2MeshLineArea extends Tw2MeshArea
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.uint
    count = 1;

    @meta.objectOf("Tw2Effect")
    effect = null;

    @meta.uint
    index = 0;

    @meta.notImplemented
    @meta.boolean
    reversed = false;

    @meta.notImplemented
    @meta.boolean
    useSHLighting = false;

    /**
     * Render Batch Constructor
     * @type {Tw2RenderBatch}
     */
    static batchType = Tw2GeometryLineBatch;

}
