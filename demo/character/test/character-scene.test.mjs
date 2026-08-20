import assert from "node:assert/strict";
import test from "node:test";

import {
    SetTestTw2,
    TnyCharacterScene
} from "./runtime-character-modules.mjs";
import { Tr2InteriorScene } from "./ccpwgl-interior-scene.mjs";

test("character scene wraps one interior scene and mirrors semantic collections", () =>
{
    const wrapped = new Tr2InteriorScene();
    const characterA = { wrapped: { name: "character-a" } };
    const characterB = { wrapped: { name: "character-b" } };
    const geometry = { wrapped: { name: "studio-floor" } };
    const light = { wrapped: { name: "shared-key" } };
    const scene = new TnyCharacterScene(wrapped);

    scene.AddCharacter([ characterA, characterB ]);
    scene.AddGeometry(geometry);
    scene.AddLight(light);

    assert.equal(scene.wrapped, wrapped);
    assert.deepEqual(wrapped.dynamics, [
        characterA.wrapped,
        characterB.wrapped,
        geometry.wrapped
    ]);
    assert.deepEqual(wrapped.lights, [ light.wrapped ]);
    assert.deepEqual(scene.GetObjects(), [ characterA, characterB, geometry ]);

    const characterC = { wrapped: { name: "character-c" } };
    scene.AddCharacter(characterC);
    scene.ReplaceCharacter(characterA, characterC);
    assert.deepEqual(scene.GetCharacters(), [ characterC, characterB ]);
    assert.deepEqual(wrapped.dynamics, [
        characterC.wrapped,
        characterB.wrapped,
        geometry.wrapped
    ]);

    scene.RemoveCharacter(characterC);
    scene.RemoveGeometry(geometry);
    scene.RemoveLight(light);
    assert.deepEqual(wrapped.dynamics, [ characterB.wrapped ]);
    assert.deepEqual(wrapped.lights, []);
});

test("character scene delegates lifecycle and renders through its outer client", () =>
{
    SetTestTw2({
        device: {
            RM_OPAQUE: 0,
            RM_DECAL: 1,
            RM_TRANSPARENT: 2,
            RM_ADDITIVE: 3
        }
    });
    const resource = {};
    const wrapped = new Tr2InteriorScene();
    const scene = new TnyCharacterScene(wrapped);
    const accumulator = {
        length: 0,
        renders: 0,
        Clear()
        {
            this.length = 0;
        },
        Render()
        {
            this.renders++;
        }
    };

    scene.AddCharacter({ wrapped: { GetResources(out) { out.push(resource); } } });
    scene.Initialize();
    scene.Update(0.25);

    assert.equal(scene.Render(0.25, { accumulator }), true);
    assert.equal(wrapped.initialized, 1);
    assert.deepEqual(wrapped.updated, [ 0.25 ]);
    assert.equal(wrapped.viewDependentUpdates, 1);
    assert.deepEqual(wrapped.batchModes, [ 0, 1, 2, 3 ]);
    assert.equal(accumulator.renders, 1);
    assert.deepEqual(scene.GetResources(), [ resource ]);
});
