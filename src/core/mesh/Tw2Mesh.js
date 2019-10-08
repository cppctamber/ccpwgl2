import { util, resMan, tw2, Tw2BaseClass } from "../../global";
import {
    RM_ADDITIVE,
    RM_DEPTH,
    RM_DISTORTION,
    RM_DECAL,
    RM_OPAQUE,
    RM_TRANSPARENT,
    RM_PICKABLE
} from "../../global/engine";
import { assignIfExists, get, toArray } from "../../global/util";

/**
 * Tw2Mesh
 * Todo: Implement "deferGeometryLoad"
 * Todo: Implement "depthNormalAreas"
 * Todo: Implement "distortionAreas"
 * Todo: Implement "depthAreas"
 * Todo: Implement "opaquePrepassAreas"
 * Todo: Handle "reversed" meshAreas
 * Todo: Handle "useSHLighting" meshAreas
 * @ccp Tr2Mesh
 *
 * @property {String} name                            -
 * @property {Array.<Tw2MeshArea>} additiveAreas      -
 * @property {Array.<Tw2MeshArea>} decalAreas         -
 * @property {Boolean} deferGeometryLoad              -
 * @property {Array.<Tw2MeshArea>} depthAreas         -
 * @property {Array.<Tw2MeshArea>} depthNormalAreas   -
 * @property {Boolean} display                        -
 * @property {Array.<Tw2MeshArea>} distortionAreas    -
 * @property {String} geometryResPath                 -
 * @property {Number} meshIndex                       -
 * @property {Array.<Tw2MeshArea>} opaqueAreas        -
 * @property {Array.<Tw2MeshArea>} opaquePrepassAreas -
 * @property {Array.<Tw2MeshArea>} pickableAreas      -
 * @property {Array.<Tw2MeshArea>} transparentAreas   -
 * @property {Tw2GeometryRes} geometryResource        -
 * @parameter {*} visible                            -

 */
export class Tw2Mesh extends Tw2BaseClass
{

    name = "";
    additiveAreas = [];
    decalAreas = [];
    deferGeometryLoad = false;
    depthAreas = [];
    depthNormalAreas = [];
    distortionAreas = [];
    geometryResPath = "";
    meshIndex = 0;
    opaqueAreas = [];
    opaquePrepassAreas = [];
    pickableAreas = [];
    transparentAreas = [];

    // ccpwgl
    display = true;
    geometryResource = null;
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

    /**
     * Initializes the mesh
     */
    Initialize()
    {
        if (this.geometryResPath !== "")
        {
            this.geometryResource = resMan.GetResource(this.geometryResPath);
        }
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

        //return super.GetResources(out);
        util.perArrayChild(this.additiveAreas, "GetResources", out);
        util.perArrayChild(this.decalAreas, "GetResources", out);
        util.perArrayChild(this.depthAreas, "GetResources", out);
        util.perArrayChild(this.distortionAreas, "GetResources", out);
        util.perArrayChild(this.opaqueAreas, "GetResources", out);
        util.perArrayChild(this.pickableAreas, "GetResources", out);
        util.perArrayChild(this.transparentAreas, "GetResources", out);
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
        switch (mode)
        {
            case RM_ADDITIVE:
                if (this.visible.additiveAreas)
                {
                    getBatches(this, this.additiveAreas, mode, accumulator, perObjectData);
                }
                return;

            case RM_DECAL:
                if (this.visible.decalAreas)
                {
                    getBatches(this, this.opaqueAreas, mode, accumulator, perObjectData);
                }
                return;

            case RM_DEPTH:
                /*
                if (this.visible.depthAreas)
                {
                    getBatches(this, this.depthAreas, mode, accumulator, perObjectData);
                }
                */
                return;

            case RM_DISTORTION:
                /*
                if (this.visible.distortionAreas)
                {
                    getBatches(this, this.distortionAreas, mode, accumulator, perObjectData);
                }
                */
                return;

            case RM_OPAQUE:
                if (this.visible.opaqueAreas)
                {
                    getBatches(this, this.opaqueAreas, mode, accumulator, perObjectData);
                }
                return;

            case RM_PICKABLE:
                if (this.visible.pickableAreas)
                {
                    getBatches(this, this.pickableAreas, mode, accumulator, perObjectData);
                }
                return;

            case RM_TRANSPARENT:
                if (this.visible.transparentAreas)
                {
                    getBatches(this, this.transparentAreas, mode, accumulator, perObjectData);
                }
                return;
        }
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
                batch.geometryRes = mesh.geometryResource;
                batch.meshIx = mesh.meshIndex;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "additiveAreas", r.array ],
            [ "decalAreas", r.array ],
            [ "deferGeometryLoad", r.boolean ],
            [ "depthAreas", r.array ],
            [ "depthNormalAreas", r.array ],
            [ "distortionAreas", r.array ],
            [ "geometryResPath", r.path ],
            [ "meshIndex", r.uint ],
            [ "name", r.string ],
            [ "opaqueAreas", r.array ],
            [ "opaquePrepassAreas", r.array ],
            [ "pickableAreas", r.array ],
            [ "transparentAreas", r.array ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 1;

}
