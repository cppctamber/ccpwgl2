/*eslint no-unused-vars:0*/
import { RM_ANY } from "constant";

/**
 * Tw2RenderBatch base class
 * @property {Number} renderMode
 * @property {Tw2PerObjectData} perObjectData
 * @property {String} techniqueOverride
 */
export class Tw2RenderBatch
{

    renderMode = RM_ANY;
    perObjectData = null;
    techniqueOverride = null;

    /**
     * Commits the batch
     * @param {String} [technique] - technique name
     * @returns {boolean} true if rendered
     */
    Commit(technique)
    {
        return false;
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return false;
    }

}

