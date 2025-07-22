import { meta } from "utils";
import { resMan, tw2 } from "global";
import { Tw2GeometryBatch } from "core/batch";
import { Tw2Effect, Tw2PerObjectData } from "core";
import { RM_ADDITIVE } from "constant";
import { mat4, vec3, vec4 } from "math";



@meta.notImplemented
@meta.type("EveTrailSet")
export class EveTrailsSet extends meta.Model
{

    @meta.struct()
    effect = null;

    @meta.path
    geometryResPath = EveTrailsSet.defaultGeometryResPath;

    @meta.boolean
    display = true;

    _position = vec3.create();
    _worldPosition = vec3.create();
    _positionWorldCenter = vec3.create();
    _dirWorldSizeCylinder = vec3.create();
    _cylinderCap1 = vec4.create();
    _cylinderCap2 = vec4.create();
    _nearPlaneCape = vec4.create();
    _data = vec4.create();

    _geometryRes = null;
    _vertex = null;
    _perObjectData = Tw2PerObjectData.from(EveTrailsSet.perObjectData);
    _geometryResource = resMan.GetResource("cdn:/graphics/generic/unit_plane.gr2_json");

    /**
     * Checks if the trail set is good
     * @returns {boolean}
     */
    IsGood()
    {
        return !!(this.effect && this.geometryResource);
    }

    /**
     * Initializes the object
     */
    Initialize()
    {
        if (this.geometryResPath)
        {
            this._geometryRes = tw2.GetResource(this.geometryResPath);
        }

        if (!this.effect)
        {
            this.effect = Tw2Effect.from(EveTrailsSet.defaultTrailEffect);
        }
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>}
     */
    GetResources(out = [])
    {
        if (this.effect)
        {
            this.effect.GetResources(out);
        }

        if (this._geometryRes && !out.includes(this._geometryRes))
        {
            out.push(this._geometryRes);
        }

        return out;
    }

    /**
     *
     * @param mode
     * @param accumulator
     * @param perObjectData
     * @returns {boolean}
     * @constructor
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (mode !== RM_ADDITIVE || !this.display || !this.IsGood()) return false;

        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._worldTransform);
        this._perObjectData.ps = perObjectData.ps;

        const batch = new Tw2GeometryBatch();
        batch.renderMode = mode;
        batch.perObjectData = this._perObjectData;
        batch.geometryRes = this._geometryResource;
        batch.meshIx = 0;
        batch.start = 0;
        batch.count = this._geometryResource.meshes[0].areas.length;
        batch.effect = this.effect;
        accumulator.Commit(batch);

        return true;
    }

    Render(technique)
    {

    }

    /**
     * Default trail effect
     * @type {string}
     */
    static defaultTrailEffect = "cdn:/graphics/effect.gles2/managed/space/booster/volumetrictrails.fx";

    /**
     * Default geometry res path
     * @type {string}
     */
    static defaultGeometryResPath = "cdn:/dx9/model/ship/booster/volumetrictrail.gr2_json";

    /**
     * Per Object Data
     * @type {{ps: [], vs: []}}
     */
    static perObjectData = {
        ps: [],
        vs: []
    }
}
