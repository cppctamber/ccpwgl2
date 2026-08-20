import assert from "node:assert/strict";
import test from "node:test";

import {
    CreateCharacterDemoCompanion,
    LayoutCharacterDemoCharacters,
    ResolveCharacterDemoCompanionPaperdoll
} from "../src/demo/CharacterDemoMultiCharacter.mjs";

function Paperdoll(recordID, resGender)
{
    return {
        recordID,
        modifiers: [ { paperdollResourceID: { resGender } } ]
    };
}

test("companion selection prefers another retained resource gender", () =>
{
    const female = Paperdoll("female", 0);
    const femaleOther = Paperdoll("female-other", 0);
    const male = Paperdoll("male", 1);

    assert.equal(
        ResolveCharacterDemoCompanionPaperdoll(
            [ female, femaleOther, male ],
            female
        ),
        male
    );
    assert.equal(
        ResolveCharacterDemoCompanionPaperdoll(
            [ female, femaleOther, male ],
            female,
            "female-other"
        ),
        femaleOther
    );
});

test("companion owns an independent appearance lifecycle over the shared library", async () =>
{
    const primary = Paperdoll("female", 0);
    const companion = Paperdoll("male", 1);
    const paperdolls = [ primary, companion ];
    const selected = [];

    class Character
    {
        constructor(options)
        {
            this.options = options;
        }

        SelectPaperdoll(recordID)
        {
            selected.push(recordID);
        }

        ApplyAppearance()
        {
            return Promise.resolve({ status: "committed", revision: 1 });
        }
    }

    const libraryManager = {
        GetDocument: name => name === "paperdolls" ? paperdolls : []
    };
    const appearanceResolver = {};
    const constructionResolver = {};
    const appearanceManager = {};
    const result = await CreateCharacterDemoCompanion({
        Character,
        libraryManager,
        appearanceResolver,
        constructionResolver,
        appearanceManager,
        primaryPaperdoll: primary
    });

    assert.equal(result.paperdoll, companion);
    assert.deepEqual(selected, [ "male" ]);
    assert.equal(result.character.options.libraryManager, libraryManager);
    assert.equal(result.character.options.appearanceManager, appearanceManager);
});

test("scene layout centers every attached character without imposing a count limit", () =>
{
    const characters = Array.from({ length: 3 }, () => ({
        wrapped: {},
        SetTranslationFromValues(...translation)
        {
            this.translation = translation;
        },
        RebuildTransforms(options)
        {
            this.rebuildOptions = options;
            this.wrapped.translation = [ ...this.translation ];
        }
    }));
    const scene = {
        GetCharacters: out => (out.push(...characters), out)
    };

    const result = LayoutCharacterDemoCharacters(scene, 1);

    assert.deepEqual(result.map(value => value.translation), [
        [ -1, 0, 0 ],
        [ 0, 0, 0 ],
        [ 1, 0, 0 ]
    ]);
    assert.deepEqual(characters.map(value => value.translation), [
        [ -1, 0, 0 ],
        [ 0, 0, 0 ],
        [ 1, 0, 0 ]
    ]);
    assert.deepEqual(characters.map(value => value.wrapped.translation), [
        [ -1, 0, 0 ],
        [ 0, 0, 0 ],
        [ 1, 0, 0 ]
    ]);
    assert.deepEqual(characters.map(value => value.rebuildOptions), [
        { force: true },
        { force: true },
        { force: true }
    ]);
});
