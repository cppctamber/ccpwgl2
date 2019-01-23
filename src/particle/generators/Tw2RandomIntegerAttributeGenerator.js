import {vec4} from "../../global";
import {Tw2ParticleElement} from "../element/Tw2ParticleElement";
import {Tw2ParticleAttributeGenerator} from "./Tw2ParticleAttributeGenerator";

/**
 * Tw2RandomIntegerAttributeGenerator
 * @ccp Tr2RandomIntegerAttributeGenerator
 *
 * @property {String} customName           -
 * @property {Number} elementType          -
 * @property {vec4} maxRange               -
 * @property {vec4} minRange               -
 * @property {Tw2ParticleElement} _element -
 */
export class Tw2RandomIntegerAttributeGenerator extends Tw2ParticleAttributeGenerator
{
    //ccp
    customName = "";
    elementType = Tw2ParticleElement.Type.CUSTOM;
    minRange = vec4.create();
    maxRange = vec4.create();

    // ccpwgl
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
                Math.floor(this.minRange[i] + Math.random() * (this.maxRange[i] - this.minRange[i]) + 0.5);
        }
    }

}

Tw2ParticleAttributeGenerator.define(Tw2RandomIntegerAttributeGenerator, Type =>
{
    return {
        type: "Tw2RandomIntegerAttributeGenerator",
        props: {
            customName: Type.STRING,
            elementType: Type.NUMBER,
            maxRange: Type.VECTOR4,
            minRange: Type.VECTOR4
        }
    };
});

