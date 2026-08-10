import assert from "node:assert/strict";
import test from "node:test";

import { CcpwglCharacter } from "../src/character/CcpwglCharacter.mjs";

function CreateFixture()
{
    const paperdoll = { recordID: "3000001" };
    const plan = {
        selections: [ {} ],
        parts: [],
        layers: [],
        textures: [],
        coverages: [],
        targets: [],
        bindings: [],
        diagnostics: [
            { code: "PART_TYPE_UNRESOLVED", severity: "warning", message: "Missing catalog" }
        ]
    };
    const library = {
        schema: "carbonenginejs.characterLibrary",
        schemaVersion: 7,
        sourceTarget: "eve",
        sourceBuild: "1"
    };
    const documents = {
        paperdolls: [ paperdoll ],
        characterPartTypes: []
    };
    const manager = {
        GetLibrary: () => library,
        Get: (name, recordID) => name === "paperdolls" && recordID === paperdoll.recordID
            ? paperdoll
            : null,
        GetDocument: name => documents[name] ?? [],
        ListDocuments: () => Object.keys(documents)
    };
    const resolver = {
        resolvePaperdoll(inputLibrary, inputPaperdoll)
        {
            assert.equal(inputLibrary, library);
            assert.equal(inputPaperdoll, paperdoll);
            return plan;
        }
    };
    const construction = {
        backend: "legacy-opengl",
        evidence: { status: "policy", rule: "test" },
        paperdollRecordID: paperdoll.recordID,
        sourceBuild: "1",
        sex: "female",
        lod: 0,
        operations: [ { operation: "test" } ]
    };
    const constructionResolver = {
        Resolve(inputPaperdoll, inputPlan)
        {
            assert.equal(inputPaperdoll, paperdoll);
            assert.equal(inputPlan, plan);
            return construction;
        }
    };

    return {
        construction,
        constructionResolver,
        manager,
        paperdoll,
        plan,
        resolver
    };
}

test("character resolves only a library-owned paper doll and exposes a proof snapshot", () =>
{
    const fixture = CreateFixture();
    const character = new CcpwglCharacter({
        libraryManager: fixture.manager,
        appearanceResolver: fixture.resolver,
        constructionResolver: fixture.constructionResolver
    });

    assert.equal(character.SelectPaperdoll("3000001"), fixture.plan);
    assert.equal(character.GetPaperdoll(), fixture.paperdoll);
    assert.equal(character.GetConstructionSequence(), fixture.construction);
    assert.equal(character.GetRevision(), 1);
    assert.deepEqual(character.GetDiagnostics().plan.diagnostics, [
        {
            code: "PART_TYPE_UNRESOLVED",
            severity: "warning",
            message: "Missing catalog"
        }
    ]);
    assert.equal(
        character.GetDiagnostics().construction.paperdollRecordID,
        "3000001"
    );
});

test("character leaves its previous selection intact when resolution fails", () =>
{
    const fixture = CreateFixture();
    const character = new CcpwglCharacter({
        libraryManager: fixture.manager,
        appearanceResolver: fixture.resolver,
        constructionResolver: fixture.constructionResolver
    });

    character.SelectPaperdoll("3000001");
    assert.throws(() => character.SelectPaperdoll("missing"), /Unknown paper-doll/);
    assert.equal(character.GetPaperdoll(), fixture.paperdoll);
    assert.equal(character.GetAppearancePlan(), fixture.plan);
    assert.equal(character.GetConstructionSequence(), fixture.construction);
    assert.equal(character.GetRevision(), 1);
});

test("character publishes paper doll, plan, and construction atomically", () =>
{
    const fixture = CreateFixture();
    let shouldFail = false;
    const constructionResolver = {
        Resolve(inputPaperdoll, inputPlan)
        {
            assert.equal(inputPaperdoll, fixture.paperdoll);
            assert.equal(inputPlan, fixture.plan);
            if (shouldFail) throw new Error("construction failed");
            return fixture.construction;
        }
    };
    const character = new CcpwglCharacter({
        libraryManager: fixture.manager,
        appearanceResolver: fixture.resolver,
        constructionResolver
    });

    character.SelectPaperdoll("3000001");
    shouldFail = true;

    assert.throws(
        () => character.SelectPaperdoll("3000001"),
        /construction failed/u
    );
    assert.equal(character.GetPaperdoll(), fixture.paperdoll);
    assert.equal(character.GetAppearancePlan(), fixture.plan);
    assert.equal(character.GetConstructionSequence(), fixture.construction);
    assert.equal(character.GetRevision(), 1);
});

test("character sends the exact construction and plan to its renderer", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    const renderer = {
        ApplyConstruction(construction, context)
        {
            calls.push({ construction, context });
            return Promise.resolve({ status: "committed" });
        }
    };
    const character = new CcpwglCharacter({
        libraryManager: fixture.manager,
        appearanceResolver: fixture.resolver,
        constructionResolver: fixture.constructionResolver,
        renderer
    });

    character.SelectPaperdoll("3000001");
    assert.deepEqual(await character.ApplyAppearance(), { status: "committed" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].construction, fixture.construction);
    assert.equal(calls[0].context.appearancePlan, fixture.plan);
    assert.equal(calls[0].context.source, character);
});
