import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(
    new URL("../src/demo/CharacterDemoAlphaAudit.mjs", import.meta.url),
    "utf8"
);

test("alpha audit remains opt-in DOM telemetry", () =>
{
    assert.match(source, /output\.id = "character-alpha-audit"/u);
    assert.match(source, /gl\.readPixels\(/u);
    assert.match(source, /enclosedTransparentPixels/u);
    assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(/u);
});
