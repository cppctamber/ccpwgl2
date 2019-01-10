import {vec4} from "../../global";
import {Tw2ParticleElement} from "../Tw2ParticleElement";
import {Tw2ParticleAttributeGenerator} from "./Tw2ParticleAttributeGenerator";

/**
 * Tw2RandomUniformAttributeGenerator
 *
 * @property {number} elementType
 * @property {String} customName
 * @property {vec4} minRange
 * @property {vec4} maxRange
 * @property {Tw2ParticleElement} _element
 * @inherits Tw2ParticleAttributeGenerator
 * @class
 */
export class Tw2RandomUniformAttributeGenerator extends Tw2ParticleAttributeGenerator
{

    elementType = Tw2ParticleElement.Type.CUSTOM;
    customName = "";
    minRange = vec4.create();
    maxRange = vec4.create();
    _element = null;


    /**
     * Binds a particle system element to the generator
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean} True if successfully bound
     */
    Bind(ps)
    {
        for (let i = 0; i < ps._elements.length; ++i)
        {
            if
            (
                ps._elements[i].elementType === this.elementType &&
                (this.elementType !== Tw2ParticleElement.Type.CUSTOM || ps._elements[i].customName === this.customName)
            )
            {
                this._element = ps._elements[i];
                return true;
            }
        }
        return false;
    }

    /**
     * Generates the attributes
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {number} index
     */
    Generate(position, velocity, index)
    {
        for (let i = 0; i < this._element.dimension; ++i)
        {
            this._element.buffer[this._element.instanceStride * index + this._element.startOffset + i] =
                this.minRange[i] + Math.random() * (this.maxRange[i] - this.minRange[i]);
        }
    }

}
