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

    _renderer;

    _revision = 0;

    constructor({
        libraryManager,
        appearanceResolver,
        constructionResolver,
        renderer = null
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
        if (renderer !== null && typeof renderer?.ApplyConstruction !== "function")
        {
            throw new TypeError("TnyCharacter renderer must expose ApplyConstruction(sequence)");
        }

        this._manager = libraryManager;
        this._appearanceResolver = appearanceResolver;
        this._constructionResolver = constructionResolver;
        this._renderer = renderer;
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

    GetRenderer()
    {
        return this._renderer;
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
            paperdoll
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

    /** Applies the current plan through the injected renderer boundary. */
    ApplyAppearance(options = {})
    {
        if (!this._plan || !this._construction)
        {
            return Promise.reject(new Error("Character has no resolved appearance and construction state"));
        }
        if (!this._renderer)
        {
            return Promise.resolve({ status: "deferred", reason: "renderer-not-configured" });
        }

        return this._renderer.ApplyConstruction(this._construction, {
            appearancePlan: this._plan,
            source: options.source ?? this
        });
    }

    GetDiagnostics()
    {
        return createCharacterDiagnostics(this);
    }

}
