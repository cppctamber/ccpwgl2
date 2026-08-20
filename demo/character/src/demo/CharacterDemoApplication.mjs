import { tw2 } from "global";
import { tnyCharacterConstructors } from "/src/runtime/character/register.js";
import { formatCommittedStage } from "./CharacterDemoFormatting.mjs";
import {
    applyCharacterPaperdollSelections,
    captureCharacterPaperdollParts,
    createCharacterPartCatalog,
    createCharacterPartIndex,
    restoreCharacterPaperdollParts,
    setCharacterPaperdollPart
} from "./CharacterDemoPartCatalog.mjs";

/** Connects browser controls to the runtime-character library and resolver. */
export class CharacterDemoApplication
{
    #appearanceResolver;

    #character = null;

    #constructionResolver;

    #libraryClient;

    #partIndex = null;

    #partSnapshots = new Map();

    #appearanceManager;

    #routePaperdollSelection;

    #routePartReset;

    #routePartSelection;

    #view;

    constructor({
        libraryClient,
        appearanceResolver,
        constructionResolver,
        appearanceManager,
        routePaperdollSelection = null,
        routePartReset = null,
        routePartSelection = null,
        view
    } = {})
    {
        if (!libraryClient || typeof libraryClient.Load !== "function")
        {
            throw new TypeError("Character demo requires a library client");
        }
        if (typeof appearanceResolver?.resolvePaperdoll !== "function")
        {
            throw new TypeError("Character demo requires an appearance resolver");
        }
        if (typeof constructionResolver?.Resolve !== "function")
        {
            throw new TypeError("Character demo requires a construction resolver");
        }
        if (!view || typeof view.Render !== "function")
        {
            throw new TypeError("Character demo requires a view");
        }

        this.#libraryClient = libraryClient;
        this.#appearanceResolver = appearanceResolver;
        this.#constructionResolver = constructionResolver;
        this.#appearanceManager = appearanceManager;
        this.#routePaperdollSelection = routePaperdollSelection;
        this.#routePartReset = routePartReset;
        this.#routePartSelection = routePartSelection;
        this.#view = view;
        this.#view.BindResolve(recordID => this.#routePaperdollSelection
            ? this.#routePaperdollSelection(recordID)
            : this.SelectPaperdoll(recordID));
        this.#view.BindPartSelection(
            (locationID, choiceID) => this.#routePartSelection
                ? this.#routePartSelection(locationID, choiceID)
                : this.SelectPart(locationID, choiceID),
            () => this.#routePartReset ? this.#routePartReset() : this.ResetParts()
        );
    }

    GetCharacter()
    {
        return this.#character;
    }

    async Start({
        libraryURL,
        paperdollID = null,
        prepareLibrary = null,
        initialPartSelections = []
    } = {})
    {
        this.#view.SetStatus("Loading character library");
        const manager = await this.#libraryClient.Load(libraryURL);
        if (prepareLibrary !== null)
        {
            if (typeof prepareLibrary !== "function")
            {
                throw new TypeError("Character demo prepareLibrary must be a function or null");
            }
            await prepareLibrary(manager);
        }
        const Character = tnyCharacterConstructors.TnyCharacter;
        if (typeof Character !== "function")
        {
            throw new Error("The character constructor catalog does not contain TnyCharacter");
        }
        const character = new Character({
            libraryManager: manager,
            appearanceResolver: this.#appearanceResolver,
            constructionResolver: this.#constructionResolver,
            appearanceManager: this.#appearanceManager
        });
        const paperdolls = character.GetPaperdolls();

        if (!paperdolls.length)
        {
            throw new Error("Character library contains no paper dolls");
        }

        this.#character = character;
        this.#partIndex = createCharacterPartIndex(paperdolls, manager);
        const selectedRecordID = paperdollID || paperdolls[0].recordID;
        const selectedPaperdoll = paperdolls.find(value => value.recordID === selectedRecordID);
        if (selectedPaperdoll && initialPartSelections.length)
        {
            applyCharacterPaperdollSelections(
                manager,
                this.#partIndex,
                selectedPaperdoll,
                initialPartSelections
            );
        }
        this.#view.SetPaperdolls(paperdolls, selectedRecordID);
        await this.SelectPaperdoll(selectedRecordID);
        return character;
    }

    async SelectPaperdoll(recordID)
    {
        if (!this.#character)
        {
            throw new Error("Character demo library is not loaded");
        }

        try
        {
            this.#view.SetStatus(`Resolving paper doll ${recordID}`);
            this.#character.SelectPaperdoll(recordID);
            const paperdoll = this.#character.GetPaperdoll();
            if (!this.#partSnapshots.has(paperdoll.recordID))
            {
                this.#partSnapshots.set(
                    paperdoll.recordID,
                    captureCharacterPaperdollParts(paperdoll)
                );
            }
            this.#view.SetParts(createCharacterPartCatalog(this.#partIndex, paperdoll));
            let snapshot = this.#character.GetDiagnostics();
            this.#view.Render(snapshot);
            this.#view.SetStage(
                "Attaching exact resolved configuration/geometry pairs over the legacy foundation",
                "working"
            );
            const result = await this.#character.ApplyAppearance();
            snapshot = this.#character.GetDiagnostics();
            this.#view.Render(snapshot);
            this.#view.SetStage(
                result.status === "committed"
                    ? formatCommittedStage(result.details)
                    : `Rendering ${result.status}: ${result.reason ?? "no reason supplied"}`,
                result.status === "committed" ? "rendered" : "deferred"
            );
            this.#view.SetStatus(
                `Ready: ${snapshot.plan.diagnostics.length} resolver diagnostics; renderer ${result.status}`,
                "ready"
            );
            return {
                diagnostics: snapshot,
                renderer: result
            };
        }
        catch (error)
        {
            this.#view.RenderError(error);
            throw error;
        }
    }

    async SelectPart(locationID, choiceID)
    {
        if (!this.#character)
        {
            throw new Error("Character demo library is not loaded");
        }

        const manager = this.#character.GetLibraryManager();
        const paperdoll = this.#character.GetPaperdoll();
        const catalog = createCharacterPartCatalog(this.#partIndex, paperdoll);
        const candidate = catalog.slots
            .find(value => value.locationID === locationID)
            ?.resources.find(value => value.choiceID === choiceID) ?? null;
        const resourceID = candidate?.recordID ?? "";
        const location = manager.Get("characterModifierLocations", locationID);
        const resource = resourceID
            ? manager.Get("characterResources", resourceID)
            : null;

        if (!location)
        {
            throw new Error(`Unknown modifier location ${JSON.stringify(locationID)}`);
        }
        if (resourceID && !resource)
        {
            throw new Error(`Unknown character resource ${JSON.stringify(resourceID)}`);
        }

        const previousParts = captureCharacterPaperdollParts(paperdoll);
        this.#view.SetStatus(
            resource
                ? `Applying ${resource.resPath || resource.recordID}`
                : `Removing ${location.modifierKey || location.recordID}`
        );
        try
        {
            setCharacterPaperdollPart(
                paperdoll,
                location,
                resource,
                candidate?.variation ?? 0
            );
            const result = await this.SelectPaperdoll(paperdoll.recordID);
            return {
                ...result,
                partChangeApplied: true
            };
        }
        catch (error)
        {
            restoreCharacterPaperdollParts(paperdoll, previousParts);
            const restored = await this.SelectPaperdoll(paperdoll.recordID);
            this.#view.SetStatus(
                `Rejected part change: ${error?.message ?? String(error)}; previous parts restored`,
                "ready"
            );
            return {
                ...restored,
                partChangeApplied: false
            };
        }
    }

    /** Applies one exact choice after fully releasing the prior audit render. */
    async SelectPartForAudit(locationID, choiceID)
    {
        if (typeof this.#appearanceManager?.ReleaseCommitted !== "function")
        {
            throw new Error("Character demo appearance manager cannot release an audit appearance");
        }
        const paperdoll = this.#character?.GetPaperdoll?.();
        const captured = this.#partSnapshots.get(paperdoll?.recordID);
        if (!paperdoll || !captured)
        {
            throw new Error("Character demo has no baseline parts for an audit");
        }

        await this.#appearanceManager.ReleaseCommitted({
            reason: "clothing-audit-replace",
            source: this
        });
        restoreCharacterPaperdollParts(paperdoll, captured);

        const manager = this.#character.GetLibraryManager();
        const catalog = createCharacterPartCatalog(this.#partIndex, paperdoll);
        const candidate = catalog.slots
            .find(value => value.locationID === locationID)
            ?.resources.find(value => value.choiceID === choiceID) ?? null;
        const location = manager.Get("characterModifierLocations", locationID);
        const resource = candidate
            ? manager.Get("characterResources", candidate.recordID)
            : null;
        if (!location || !candidate || !resource)
        {
            throw new Error(`Unknown exact character audit choice ${JSON.stringify(choiceID)}`);
        }
        setCharacterPaperdollPart(
            paperdoll,
            location,
            resource,
            candidate.variation
        );
        return this.SelectPaperdoll(paperdoll.recordID);
    }

    /** Selects one retained donor outfit after releasing the prior audit render. */
    async SelectPaperdollForAudit(recordID)
    {
        if (typeof this.#appearanceManager?.ReleaseCommitted !== "function")
        {
            throw new Error("Character demo appearance manager cannot release an audit appearance");
        }
        const paperdoll = this.#character?.GetPaperdolls?.()
            .find(value => value?.recordID === String(recordID));
        if (!paperdoll)
        {
            throw new Error(`Unknown character audit paper doll ${JSON.stringify(recordID)}`);
        }

        await this.#appearanceManager.ReleaseCommitted({
            reason: "clothing-donor-audit-replace",
            source: this
        });
        return this.SelectPaperdoll(paperdoll.recordID);
    }

    /** Restores one retained paper doll after an isolated donor-outfit audit. */
    async ResetPaperdollAfterAudit(recordID)
    {
        if (typeof this.#appearanceManager?.ReleaseCommitted !== "function") return null;
        await this.#appearanceManager.ReleaseCommitted({
            reason: "clothing-donor-audit-complete",
            source: this
        });
        return this.SelectPaperdoll(recordID);
    }

    /** Restores the selected paper doll after an isolated audit sweep. */
    async ResetPartsAfterAudit()
    {
        const paperdoll = this.#character?.GetPaperdoll?.();
        const captured = this.#partSnapshots.get(paperdoll?.recordID);
        if (!paperdoll || !captured) return null;
        await this.#appearanceManager.ReleaseCommitted({
            reason: "clothing-audit-complete",
            source: this
        });
        restoreCharacterPaperdollParts(paperdoll, captured);
        return this.SelectPaperdoll(paperdoll.recordID);
    }

    async ResetParts()
    {
        if (!this.#character)
        {
            throw new Error("Character demo library is not loaded");
        }

        const paperdoll = this.#character.GetPaperdoll();
        const captured = this.#partSnapshots.get(paperdoll.recordID);
        if (!captured)
        {
            throw new Error(`No original part snapshot for paper doll ${paperdoll.recordID}`);
        }

        const previousParts = captureCharacterPaperdollParts(paperdoll);
        this.#view.SetStatus(`Resetting paper doll ${paperdoll.recordID}`);
        try
        {
            restoreCharacterPaperdollParts(paperdoll, captured);
            return await this.SelectPaperdoll(paperdoll.recordID);
        }
        catch (error)
        {
            restoreCharacterPaperdollParts(paperdoll, previousParts);
            await this.SelectPaperdoll(paperdoll.recordID);
            throw error;
        }
    }
}

export default CharacterDemoApplication;
