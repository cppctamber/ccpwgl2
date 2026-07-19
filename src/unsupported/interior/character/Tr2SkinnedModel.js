import { meta, perArrayChild } from "utils";
import { tw2 } from "global";
import { box3, sph3 } from "math";
import { Tw2Effect, Tw2Mesh, Tw2MeshArea } from "core";


@meta.type("Tr2SkinnedModel")
@meta.ccp.define("Tr2SkinnedModel")
export class Tr2SkinnedModel extends meta.Model
{

    @meta.string
    name = "";

    @meta.path
    geometryResPath = "";

    @meta.list("Tw2Mesh")
    meshes = [];

    @meta.string
    skeletonName = "";

    @meta.path
    skeletonResPath = "";

    @meta.struct("Tw2GeometryRes")
    @meta.isPrivate
    skeletonResource = null;

    /**
     * Initializes the model
     */
    Initialize()
    {
        if (!this.meshes.length && this.geometryResPath)
        {
            const mesh = this.EnsureMesh();
            mesh.name = this.name;
            mesh.geometryResPath = this.geometryResPath;
        }

        if (this.skeletonResPath && !this.skeletonResource)
        {
            this.skeletonResource = tw2.GetResource(this.skeletonResPath);
        }

        for (let i = 0; i < this.meshes.length; i++)
        {
            if (this.meshes[i] && this.meshes[i].Initialize)
            {
                this.meshes[i].Initialize();
            }
        }
    }

    /**
     * Ensures a mesh exists
     * @param {Number} [index=0]
     * @returns {Tw2Mesh}
     */
    EnsureMesh(index = 0)
    {
        if (!this.meshes[index])
        {
            this.meshes[index] = new Tw2Mesh();
        }
        return this.meshes[index];
    }

    /**
     * Sets the non-rendered skeleton geometry resource or path
     * @param {String|*} geometry
     * @returns {*}
     */
    SetSkeletonResource(geometry)
    {
        if (typeof geometry === "string")
        {
            this.skeletonResPath = geometry;
            this.skeletonResource = tw2.GetResource(geometry);
        }
        else
        {
            this.skeletonResource = geometry || null;
            this.skeletonResPath = geometry && geometry.path ? geometry.path : this.skeletonResPath;
        }
        return this.skeletonResource;
    }

    /**
     * Sets a mesh geometry resource or path
     * @param {String|*} geometry
     * @param {Number} [index=0]
     * @returns {Tw2Mesh}
     */
    SetGeometryResource(geometry, index = 0)
    {
        const mesh = this.EnsureMesh(index);

        if (typeof geometry === "string")
        {
            mesh.geometryResPath = geometry;
            mesh.Initialize();
        }
        else
        {
            mesh.geometryResource = geometry || null;
            mesh.geometryResPath = geometry && geometry.path ? geometry.path : mesh.geometryResPath;
        }

        const meshIndex = this.constructor.FindFirstMeshBindingIndex(mesh.geometryResource);
        if (meshIndex !== -1)
        {
            mesh.meshIndex = meshIndex;
        }

        return mesh;
    }

    /**
     * Rebuilds mesh areas against the current geometry resource
     * @param {String} effectFilePath
     * @param {Object} [opt]
     * @returns {Number}
     */
    RebuildAreas(effectFilePath, opt = {})
    {
        const
            areaName = opt.areaName || "opaqueAreas",
            AreaConstructor = opt.AreaConstructor || Tw2MeshArea,
            skipUnboundMeshes = opt.skipUnboundMeshes === true;

        let count = 0;

        this.ExpandResourceMeshes(skipUnboundMeshes);

        for (let i = 0; i < this.meshes.length; i++)
        {
            const
                mesh = this.meshes[i],
                res = mesh && mesh.geometryResource,
                activeMeshIndex = mesh ? mesh.meshIndex : 0;

            if (!mesh || !res || !res.meshes) continue;

            if (!mesh[areaName]) mesh[areaName] = [];
            mesh[areaName].splice(0);

            for (let meshIndex = 0; meshIndex < res.meshes.length; meshIndex++)
            {
                const
                    resMesh = res.meshes[meshIndex],
                    areas = resMesh.areas || [];

                if (meshIndex !== activeMeshIndex) continue;
                if (skipUnboundMeshes && !this.constructor.HasMeshBinding(res, meshIndex)) continue;

                for (let areaIndex = 0; areaIndex < areas.length; areaIndex++)
                {
                    const effect = Tw2Effect.from({
                        effectFilePath,
                        autoParameter: opt.autoParameter !== false
                    });
                    effect.name = `${resMesh.name || "mesh"}.${areas[areaIndex].name || areaIndex}`;

                    const area = new AreaConstructor();
                    area.name = effect.name;
                    area.meshIndex = meshIndex;
                    area.index = areaIndex;
                    area.effect = effect;
                    mesh[areaName].push(area);
                    count++;
                }
            }
        }

        return count;
    }

    /**
     * Expands each geometry resource into one render mesh per resource submesh,
     * so each submesh can carry the matching bone palette in per-object data.
     * @param {Boolean} skipUnboundMeshes
     */
    ExpandResourceMeshes(skipUnboundMeshes)
    {
        for (let i = this.meshes.length - 1; i >= 0; i--)
        {
            if (this.meshes[i] && this.meshes[i]._interiorAutoPart)
            {
                this.meshes.splice(i, 1);
            }
        }

        const baseMeshes = this.meshes.slice();
        for (let i = 0; i < baseMeshes.length; i++)
        {
            const
                mesh = baseMeshes[i],
                res = mesh && mesh.geometryResource;

            if (!mesh || !res || !res.meshes || !res.meshes.length) continue;

            const indices = this.constructor.GetRenderableMeshIndices(res, skipUnboundMeshes);
            if (!indices.length) continue;

            mesh.meshIndex = indices[0];
            for (let j = 1; j < indices.length; j++)
            {
                const part = this.constructor.CreateRenderPartMesh(mesh, indices[j]);
                this.meshes.push(part);
            }
        }
    }

    /**
     * Checks if any renderable mesh is ready
     * @returns {boolean}
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
        if (this.skeletonResource && !out.includes(this.skeletonResource))
        {
            out.push(this.skeletonResource);
        }
        perArrayChild(this.meshes, "GetResources", out);
        return out;
    }

    /**
     * Gets the first good geometry resource
     * @returns {*}
     */
    GetGeometryResource()
    {
        for (let i = 0; i < this.meshes.length; i++)
        {
            const mesh = this.meshes[i];
            if (mesh && mesh.IsGood && mesh.IsGood()) return mesh.geometryResource;
        }
        return null;
    }

    /**
     * Gets all good geometry resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetGeometryResources(out = [])
    {
        if (
            this.skeletonResource &&
            this.skeletonResource.IsGood &&
            this.skeletonResource.IsGood() &&
            !out.includes(this.skeletonResource)
        )
        {
            out.push(this.skeletonResource);
        }

        for (let i = 0; i < this.meshes.length; i++)
        {
            const mesh = this.meshes[i];
            if (mesh && mesh.IsGood && mesh.IsGood() && !out.includes(mesh.geometryResource))
            {
                out.push(mesh.geometryResource);
            }
        }
        return out;
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {*} accumulator
     * @param {*|Function} perObjectData
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
                const pod = typeof perObjectData === "function"
                    ? perObjectData(mesh, i)
                    : perObjectData;
                mesh.GetBatches(mode, accumulator, pod);
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
        const scratch = Tr2SkinnedModel.global.box3_0;
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
        if (this.GetBoundingBox(Tr2SkinnedModel.global.box3_0))
        {
            return sph3.fromBox3(out, Tr2SkinnedModel.global.box3_0);
        }
        return null;
    }

    /**
     * Checks if a resource mesh has a skeleton binding
     * @param {*} res
     * @param {Number} meshIndex
     * @returns {Boolean}
     */
    static HasMeshBinding(res, meshIndex)
    {
        const resMesh = res && res.meshes && res.meshes[meshIndex];
        if (!resMesh || !res.models) return false;

        for (let i = 0; i < res.models.length; i++)
        {
            const bindings = res.models[i] && res.models[i].meshBindings;
            for (let j = 0; bindings && j < bindings.length; j++)
            {
                if (bindings[j].mesh === resMesh) return true;
            }
        }
        return false;
    }

    /**
     * Finds the first resource mesh with a skeleton binding
     * @param {*} res
     * @returns {Number}
     */
    static FindFirstMeshBindingIndex(res)
    {
        if (!res || !res.meshes) return -1;
        for (let i = 0; i < res.meshes.length; i++)
        {
            if (this.HasMeshBinding(res, i)) return i;
        }
        return -1;
    }

    /**
     * Gets resource mesh indices that should be rendered
     * @param {*} res
     * @param {Boolean} skipUnboundMeshes
     * @returns {Array<Number>}
     */
    static GetRenderableMeshIndices(res, skipUnboundMeshes)
    {
        const out = [];
        if (!res || !res.meshes) return out;

        let hasBindings = false;
        for (let i = 0; i < res.meshes.length; i++)
        {
            hasBindings = this.HasMeshBinding(res, i) || hasBindings;
        }

        for (let i = 0; i < res.meshes.length; i++)
        {
            const mesh = res.meshes[i];
            if (!mesh || !mesh.areas || !mesh.areas.length) continue;
            if ((skipUnboundMeshes || hasBindings) && !this.HasMeshBinding(res, i)) continue;
            out.push(i);
        }

        return out;
    }

    /**
     * Creates a render carrier for a resource submesh
     * @param {Tw2Mesh} source
     * @param {Number} meshIndex
     * @returns {Tw2Mesh}
     */
    static CreateRenderPartMesh(source, meshIndex)
    {
        const mesh = new Tw2Mesh();
        mesh.name = `${source.name || source.geometryResource?.path || "part"}:${meshIndex}`;
        mesh.display = source.display;
        mesh.geometryResource = source.geometryResource;
        mesh.geometryResPath = source.geometryResPath;
        mesh.meshIndex = meshIndex;
        mesh.visible = { ...source.visible };
        mesh._interiorAutoPart = true;
        return mesh;
    }

    static global = {
        box3_0: box3.create()
    };

}
