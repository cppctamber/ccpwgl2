import { meta, perArrayChild } from "utils";
import {
    RM_ADDITIVE,
    RM_DEPTH,
    RM_DISTORTION,
    RM_DECAL,
    RM_OPAQUE,
    RM_TRANSPARENT,
    RM_PICKABLE
} from "global/engine/Tw2Constant";


@meta.notImplemented
@meta.ctor("Tr2MeshLod")
@meta.todo("Implement LOD")
export class Tr2MeshLod extends meta.Model
{

    @meta.list("Tw2MeshArea")
    additiveAreas = [];

    @meta.notImplemented
    @meta.list("Tw2GeometryRes")
    associatedResources = [];

    @meta.list("Tw2MeshArea")
    decalAreas = [];

    @meta.notImplemented
    @meta.list("Tw2MeshArea")
    depthAreas = [];

    @meta.notImplemented
    @meta.list("Tw2MeshArea")
    distortionAreas = [];

    @meta.struct("Tr2LodResource")
    geometryRes = null;

    @meta.list("Tw2MeshArea")
    opaqueAreas = [];

    @meta.list("Tw2MeshArea")
    pickableAreas = [];

    @meta.list("Tw2MeshArea")
    transparentAreas = [];

    @meta.boolean
    display = true;

    @meta.plain
    visible = {
        opaqueAreas: true,
        transparentAreas: true,
        additiveAreas: true,
        pickableAreas: true,
        distortionAreas: true,
        decalAreas: true,
        depthAreas: true
    };


    _geometryResource = null;


    /**
     * Temporary alias for _geometryResource
     * @returns {null}
     */
    get geometryResource()
    {
        return this._geometryResource;
    }

    /**
     * Temporary alias for _geometryResource
     * @param res
     */
    set geometryResource(res)
    {
        this._geometryResource = res;
    }

    /**
     * Initializes the object
     */
    @meta.notImplemented
    Initialize()
    {

    }

    /**
     * Rebuilds cached data
     * @param {Tw2GeometryRes} res
     */
    OnResPrepared(res)
    {
        this._geometryResource = res;
    }

    /**
     * Checks if the mesh's resource is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return this._geometryResource && this._geometryResource.IsGood();
    }

    /**
     * Gets mesh resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.associatedResources; i++)
        {
            if (out[i] && !out.includes(this.associatedResources[i]))
            {
                out.push(this.associatedResources[i]);
            }
        }

        //return super.GetResources(out);
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

        if (area) getBatches(this, area, mode, accumulator, perObjectData);
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
     * Gets render batches from a mesh area array and commits them to an accumulator
     * @param {Tr2MeshLod} mesh
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
                batch.meshIx = 0;                           // Why no mesh index?
                batch.start = area.index;
                batch.count = area.count;
                batch.effect = area.effect;
                accumulator.Commit(batch);
            }
        }
    }

}

