import {Tw2VertexElement} from "../core";
import {Tw2ParticleElement} from "./Tw2ParticleElement";

/**
 * Tw2ParticleElementDeclaration
 *
 * @property {number} elementType=4
 * @property {String} customName
 * @property {number} dimension=1
 * @property {number} usageIndex
 * @property {Boolean} usedByGPU
 * @class
 */
export class Tw2ParticleElementDeclaration
{

    elementType = 4;
    customName = "";
    dimension = 1;
    usageIndex = 0;
    usedByGPU = true;


    /**
     * Gets the dimension of an element type
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
     * GetDeclaration
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

}

