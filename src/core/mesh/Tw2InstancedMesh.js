import { meta, isString, perArrayChild, get, assignIfExists } from "utils";
import { resMan } from "global";
import { vec3 } from "math";
import { Tw2InstancedMeshBatch } from "../batch";
import { Tw2Mesh } from "./Tw2Mesh";
import {
    RM_ADDITIVE,
    RM_DEPTH,
    RM_DISTORTION,
    RM_DECAL,
    RM_OPAQUE,
    RM_TRANSPARENT,
    RM_PICKABLE
} from "constant";


@meta.type("Tw2InstancedMesh", "Tr2InstancedMesh")
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

    @meta.path
    geometryResPath = "";

    @meta.path
    instanceGeometryResPath = "";

    @meta.struct()
    instanceGeometryResource = null;

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

    @meta.plain
    visible = {
        additiveAreas: true,
        decalAreas: true,
        depthAreas: true,
        distortionAreas: true,
        opaqueAreas: true,
        pickableAreas: true,
        transparentAreas: true,
    };

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
     * Initializes the instanced mesh
     */
    Initialize()
    {
        if (this.geometryResPath !== "")
        {
            this._geometryResource = resMan.GetResource(this.geometryResPath);
        }

        if (this.instanceGeometryResPath !== "")
        {
            this.instanceGeometryResource = resMan.GetResource(this.instanceGeometryResPath);
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
     * Checks if the instances meshes' resources are good
     * @returns {Boolean}
     */
    IsGood()
    {
        const
            instanced = this.instanceGeometryResource,
            isResGood = this._geometryResource && this._geometryResource.IsGood(),
            isInstancedResGood = !instanced ? false : instanced.IsGood ? instanced.IsGood() : true;

        return isResGood && isInstancedResGood;
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
                if (this.visible.decalAreas) area = this.opaqueAreas;
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
            this._geometryResource.RenderAreasInstanced(meshIx, start, count, effect, technique, buffer,
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
            /*
            if (values.instanceGeometryResource)
            {
                item.instanceGeometryResource = values.instanceGeometryResource;
            }
            */

            assignIfExists(item, values, [
                "name", "display", "geometryResPath",
                "instanceGeometryResPath", "instanceMeshIndex"
            ]);

            const areaNames = [
                "additiveAreas", "decalAreas", "depthAreas",
                "distortionAreas", "opaqueAreas", "pickableAreas",
                "transparentAreas"
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
     */
    static GetAreaBatches(mesh, areas, mode, accumulator, perObjectData)
    {
        for (let i = 0; i < areas.length; ++i)
        {
            const area = areas[i];
            if (area.effect && area.display)
            {
                const batch = new Tw2InstancedMeshBatch();
                batch.renderMode = mode;
                batch.perObjectData = perObjectData;
                batch.instanceMesh = mesh;
                batch.meshIx = area.meshIndex;
                batch.start = area.index;
                batch.count = area.count;
                batch.effect = area.effect;
                accumulator.Commit(batch);
            }
        }
    }

}
