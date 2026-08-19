import assert from "node:assert/strict";
import test from "node:test";

import { TnyCharacterRenderer } from "./runtime-character-modules.mjs";

test("renderer reports the temporary legacy OpenGL bone limitation", () =>
{
    const renderer = new TnyCharacterRenderer();

    assert.deepEqual(renderer.GetCapabilities(), {
        backend: "legacy-opengl",
        maximumBones: 58,
        requiredBones: 69,
        completeBonePalette: false,
        adapterConnected: false
    });
});

test("renderer releases a stale staged revision and commits only the newest construction", async () =>
{
    const prepared = [];
    const committed = [];
    const released = [];
    let continueFirst;
    const firstGate = new Promise(resolve =>
    {
        continueFirst = resolve;
    });
    const adapter = {
        async Prepare(construction)
        {
            const staged = { construction };
            prepared.push(staged);
            if (construction.id === 1) await firstGate;
            return staged;
        },
        async Commit(staged)
        {
            committed.push(staged);
        },
        async Release(staged, context)
        {
            released.push({ staged, reason: context.reason });
        }
    };
    const renderer = new TnyCharacterRenderer({ adapter });
    const first = renderer.ApplyConstruction(CreateConstruction(1));

    await Promise.resolve();
    const second = renderer.ApplyConstruction(CreateConstruction(2));
    continueFirst();

    assert.deepEqual(await first, { status: "stale", revision: 1 });
    assert.deepEqual(await second, { status: "committed", revision: 2 });
    assert.equal(prepared.length, 2);
    assert.deepEqual(committed.map(value => value.construction.id), [ 2 ]);
    assert.deepEqual(released.map(value => [ value.staged.construction.id, value.reason ]), [
        [ 1, "stale" ]
    ]);
});

test("renderer retains the last complete revision when a replacement commit fails", async () =>
{
    const released = [];
    const adapter = {
        async Prepare(construction)
        {
            return { construction };
        },
        async Commit(staged)
        {
            if (staged.construction.fail) throw new Error("commit failed");
        },
        async Release(staged, context)
        {
            released.push([ staged.construction.id, context.reason ]);
        }
    };
    const renderer = new TnyCharacterRenderer({ adapter });

    assert.equal((await renderer.ApplyConstruction(CreateConstruction(1))).status, "committed");
    await assert.rejects(
        renderer.ApplyConstruction(CreateConstruction(2, { fail: true })),
        /commit failed/
    );
    assert.deepEqual(released, [ [ 2, "commit-failed" ] ]);
});

test("renderer keeps the previous revision published until its replacement commits", async () =>
{
    const events = [];
    let finishPrepare;
    const prepareGate = new Promise(resolve =>
    {
        finishPrepare = resolve;
    });
    const adapter = {
        async Prepare(construction)
        {
            events.push([ "prepare", construction.id ]);
            if (construction.id === 2) await prepareGate;
            return { construction };
        },
        Commit(staged)
        {
            events.push([ "commit", staged.construction.id ]);
        },
        Release(staged, context)
        {
            events.push([ "release", staged.construction.id, context.reason ]);
        }
    };
    const renderer = new TnyCharacterRenderer({ adapter });

    await renderer.ApplyConstruction(CreateConstruction(1));
    const replacement = renderer.ApplyConstruction(CreateConstruction(2));
    await Promise.resolve();

    assert.deepEqual(events, [
        [ "prepare", 1 ],
        [ "commit", 1 ],
        [ "prepare", 2 ]
    ]);

    finishPrepare();
    assert.equal((await replacement).status, "committed");
    assert.deepEqual(events.slice(-2), [
        [ "commit", 2 ],
        [ "release", 1, "replaced" ]
    ]);
});

test("renderer delegates an atomic handoff when the adapter owns shared resources", async () =>
{
    const events = [];
    const adapter = {
        async Prepare(construction) { return { construction }; },
        Commit(staged) { events.push([ "commit", staged.construction.id ]); },
        Handoff(previous, staged)
        {
            events.push([ "handoff", previous.construction.id, staged.construction.id ]);
        },
        Release(staged, context)
        {
            events.push([ "release", staged.construction.id, context.reason ]);
        }
    };
    const renderer = new TnyCharacterRenderer({ adapter });

    await renderer.ApplyConstruction(CreateConstruction(1));
    await renderer.ApplyConstruction(CreateConstruction(2));

    assert.deepEqual(events, [
        [ "commit", 1 ],
        [ "handoff", 1, 2 ],
        [ "release", 1, "replaced" ]
    ]);
});

test("renderer reuses an identical committed construction and reports changed domains", async () =>
{
    const prepared = [];
    const committed = [];
    const adapter = {
        Prepare(construction, context)
        {
            prepared.push({ construction, change: context.appearanceChange });
            return { construction };
        },
        Commit(staged) { committed.push(staged); },
        Handoff() {},
        Release() {},
        GetDiagnostics(staged) { return { id: staged.construction.id }; }
    };
    const renderer = new TnyCharacterRenderer({ adapter });
    const first = CreateConstruction(1, {
        textureContributions: [ {
            groupID: "topinner",
            textures: [ { target: "body", path: "res:/body-a.png" } ]
        } ]
    });

    await renderer.ApplyConstruction(first);
    const repeated = await renderer.ApplyConstruction(CloneConstruction(first));

    assert.equal(prepared.length, 1);
    assert.equal(committed.length, 1);
    assert.deepEqual(repeated, {
        status: "committed",
        revision: 2,
        reused: true,
        reuseRule: "identical-construction",
        appearanceChange: {
            identical: true,
            initial: false,
            dirtyDomains: []
        },
        details: { id: 1 }
    });

    const changed = CloneConstruction(first);
    changed.textureContributions[0].textures[0].path = "res:/body-b.png";
    await renderer.ApplyConstruction(changed);

    assert.equal(prepared.length, 2);
    assert.deepEqual(prepared[1].change, {
        identical: false,
        initial: false,
        dirtyDomains: [ "bodyComposition" ]
    });
});

test("renderer can explicitly release an audit appearance before a non-atomic replacement", async () =>
{
    const released = [];
    const adapter = {
        async Prepare(construction)
        {
            return { construction };
        },
        Commit() {},
        async Release(staged, context)
        {
            released.push([ staged.construction.id, context.reason ]);
        }
    };
    const renderer = new TnyCharacterRenderer({ adapter });

    assert.equal((await renderer.ApplyConstruction(CreateConstruction(1))).status, "committed");
    assert.deepEqual(await renderer.ReleaseCommitted({ reason: "audit-replace" }), {
        status: "released",
        revision: 2
    });
    assert.deepEqual(released, [ [ 1, "audit-replace" ] ]);
    assert.equal(renderer.GetState().lastResult.status, "released");
    assert.deepEqual(await renderer.ApplyConstruction(CreateConstruction(2)), {
        status: "committed",
        revision: 3
    });
});

test("renderer delegates configured-part isolation only to the committed appearance", async () =>
{
    const calls = [];
    const adapter = {
        async Prepare(construction) { return { construction }; },
        Commit() {},
        Release() {},
        GetDiagnostics(staged)
        {
            return { isolated: staged.construction.operations.length };
        },
        SetConfiguredPartDisplay(staged, identity, display)
        {
            calls.push({ staged, identity, display });
            return { identity, display };
        },
        SetFoundationDisplay(staged, role, display)
        {
            calls.push({ staged, role, display });
            return { role, display };
        }
    };
    const renderer = new TnyCharacterRenderer({ adapter });

    assert.throws(
        () => renderer.SetConfiguredPartDisplay("female/dependants/tuck/basic", false),
        /no committed appearance/u
    );
    await renderer.ApplyConstruction({ operations: [] });
    assert.deepEqual(
        renderer.SetConfiguredPartDisplay("female/dependants/tuck/basic", false),
        { identity: "female/dependants/tuck/basic", display: false }
    );
    assert.equal(calls.length, 1);
    assert.deepEqual(renderer.GetState().lastResult.details, { isolated: 0 });
    assert.deepEqual(renderer.SetFoundationDisplay("body", false), {
        role: "body",
        display: false
    });
    assert.equal(calls.length, 2);
});

function CreateConstruction(id, values = {})
{
    return {
        id,
        operations: [],
        ...values
    };
}

function CloneConstruction(value)
{
    return JSON.parse(JSON.stringify(value));
}
