/*eslint no-unused-vars:0*/
import {device} from "../../global";

/**
 * Tw2RenderBatch base class
 *
 * @property {Number} renderMode
 * @property {Tw2PerObjectData} perObjectData
 * @class
 */
export class Tw2RenderBatch
{

    renderMode = device.RM_ANY;
    perObjectData = null;


    /**
     * Commits the batch
     * @param {String} technique - technique name
     */
    Commit(technique)
    {

    }

}
