import { meta } from "utils";
import { createCharacterDiagnostics } from "./TnyCharacterDiagnostics.js";

/** Owns one selected paper doll and its latest resolved appearance plan. */
export class TnyCharacter extends meta.Model
{
    _appearanceResolver;

    _construction = null;

    _constructionResolver;

    _manager;

    _paperdoll = null;

    _plan = null;

    _appearanceManager;

    _revision = 0;

    constructor({
        libraryManager,
        appearanceResolver,
        constructionResolver,
        appearanceManager = null
    } = {})
    {
        super();

        if (!libraryManager
            || typeof libraryManager.GetLibrary !== "function"
            || typeof libraryManager.Get !== "function")
        {
            throw new TypeError("TnyCharacter requires a character library manager");
        }
        if (typeof appearanceResolver?.resolvePaperdoll !== "function")
        {
            throw new TypeError("TnyCharacter requires a paper-doll appearance resolver");
        }
        if (typeof constructionResolver?.Resolve !== "function")
        {
            throw new TypeError("TnyCharacter requires a construction resolver");
        }
        if (appearanceManager !== null
            && typeof appearanceManager?.ApplyConstruction !== "function")
        {
            throw new TypeError(
                "TnyCharacter appearance manager must expose ApplyConstruction(sequence)"
            );
        }

        this._manager = libraryManager;
        this._appearanceResolver = appearanceResolver;
        this._constructionResolver = constructionResolver;
        this._appearanceManager = appearanceManager;
    }

    GetLibraryManager()
    {
        return this._manager;
    }

    GetPaperdolls()
    {
        return this._manager.GetDocument("paperdolls") ?? [];
    }

    GetPaperdoll()
    {
        return this._paperdoll;
    }

    GetAppearancePlan()
    {
        return this._plan;
    }

    GetConstructionSequence()
    {
        return this._construction;
    }

    /** Returns the per-character manager that stages and commits appearances. */
    GetAppearanceManager()
    {
        return this._appearanceManager;
    }

    GetRevision()
    {
        return this._revision;
    }

    /** Resolves one exact library-owned paper doll into the current plan stage. */
    SelectPaperdoll(recordID)
    {
        const identity = String(recordID ?? "").trim();

        if (!identity)
        {
            throw new TypeError("Paper-doll record ID must be a non-empty string");
        }

        const paperdoll = this._manager.Get("paperdolls", identity);

        if (!paperdoll)
        {
            throw new Error(`Unknown paper-doll record ${JSON.stringify(identity)}`);
        }

        const plan = this._appearanceResolver.resolvePaperdoll(
            this._manager.GetLibrary(),
            paperdoll,
            { requestedLod: 0 }
        );
        const construction = this._constructionResolver.Resolve(
            paperdoll,
            plan,
            this._manager.GetLibrary()
        );

        this._paperdoll = paperdoll;
        this._plan = plan;
        this._construction = construction;
        this._revision += 1;
        this.EmitEvent("appearancechanged", {
            type: "appearancechanged",
            source: this,
            revision: this._revision
        });
        return plan;
    }

    /** Applies the current plan through the injected appearance manager. */
    ApplyAppearance(options = {})
    {
        if (!this._plan || !this._construction)
        {
            return Promise.reject(new Error("Character has no resolved appearance and construction state"));
        }
        if (!this._appearanceManager)
        {
            return Promise.resolve({
                status: "deferred",
                reason: "appearance-manager-not-configured"
            });
        }

        return this._appearanceManager.ApplyConstruction(this._construction, {
            appearancePlan: this._plan,
            source: options.source ?? this
        });
    }

    GetDiagnostics()
    {
        return createCharacterDiagnostics(this);
    }

}
