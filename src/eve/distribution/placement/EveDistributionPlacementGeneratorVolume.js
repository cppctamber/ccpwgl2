// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionPlacementGenerators/EveDistributionPlacementGeneratorVolume.h
import { meta } from "utils";
import { quat, vec3 } from "math";
import { InitialPlacement } from "../attributeModifiers/InitialPlacement.js";
import { PlacementDataWithIdentifier } from "../../PlacementDataWithIdentifier.js";


/** EveDistributionPlacementGeneratorVolume (eve/distribution/placement) - generated from schema shapeHash d6e2cbac.... */
@meta.type("EveDistributionPlacementGeneratorVolume")
@meta.ccp.define("EveDistributionPlacementGeneratorVolume")
export class EveDistributionPlacementGeneratorVolume extends meta.Model
{

    _isRequestingRegeneration = true;

    _volumeCallbackID = 0;

    _subscribedVolume = null;

    /** m_numGenerated (uint32_t) [READWRITE, PERSIST, NOTIFY] */
    @meta.uint
    numGenerated = 10;

    /** m_hollowVolume (bool) [READWRITE, PERSIST, NOTIFY] */
    @meta.boolean
    hollowVolume = false;

    /** m_falloffFactor (float) [READWRITE, PERSIST, NOTIFY] */
    @meta.float
    falloffFactor = 1.5;

    /** m_volume (IEveVolumePtr) [PERSISTONLY] */
    @meta.struct("IEveVolume")
    volume = null;

    /**
     * Appends one placement per point sampled from the assigned volume, translated by the volume's bounding-sphere centre and oriented so +Y points along the sampled radial direction; appends nothing when no volume is assigned.
     *
     * @param placements Caller-owned pool array that is appended to.
     * @param trackingID Mutable counter shared across all generators; each placement consumes one unique id from it.
     */
    GetInitialPlacements(placements, trackingID)
    {
        this._syncVolumeCallbacks();
        if (!this.volume)
        {
            return;
        }

        const points = [];
        this.volume.GeneratePointsInVolume(points, this.numGenerated, this.hollowVolume, this.falloffFactor);
        const offset = this.volume.GetBoundingSphere().center;
        const direction = vec3.create();
        const up = vec3.fromValues(0, 1, 0);

        for (const point of points)
        {
            const data = new PlacementDataWithIdentifier();
            vec3.add(data.initialTranslation, offset, point);
            vec3.normalize(direction, point);
            quat.rotationTo(data.initialRotation, up, direction);
            data.uniqueID = trackingID.value++;

            const placement = new InitialPlacement();
            placement.placement = data;
            placement.timeOutDuration = 0;
            placements.push(placement);
        }

        this._isRequestingRegeneration = false;
    }

    /** Marks the placement pool as stale so the owning distribution rebuilds it. */
    RequestRegeneration()
    {
        this._isRequestingRegeneration = true;
    }

    /**
     * Reports whether the pool is stale; the owning distribution restarts while
     * this is true, and it clears once new placements are generated.
     */
    IsRequestingRegeneration()
    {
        return this._isRequestingRegeneration;
    }

    /** Subscribes to change notifications on the assigned volume. */
    Initialize()
    {
        this._syncVolumeCallbacks();
        return true;
    }

    /**
     * Requests regeneration and re-points the volume subscription after any
     * authored change.
     */
    OnModified(_options = {})
    {
        this.RequestRegeneration();
        this._syncVolumeCallbacks();
        return true;
    }

    /**
     * Re-checks the volume subscription each frame, so a volume swapped in at
     * runtime is picked up and triggers regeneration.
     */
    UpdateSyncronous(_updateContext, _params, _owner)
    {
        this._syncVolumeCallbacks();
    }

    /**
     * Moves the change subscription onto the currently assigned volume when it
     * differs from the subscribed one, then requests regeneration.
     */
    _syncVolumeCallbacks()
    {
        if (this.volume === this._subscribedVolume)
        {
            return;
        }

        if (this._subscribedVolume && this._volumeCallbackID !== 0)
        {
            this._subscribedVolume.UnregisterForChanges(this._volumeCallbackID);
        }

        this._subscribedVolume = this.volume;
        this._volumeCallbackID = 0;
        if (this._subscribedVolume)
        {
            this._volumeCallbackID = this._subscribedVolume.RegisterForChanges(() => this.RequestRegeneration());
        }
        this.RequestRegeneration();
    }

}
