import { createCharacterDiagnostics } from "./CcpwglCharacterDiagnostics.mjs";

/** Owns one selected paper doll and its latest resolved appearance plan. */
export class CcpwglCharacter
{
    #appearanceResolver;

    #construction = null;

    #constructionResolver;

    #listeners = new Set();

    #manager;

    #paperdoll = null;

    #plan = null;

    #renderer;

    #revision = 0;

    constructor({
        libraryManager,
        appearanceResolver,
        constructionResolver,
        renderer = null
    } = {})
    {
        if (!libraryManager
            || typeof libraryManager.GetLibrary !== "function"
            || typeof libraryManager.Get !== "function")
        {
            throw new TypeError("CcpwglCharacter requires a character library manager");
        }
        if (typeof appearanceResolver?.resolvePaperdoll !== "function")
        {
            throw new TypeError("CcpwglCharacter requires a paper-doll appearance resolver");
        }
        if (typeof constructionResolver?.Resolve !== "function")
        {
            throw new TypeError("CcpwglCharacter requires a construction resolver");
        }
        if (renderer !== null && typeof renderer?.ApplyConstruction !== "function")
        {
            throw new TypeError("CcpwglCharacter renderer must expose ApplyConstruction(sequence)");
        }

        this.#manager = libraryManager;
        this.#appearanceResolver = appearanceResolver;
        this.#constructionResolver = constructionResolver;
        this.#renderer = renderer;
    }

    GetLibraryManager()
    {
        return this.#manager;
    }

    GetPaperdolls()
    {
        return this.#manager.GetDocument("paperdolls") ?? [];
    }

    GetPaperdoll()
    {
        return this.#paperdoll;
    }

    GetAppearancePlan()
    {
        return this.#plan;
    }

    GetConstructionSequence()
    {
        return this.#construction;
    }

    GetRenderer()
    {
        return this.#renderer;
    }

    GetRevision()
    {
        return this.#revision;
    }

    /** Resolves one exact library-owned paper doll into the current plan stage. */
    SelectPaperdoll(recordID)
    {
        const identity = String(recordID ?? "").trim();

        if (!identity)
        {
            throw new TypeError("Paper-doll record ID must be a non-empty string");
        }

        const paperdoll = this.#manager.Get("paperdolls", identity);

        if (!paperdoll)
        {
            throw new Error(`Unknown paper-doll record ${JSON.stringify(identity)}`);
        }

        const plan = this.#appearanceResolver.resolvePaperdoll(
            this.#manager.GetLibrary(),
            paperdoll
        );
        const construction = this.#constructionResolver.Resolve(
            paperdoll,
            plan,
            this.#manager.GetLibrary()
        );

        this.#paperdoll = paperdoll;
        this.#plan = plan;
        this.#construction = construction;
        this.#revision += 1;
        this.#Emit("appearancechanged");
        return plan;
    }

    /** Applies the current plan through the injected renderer boundary. */
    ApplyAppearance(options = {})
    {
        if (!this.#plan || !this.#construction)
        {
            return Promise.reject(new Error("Character has no resolved appearance and construction state"));
        }
        if (!this.#renderer)
        {
            return Promise.resolve({ status: "deferred", reason: "renderer-not-configured" });
        }

        return this.#renderer.ApplyConstruction(this.#construction, {
            appearancePlan: this.#plan,
            source: options.source ?? this
        });
    }

    GetDiagnostics()
    {
        return createCharacterDiagnostics(this);
    }

    Subscribe(listener)
    {
        if (typeof listener !== "function")
        {
            throw new TypeError("Character subscriber must be a function");
        }

        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    #Emit(type)
    {
        const event = {
            type,
            source: this,
            revision: this.#revision
        };

        for (const listener of this.#listeners)
        {
            listener(event);
        }
    }
}

export default CcpwglCharacter;
