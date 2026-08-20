import assert from "node:assert/strict";
import test from "node:test";

import {
    RegisterTnyCharacterConstructors,
    tnyCharacterConstructors
} from "./runtime-character-modules.mjs";

test("character runtime registers one named constructor catalog", () =>
{
    let registered = null;
    const library = {
        Register(values)
        {
            registered = values;
        }
    };

    assert.equal(RegisterTnyCharacterConstructors(library), library);
    assert.equal(registered.constructors, tnyCharacterConstructors);
    assert.equal(typeof registered.constructors.TnyCharacter, "function");
    assert.equal(typeof registered.constructors.TnyCharacterAppearanceManager, "function");
    assert.equal(registered.constructors.TnyCharacterRenderer, undefined);
    assert.equal(typeof registered.constructors.TnyCharacterScene, "function");
    assert.equal(typeof registered.constructors.TnyGlesCharacterAdapter, "function");
});
