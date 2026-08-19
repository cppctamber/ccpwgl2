import assert from "node:assert/strict";
import test from "node:test";

import { CharacterDemoView } from "../src/demo/CharacterDemoView.mjs";

test("view displays the same construction sequence reported by diagnostics", () =>
{
    const root = CreateRoot();
    const view = new CharacterDemoView(root);
    const previousDocument = globalThis.document;
    const construction = {
        backend: "legacy-opengl",
        evidence: { status: "policy", rule: "legacy-opengl-foundation-v1" },
        sex: "female",
        lod: 0,
        operations: [
            { operation: "skeleton", resourcePath: "res:/female/skeleton.gr2" },
            { operation: "geometry", role: "body", index: 0, resourcePath: "res:/female/body.gr2" }
        ]
    };

    globalThis.document = { createElement: CreateElement };

    try
    {
        view.Render({
            library: { schemaVersion: 7 },
            selection: { recordID: "3000001", revision: 1 },
            plan: {
                selections: 1,
                parts: 1,
                layers: 1,
                textures: 0,
                coverages: 0,
                targets: 0,
                bindings: 0,
                diagnostics: []
            },
            construction,
            renderer: { backend: "legacy-opengl" }
        });
    }
    finally
    {
        globalThis.document = previousDocument;
    }

    assert.deepEqual(
        JSON.parse(root.elements.get("construction-summary").textContent),
        construction
    );
    assert.equal(root.elements.get("plan-diagnostics").children.length, 1);
    assert.equal(
        root.elements.get("plan-diagnostics").children[0].textContent,
        "No resolver diagnostics."
    );
});

test("view distinguishes working, rendered, deferred, and failed stages", () =>
{
    const root = CreateRoot();
    const view = new CharacterDemoView(root);

    view.SetStage("Preparing", "working");
    assert.equal(root.elements.get("stage-title").textContent, "Rendering in progress");
    assert.equal(root.elements.get("stage-message").dataset.rendered, "false");
    assert.equal(root.elements.get("stage-message").dataset.state, "working");

    view.SetStage("Attached", "rendered");
    assert.equal(root.elements.get("stage-title").textContent, "Character geometry rendered");
    assert.equal(root.elements.get("stage-message").dataset.rendered, "true");

    view.SetStage("No adapter", "deferred");
    assert.equal(root.elements.get("stage-title").textContent, "Rendering deferred");

    view.RenderError(new Error("resource failed"));
    assert.equal(root.elements.get("stage-title").textContent, "Rendering failed");
    assert.equal(root.elements.get("demo-status").textContent, "resource failed");
    assert.equal(root.elements.get("stage-message").querySelector("span").textContent, "resource failed");

    assert.throws(() => view.SetStage("Invalid", "gated"), /Unknown character demo stage/);
});

test("view keeps camera-wheel input from scrolling the page", () =>
{
    const root = CreateRoot();
    new CharacterDemoView(root);
    const canvas = root.elements.get("character-canvas");
    const wheel = canvas.listeners.get("wheel");
    let prevented = false;

    assert.deepEqual(wheel.options, { passive: false });
    wheel.listener({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
});

test("view renders exact authored material palettes as selectable colour tiles", async () =>
{
    const root = CreateRoot();
    const view = new CharacterDemoView(root);
    let selected = null;
    view.BindPartSelection((locationID, choiceID) =>
    {
        selected = { locationID, choiceID };
    }, () => undefined);
    const previousDocument = globalThis.document;
    globalThis.document = { createElement: CreateElement };

    try
    {
        view.SetParts({
            gender: 0,
            slots: [ {
                locationID: "10",
                modifierKey: "outer",
                variationKey: "",
                adapterSupported: true,
                selectedResourceID: "100",
                selectedChoiceID: "100@0",
                resources: [ {
                    choiceID: "100@0",
                    recordID: "100",
                    resPath: "res:/female/outer/coat/types/blue",
                    partSourceRecordID: "coat",
                    variation: 0,
                    colorPreview: Preview("blue")
                }, {
                    choiceID: "101@2",
                    recordID: "101",
                    resPath: "res:/female/outer/coat/types/red",
                    partSourceRecordID: "coat",
                    variation: 2,
                    colorPreview: Preview("red", "Hexagon")
                }, {
                    choiceID: "200@0",
                    recordID: "200",
                    resPath: "res:/female/outer/skirt/types/green",
                    partSourceRecordID: "skirt",
                    variation: 0,
                    colorPreview: Preview("green")
                } ]
            } ]
        });
    }
    finally
    {
        globalThis.document = previousDocument;
    }

    const row = root.elements.get("part-editor-list").children[0];
    const choice = row.children[1];
    const disclosure = choice.children[1];
    const summary = disclosure.children[0];
    const palette = disclosure.children[1];
    const button = palette.children[0];
    const patternedButton = palette.children[1];

    assert.equal(disclosure.className, "part-editor__palette-disclosure");
    assert.equal(summary.children[1].textContent, "2 authored colour choices");
    assert.equal(palette.className, "part-editor__palette");
    assert.equal(palette.children.length, 2);
    assert.equal(button.dataset.choiceId, "100@0");
    assert.equal(button.attributes.get("aria-pressed"), "true");
    assert.match(button.attributes.get("aria-label"), /resource 100 · variation 0/u);
    assert.equal(button.children.length, 3);
    assert.match(button.children[0].style.backgroundColor, /^rgb\(/u);
    assert.equal(patternedButton.dataset.patterned, "true");

    const click = root.elements.get("part-editor-list").listeners.get("click").listener;
    assert.equal(click({
        target: { closest: () => button }
    }), undefined);
    assert.equal(selected, null);

    await click({ target: { closest: () => patternedButton } });
    assert.deepEqual(selected, { locationID: "10", choiceID: "101@2" });
    assert.equal(root.elements.get("part-editor").attributes.get("aria-busy"), "false");
});

test("view locks the persistent part editor across asynchronous rerenders", async () =>
{
    const root = CreateRoot();
    const view = new CharacterDemoView(root);
    let release;
    let callCount = 0;
    let throwSynchronously = false;
    view.BindPartSelection(() =>
    {
        callCount++;
        if (throwSynchronously) throw new Error("selection failed");
        return new Promise(resolve => { release = resolve; });
    }, () => undefined);
    const button = CreateElement();
    button.dataset.locationId = "10";
    button.dataset.choiceId = "101@0";
    button.setAttribute("aria-pressed", "false");
    const click = root.elements.get("part-editor-list").listeners.get("click").listener;

    const first = click({ target: { closest: () => button } });
    assert.equal(root.elements.get("part-editor").inert, true);
    assert.equal(root.elements.get("part-editor").attributes.get("aria-busy"), "true");
    view.SetParts({ gender: 0, slots: [] });
    assert.equal(await click({ target: { closest: () => button } }), false);
    assert.equal(callCount, 1);

    release();
    assert.equal(await first, true);
    assert.equal(root.elements.get("part-editor").inert, false);
    assert.equal(root.elements.get("part-editor").attributes.get("aria-busy"), "false");

    throwSynchronously = true;
    assert.equal(await click({ target: { closest: () => button } }), false);
    assert.equal(root.elements.get("part-editor").inert, false);
    assert.equal(root.elements.get("part-editor").attributes.get("aria-busy"), "false");
});

function CreateRoot()
{
    const ids = [
        "demo-status",
        "stage-message",
        "stage-title",
        "library-summary",
        "plan-summary",
        "construction-summary",
        "renderer-summary",
        "plan-diagnostics",
        "paperdoll-id",
        "paperdoll-samples",
        "resolve-paperdoll",
        "part-editor",
        "part-editor-summary",
        "part-editor-list",
        "reset-parts",
        "show-experimental-parts",
        "character-canvas"
    ];
    const elements = new Map(ids.map(id => [ id, CreateElement() ]));

    return {
        elements,
        getElementById(id)
        {
            return elements.get(id) ?? null;
        }
    };
}

function CreateElement()
{
    return {
        attributes: new Map(),
        children: [],
        className: "",
        dataset: {},
        listeners: new Map(),
        span: null,
        style: {},
        textContent: "",
        value: "",
        checked: false,
        addEventListener(type, listener, options)
        {
            this.listeners.set(type, { listener, options });
        },
        append(...values)
        {
            this.children.push(...values);
        },
        querySelector()
        {
            this.span ||= CreateElement();
            return this.span;
        },
        replaceChildren()
        {
            this.children = [];
        },
        setAttribute(name, value)
        {
            this.attributes.set(name, String(value));
        },
        getAttribute(name)
        {
            return this.attributes.get(name) ?? null;
        }
    };
}

function Preview(colorVariant, pattern = null)
{
    return {
        colorVariant,
        colors: [
            [ 0.1, 0.2, 0.3, 1 ],
            [ 0.4, 0.5, 0.6, 1 ],
            [ 0.7, 0.8, 0.9, 1 ]
        ],
        pattern,
        patternColors: pattern ? [
            [ 0.9, 0.8, 0.7, 1 ],
            [ 0.6, 0.5, 0.4, 1 ],
            [ 0.3, 0.2, 0.1, 1 ]
        ] : null
    };
}
