import { Tw2GeometryBatch } from "./Tw2GeometryBatch";

/**
 * A render batch for Instanced geometry
 *
 * @property {Tw2InstancedMesh} instanceMesh
 * @class
 */
export class Tw2InstancedMeshBatch extends Tw2GeometryBatch
{

    instanceMesh = null;

    /**
     * Commits the instanced mesh for rendering
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        if (this.instanceMesh && this.effect)
        {
            this.instanceMesh.RenderAreas(this.meshIx, this.start, this.count, this.effect, this.techniqueOverride || technique);
        }
    }

}
