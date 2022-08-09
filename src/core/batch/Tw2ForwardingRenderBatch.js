import { Tw2RenderBatch } from "./Tw2RenderBatch";

/**
 * A render batch that uses geometry provided from an external source
 *
 * @property {*} geometryProvider
 * @property {Tw2Effect} effect
 */
export class Tw2ForwardingRenderBatch extends Tw2RenderBatch
{

    geometryProvider = null;
    effect = null;

    /**
     * Commits the batch for rendering
     * @param {String} technique - technique name
     * @returns {Boolean} true if rendered
     */
    Commit(technique)
    {
        if (this.geometryProvider)
        {
            return this.geometryProvider.Render(this, this.techniqueOverride || technique);
        }
        return false;
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
