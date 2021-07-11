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

    @meta.notImplemented
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
    _geometryResource = null;

    /**
     * Temporary alias for _geometryResource
     * @returns {null|Tw2GeometryRes}
     */
    get geometryResource()
    {
        return this._geometryResource;
    }

    /**
     * Temporary alias for _geometryResource
     * @param {Tw2GeometryRes} res
     */
    set geometryResource(res)
    {
        this._geometryResource = res;
    }

    /**
     * Initializes the mesh
     */
    Initialize()
    {
        if (this.geometryResPath !== "")
        {
            this._geometryResource = tw2.GetResource(this.geometryResPath);
        }
    }

    /**
     * Finds all parameters of a given name
     * @param {Object|String} options
     * @param {Array} [out=[]]
     * @returns {Array} out
     */
    FindParameters(options, out = [])
    {
        if (isString(options)) options = { name: options };
        const { name, areaName, areaType } = options;

        const findParameter = type =>
        {
            if (!areaType || areaType === type)
            {
                const meshAreas = this[type] || [];
                for (let i = 0; i < meshAreas.length; i++)
                {
                    if (!areaName || meshAreas[i].name === areaName)
                    {
                        const parameter = meshAreas[i].FindParameter(name, out);
                        if (parameter && !out.includes(parameter))
                        {
                            out.push(parameter);
                        }
                    }
                }
            }
        };

        findParameter("transparentAreas");
        findParameter("pickableAreas");
        findParameter("opaqueAreas");
        findParameter("distortionAreas");
        findParameter("depthAreas");
        findParameter("additiveAreas");
        findParameter("opaquePrepassAreas");
        findParameter("depthNormalAreas");

        return out;
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
     * Finds a mesh area by type and index
     * @param {Tw2Mesh|Tw2InstancedMesh} mesh
     * @param {String} areasType
     * @param {Number} index
     * @param {Number} [meshIndex=0]
     * @return {Tw2MeshArea|Tw2MeshLineArea}
     */
    static FindMeshAreaByTypeAndIndex(mesh, areasType, index, meshIndex=0)
    {
        if (areasType in this.AreaType)
        {
            areasType = mesh[this.AreaType[areasType]];
        }

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
    }

    static AreaType = {
        "TRANSPARENT": "transparentAreas",
        "PICKABLE": "pickableAreas",
        "DISTORTION": "distortionAreas",
        "DEPTH": "depthAreas",
        "DEPTH_NORMAL": "depthNormalAreas",
        "ADDITIVE": "additiveAreas",
        "OPAQUE": "opaqueAreas",
        "OPAQUE_PREPASS": "opaquePrepassAreas",
    };

    /**
     * Checks if the mesh's resource is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return this._geometryResource && this._geometryResource.IsGood();
    }

    /**
     * Gets the meshes' geometry resource
     * @returns {null|Tw2GeometryRes}
     */
    GetGeometryRes()
    {
        return this._geometryResource;
    }

    /**
     * Gets mesh resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this._geometryResource && !out.includes(this._geometryResource))
        {
            out.push(this._geometryResource);
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

            case RM_DEPTH:
                if (this.visible.depthAreas) area = this.depthAreas;
                break;

            case RM_DISTORTION:
                if (this.visible.distortionAreas) area = this.distortionAreas;
                break;

            case RM_OPAQUE:
                if (this.visible.opaqueAreas) area = this.opaqueAreas;
                break;

            case RM_PICKABLE:
                if (this.visible.pickableAreas) area = this.pickableAreas;
                break;

            case RM_TRANSPARENT:
                if (this.visible.transparentAreas) area = this.transparentAreas;
                break;
        }

        if (area)
        {
            getBatches(this, area, mode, accumulator, perObjectData);
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
        this.depthNormalAreas.splice(0);
        this.distortionAreas.splice(0);
        this.opaqueAreas.splice(0);
        this.opaquePrepassAreas.splice(0);
        this.pickableAreas.splice(0);
        this.transparentAreas.splice(0);
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
        for (let i = 0; i < areas.length; ++i)
        {
            const area = areas[i];
            if (area.effect && area.display)
            {
                const batch = new area.constructor.batchType();
                batch.renderMode = mode;
                batch.perObjectData = perObjectData;
                batch.geometryRes = mesh._geometryResource;
                batch.meshIx = area.meshIndex;
                batch.start = area.index;
                batch.count = area.count;
                batch.effect = area.effect;
                accumulator.Commit(batch);
            }
        }
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
        item.index = get(options, "index", 0);

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
