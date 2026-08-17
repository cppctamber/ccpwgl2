// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionPlacementGenerators/EveDistributionPlacementGeneratorLocators.h
import { meta } from "utils";
import { InitialPlacement } from "../attributeModifiers/InitialPlacement.js";
import { PlacementDataWithIdentifier } from "../../PlacementDataWithIdentifier.js";


/** EveDistributionPlacementGeneratorLocators (eve/distribution/placement) - generated from schema shapeHash f7dad053.... */
@meta.type("EveDistributionPlacementGeneratorLocators")
@meta.ccp.define("EveDistributionPlacementGeneratorLocators")
export class EveDistributionPlacementGeneratorLocators extends meta.Model
{

    _requestRegeneration = false;

    /** m_locators (PLocatorStructureList) [READ, PERSIST] */
    @meta.list("Locator")
    locators = [];

    /** Flags the pool as stale when the authored locator list changes. */
    OnStructureListModified(_event, _item, _index, _list)
    {
        this._requestRegeneration = true;
    }

    /**
     * Appends one placement per authored locator, copying its position, direction, scale and bone index, and clears the regeneration request.
     *
     * @param placements Caller-owned pool array that is appended to.
     * @param trackingID Mutable counter shared across all generators; each placement consumes one unique id from it.
     */
    GetInitialPlacements(placements, trackingID)
    {
        for (const locator of this.locators)
        {
            const data = new PlacementDataWithIdentifier();
            data.initialTranslation.set(locator.position);
            data.initialRotation.set(locator.direction);
            data.initialScale.set(locator.scale);
            data.boneIndex = locator.boneIndex;
            data.uniqueID = trackingID.value++;

            const placement = new InitialPlacement();
            placement.placement = data;
            placement.timeOutDuration = 0;
            placements.push(placement);
        }
        this._requestRegeneration = false;
    }

    /** Reports whether the locator list changed since the pool was last generated. */
    IsRequestingRegeneration()
    {
        return this._requestRegeneration;
    }

    /** No per-frame work; this generator only reacts to locator list changes. */
    UpdateSyncronous(_updateContext, _params, _owner)
    {
    }

}
