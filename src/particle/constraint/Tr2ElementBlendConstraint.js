import { meta } from "utils";
import { vec4 } from "math";
import { Tw2ParticleConstraint } from "./Tw2ParticleConstraint";
import { Tw2ParticleElement } from "../element";


/**
 * Rescales and offsets one bound element on every alive particle each frame:
 * `value = value * originalFactor + value`.
 *
 * Carbon (`Tr2ElementBlendConstraint.cpp:31-107`) has three code paths - a
 * scalar loop, a 16-byte-aligned SIMD path, and an unaligned fallback - which
 * are algebraically identical. JS has no alignment distinction, so the single
 * scalar loop below covers all three.
 */
@meta.type("Tr2ElementBlendConstraint")
@meta.define({ ccp: "Tr2ElementBlendConstraint" })
export class Tr2ElementBlendConstraint extends Tw2ParticleConstraint
{

    @meta.enums(Tw2ParticleElement.Type)
    elementType = Tw2ParticleElement.Type.CUSTOM;

    @meta.string
    customName = "";

    @meta.vector4
    value = vec4.create();

    @meta.float
    originalFactor = 1;

    @meta.struct("Tw2ParticleElement")
    _element = null;

    @meta.boolean
    @meta.isPrivate
    isValid = false;

    /**
     * Resolves the element this constraint blends, by semantic type or by custom
     * name. Marks itself invalid when it cannot resolve, so `ApplyConstraint` is
     * a no-op rather than a crash.
     *
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean}
     */
    Bind(ps)
    {
        this._element = this.elementType === Tw2ParticleElement.Type.CUSTOM
            ? ps.GetElement(this.customName)
            : ps.GetElement(this.elementType);

        this.isValid = !!this._element;
        return this.isValid;
    }

    /**
     * Blends the bound element across every alive particle.
     *
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {Number} aliveCount
     */
    ApplyConstraint(buffers, instanceStride, aliveCount)
    {
        if (!this.isValid || !this._element) return;

        const
            element = this._element,
            buffer = buffers[element.bufferIndex],
            stride = instanceStride[element.bufferIndex];

        if (!buffer) return;

        for (let i = 0; i < aliveCount; ++i)
        {
            const offset = element.startOffset + i * stride;
            for (let c = 0; c < element.dimension; ++c)
            {
                buffer[offset + c] = buffer[offset + c] * this.originalFactor + this.value[c];
            }
        }
    }

}
