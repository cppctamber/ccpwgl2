import assert from "node:assert/strict";
import test from "node:test";

import { SetTestTw2, TnyCharacterLibraryClient } from "./runtime-character-modules.mjs";

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

    SetTestTw2({
        resMan: {
            async FetchRaw(url, responseType)
            {
                assert.equal(url, "/library.json");
                assert.equal(responseType, "json");
                return values;
            }
        }
    });
    const client = new TnyCharacterLibraryClient({ LibraryManager: FakeManager });
    const manager = await client.Load("/library.json");

    assert.equal(manager.input, values);
});

test("library client exposes resource-manager load failures", async () =>
{
    SetTestTw2({
        resMan: {
            async FetchRaw()
            {
                throw new Error("Character library request failed with HTTP 404");
            }
        }
    });
    const client = new TnyCharacterLibraryClient({ LibraryManager: class {} });

    await assert.rejects(
        client.Load("/missing.json"),
        /HTTP 404/u
    );
});

test("library client preserves the resource-manager receiver", async () =>
{
    let receiver = null;
    const resMan = {
        async FetchRaw(url, responseType)
        {
            receiver = this;
            assert.equal(url, "/library.json");
            assert.equal(responseType, "json");
            return { schemaVersion: 7 };
        }
    };

    class FakeManager
    {
        InstallLibrary(values)
        {
            this.values = values;
        }
    }

    const installed = SetTestTw2({ resMan });
    const client = new TnyCharacterLibraryClient({ LibraryManager: FakeManager });
    const manager = await client.Load("/library.json");

    assert.equal(receiver, installed.resMan);
    assert.deepEqual(manager.values, { schemaVersion: 7 });
});
