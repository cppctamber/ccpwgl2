import {mat4} from "../../global";
import {Tw2PerObjectData, Tw2RawData} from "../../core";
import {EveChild} from "./EveChild";

/**
 * Mesh attachment to space object
 * TODO: Implement LOD
 *
 * @property {Tw2Mesh|Tw2InstancedMesh} mesh
 * @property {Boolean} useSpaceObjectData
 * @class
 */
export class EveChildMesh extends EveChild
{

    mesh = null;
    useSpaceObjectData = true;


    /**
     * Gets the child's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>} out
     */
    GetResources(out)
    {
        if (this.mesh) this.mesh.GetResources(out);
        return out;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh || this.lod < this.lowestLodVisible) return;

        if (this.useSpaceObjectData)
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new Tw2PerObjectData();
                this._perObjectData.vs = new Tw2RawData();
                this._perObjectData.vs.data = new Float32Array(perObjectData.vs.data.length);

                this._perObjectData.vs.data[33] = 1;
                this._perObjectData.vs.data[35] = 1;

                this._perObjectData.ps = new Tw2RawData();
                this._perObjectData.ps.data = new Float32Array(perObjectData.ps.data.length);

                this._perObjectData.ps.data[1] = 1;
                this._perObjectData.ps.data[3] = 1;
            }
            this._perObjectData.vs.data.set(perObjectData.vs.data);
            this._perObjectData.ps.data.set(perObjectData.ps.data);

            mat4.transpose(this._perObjectData.vs.data, this.worldTransform);
            mat4.transpose(this._perObjectData.vs.data.subarray(16), this.worldTransformLast);
        }
        else
        {
            if (!this._perObjectData)
            {
                this._perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);
            }
            mat4.transpose(this._perObjectData.ffe.Get("world"), this.worldTransform);
            mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this.worldTransform);
        }

        this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

}