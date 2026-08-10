import assert from "node:assert/strict";
import test from "node:test";

import { CharacterLibraryClient } from "../src/demo/CharacterLibraryClient.mjs";

test("library client delegates schema validation and hydration to the runtime manager", async () =>
{
    const values = { schema: "carbonenginejs.characterLibrary", schemaVersion: 7 };

    class FakeManager
    {
        InstallLibrary(input)
        {
            this.input = input;
        }
    }

    const client = new CharacterLibraryClient({
        LibraryManager: FakeManager,
        fetch: async url => ({
            ok: true,
            async json()
            {
                assert.equal(url, "/library.json");
                return values;
            }
        })
    });
    const manager = await client.Load("/library.json");

    assert.equal(manager.input, values);
});

test("library client exposes failed HTTP status without converting the payload", async () =>
{
    const client = new CharacterLibraryClient({
        LibraryManager: class {},
        fetch: async () => ({ ok: false, status: 404 })
    });

    await assert.rejects(
        client.Load("/missing.json"),
        /HTTP 404/
    );
});

test("library client preserves a caller-required fetch receiver", async () =>
{
    const receiver = {
        async fetch()
        {
            assert.equal(this, receiver);
            return {
                ok: true,
                async json()
                {
                    return { schemaVersion: 7 };
                }
            };
        }
    };

    class FakeManager
    {
        InstallLibrary(values)
        {
            this.values = values;
        }
    }

    const client = new CharacterLibraryClient({
        LibraryManager: FakeManager,
        fetch: receiver.fetch.bind(receiver)
    });
    const manager = await client.Load("/library.json");

    assert.deepEqual(manager.values, { schemaVersion: 7 });
});
