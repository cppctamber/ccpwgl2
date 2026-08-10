import assert from "node:assert/strict";
import { mkdtemp, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { createCharacterDemoServer } from "../server.mjs";

test("character demo server exposes only its allowlisted files", async context =>
{
    const temporaryRoot = await mkdtemp(join(tmpdir(), "ccpwgl-character-demo-"));
    const libraryPath = join(temporaryRoot, "library.json");
    await writeFile(libraryPath, "{\"schemaVersion\":7}\n");

    const repositoryRoot = resolve(import.meta.dirname, "../../..");
    const carbonengineRoot = resolve(repositoryRoot, "../carbonenginejs-org");
    const server = createCharacterDemoServer({
        repositoryRoot,
        carbonengineRoot,
        libraryPath
    });
    await new Promise((resolveListen, reject) =>
    {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolveListen);
    });

    context.after(async () =>
    {
        await new Promise(resolveClose => server.close(resolveClose));
        await unlink(libraryPath);
        await rmdir(temporaryRoot);
    });

    const origin = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(`${origin}/demo/character/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Character runtime/);

    const source = await fetch(`${origin}/demo/character/src/character/CcpwglCharacter.mjs`);
    assert.equal(source.status, 200);
    assert.match(source.headers.get("content-type"), /javascript/);

    const runtime = await fetch(`${origin}/vendor/runtime-character/library/CjsCharacterLibraryManager.js`);
    assert.equal(runtime.status, 200);

    const library = await fetch(`${origin}/local/character-library.json`);
    assert.equal(library.status, 200);
    assert.deepEqual(await library.json(), { schemaVersion: 7 });

    const head = await fetch(`${origin}/local/character-library.json`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");

    for (const pathname of [
        "/package.json",
        "/.git/config",
        "/_dev/character/main.js",
        "/demo/character/src/%2e%2e/%2e%2e/package.json",
        "/vendor/runtime-utils/package.json"
    ])
    {
        assert.equal((await fetch(`${origin}${pathname}`)).status, 404, pathname);
    }

    assert.equal((await fetch(`${origin}/demo/character/`, { method: "POST" })).status, 405);
});
