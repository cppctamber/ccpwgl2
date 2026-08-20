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
        this.appearanceManagerSummary = RequireElement(root, "appearance-manager-summary");
        this.diagnostics = RequireElement(root, "plan-diagnostics");
        this.paperdollID = RequireElement(root, "paperdoll-id");
        this.paperdollSamples = RequireElement(root, "paperdoll-samples");
        this.resolvePaperdoll = RequireElement(root, "resolve-paperdoll");
        this.partEditor = RequireElement(root, "part-editor");
        this.partEditorSummary = RequireElement(root, "part-editor-summary");
        this.partEditorList = RequireElement(root, "part-editor-list");
        this.resetParts = RequireElement(root, "reset-parts");
        this.showExperimentalParts = RequireElement(root, "show-experimental-parts");
        this.partsCatalog = null;
        this.canvas = RequireElement(root, "character-canvas");
        this.canvas.addEventListener("wheel", event => event.preventDefault(), {
            passive: false
        });
    }

    BindPartSelection(listener, resetListener)
    {
        this.partEditorList.addEventListener("change", event =>
        {
            const select = event.target?.closest?.("select[data-location-id]");
            if (!select) return;
            return this._RunPartTransaction(() =>
                listener(select.dataset.locationId, select.value));
        });
        this.partEditorList.addEventListener("click", event =>
        {
            const button = event.target?.closest?.(
                "button[data-location-id][data-choice-id]"
            );
            if (!button || button.getAttribute("aria-pressed") === "true") return;
            return this._RunPartTransaction(() =>
                listener(button.dataset.locationId, button.dataset.choiceId));
        });
        this.resetParts.addEventListener("click", () =>
        {
            return this._RunPartTransaction(resetListener);
        });
        this.showExperimentalParts.addEventListener("change", () =>
        {
            if (this.partEditor.dataset.busy === "true") return;
            if (this.partsCatalog) this._RenderParts();
        });
    }

    _RunPartTransaction(action)
    {
        if (this.partEditor.dataset.busy === "true") return Promise.resolve(false);

        this.partEditor.dataset.busy = "true";
        this.partEditor.inert = true;
        this.partEditor.setAttribute("aria-busy", "true");

        return Promise.resolve()
            .then(action)
            .then(() => true)
            .catch(() => false)
            .finally(() =>
            {
                delete this.partEditor.dataset.busy;
                this.partEditor.inert = false;
                this.partEditor.setAttribute("aria-busy", "false");
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

    SetParts(catalog)
    {
        this.partsCatalog = catalog;
        this._RenderParts();
        this.partEditor.hidden = false;
    }

    _RenderParts()
    {
        const catalog = this.partsCatalog;
        this.partEditorList.replaceChildren();
        const showExperimental = this.showExperimentalParts.checked;
        const visibleSlots = catalog.slots.filter(slot =>
            showExperimental || slot.adapterSupported || slot.selectedResourceID
        );
        this.partEditorSummary.textContent = catalog.gender === null
            ? `${visibleSlots.length}/${catalog.slots.length} slot(s); gender unresolved`
            : `${visibleSlots.length}/${catalog.slots.length} slot(s) for gender ${catalog.gender}`;

        for (const slot of visibleSlots)
        {
            const row = document.createElement("div");
            row.className = "part-editor__row";

            const label = document.createElement("label");
            const labelTitle = document.createElement("strong");
            const labelDetail = document.createElement("span");
            const select = document.createElement("select");
            const choice = document.createElement("div");
            const empty = document.createElement("option");

            select.id = `part-${slot.locationID}`;
            select.dataset.locationId = slot.locationID;
            label.htmlFor = select.id;
            labelTitle.textContent = slot.modifierKey;
            labelDetail.textContent = [
                slot.variationKey,
                slot.adapterSupported ? "adapter path" : "experimental",
                `${slot.resources.length} observed choice(s)`
            ].filter(Boolean).join(" · ");
            empty.value = "";
            empty.textContent = "None / remove this slot";

            label.append(labelTitle, labelDetail);
            select.append(empty);
            choice.className = "part-editor__choice";

            for (const resource of slot.resources)
            {
                if (!showExperimental
                    && !slot.adapterSupported
                    && resource.choiceID !== slot.selectedChoiceID)
                {
                    continue;
                }
                const option = document.createElement("option");
                option.value = resource.choiceID;
                option.textContent = resource.resPath
                    ? `${resource.resPath} · ${resource.recordID} · variation ${resource.variation}`
                    : `${resource.recordID} · variation ${resource.variation}`;
                select.append(option);
            }

            select.value = slot.selectedChoiceID;
            choice.append(select);

            const selectedResource = slot.resources.find(resource =>
                resource.choiceID === slot.selectedChoiceID
            );
            const selectedPartSourceRecordID = selectedResource?.partSourceRecordID ?? "";
            const paletteResources = selectedPartSourceRecordID
                ? slot.resources.filter(resource =>
                    resource.partSourceRecordID === selectedPartSourceRecordID
                    && resource.colorPreview
                    && (showExperimental
                        || slot.adapterSupported
                        || resource.choiceID === slot.selectedChoiceID)
                )
                : [];
            if (paletteResources.length)
            {
                const disclosure = document.createElement("details");
                const summary = document.createElement("summary");
                const summaryLabel = document.createElement("span");
                const palette = document.createElement("div");
                disclosure.className = "part-editor__palette-disclosure";
                summary.className = "part-editor__palette-summary";
                summaryLabel.textContent = `${paletteResources.length} authored colour ${
                    paletteResources.length === 1 ? "choice" : "choices"
                }`;
                palette.className = "part-editor__palette";
                palette.setAttribute("role", "group");
                palette.setAttribute(
                    "aria-label",
                    `${slot.modifierKey} authored material choices`
                );

                if (selectedResource?.colorPreview)
                {
                    summary.append(CreatePalettePreview(selectedResource.colorPreview));
                }
                summary.append(summaryLabel);

                for (const resource of paletteResources)
                {
                    palette.append(CreatePaletteButton(
                        slot,
                        resource,
                        resource.choiceID === slot.selectedChoiceID
                    ));
                }
                disclosure.append(summary, palette);
                choice.append(disclosure);
            }

            row.append(label, choice);
            this.partEditorList.append(row);
        }
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
        this.appearanceManagerSummary.textContent = JSON.stringify(
            snapshot.appearanceManager,
            null,
            2
        );
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

function CreatePaletteButton(slot, resource, selected)
{
    const preview = resource.colorPreview;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "part-editor__palette-choice";
    button.dataset.locationId = slot.locationID;
    button.dataset.choiceId = resource.choiceID;
    button.setAttribute("aria-pressed", String(selected));
    const description = [
        resource.resPath || resource.recordID,
        `resource ${resource.recordID}`,
        `variation ${resource.variation}`,
        preview.pattern ? `pattern ${preview.pattern}` : null,
        `material ${preview.colorVariant}`
    ].filter(Boolean).join(" · ");
    button.setAttribute("aria-label", description);
    button.title = description;

    button.append(...CreatePaletteSwatches(preview));
    if (preview.pattern)
    {
        button.dataset.patterned = "true";
    }
    return button;
}

function CreatePalettePreview(preview)
{
    const element = document.createElement("span");
    element.className = "part-editor__palette-preview";
    element.setAttribute("aria-hidden", "true");
    element.append(...CreatePaletteSwatches(preview));
    if (preview.pattern)
    {
        element.dataset.patterned = "true";
    }
    return element;
}

function CreatePaletteSwatches(preview)
{
    return (preview.patternColors ?? preview.colors).map(color =>
    {
        const swatch = document.createElement("span");
        swatch.className = "part-editor__palette-swatch";
        swatch.style.backgroundColor = LinearColorToCss(color);
        return swatch;
    });
}

function LinearColorToCss(value)
{
    const channels = value.slice(0, 3).map(component =>
    {
        const linear = Math.max(0, Math.min(1, Number(component)));
        const srgb = linear <= 0.0031308
            ? linear * 12.92
            : 1.055 * linear ** (1 / 2.4) - 0.055;
        return Math.round(srgb * 255);
    });
    return `rgb(${channels.join(" ")})`;
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
