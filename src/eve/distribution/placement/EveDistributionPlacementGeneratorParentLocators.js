// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionPlacementGenerators/EveDistributionPlacementGeneratorParentLocators.h
import { meta } from "utils";
import { InitialPlacement } from "../attributeModifiers/InitialPlacement.js";
import { PlacementDataWithIdentifier } from "../../PlacementDataWithIdentifier.js";
import { EveChildInstanceContainer } from "eve/child/EveChildInstanceContainer";


/** EveDistributionPlacementGeneratorParentLocators (eve/distribution/placement) - generated from schema shapeHash ebb2456a.... */
@meta.type("EveDistributionPlacementGeneratorParentLocators")
@meta.ccp.define("EveDistributionPlacementGeneratorParentLocators")
export class EveDistributionPlacementGeneratorParentLocators extends meta.Model
{

    // Carbon's structure-list notification drives this regeneration state.
    _regenerated = false;

    _requestRegeneration = false;

    _locators = null;

    _parent = null;

    _locatorSetName = null;

    /** m_locatorSetName (BlueSharedString) [READWRITE, PERSIST, NOTIFY] */
    @meta.string
    locatorSetName = "damage";

    /**
     * Appends one placement per locator of the parent space object's named locator set, copying position, direction, scale and bone index; appends nothing until an update has resolved that set.
     *
     * @param placements Caller-owned pool array that is appended to.
     * @param trackingID Mutable counter shared across all generators; each placement consumes one unique id from it.
     */
    GetInitialPlacements(placements, trackingID)
    {
        this._requestRegeneration = false;
        if (!this._locators)
        {
            return;
        }

        for (const locator of this._locators)
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
    }

    /**
     * Reports whether a locator set has just been resolved from the parent and the
     * pool therefore needs rebuilding.
     */
    IsRequestingRegeneration()
    {
        return this._requestRegeneration;
    }

    /**
     * Resolves the named locator set from the space-object parent carried by the
     * update params, re-resolving whenever the parent or the set name changes, and
     * requests regeneration once locators are found.
     */
    UpdateSyncronous(_updateContext, params, _owner)
    {
        const parent = params.spaceObjectParent;
        const locatorSetName = String(this.locatorSetName ?? "");
        if (parent !== this._parent || locatorSetName !== this._locatorSetName)
        {
            this._parent = parent;
            this._locatorSetName = locatorSetName;
            this._locators = null;
            this._regenerated = false;
        }

        if (!this._regenerated && parent)
        {
            // Carbon calls `spaceObject->GetLocatorsForSet(name)` directly, but
            // ccpwgl's EveShip2 has no such method - its equivalent is the
            // private `_GetLocatorSetItems`. Calling Carbon's name threw
            // "parent.GetLocatorsForSet is not a function" from inside
            // EveShip2.Update, which aborts the whole child loop and takes every
            // sibling after the smart light set down with it.
            //
            // EveChildInstanceContainer already owns that adaptation and two
            // other classes already use it, so this defers rather than adding a
            // second copy of the same fallback chain.
            const locators = EveChildInstanceContainer.GetLocatorsForSet(parent, locatorSetName);
            this._locators = locators;
            if (locators)
            {
                this._regenerated = true;
                this._requestRegeneration = true;
            }
        }
    }

    /**
     * Invalidates the resolved locator set after an authored change so the next
     * update re-reads it.
     */
    OnModified(_options = {})
    {
        this._regenerated = false;
        return true;
    }

    /**
     * Invalidates the resolved locator set so the next update re-reads it from the
     * parent.
     *
     * JavaScript retains explicit invalidation state in place of native
     * structure-list notifier ownership.
     */
    OnStructureListModified(_event, _item, _index, _list)
    {
        this._regenerated = false;
    }

}
