import {resMan, Tw2BaseClass} from "../../global";
import {Tw2RenderBatch} from "../../core/batch";

/**
 * EveTrailSetRenderBatch
 * TODO: Implement (Probably a forwarding render batch or geometry render batch)
 * @ccp N/A
 *
 * @property {EveTrailsSet} trailsSet
 */
export class EveTrailSetRenderBatch extends Tw2RenderBatch
{

    trailsSet = null;

    /**
     * Commits the batch
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        this.boosters.Render(technique);
    }
}


/**
 * Trails set
 * Todo: Implement
 * @ccp EveTrailSet
 *
 * @property {Tr2Effect} effect           -
 * @property {String} geometryResPath     -
 * @property {Boolean} display            -
 * @property {Tw2GeometryRes} geometryRes -
 */
export class EveTrailsSet extends Tw2BaseClass
{

    // ccp
    effect = null;
    geometryResPath = "";

    //ccpwgl
    display = true;
    geometryRes = null;

    /**
     * Initializes the object
     */
    Initialize()
    {
        if (this.geometryResPath)
        {
            this.geometryRes = resMan.GetResource(this.geometryResPath);
            this.geometryRes.RegisterNotification(this);
        }
    }

    /**
     * Rebuilds cached data
     * @param {Tw2GeometryRes} res
     */
    RebuildCachedData(res)
    {
        //TODO: RebuildCachedData
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

        if (this.geometryRes && !out.includes(this.geometryRes))
        {
            out.push(this.geometryRes);
        }

        return out;
    }

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    Update(dt)
    {
        //TODO: Implement
    }

    /**
     * Unloads the object's buffers
     */
    Unload()
    {
        // TODO: Unload buffers
    }

    /**
     * Rebuilds the haze set's buffers
     */
    Rebuild()
    {
        // TODO: Rebuild buffers
    }

    /**
     * Gets the plane set's render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        // TODO: GetBatches
    }

    /**
     * Renders the haze set
     * @param {String} technique - technique name
     */
    Render(technique)
    {
        // TODO: Render
    }

}

Tw2BaseClass.define(EveTrailsSet, Type =>
{
    return {
        type: "EveTrailsSet",
        category: "EveObjectSet",
        isStaging: true,
        props: {
            display: Type.BOOLEAN,
            effect: ["Tr2Effect"],
            geometryResPath: Type.PATH
        },
        notImplemented: ["*"]
    };
});

