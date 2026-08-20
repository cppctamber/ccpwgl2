import { meta } from "utils";
import { vec4 } from "math";
import { Tw2ParticleAttributeGenerator } from "./Tw2ParticleAttributeGenerator";
import { Tw2ParticleElement } from "../element";


/**
 * Writes a per-component counter that increments on every particle and wraps
 * inside `[minRange, maxRange)` - used to step through atlas frames and similar
 * cycling indices.
 *
 * Carbon: `Tr2ConsecutiveIntegerAttributeGenerator.cpp:42-66`. The counter is
 * `uint32_t` there and `Uint32Array` here, so both wrap at 2^32 identically.
 *
 * One deliberate divergence: when `maxRange < minRange` Carbon's
 * `uint32_t(max - min)` cast underflows to a huge modulus, which is a defect
 * rather than a behaviour worth reproducing. A range of zero or less pins the
 * component to `minRange` instead.
 */
@meta.type("Tw2ConsecutiveIntegerAttributeGenerator", "Tr2ConsecutiveIntegerAttributeGenerator")
@meta.define({
    wgl: "Tw2ConsecutiveIntegerAttributeGenerator",
    ccp: "Tr2ConsecutiveIntegerAttributeGenerator"
})
export class Tw2ConsecutiveIntegerAttributeGenerator extends Tw2ParticleAttributeGenerator
{

    @meta.enums(Tw2ParticleElement.Type)
    elementType = Tw2ParticleElement.Type.CUSTOM;

    @meta.string
    customName = "";

    @meta.vector4
    minRange = vec4.create();

    @meta.vector4
    maxRange = vec4.create();

    @meta.struct("Tw2ParticleElement")
    _element = null;

    _currentValues = new Uint32Array(4);

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
     * Advances and wraps the counter, then writes it.
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {Number} index
     */
    Generate(position, velocity, index)
    {
        if (!this._element) return;

        const offset = this._element.startOffset + index * this._element.instanceStride;

        for (let c = 0; c < this._element.dimension; ++c)
        {
            this._currentValues[c]++;
            const range = Math.max(0, Math.trunc(this.maxRange[c] - this.minRange[c]));
            this._element.buffer[offset + c] = range
                ? this.minRange[c] + this._currentValues[c] % range
                : this.minRange[c];
        }
    }

}
