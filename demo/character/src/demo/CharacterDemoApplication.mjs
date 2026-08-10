import { CcpwglCharacter } from "../character/CcpwglCharacter.mjs";

/** Connects browser controls to the runtime-character library and resolver. */
export class CharacterDemoApplication
{
    #appearanceResolver;

    #character = null;

    #constructionResolver;

    #libraryClient;

    #renderer;

    #view;

    constructor({
        libraryClient,
        appearanceResolver,
        constructionResolver,
        renderer,
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
        this.#renderer = renderer;
        this.#view = view;
        this.#view.BindResolve(recordID => this.SelectPaperdoll(recordID));
    }

    GetCharacter()
    {
        return this.#character;
    }

    async Start({ libraryURL, paperdollID = null } = {})
    {
        this.#view.SetStatus("Loading character library");
        const manager = await this.#libraryClient.Load(libraryURL);
        const character = new CcpwglCharacter({
            libraryManager: manager,
            appearanceResolver: this.#appearanceResolver,
            constructionResolver: this.#constructionResolver,
            renderer: this.#renderer
        });
        const paperdolls = character.GetPaperdolls();

        if (!paperdolls.length)
        {
            throw new Error("Character library contains no paper dolls");
        }

        this.#character = character;
        const selectedRecordID = paperdollID || paperdolls[0].recordID;
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
            return snapshot;
        }
        catch (error)
        {
            this.#view.RenderError(error);
            throw error;
        }
    }
}

export function formatCommittedStage(details = {})
{
    const configured = details?.configuredPartCount ?? 0;
    const composition = details?.composition;

    if (!composition || !Number.isInteger(composition.contributionCount))
    {
        return `${configured} exact configured part(s) attached; ${details?.deferredContributionCount ?? 0} contribution(s) retained/deferred`;
    }

    return `${configured} exact configured part(s) attached; body diffuse applied ${composition.composedContributionCount ?? 0}/${composition.contributionCount} contribution(s); ${composition.deferredContributionCount ?? 0} retained/deferred`;
}

export default CharacterDemoApplication;
