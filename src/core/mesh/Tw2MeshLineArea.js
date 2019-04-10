import {Tw2GeometryLineBatch} from "../batch";
import {Tw2MeshArea} from "./Tw2MeshArea";

/**
 * Tw2MeshLineArea
 * TODO: Is this deprecated?
 * @ccp N/A
 */
export class Tw2MeshLineArea extends Tw2MeshArea
{

    /**
     * Render Batch Constructor
     * @type {Tw2RenderBatch}
     */
    static batchType = Tw2GeometryLineBatch;

}