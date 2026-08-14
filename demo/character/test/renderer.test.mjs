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
