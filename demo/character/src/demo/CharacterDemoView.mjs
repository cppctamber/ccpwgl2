/** Renders the small library and resolver proof UI. */
export class CharacterDemoView
{
    constructor(root = document)
    {
        this.status = RequireElement(root, "demo-status");
        this.stageMessage = RequireElement(root, "stage-message");
        this.stageTitle = RequireElement(root, "stage-title");
        this.librarySummary = RequireElement(root, "library-summary");
        this.planSummary = RequireElement(root, "plan-summary");
        this.constructionSummary = RequireElement(root, "construction-summary");
        this.rendererSummary = RequireElement(root, "renderer-summary");
        this.diagnostics = RequireElement(root, "plan-diagnostics");
        this.paperdollID = RequireElement(root, "paperdoll-id");
        this.paperdollSamples = RequireElement(root, "paperdoll-samples");
        this.resolvePaperdoll = RequireElement(root, "resolve-paperdoll");
        this.canvas = RequireElement(root, "character-canvas");
        this.canvas.addEventListener("wheel", event => event.preventDefault(), {
            passive: false
        });
    }

    SetStatus(message, state = "working")
    {
        this.status.textContent = String(message);
        this.status.dataset.state = state;
    }

    BindResolve(listener)
    {
        const resolvePaperdoll = () => Promise.resolve(listener(this.paperdollID.value))
            .catch(() => undefined);
        this.resolvePaperdoll.addEventListener("click", resolvePaperdoll);
        this.paperdollID.addEventListener("keydown", event =>
        {
            if (event.key === "Enter") resolvePaperdoll();
        });
        this.paperdollSamples.addEventListener("change", () =>
        {
            if (!this.paperdollSamples.value) return;
            this.paperdollID.value = this.paperdollSamples.value;
            resolvePaperdoll();
        });
    }

    SetStage(message, state = "working")
    {
        const titles = {
            working: "Rendering in progress",
            rendered: "Character geometry rendered",
            deferred: "Rendering deferred",
            failed: "Rendering failed"
        };

        if (!Object.hasOwn(titles, state))
        {
            throw new TypeError(`Unknown character demo stage ${JSON.stringify(state)}`);
        }

        this.stageTitle.textContent = titles[state];
        this.stageMessage.querySelector("span").textContent = String(message);
        this.stageMessage.dataset.rendered = String(state === "rendered");
        this.stageMessage.dataset.state = state;
    }

    SetPaperdolls(records, selectedRecordID)
    {
        this.paperdollSamples.replaceChildren();

        const count = Math.min(records.length, 40);

        for (let index = 0; index < count; index++)
        {
            const option = document.createElement("option");
            option.value = records[index].recordID;
            option.textContent = records[index].recordID;
            this.paperdollSamples.append(option);
        }

        this.paperdollID.value = selectedRecordID ?? "";
        this.paperdollSamples.value = selectedRecordID ?? "";
    }

    Render(snapshot)
    {
        this.librarySummary.textContent = JSON.stringify(snapshot.library, null, 2);
        this.planSummary.textContent = JSON.stringify({
            selection: snapshot.selection,
            selections: snapshot.plan?.selections ?? 0,
            parts: snapshot.plan?.parts ?? 0,
            layers: snapshot.plan?.layers ?? 0,
            textures: snapshot.plan?.textures ?? 0,
            coverages: snapshot.plan?.coverages ?? 0,
            morphTargets: snapshot.plan?.morphTargets ?? 0,
            targets: snapshot.plan?.targets ?? 0,
            bindings: snapshot.plan?.bindings ?? 0
        }, null, 2);
        this.constructionSummary.textContent = JSON.stringify(
            snapshot.construction,
            null,
            2
        );
        this.rendererSummary.textContent = JSON.stringify(snapshot.renderer, null, 2);
        this.#RenderDiagnostics(snapshot.plan?.diagnostics ?? []);
    }

    RenderError(error)
    {
        const message = error?.message ?? String(error);

        this.SetStatus(message, "error");
        this.SetStage(message, "failed");
    }

    #RenderDiagnostics(diagnostics)
    {
        this.diagnostics.replaceChildren();

        if (!diagnostics.length)
        {
            const item = document.createElement("li");
            item.textContent = "No resolver diagnostics.";
            this.diagnostics.append(item);
            return;
        }

        for (const diagnostic of diagnostics)
        {
            const item = document.createElement("li");
            item.textContent = `[${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`;
            this.diagnostics.append(item);
        }
    }
}

function RequireElement(root, id)
{
    const element = root.getElementById(id);

    if (!element)
    {
        throw new Error(`Character demo element is missing: ${id}`);
    }

    return element;
}

export default CharacterDemoView;
