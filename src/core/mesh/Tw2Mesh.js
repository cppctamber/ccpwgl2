import { meta, isString, perArrayChild, assignIfExists, get, toArray, isArray } from "utils";
import { tw2 } from "global";
import {
    RM_ADDITIVE,
    RM_DEPTH,
    RM_DISTORTION,
    RM_DECAL,
    RM_OPAQUE,
    RM_TRANSPARENT,
    RM_PICKABLE
} from "constant";
import { box3 } from "math/box3";
import { sph3 } from "math/sph3";


@meta.type("Tw2Mesh", "Tr2Mesh")
export class Tw2Mesh extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("Tw2MeshArea")
    additiveAreas = [];

    @meta.list("Tw2MeshArea")
    decalAreas = [];

    @meta.notImplemented
    @meta.boolean
    deferGeometryLoad = false;

    @meta.notImplemented
    @meta.list("Tw2MeshArea")
    depthAreas = [];

    @meta.notImplemented
    @meta.list("Tw2MeshArea")
    depthNormalAreas = [];

    @meta.boolean
    display = true;

    @meta.list("Tw2MeshArea")
    distortionAreas = [];

    @meta.path
    geometryResPath = "";

    @meta.uint
    meshIndex = 0;

    @meta.list("Tw2MeshArea")
    opaqueAreas = [];

    @meta.notImplemented
    @meta.list("Tw2MeshArea")
    opaquePrepassAreas = [];

    @meta.list("Tw2MeshArea")
    pickableAreas = [];

    @meta.list("Tw2MeshArea")
    transparentAreas = [];

    @meta.plain
    visible = {
        additiveAreas: true,
        decalAreas: true,
        depthAreas: true,
        depthNormalAreas: true,
        distortionAreas: true,
        opaqueAreas: true,
        opaquePrepassAreas: true,
        pickableAreas: true,
        transparentAreas: true,
    };

    @meta.struct("Tw2GeometryRes")
    @meta.isPrivate
    geometryResource = null;

    @meta.float
    @meta.notImplemented
    maxVertexScale = 0.0;

    @meta.boolean
    @meta.notImplemented
    rotatesVertices = false;

    @meta.float
    @meta.notImplemented
    maxVertexDisplacement = 0.0;

    /**
     * Alias for geometryResource
     * @returns {null|Tw2GeometryRes}
     */
    get res()
    {
        return this.geometryResource;
    }

    /**
     * Gets the current mesh index
     * @returns {number}
     */
    GetMeshIndex()
    {
        return this.meshIndex;
    }

    /**
     * Sets the current mesh index
     * @param index
     */
    SetMeshIndex(index)
    {
        this.meshIndex = index;
    }

    /**
     * Initializes the mesh
     */
    Initialize()
    {
        if (this.geometryResPath !== "")
        {
            this.geometryResource = tw2.GetResource(this.geometryResPath);
        }
    }

    /**
     * Handles fetching of geometry resources
     * @param {*} parent
     * @param {String} pathProperty
     * @param {String} resProperty
     * @param {String} resPath
     * @returns {Promise<boolean>}
     */
    static async HandleFetch(parent, pathProperty, resProperty, resPath)
    {

        if (!resPath)
        {
            if (parent[resProperty])
            {
                parent[resProperty].RemoveNotification(this);
                parent[resProperty] = null;
            }

            if (parent[pathProperty])
            {
                this[pathProperty] = "";
                return true;
            }

            return false;
        }

        parent[pathProperty] = resPath;
        const res = await tw2.Fetch(resPath);
        if (parent[pathProperty] === resPath && parent[resProperty] !== res)
        {
            parent[resProperty] = res;
            return true;
        }
        return false;
    }

    /**
     * Sets the geometry path and loads it is another hasn't been loaded since
     * @param {string} resPath
     * @returns {Promise<Boolean>}
     */
    async FetchGeometryResPath(resPath)
    {
        return Tw2Mesh.HandleFetch(this, "geometryResPath", "geometryResource", resPath);
    }

    /**
     * Intersects the mesh
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} worldTransform
     * @param {Object} [cache]
     */
    Intersect(ray, intersects, worldTransform, cache)
    {
        if (this.display && this.IsGood() && !ray.IsMasked(this))
        {
            //console.log("Intersecting mesh " + this.name);
            return this.geometryResource.Intersect(ray, intersects, worldTransform, cache, this.meshIndex);
        }
    }

    /**
     *
     * @param force
     */
    RebuildBounds(force)
    {
        if (this.IsGood())
        {
            this.geometryResource.RebuildBounds(force);
            return true;
        }
        return false;
    }

    /**
     *
     * @param {box3} out
     * @param {Boolean} force
     * @return {box3|null}
     */
    GetBoundingBox(out, force)
    {
        if (this.RebuildBounds(force))
        {
            return this.geometryResource.GetBoundingBox(out);
        }

        box3.empty(out);
        return null;
    }

    /**
     *
     * @param {sph3} out
     * @param {Boolean} force
     * @return {sph3|null}
     */
    GetBoundingSphere(out, force)
    {
        if (this.RebuildBounds(force))
        {
            return this.geometryResource.GetBoundingSphere(out);
        }

        sph3.empty(out);
        return null;
    }

    /**
     * Sets the geometry resource
     * @param path
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
     * Finds all parameters of a given name
     * @param {Object|String} options
     * @param {Array} [out=[]]
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
            "opaquePrepassAreas",
            "depthNormalAreas",
        ], out);
    }

    /**
     * Finds a mesh area by type and index
     * @param {String} areasType
     * @param {Number} index
     * @param {Number} meshIndex
     * @return {Tw2MeshArea|Tw2MeshLineArea}
     */
    FindMeshAreaByTypeAndIndex(areasType, index, meshIndex)
    {
        return Tw2Mesh.FindMeshAreaByTypeAndIndex(this, areasType, index, meshIndex);
    }

    /**
     * Checks if the mesh's resource is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return this.geometryResource && this.geometryResource.IsGood();
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

        const per = perArrayChild;
        per(this.additiveAreas, "GetResources", out);
        per(this.decalAreas, "GetResources", out);
        per(this.depthAreas, "GetResources", out);
        per(this.distortionAreas, "GetResources", out);
        per(this.opaqueAreas, "GetResources", out);
        per(this.pickableAreas, "GetResources", out);
        per(this.transparentAreas, "GetResources", out);
        return out;
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
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
                if (this.visible.decalAreas) area = this.decalAreas;
                break;

            case RM_DISTORTION:
                if (this.visible.distortionAreas) area = this.distortionAreas;
                break;

            case RM_OPAQUE:
                if (this.visible.opaqueAreas) area = this.opaqueAreas;
                break;

            case RM_TRANSPARENT:
                if (this.visible.transparentAreas) area = this.transparentAreas;
                break;

            case RM_DEPTH:
                if (this.visible.depthAreas) area = this.depthAreas;
                break;

            case RM_PICKABLE:
                if (this.visible.pickableAreas) area = this.pickableAreas;
                break;
        }

        return area ? getBatches(this, area, mode, accumulator, perObjectData) : false;
    }

    /**
     * Todo: Remove when sof can figure out what areas to update
     */
    EmptyAreas()
    {
        this.additiveAreas.splice(0);
        this.decalAreas.splice(0);
        this.depthAreas.splice(0);
        this.depthNormalAreas.splice(0);
        this.distortionAreas.splice(0);
        this.opaqueAreas.splice(0);
        this.opaquePrepassAreas.splice(0);
        this.pickableAreas.splice(0);
        this.transparentAreas.splice(0);
    }

    /**
     * Finds all parameters in a mesh of a given name, optionally by area name and area type
     * @param {Tw2Mesh|Tw2InstancedMesh}mesh
     * @param {String|Object} options
     * @param {Array<String>}areaNames
     * @param {Array} [out=[]]
     * @returns {Array} out
     */
    static FindParameters(mesh, options, areaNames, out = [])
    {
        if (isString(options)) options = { parameterName: options };
        const { parameterName, areaName, areaType } = options;

        for (let i = 0; i < areaNames.length; i++)
        {
            const type = areaNames[i];
            if (!areaType || areaType === type)
            {
                const meshAreas = mesh[type] || [];
                for (let i = 0; i < meshAreas.length; i++)
                {
                    if (!areaName || meshAreas[i].name === areaName)
                    {
                        const parameter = meshAreas[i].FindParameter(parameterName, out);
                        if (parameter && !out.includes(parameter))
                        {
                            out.push(parameter);
                        }
                    }
                }
            }
        }

        return out;
    }

    /**
     * Finds a mesh area by type and index
     * @param {Tw2Mesh|Tw2InstancedMesh} mesh
     * @param {String} areasType
     * @param {Number} index
     * @param {Number} [meshIndex=0]
     * @return {null|Tw2MeshArea|Tw2MeshLineArea}
     */
    static FindMeshAreaByTypeAndIndex(mesh, areasType, index, meshIndex = 0)
    {
        const meshAreas = mesh[areasType];
        if (!isArray(meshAreas))
        {
            throw new ReferenceError(`Invalid mesh area type: ${areasType}`);
        }

        if (meshAreas)
        {
            for (let i = 0; i < meshAreas.length; i++)
            {
                if (meshAreas[i].index === index && meshAreas[i].meshIndex === meshIndex)
                {
                    return meshAreas[i];
                }
            }
        }

        return null;
    }

    /**
     * Gets render batches from a mesh area array and commits them to an accumulator
     * @param {Tw2Mesh} mesh
     * @param {Array.<Tw2MeshArea>} areas
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    static GetAreaBatches(mesh, areas, mode, accumulator, perObjectData)
    {
        const c = accumulator.length;

        for (let i = 0; i < areas.length; ++i)
        {
            const area = areas[i];
            if (!area.effect || !area.display || !area.effect.IsGood()) continue;

            const batch = new area.constructor.batchType();
            batch.renderMode = mode;
            batch.perObjectData = perObjectData;
            batch.geometryRes = mesh.geometryResource;
            batch.meshIx = mesh.meshIndex;              //area.meshIndex;
            batch.start = area.index;
            batch.count = area.count;
            batch.effect = area.effect;
            accumulator.Commit(batch);
        }

        return accumulator.length !== c;
    }

    /**
     * Creates an area if it exists
     * @param {*} dest
     * @param {*} src
     * @param {String|String[]} names
     */
    static createAreaIfExists(dest, src, names)
    {
        names = toArray(names);
        for (let i = 0; i < names.length; i++)
        {
            const name = names[i];
            if (name in src && name in dest)
            {
                for (let i = 0; i < src[name].length; i++)
                {
                    const
                        type = src[name][i].__type || "Tw2MeshArea",
                        Constructor = tw2.GetClass(type);

                    // Why is index put in the object?
                    // src[name][i].index = i;
                    dest[name].push(Constructor.from(src[name][i], { index: i }));
                }
            }
        }
    }

    /**
     * Creates a mesh from a plain object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {Tw2Mesh}
     */
    static from(values, options)
    {
        const item = new Tw2Mesh();

        if (values)
        {
            assignIfExists(item, values, [
                "name", "display", "deferGeometryLoad",
                "geometryResPath", "meshIndex"
            ]);

            const areaNames = [
                "additiveAreas", "decalAreas", "depthAreas",
                "depthNormalAreas", "distortionAreas", "opaqueAreas",
                "opaquePrepassAreas", "pickableAreas", "transparentAreas"
            ];

            assignIfExists(item.visible, values.visible, areaNames);
            this.createAreaIfExists(item, values, areaNames);
        }

        if (!options || !options.skipUpdate)
        {
            item.Initialize();
        }

        return item;
    }

}
