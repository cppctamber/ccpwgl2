import { meta, perArrayChild, get, assignIfExists } from "utils";
import { tw2 } from "global";
import { box3, mat4, sph3, vec3 } from "math";
import { Tw2InstancedMeshBatch } from "../batch";
import { Tw2Mesh } from "./Tw2Mesh";
import {
    RM_ADDITIVE,
    RM_DEPTH,
    RM_DISTORTION,
    RM_DECAL,
    RM_OPAQUE,
    RM_TRANSPARENT,
    RM_PICKABLE,
    RM_NORMAL
} from "constant";


@meta.todo("Is this deprecated?")
@meta.define("Tw2InstancedMesh", "Tr2InstancedMesh")
export class Tw2InstancedMesh extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.list("Tw2MeshArea")
    additiveAreas = [];

    @meta.struct()
    boundsMethod = null;

    @meta.list("Tw2MeshArea")
    decalAreas = [];

    @meta.notImplemented
    @meta.list("Tw2MeshArea")
    depthAreas = [];

    @meta.notImplemented
    @meta.list("Tw2MeshArea")
    distortionAreas = [];

    @meta.struct("Tw2GeometryResource")
    @meta.isPrivate
    geometryResource = null;

    @meta.path
    geometryResPath = "";

    @meta.struct()
    instanceGeometryResource = null;

    @meta.path
    instanceGeometryResPath = "";

    @meta.uint
    instanceMeshIndex = 0;

    @meta.vector3
    maxBounds = vec3.create();

    @meta.notImplemented
    @meta.uint
    maxInstanceSize = 0;

    @meta.vector3
    minBounds = vec3.create();

    @meta.list("Tw2MeshArea")
    opaqueAreas = [];

    @meta.list("Tw2MeshArea")
    pickableAreas = [];

    @meta.list("Tw2MeshArea")
    transparentAreas = [];

    // CCPWGL only

    @meta.list("Tw2MeshArea")
    depthNormalAreas = [];

    @meta.plain
    visible = {
        additiveAreas: true,
        decalAreas: true,
        depthAreas: true,
        depthNormalAreas: true,
        distortionAreas: true,
        opaqueAreas: true,
        pickableAreas: true,
        transparentAreas: true,
    };


    /**
     * Alias for geometryResource
     * @returns {null|Tw2GeometryResource}
     */
    get res()
    {
        return this.geometryResource;
    }

    /**
     * Gets the current mesh index
     * @returns {Number}
     */
    GetMeshIndex()
    {
        return this.instanceMeshIndex;
    }

    /**
     * Sets the current mesh index
     * @param {Number} index
     */
    SetMeshIndex(index)
    {
        this.instanceMeshIndex = index;
    }

    /**
     * Initializes the instanced mesh
     */
    Initialize()
    {
        if (this.geometryResPath !== "")
        {
            this.geometryResource = tw2.GetResource(this.geometryResPath);
        }

        if (this.instanceGeometryResPath !== "")
        {
            this.instanceGeometryResource = tw2.GetResource(this.instanceGeometryResPath);
        }
    }

    /**
     * Sets the geometry path and loads it if another hasn't been requested since
     * @param {string} resPath
     * @returns { Promise<Boolean> }
     */
    async FetchGeometryResPath(resPath)
    {
        return Tw2Mesh.HandleFetch(this, "geometryResPath", "geometryResource", resPath);
    }

    /**
     * Sets the instanced geometry path and loads it
     * @param {string} resPath
     * @returns { Promise<Boolean> }
     */
    async FetchInstanceGeometryResPath(resPath)
    {
        return Tw2Mesh.HandleFetch(this, "instanceGeometryResPath", "instanceGeometryResource", resPath);
    }

    /**
     * Intersects the mesh
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} worldTransform
     * @param {Object} [cache]
     */
    /**
     * The transform of one instance, in the mesh's own space.
     *
     * Returns null by default, and that is not a stub - it is the honest
     * answer. Instance data is handed to the GPU as an opaque buffer plus a
     * declaration (see RenderAreas) and the SHADER decides what the elements
     * mean; nothing on the CPU ever builds a transform from them. The layout
     * differs between users - the smart light meshes carry theirs on TEXCOORD
     * 8..14, Carbon's generic instancing on 0..6 - so there is no convention
     * here to read.
     *
     * Anything that KNOWS its own layout should override this, and gets
     * per-instance picking for free. Anything that does not gets the whole
     * instanced mesh as one hit, which is correct if coarse - and much better
     * than a transform assembled from a guessed element order, which would put
     * instances in plausible wrong places.
     *
     * @param {Number} index
     * @param {mat4} out
     * @returns {?mat4} out, or null when the layout is unknown here
     */
    GetInstanceTransform(index, out)
    {
        const data = this.instanceGeometryResource;
        return data && data.GetInstanceTransform ? data.GetInstanceTransform(index, out) : null;
    }

    /**
     * How many instances this mesh draws.
     * @returns {Number}
     */
    GetInstanceCount()
    {
        if (!this.instanceGeometryResource || !this.instanceGeometryResource.GetInstanceCount) return 0;
        return this.instanceGeometryResource.GetInstanceCount(this.instanceMeshIndex) || 0;
    }

    /**
     * Intersects the instanced mesh.
     *
     * Per instance where the layout is known, and the path carries
     * `instance[n]` so a caller can tell WHICH one was hit - the question that
     * was previously unanswerable. Where it is not known, the base geometry is
     * tested once against the mesh's own transform: a coarse hit that names the
     * mesh, rather than nothing at all.
     *
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} worldTransform
     * @param {Object} [cache]
     * @returns {?Object} the first intersection, if any
     */
    Intersect(ray, intersects, worldTransform, cache)
    {
        if (!this.display || !this.IsGood() || ray.IsMasked(this)) return null;

        const before = intersects.length;
        const count = this.GetInstanceCount();

        const instance = Tw2InstancedMesh.global.mat4_0;
        const combined = Tw2InstancedMesh.global.mat4_1;

        let perInstance = false;

        for (let i = 0; i < count; i++)
        {
            if (!this.GetInstanceTransform(i, instance))
            {
                // Asked once. A mesh either knows its layout or does not, and it
                // will not start knowing it at instance seven.
                break;
            }

            perInstance = true;
            mat4.multiply(combined, worldTransform, instance);

            // A fresh cache per instance: the caller's holds an inverse world
            // transform and a ray in local space, and both are wrong for the
            // next instance. Sharing it would test every instance against the
            // first one's space.
            const at = intersects.length;
            this.geometryResource.Intersect(ray, intersects, combined, {}, this.meshIndex);
            ray.TrailFrom(intersects, at, `instance[${i}]`);
        }

        if (!perInstance)
        {
            this.geometryResource.Intersect(ray, intersects, worldTransform, cache, this.meshIndex);
        }

        for (let i = before; i < intersects.length; i++)
        {
            if (!intersects[i].item) intersects[i].item = this;
            if (!intersects[i].name) intersects[i].name = this.name || "";
        }

        return intersects.length > before ? intersects[before] : null;
    }

    /**
     * Rebuilds bounds
     * @param {Boolean} force
     * @returns {Boolean} true if rebuilt
     */
    RebuildBounds(force)
    {
        if (this.IsGood())
        {
            this.geometryResource.RebuildBounds(force);
            if ("RebuildBounds" in this.instanceGeometryResource)
            {
                this.instanceGeometryResource.RebuildBounds(force);
            }
            return true;
        }
        return false;
    }

    /**
     * Gets the bounding box for the mesh: the base geometry's bounds unioned
     * over every instance transform.
     *
     * Carbon declines to answer this at all - `EveChildInstancedMeshes::
     * GetBoundingSphere` is literally `return false;` - but ccpwgl cannot
     * afford to. `EveTransform.UpdateLod` starts a mesh-bearing transform at
     * `meshVisible = !this.mesh`, so a mesh that reports no bounds is never
     * made visible and silently never draws. In a sof layout, which is mostly
     * instanced placements, that is the whole scene.
     *
     * Recomputed every call, NOT cached. Caching this on the instance count
     * was wrong: instances move without the count changing, so the bounds went
     * stale, stopped matching where the geometry actually was, and the frustum
     * culled things that were on screen - objects vanishing, and LOD picked
     * from a pixel size measured against the wrong sphere.
     *
     * The walk is O(instances) and `UpdateLod` asks every frame, so this wants
     * a real invalidation signal from the instance data rather than a recompute.
     * Correctness first; there is no such signal today.
     *
     * @param {box3} out
     * @param {Boolean} force
     * @return {box3|null} `out` when it holds usable bounds, otherwise null
     */
    GetBoundingBox(out, force)
    {
        if (!this.IsGood()) return null;

        const count = this.GetInstanceCount();

        // No instances means nothing is drawn, so there is nothing to bound.
        // Distinct from "bounds unknown": the answer is that there is no extent.
        if (!count) return null;

        const { mat4_0 } = Tw2InstancedMesh.global;
        const base = Tw2InstancedMesh.global.box3_0;
        const worked = Tw2InstancedMesh.global.box3_1;

        if (!this.geometryResource.GetBoundingBox(base, force)) return null;

        let unioned = false;
        for (let i = 0; i < count; i++)
        {
            // Asked once. A mesh either knows its instance layout or does not,
            // and it will not start knowing it at instance seven - the same
            // rule `Intersect` follows.
            if (!this.GetInstanceTransform(i, mat4_0)) break;

            box3.transformMat4(worked, base, mat4_0);

            if (unioned)
            {
                box3.union(out, out, worked);
            }
            else
            {
                box3.copy(out, worked);
                unioned = true;
            }
        }

        // Layout unknown: the base geometry's own bounds. Coarse - every
        // instance is assumed to sit at the mesh's own transform - but real,
        // and the same fallback `Intersect` takes rather than answering nothing.
        if (!unioned) box3.copy(out, base);

        return out;
    }

    /**
     * Gets the bounding sphere for the mesh. See `GetBoundingBox`.
     * @param {sph3} out
     * @param {Boolean} force
     * @return {sph3|null} `out` when it holds usable bounds, otherwise null
     */
    GetBoundingSphere(out, force)
    {
        const box = Tw2InstancedMesh.global.box3_2;
        if (!this.GetBoundingBox(box, force)) return null;
        return sph3.fromBox3(out, box);
    }

    /**
     * Finds all parameters of a given name
     * @param {Object|String} options
     * @param {Array} [out]
     * @returns {Array} out
     */
    FindParameters(options, out)
    {
        return Tw2Mesh.FindParameters(this, options, [
            "transparentAreas",
            "pickableAreas",
            "opaqueAreas",
            "distortionAreas",
            "depthAreas",
            "additiveAreas",
            "depthNormalAreas"
        ], out);
    }

    /**
     * Finds a mesh area by type and index
     * @param {String} areasType
     * @param {Number} index
     * @param {Number} [meshIndex=0]
     * @return {Tw2MeshArea|Tw2MeshLineArea}
     */
    FindMeshAreaByTypeAndIndex(areasType, index, meshIndex)
    {
        return Tw2Mesh.FindMeshAreaByTypeAndIndex(this, areasType, index, meshIndex);
    }

    /**
     * Checks if the instances meshes' resources are good
     * @returns {Boolean}
     */
    IsGood()
    {
        const
            instanced = this.instanceGeometryResource,
            isResGood = this.geometryResource && this.geometryResource.IsGood(),
            isInstancedResGood = !instanced ? false : instanced.IsGood ? instanced.IsGood() : true;

        return isResGood && isInstancedResGood;
    }

    /**
     * Sets the geometry resource
     * @param {String} path
     */
    SetGeometryRes(path)
    {
        this.geometryResPath = path;
        this.geometryResource = path ? tw2.GetResource(this.geometryResPath) : null;
    }

    /**
     * Gets the geometry resource
     * TODO: Remove all usages
     * @returns {null|Tw2GeometryResource}
     */
    GetGeometryRes()
    {
        return this.geometryResource;
    }

    /**
     * Sets the instance geometry resource
     * @param {String} path
     */
    SetInstanceGeometryRes(path)
    {
        this.instanceGeometryResPath = path;
        this.instanceGeometryResource = path ? tw2.GetResource(this.instanceGeometryResPath) : null;
    }

    /**
     * Gets mesh resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.geometryResource && !out.includes(this.geometryResource))
        {
            out.push(this.geometryResource);
        }

        if (this.instanceGeometryResource && "GetResources" in this.instanceGeometryResource)
        {
            this.instanceGeometryResource.GetResources(out);
        }

        const per = perArrayChild;
        per(this.additiveAreas, "GetResources", out);
        per(this.decalAreas, "GetResources", out);
        per(this.depthAreas, "GetResources", out);
        per(this.distortionAreas, "GetResources", out);
        per(this.opaqueAreas, "GetResources", out);
        per(this.pickableAreas, "GetResources", out);
        per(this.transparentAreas, "GetResources", out);
        per(this.depthNormalAreas, "GetResources", out);

        return out;
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Boolean} true if a batch was accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.IsGood() || !this.display) return false;

        const getBatches = this.constructor.GetAreaBatches;

        let area;
        switch (mode)
        {
            case RM_ADDITIVE:
                if (this.visible.additiveAreas) area = this.additiveAreas;
                break;

            case RM_DECAL:
                if (this.visible.decalAreas) area = this.opaqueAreas;
                break;

            case RM_DISTORTION:
                if (this.visible.distortionAreas) area = this.distortionAreas;
                break;

            case RM_OPAQUE:
                if (this.visible.opaqueAreas) area = this.opaqueAreas;
                break;

            case RM_NORMAL:
                if (this.visible.depthNormalAreas) area = this.depthNormalAreas;
                break;

            case RM_TRANSPARENT:
                if (this.visible.transparentAreas) area = this.transparentAreas;
                break;

            case RM_PICKABLE:
                if (this.visible.pickableAreas) area = this.pickableAreas;
                break;

            case RM_DEPTH:
                if (this.visible.depthAreas) area = this.depthAreas;
                break;
        }

        return area && area.length ? getBatches(this, area, mode, accumulator, perObjectData) : false;
    }

    /**
     * RenderAreas
     * @param {Number} meshIx
     * @param {Number} start
     * @param {Number} count
     * @param {Tw2Effect} effect
     * @param {String} technique
     */
    RenderAreas(meshIx, start, count, effect, technique)
    {
        if (!this.IsGood()) return;

        const buffer = this.instanceGeometryResource.GetInstanceBuffer(this.instanceMeshIndex);
        if (buffer)
        {
            this.geometryResource.RenderAreasInstanced(meshIx, start, count, effect, technique, buffer,
                this.instanceGeometryResource.GetInstanceDeclaration(this.instanceMeshIndex),
                this.instanceGeometryResource.GetInstanceStride(this.instanceMeshIndex),
                this.instanceGeometryResource.GetInstanceCount(this.instanceMeshIndex));
        }
    }

    /**
     * Todo: Remove when sof can figure out what areas to update
     */
    EmptyAreas()
    {
        this.additiveAreas.splice(0);
        this.decalAreas.splice(0);
        this.depthAreas.splice(0);
        this.distortionAreas.splice(0);
        this.opaqueAreas.splice(0);
        this.pickableAreas.splice(0);
        this.transparentAreas.splice(0);
        this.depthNormalAreas.splice(0);
    }

    /**
     * Creates an instanced mesh from a plain object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {Tw2InstancedMesh}
     */
    static from(values, options)
    {
        const item = new Tw2InstancedMesh();
        item.meshIndex = get(options, "index", 0);

        if (values)
        {
            assignIfExists(item, values, [
                "name", "display", "geometryResPath",
                "instanceGeometryResPath", "instanceMeshIndex"
            ]);

            const areaNames = [
                "additiveAreas", "decalAreas", "depthAreas",
                "distortionAreas", "opaqueAreas", "pickableAreas",
                "transparentAreas", "depthNormalAreas"
            ];

            assignIfExists(item.visible, values.visible, areaNames);
            Tw2Mesh.createAreaIfExists(item, values, areaNames);
        }

        if (!options || !options.skipUpdate)
        {
            item.Initialize();
        }

        return item;
    }


    /**
     * Gets area batches
     * @param {Tw2InstancedMesh} mesh
     * @param {Array.<Tw2MeshArea>} areas
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    static GetAreaBatches(mesh, areas, mode, accumulator, perObjectData)
    {
        const c = accumulator.length;
        for (let i = 0; i < areas.length; ++i)
        {
            const area = areas[i];
            if (!area.effect || !area.display || !area.effect.IsGood()) continue;

            const batch = new Tw2InstancedMeshBatch();
            batch.renderMode = mode;
            batch.perObjectData = perObjectData;
            batch.instanceMesh = mesh;
            batch.meshIx = area.meshIndex; // mesh.meshIndex; //
            batch.start = area.index;
            batch.count = area.count;
            batch.effect = area.effect;
            accumulator.Commit(batch);
        }
        return accumulator.length !== c;
    }


    /**
     * Shared scratch
     */
    static global = {
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        box3_0: box3.create(),
        box3_1: box3.create(),
        box3_2: box3.create()
    };

}
