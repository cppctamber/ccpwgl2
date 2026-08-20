import { meta } from "utils";
import { Tw2ParticleAttributeGenerator } from "./Tw2ParticleAttributeGenerator";
import { Tw2ParticleElement } from "../element";


/**
 * Writes a random unit vector into a bound element, sized to that element's
 * dimension.
 *
 * Carbon: `Tr2RandomDirectionAttributeGenerator.cpp:37-67`. Samples each
 * component in [-1, 1] then normalises, falling back to (1, 0, 0, ...) when the
 * sample lands exactly on zero - there is no rejection loop.
 */
@meta.type("Tw2RandomDirectionAttributeGenerator", "Tr2RandomDirectionAttributeGenerator")
@meta.define({
    wgl: "Tw2RandomDirectionAttributeGenerator",
    ccp: "Tr2RandomDirectionAttributeGenerator"
})
export class Tw2RandomDirectionAttributeGenerator extends Tw2ParticleAttributeGenerator
{

    @meta.enums(Tw2ParticleElement.Type)
    elementType = Tw2ParticleElement.Type.CUSTOM;

    @meta.string
    customName = "";

    @meta.struct("Tw2ParticleElement")
    _element = null;

    /**
     * Binds the element this generator writes.
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean}
     */
    Bind(ps)
    {
        this._element = null;

        for (let i = 0; i < ps._elements.length; ++i)
        {
            const element = ps._elements[i];
            if (element.elementType !== this.elementType) continue;
            if (this.elementType === Tw2ParticleElement.Type.CUSTOM && element.customName !== this.customName) continue;
            this._element = element;
            return true;
        }

        return false;
    }

    /**
     * Writes one particle's random direction.
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Number} index
     */
    Generate(position, velocity, index)
    {
        if (!this._element) return;

        const
            dimension = this._element.dimension,
            value = Tw2RandomDirectionAttributeGenerator.global.value;

        let lengthSquared = 0;
        for (let c = 0; c < dimension; ++c)
        {
            value[c] = -1 + 2 * Math.random();
            lengthSquared += value[c] * value[c];
        }

        if (lengthSquared === 0)
        {
            value[0] = 1;
        }
        else
        {
            const inverseLength = 1 / Math.sqrt(lengthSquared);
            for (let c = 0; c < dimension; ++c) value[c] *= inverseLength;
        }

        const offset = this._element.startOffset + index * this._element.instanceStride;
        for (let c = 0; c < dimension; ++c)
        {
            this._element.buffer[offset + c] = value[c];
        }
    }

    /**
     * Scratch, sized to the largest element dimension.
     * @type {*}
     */
    static global = {
        value: new Float32Array(4)
    };

}
