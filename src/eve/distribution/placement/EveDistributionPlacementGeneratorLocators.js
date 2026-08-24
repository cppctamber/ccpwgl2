// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionPlacementGenerators/EveDistributionPlacementGeneratorLocators.h
import { meta } from "utils";
import { InitialPlacement } from "../attributeModifiers/InitialPlacement.js";
import { PlacementDataWithIdentifier } from "../../PlacementDataWithIdentifier.js";
import { Locator } from "../../item/EveLocatorSets.js";


/** EveDistributionPlacementGeneratorLocators (eve/distribution/placement) - generated from schema shapeHash f7dad053.... */
@meta.define("EveDistributionPlacementGeneratorLocators", true)
export class EveDistributionPlacementGeneratorLocators extends meta.Model
{

    _requestRegeneration = false;

    /**
     * m_locators (PLocatorStructureList) [READ, PERSIST]
     *
     * Carbon's `Locator` struct (EveLocatorSets.h:10-17), read straight off the
     * black file - so it must be the class whose PROPERTY NAMES match what was
     * authored: position/direction/scale/boneIndex.
     *
     * NOT `EveLocatorSetItem`, which carries the same four values under
     * rotation/scaling. That substitution was tried and reverted: the reader
     * matches by name, so it built an untyped bag, misread the list, and threw
     * on the next value it took for a length - which reads as a corrupt asset
     * rather than a wrong class. See the note on `Locator` itself.
     *
     * Not `EveLocator2`/`EveLocator` either: those are the hull's NAMED single
     * locators and carry a matrix, not a decomposed SRT.
     *
     * Passed as the CLASS rather than its name, and that is load bearing: the
     * `list` decorator only wires the packed structure-list reader when it is
     * handed a constructor. Given a string it falls through to the generic
     * object-list path, which expects typed objects on the wire, reads a
     * float as a length, and throws `Argument is too big` naming a number
     * with no relation to anything - which reads as a corrupt asset.
     */
    @meta.list(Locator)
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

            // Carbon's spelling, because these are Carbon's authored structs.
            // Reading the other one yields undefined, and
            // `Float32Array.set(undefined)` THROWS - which the owning smart
            // light set catches and latches, so the whole set goes permanently
            // inert with no visible error.
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
