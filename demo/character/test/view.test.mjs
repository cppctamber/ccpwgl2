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
        "resolve-paperdoll"
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
        children: [],
        dataset: {},
        span: null,
        textContent: "",
        value: "",
        addEventListener() {},
        append(value)
        {
            this.children.push(value);
        },
        querySelector()
        {
            this.span ||= CreateElement();
            return this.span;
        },
        replaceChildren()
        {
            this.children = [];
        }
    };
}
