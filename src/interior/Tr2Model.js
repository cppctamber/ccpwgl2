import { meta, perArrayChild } from "utils";
import { box3, sph3 } from "math";


@meta.type("Tr2Model")
@meta.ccp.define("Tr2Model")
export class Tr2Model extends meta.Model
{

    @meta.list("Tw2Mesh")
    meshes = [];

    /**
     * Initializes child meshes
     */
    Initialize()
    {
        for (let i = 0; i < this.meshes.length; i++)
        {
            if (this.meshes[i] && this.meshes[i].Initialize)
            {
                this.meshes[i].Initialize();
            }
        }
    }

    /**
     * Checks if any mesh is ready
     * @returns {Boolean}
     */
    IsGood()
    {
        for (let i = 0; i < this.meshes.length; i++)
        {
            if (this.meshes[i] && this.meshes[i].IsGood && this.meshes[i].IsGood())
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        perArrayChild(this.meshes, "GetResources", out);
        return out;
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {*} accumulator
     * @param {*} perObjectData
     * @returns {Boolean}
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        const c = accumulator.length;

        for (let i = 0; i < this.meshes.length; i++)
        {
            const mesh = this.meshes[i];
            if (mesh && mesh.GetBatches)
            {
                mesh.GetBatches(mode, accumulator, perObjectData);
            }
        }

        return accumulator.length !== c;
    }

    /**
     * Gets a bounding box from all meshes
     * @param {box3} out
     * @returns {box3|null}
     */
    GetBoundingBox(out)
    {
        let hasBounds = false;
        const scratch = Tr2Model.global.box3_0;
        box3.empty(out);

        for (let i = 0; i < this.meshes.length; i++)
        {
            const mesh = this.meshes[i];
            if (mesh && mesh.GetBoundingBox && mesh.GetBoundingBox(scratch))
            {
                if (hasBounds)
                {
                    box3.union(out, out, scratch);
                }
                else
                {
                    box3.copy(out, scratch);
                    hasBounds = true;
                }
            }
        }

        return hasBounds ? out : null;
    }

    /**
     * Gets a bounding sphere from all meshes
     * @param {sph3} out
     * @returns {sph3|null}
     */
    GetBoundingSphere(out)
    {
        if (this.GetBoundingBox(Tr2Model.global.box3_0))
        {
            return sph3.fromBox3(out, Tr2Model.global.box3_0);
        }
        return null;
    }

    static global = {
        box3_0: box3.create()
    };

}
