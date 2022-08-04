import { Tw2RenderBatch } from "./Tw2RenderBatch";

/**
 * A render batch for geometry
 *
 * @property {Tw2GeometryRes} geometryRes
 * @property {Number} meshIx
 * @property {Number} start
 * @property {Number} count
 * @property {Tw2Effect} effect
 * @property {String} technique
 * @class
 */
export class Tw2GeometryBatch extends Tw2RenderBatch
{

    geometryRes = null;
    meshIx = 0;
    start = 0;
    count = 1;
    effect = null;


    /**
     * Commits the geometry batch for rendering
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        if (this.geometryRes && this.effect)
        {
            this.geometryRes.RenderAreas(this.meshIx, this.start, this.count, this.effect, this.techniqueOverride || technique);
        }
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.effect && this.effect.HasTechnique(technique);
    }

}

