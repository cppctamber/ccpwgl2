import { meta, vec4 } from "global";
import { Tw2ParticleElement } from "../element/Tw2ParticleElement";
import { Tw2ParticleAttributeGenerator } from "./Tw2ParticleAttributeGenerator";


@meta.type("Tw2RandomIntegerAttributeGenerator", "Tr2RandomIntegerAttributeGenerator")
export class Tw2RandomIntegerAttributeGenerator extends Tw2ParticleAttributeGenerator
{

    @meta.black.string
    customName = "";

    @meta.black.uint
    @meta.enumerable(Tw2ParticleElement.Type)
    elementType = Tw2ParticleElement.Type.CUSTOM;

    @meta.black.vector4
    minRange = vec4.create();

    @meta.black.vector4
    maxRange = vec4.create();

    @meta.objectOf("Tw2ParticleElement")
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
