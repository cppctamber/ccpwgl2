import {Tw2VertexElement} from "../../core";
import {Tw2ParticleElement} from "./Tw2ParticleElement";
import {Tw2BaseClass} from "../../global";

/**
 * Tw2ParticleElementDeclaration
 * TODO: Handle "elementType" if passed a string by .black format
 * @ccp Tr2ParticleElementDeclaration
 *
 * @property {String} customName  -
 * @property {Number} dimension   -
 * @property {Number} elementType -
 * @property {Number} usageIndex  -
 * @property {Boolean} usedByGPU  -
 */
export class Tw2ParticleElementDeclaration extends Tw2BaseClass
{

    // ccp
    customName = "";
    dimension = 1;
    elementType = 4;
    usageIndex = 0;
    usedByGPU = true;


    /**
     * Gets the element's dimension
     * @returns {number}
     */
    GetDimension()
    {
        switch (this.elementType)
        {
            case Tw2ParticleElement.Type.LIFETIME:
                return 2;

            case Tw2ParticleElement.Type.POSITION:
                return 3;

            case Tw2ParticleElement.Type.VELOCITY:
                return 3;

            case Tw2ParticleElement.Type.MASS:
                return 1;
        }
        return this.dimension;
    }

    /**
     * Gets the object's vertex declaration
     * @returns {Tw2VertexElement}
     */
    GetDeclaration()
    {
        let usage;
        switch (this.elementType)
        {
            case Tw2ParticleElement.Type.LIFETIME:
                usage = Tw2VertexElement.Type.TANGENT;
                break;

            case Tw2ParticleElement.Type.POSITION:
                usage = Tw2VertexElement.Type.POSITION;
                break;

            case Tw2ParticleElement.Type.VELOCITY:
                usage = Tw2VertexElement.Type.NORMAL;
                break;

            case Tw2ParticleElement.Type.MASS:
                usage = Tw2VertexElement.Type.BINORMAL;
                break;

            default:
                usage = Tw2VertexElement.Type.TEXCOORD;
        }

        return Tw2VertexElement.from({
            usage: usage,
            usageIndex: this.usageIndex,
            elements: this.GetDimension()
        });
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["customName", r.string],
            ["dimension", r.uint],
            ["elementType", r.uint],
            ["usageIndex", r.uint],
            ["usedByGPU", r.boolean]
        ];
    }

}